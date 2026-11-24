// Contract fixture for legacy SQL-backed customizer tables. No production data is copied.
export const customDesignSchema = `
CREATE TABLE custom_print_config (
  id text PRIMARY KEY, is_active boolean DEFAULT true,
  technique_dtf_cost numeric, technique_serigrafi_cost numeric, technique_nakkas_cost numeric,
  size_pocket_mult numeric, size_a5_mult numeric, size_a4_mult numeric, size_a3_mult numeric,
  size_a3_plus_mult numeric, vat_rate numeric, discount_tiers jsonb,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO custom_print_config VALUES ('integration-config', true, 85, 60, 110, .6, .8, 1, 1.4, 1.8, 20, '[]', now());
CREATE TABLE custom_design (
  id text PRIMARY KEY, product_id text, variant_id text, original_file_path text,
  original_file_name text, file_type text, file_size integer, preview_file_path text,
  color_id text, color_name text, color_hex text, size text, view text,
  position_id text, position_name text, transform jsonb, physical_dimensions jsonb,
  quantity integer, pricing_estimate jsonb, status text, cart_id text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);`
