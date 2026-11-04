import type { SavedClientInput, PaymentPreferencesInput } from "@/zod-schemas/invoice/presets";
import { db, schema } from "@invoicely/db";
import { and, asc, eq } from "drizzle-orm";
export const listSavedClients = (userId: string) =>
  db
    .select()
    .from(schema.savedClients)
    .where(eq(schema.savedClients.userId, userId))
    .orderBy(asc(schema.savedClients.name), asc(schema.savedClients.id));
export async function createSavedClient(userId: string, input: SavedClientInput) {
  const [row] = await db
    .insert(schema.savedClients)
    .values({ ...input, userId })
    .returning();
  return row;
}
export async function updateSavedClient(userId: string, id: string, input: SavedClientInput) {
  const [row] = await db
    .update(schema.savedClients)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(schema.savedClients.id, id), eq(schema.savedClients.userId, userId)))
    .returning();
  return row;
}
export async function deleteSavedClient(userId: string, id: string) {
  const [row] = await db
    .delete(schema.savedClients)
    .where(and(eq(schema.savedClients.id, id), eq(schema.savedClients.userId, userId)))
    .returning({ id: schema.savedClients.id });
  return row;
}
export async function getPreferences(userId: string) {
  const [row] = await db.select().from(schema.accountPreferences).where(eq(schema.accountPreferences.userId, userId));
  return { paymentInformation: row?.paymentInformation ?? [] };
}
export async function updatePreferences(userId: string, input: PaymentPreferencesInput) {
  const [row] = await db
    .insert(schema.accountPreferences)
    .values({ ...input, userId })
    .onConflictDoUpdate({ target: schema.accountPreferences.userId, set: { ...input, updatedAt: new Date() } })
    .returning();
  return { paymentInformation: row.paymentInformation };
}
