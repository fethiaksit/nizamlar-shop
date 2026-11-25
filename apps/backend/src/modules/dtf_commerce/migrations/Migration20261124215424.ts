import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261124215424 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "dtf_webhook_event" drop constraint if exists "dtf_webhook_event_webhook_id_unique";`);
    this.addSql(`alter table if exists "dtf_product_spec" drop constraint if exists "dtf_product_spec_handle_unique";`);
    this.addSql(`alter table if exists "dtf_production_job" drop constraint if exists "dtf_production_job_production_ref_unique";`);
    this.addSql(`alter table if exists "dtf_pricing_rule" drop constraint if exists "dtf_pricing_rule_code_unique";`);
    this.addSql(`create table if not exists "dtf_design_asset" ("id" text not null, "product_handle" text null, "product_type" text check ("product_type" in ('ready_to_press', 'custom_dtf', 'gang_sheet', 'dtf_bundle')) not null, "unit_system" text check ("unit_system" in ('in', 'cm')) not null default 'in', "width_in" real not null, "height_in" real not null, "width_cm" real not null, "height_cm" real not null, "quantity" integer not null default 1, "pixel_width" integer not null, "pixel_height" integer not null, "effective_dpi" integer not null, "has_transparency" boolean not null default false, "file_mime_type" text not null, "original_file_name" text not null, "preview_garment_color" text null, "original_asset_path" text not null, "production_asset_path" text not null, "mockup_preview_path" text null, "placement_json" jsonb null, "layout_state_json" jsonb null, "verified_quote_json" jsonb not null, "quote_signature" text not null, "status" text check ("status" in ('draft', 'quoted', 'in_cart', 'ordered', 'archived')) not null default 'quoted', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "dtf_design_asset_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dtf_design_asset_deleted_at" ON "dtf_design_asset" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "dtf_pricing_rule" ("id" text not null, "code" text not null, "currency_code" text not null default 'USD', "is_active" boolean not null default true, "rate_per_sq_inch_cents" integer not null default 6, "min_transfer_unit_cents" integer not null default 150, "min_order_cents" integer not null default 1500, "gang_sheet_width_in" real not null default 22, "max_print_width_in" real not null default 22, "max_print_height_in" real not null default 120, "min_dimension_in" real not null default 0.5, "min_margin_in" real not null default 0.25, "min_gap_in" real not null default 0.25, "target_dpi" integer not null default 300, "min_acceptable_dpi" integer not null default 150, "printer_rip_verified" boolean not null default false, "gang_sheet_lengths_json" jsonb not null, "quantity_tiers_json" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "dtf_pricing_rule_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_dtf_pricing_rule_code_unique" ON "dtf_pricing_rule" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dtf_pricing_rule_deleted_at" ON "dtf_pricing_rule" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "dtf_production_job" ("id" text not null, "production_ref" text not null, "source_channel" text check ("source_channel" in ('shopify_us', 'medusa')) not null default 'shopify_us', "external_order_id" text not null, "external_order_name" text null, "customer_email" text null, "payment_verified" boolean not null default false, "state" text check ("state" in ('payment_confirmed', 'design_review', 'ready_for_printing', 'printing', 'quality_control', 'packed', 'shipped', 'delivered')) not null default 'payment_confirmed', "cancellation_state" text check ("cancellation_state" in ('none', 'cancel_requested', 'cancelled')) not null default 'none', "refund_state" text check ("refund_state" in ('none', 'partial_refund', 'refunded')) not null default 'none', "design_asset_id" text null, "product_type" text not null, "width_in" real not null, "height_in" real not null, "quantity" integer not null, "currency_code" text not null default 'USD', "total_cents" integer not null, "qc_notes" text null, "tracking_number" text null, "tracking_carrier" text null, "tracking_url" text null, "shipping_country" text not null default 'US', "shipping_state" text null, "shipping_zip" text null, "erp_sync_status" text not null default 'pending', "line_items_json" jsonb not null, "history_json" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "dtf_production_job_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_dtf_production_job_production_ref_unique" ON "dtf_production_job" ("production_ref") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dtf_production_job_deleted_at" ON "dtf_production_job" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "dtf_product_spec" ("id" text not null, "handle" text not null, "medusa_product_id" text null, "shopify_product_gid" text null, "shopify_default_variant_gid" text null, "product_type" text check ("product_type" in ('ready_to_press', 'custom_dtf', 'gang_sheet', 'dtf_bundle')) not null, "title_en" text not null, "title_tr" text null, "description_en" text not null, "description_tr" text null, "garment_included" boolean not null default false, "home_iron_supported" boolean not null default false, "home_iron_verified" boolean not null default false, "heat_press_supported" boolean not null default true, "application_approved" boolean not null default false, "application_instructions_json" jsonb not null, "presets_json" jsonb not null, "base_price_cents" integer not null default 0, "is_published" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "dtf_product_spec_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_dtf_product_spec_handle_unique" ON "dtf_product_spec" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dtf_product_spec_deleted_at" ON "dtf_product_spec" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "dtf_webhook_event" ("id" text not null, "webhook_id" text not null, "topic" text not null, "shop_domain" text not null, "hmac_verified" boolean not null default false, "processing_status" text check ("processing_status" in ('received', 'processed', 'ignored_duplicate', 'ignored_unpaid', 'failed')) not null default 'received', "attempt_count" integer not null default 1, "last_error" text null, "payload_hash" text not null, "payload_json" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "dtf_webhook_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_dtf_webhook_event_webhook_id_unique" ON "dtf_webhook_event" ("webhook_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dtf_webhook_event_deleted_at" ON "dtf_webhook_event" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "dtf_design_asset" cascade;`);

    this.addSql(`drop table if exists "dtf_pricing_rule" cascade;`);

    this.addSql(`drop table if exists "dtf_production_job" cascade;`);

    this.addSql(`drop table if exists "dtf_product_spec" cascade;`);

    this.addSql(`drop table if exists "dtf_webhook_event" cascade;`);
  }

}
