# Invoice workflow upgrades

Invoice sub-items support text, names, fixed prices, descriptive hours, and quantity × unit price. Hours do not affect totals. Each priced sub-item contributes once; the parent quantity never multiplies child amounts. Parent quantities are whole numbers; child quantities can be fractional. Zero base prices are supported.

## Bulk entry

Use **Download template** in Invoice Items, then upload the filled CSV or paste it into **Paste CSV**. The importer shows errors and a review before it appends items to the current draft. Save the invoice separately.

Headers: `row_type,item_ref,name,description,text,quantity,unit_price,amount,hours`.

- `item` declares a unique `item_ref` and parent name, description, quantity and unit price.
- `text`, `name`, `priced`, `hours`, and `quantity_price` rows refer to their parent through `item_ref`.
- Fixed prices use `amount`. Quantity prices use `quantity` and `unit_price`. Hours use `hours`.
- Quoted commas, multiline fields, and UTF-8 are supported. Use decimal points and unformatted numbers; leave currency symbols out.
- The whole CSV must validate before anything is added. Imports are limited to 1 MB and 1,000 rows.

## Reusable account information

Manage Assets → **Clients & payment information** holds account-owned saved clients and a default payment-information list in Neon. The existing browser-only default client can be explicitly copied into the account.

Select a saved client in Client Details to copy its fields into the invoice. The invoice remains editable and stores a snapshot, so changes to saved clients never rewrite existing invoices. Payment defaults apply only to fresh invoices; opening or importing an invoice keeps its own payment information.

## Integrity and images

Server invoice create, edit and migration use one transactional Neon HTTP batch. An edit preserves invoice identity, creation date, payment status and paid date. Missing optional metadata is normalized before use. Migration 0004 repairs only older invoice fields with no metadata record; it cannot recover text that was never saved.

Image keys and relative paths resolve against the server-configured storage URL. Public bucket settings and browser CORS must permit image retrieval. Local temporary image references recover from base64 when available; otherwise the UI asks the user to select/upload the image again.

PDF generation retrieves remote logos/signatures with CORS and embeds their bytes before rendering. It bypasses older image-cache responses that lack CORS headers, reuses successful image loads, and reports retrieval failures instead of silently exporting without the image.

## Checks and release

Run `corepack yarn build`, then `node --test scripts/*.test.mjs apps/web/src/lib/invoice/move-invoice-to-server.test.mjs`.

Set `TEST_DATABASE_URL` to an isolated PostgreSQL database to also run the persistence suite. That suite creates a disposable schema, applies migrations, exercises the real Drizzle Neon batch query builder through a PostgreSQL transaction backend, and removes the schema afterward. Never point it at production.

PDF integration tests render both templates and inspect page text, multi-page content, and description spacing. Set `PDF_ARTIFACT_DIR` to retain PDFs for visual inspection.

Apply additive database migrations with `corepack yarn db:migrate` before releasing the application. Confirm the deployed commit, imports, storage-image listing, and read-only access to existing invoices before declaring production verified.
