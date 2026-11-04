import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import postgres from "postgres";
import { build } from "esbuild";
import test from "node:test";
import path from "node:path";

test(
  "atomic invoice writes and account presets against isolated PostgreSQL",
  { skip: !process.env.TEST_DATABASE_URL },
  async (t) => {
    const pg = postgres(process.env.TEST_DATABASE_URL, {
      max: 1,
      onnotice: () => {},
      types: {
        timestamp: {
          to: 1114,
          from: [1114, 1184],
          serialize: (v) => (v instanceof Date ? v.toISOString() : v),
          parse: (v) => v,
        },
      },
    });
    const namespace = "invoice_test_" + randomUUID().replaceAll("-", "");
    const output = path.resolve(`.tmp-invoice-integration-${randomUUID()}.mjs`);
    let failBatchAt = -1;
    const execute = async (conn, packet, options = packet.options) => {
      const query = conn.unsafe(packet.text, packet.params);
      const rows = options?.arrayMode ? await query.values() : await query;
      return { rows, rowCount: rows.count };
    };
    const query = (text, params, options) => ({
      text,
      params,
      options,
      then: (yes, no) => execute(pg, { text, params, options }).then(yes, no),
    });
    // Exercise Drizzle's actual Neon HTTP batch implementation against a local transaction backend.
    globalThis.__invoiceTestClient = {
      query,
      transaction: (packets) =>
        pg.begin(async (tx) => {
          const results = [];
          for (let i = 0; i < packets.length; i++) {
            if (i === failBatchAt) {
              failBatchAt = -1;
              throw Error("Injected write failure");
            }
            results.push(await execute(tx, packets[i]));
          }
          return results;
        }),
    };
    try {
      await pg.unsafe(`CREATE SCHEMA "${namespace}"`);
      await pg.unsafe(`SET search_path TO "${namespace}"`);
      for (const name of (await fs.readdir("packages/db/migrations")).filter((n) => n.endsWith(".sql")).sort())
        await pg.unsafe(
          (await fs.readFile(`packages/db/migrations/${name}`, "utf8")).replaceAll('"public".', `"${namespace}".`),
        );
      await build({
        stdin: {
          contents: `export * from './apps/web/src/lib/db-queries/invoice/insertInvoice';export * from './apps/web/src/lib/db-queries/invoice/getInvoice';export * from './apps/web/src/lib/db-queries/account-presets';export {createInvoiceSchemaDefaultValues as defaults} from './apps/web/src/zod-schemas/invoice/create-invoice';`,
          resolveDir: process.cwd(),
        },
        outfile: output,
        bundle: true,
        format: "esm",
        platform: "node",
        packages: "external",
        tsconfig: "apps/web/tsconfig.json",
        plugins: [
          {
            name: "isolated-db",
            setup(b) {
              b.onResolve({ filter: /^@invoicely\/db$/ }, () => ({ path: "fixture-db", namespace: "fixture" }));
              b.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
                resolveDir: process.cwd(),
                loader: "ts",
                contents: `import {drizzle} from 'drizzle-orm/neon-http';import * as schema from '${path.resolve("packages/db/src/schema/index.ts")}';export {schema};export const db=drizzle(globalThis.__invoiceTestClient,{schema});`,
              }));
            },
          },
        ],
      });
      const api = await import(output);
      const owner = randomUUID(),
        other = randomUUID();
      await pg`insert into users (id,name,email) values (${owner},'Test owner',${owner + "@example.test"}),(${other},'Other owner',${other + "@example.test"})`;
      const invoice = {
        ...api.defaults,
        metadata: {
          notes: "Preserve notes",
          terms: "Net 30",
          paymentInformation: [{ label: "Bank", value: "Test account" }],
        },
        items: [
          {
            name: "Service",
            description: "Description",
            quantity: 1,
            unitPrice: 0,
            subItems: [
              { type: "hours", name: "Planning", hours: 1.5 },
              { type: "quantity_price", name: "Work", quantity: 2.5, unitPrice: 10 },
            ],
          },
        ],
      };
      let id;
      await t.test(
        "create, reopen and edit preserve zero base price, sub-items, creation and payment status",
        async () => {
          id = await api.insertInvoiceQuery(invoice, owner, undefined, {
            status: "success",
            paidAt: new Date("2026-11-01T12:00:00Z"),
          });
          const first = await api.getInvoiceQuery(id, owner);
          assert.equal(first.invoiceFields.items[0].unitPrice.toNumber(), 0);
          assert.deepEqual(first.invoiceFields.items[0].subItems, invoice.items[0].subItems);
          await api.replaceInvoiceQuery({ ...invoice, metadata: { ...invoice.metadata, notes: "Edited" } }, owner, id);
          const edited = await api.getInvoiceQuery(id, owner);
          assert.equal(edited.invoiceFields.metadata.notes, "Edited");
          assert.equal(edited.status, "success");
          assert.deepEqual(edited.paidAt, first.paidAt);
          assert.deepEqual(edited.createdAt, first.createdAt);
        },
      );
      await t.test("failed creates roll back every inserted row", async () => {
        const badId = randomUUID();
        failBatchAt = 4;
        await assert.rejects(api.insertInvoiceQuery(invoice, owner, badId));
        const [count] = await pg`select count(*)::int as count from invoices where id=${badId}`;
        assert.equal(count.count, 0);
      });
      await t.test("failed edits leave previous invoice intact", async () => {
        const before = await api.getInvoiceQuery(id, owner);
        failBatchAt = 5;
        await assert.rejects(
          api.replaceInvoiceQuery(
            { ...invoice, metadata: { ...invoice.metadata, notes: "Must roll back" } },
            owner,
            id,
          ),
        );
        const after = await api.getInvoiceQuery(id, owner);
        assert.deepEqual(after, before);
      });
      await t.test("another account cannot read or overwrite invoices", async () => {
        assert.equal(await api.getInvoiceQuery(id, other), undefined);
        await assert.rejects(api.replaceInvoiceQuery(invoice, other, id));
        assert.ok(await api.getInvoiceQuery(id, owner));
      });
      await t.test("client ownership isolation and snapshot semantics", async () => {
        const client = await api.createSavedClient(owner, {
          name: "Client",
          address: "First address",
          metadata: [{ label: "GST", value: "Example" }],
        });
        assert.equal((await api.listSavedClients(other)).length, 0);
        assert.equal(
          await api.updateSavedClient(other, client.id, { name: "No", address: "", metadata: [] }),
          undefined,
        );
        assert.equal(await api.deleteSavedClient(other, client.id), undefined);
        await api.updateSavedClient(owner, client.id, {
          name: "Updated client",
          address: "Second address",
          metadata: [],
        });
        assert.equal((await api.listSavedClients(owner))[0].address, "Second address");
        await api.deleteSavedClient(owner, client.id);
        assert.equal((await api.listSavedClients(owner)).length, 0);
        assert.equal(
          (await api.getInvoiceQuery(id, owner)).invoiceFields.clientDetails.name,
          invoice.clientDetails.name,
        );
      });
      await t.test("payment defaults are account-owned and empty values are intentional", async () => {
        assert.deepEqual(await api.getPreferences(owner), { paymentInformation: [] });
        await api.updatePreferences(owner, { paymentInformation: [{ label: "UPI", value: "test@example" }] });
        assert.equal((await api.getPreferences(owner)).paymentInformation.length, 1);
        assert.equal((await api.getPreferences(other)).paymentInformation.length, 0);
        await api.updatePreferences(owner, { paymentInformation: [] });
        assert.equal((await api.getPreferences(owner)).paymentInformation.length, 0);
        assert.deepEqual(
          (await api.getInvoiceQuery(id, owner)).invoiceFields.metadata.paymentInformation.map(({ label, value }) => ({
            label,
            value,
          })),
          invoice.metadata.paymentInformation,
        );
      });
      await t.test("metadata repair fills only older absent rows and preserves existing information", async () => {
        const oldId = randomUUID(),
          freshId = randomUUID(),
          oldField = randomUUID(),
          freshField = randomUUID();
        await pg`insert into invoices (id,user_id,created_at) values (${oldId},${owner},'2020-01-01'),(${freshId},${owner},now())`;
        await pg`insert into invoice_fields (id,invoice_id) values (${oldField},${oldId}),(${freshField},${freshId})`;
        const migration = await fs.readFile("packages/db/migrations/0004_fearless_vengeance.sql", "utf8");
        await pg.unsafe(migration.slice(migration.indexOf('INSERT INTO "invoice_metadata"')));
        const oldRows = await pg`select notes,terms from invoice_metadata where invoice_field_id=${oldField}`;
        assert.deepEqual([...oldRows], [{ notes: "", terms: "" }]);
        assert.equal((await pg`select id from invoice_metadata where invoice_field_id=${freshField}`).length, 0);
        assert.equal((await api.getInvoiceQuery(id, owner)).invoiceFields.metadata.notes, "Edited");
      });
    } finally {
      await pg.unsafe(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`).catch(() => {});
      await pg.end();
      await fs.unlink(output).catch(() => {});
      delete globalThis.__invoiceTestClient;
    }
  },
);
