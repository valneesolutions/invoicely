-- Add item type column to support credit line items (type: 'item' | 'credit')
ALTER TABLE "invoice_items" ADD COLUMN "type" text NOT NULL DEFAULT 'item';

-- Create invoice templates table for saved invoice content templates
CREATE TABLE "invoice_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "invoice_templates" ADD CONSTRAINT "invoice_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
