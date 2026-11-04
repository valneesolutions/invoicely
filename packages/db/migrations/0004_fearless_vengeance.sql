CREATE TABLE "account_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"payment_information" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"metadata" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_preferences" ADD CONSTRAINT "account_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_clients" ADD CONSTRAINT "saved_clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saved_clients_user_idx" ON "saved_clients" USING btree ("user_id");
--> statement-breakpoint
-- Repair only older incomplete invoices. Never replace existing notes, terms or payment fields.
INSERT INTO "invoice_metadata" ("id", "notes", "terms", "invoice_field_id")
SELECT gen_random_uuid(), '', '', f.id
FROM "invoice_fields" f
JOIN "invoices" i ON i.id = f.invoice_id
WHERE i.created_at < now() - interval '1 hour'
AND NOT EXISTS (SELECT 1 FROM "invoice_metadata" m WHERE m.invoice_field_id = f.id);
