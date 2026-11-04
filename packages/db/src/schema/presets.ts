import { pgTable, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./user";
export type DetailField = { label: string; value: string };
export const savedClients = pgTable(
  "saved_clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    address: text("address").notNull().default(""),
    metadata: jsonb("metadata").$type<DetailField[]>().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("saved_clients_user_idx").on(table.userId)],
);
export const accountPreferences = pgTable("account_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  paymentInformation: jsonb("payment_information").$type<DetailField[]>().notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
