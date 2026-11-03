--
-- PostgreSQL database dump
--

\restrict fx2LpDZSRGwgs6isoeC5JzZBepXEPB3VyjjeqlH4VTC9i1pq63OYCiVT8ii3uVV

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: claim_reason_enum; Type: TYPE; Schema: public; Owner: medusa
--

CREATE TYPE public.claim_reason_enum AS ENUM (
    'missing_item',
    'wrong_item',
    'production_failure',
    'other'
);


ALTER TYPE public.claim_reason_enum OWNER TO medusa;

--
-- Name: order_claim_type_enum; Type: TYPE; Schema: public; Owner: medusa
--

CREATE TYPE public.order_claim_type_enum AS ENUM (
    'refund',
    'replace'
);


ALTER TYPE public.order_claim_type_enum OWNER TO medusa;

--
-- Name: order_status_enum; Type: TYPE; Schema: public; Owner: medusa
--

CREATE TYPE public.order_status_enum AS ENUM (
    'pending',
    'completed',
    'draft',
    'archived',
    'canceled',
    'requires_action'
);


ALTER TYPE public.order_status_enum OWNER TO medusa;

--
-- Name: return_status_enum; Type: TYPE; Schema: public; Owner: medusa
--

CREATE TYPE public.return_status_enum AS ENUM (
    'open',
    'requested',
    'received',
    'partially_received',
    'canceled'
);


ALTER TYPE public.return_status_enum OWNER TO medusa;

--
-- Name: medusa_search_english; Type: TEXT SEARCH CONFIGURATION; Schema: public; Owner: medusa
--

CREATE TEXT SEARCH CONFIGURATION public.medusa_search_english (
    PARSER = pg_catalog."default" );

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR asciiword WITH english_stem;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR word WITH public.unaccent, english_stem;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR numword WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR email WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR url WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR host WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR sfloat WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR version WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR hword_numpart WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR hword_part WITH public.unaccent, english_stem;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR hword_asciipart WITH english_stem;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR numhword WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR asciihword WITH english_stem;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR hword WITH public.unaccent, english_stem;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR url_path WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR file WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR "float" WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR "int" WITH simple;

ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english
    ADD MAPPING FOR uint WITH simple;


ALTER TEXT SEARCH CONFIGURATION public.medusa_search_english OWNER TO medusa;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_holder; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.account_holder (
    id text NOT NULL,
    provider_id text NOT NULL,
    external_id text NOT NULL,
    email text,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.account_holder OWNER TO medusa;

--
-- Name: api_key; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.api_key (
    id text NOT NULL,
    token text NOT NULL,
    salt text NOT NULL,
    redacted text NOT NULL,
    title text NOT NULL,
    type text NOT NULL,
    last_used_at timestamp with time zone,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_by text,
    revoked_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT api_key_type_check CHECK ((type = ANY (ARRAY['publishable'::text, 'secret'::text])))
);


ALTER TABLE public.api_key OWNER TO medusa;

--
-- Name: application_method_buy_rules; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.application_method_buy_rules (
    application_method_id text NOT NULL,
    promotion_rule_id text NOT NULL
);


ALTER TABLE public.application_method_buy_rules OWNER TO medusa;

--
-- Name: application_method_target_rules; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.application_method_target_rules (
    application_method_id text NOT NULL,
    promotion_rule_id text NOT NULL
);


ALTER TABLE public.application_method_target_rules OWNER TO medusa;

--
-- Name: auth_identity; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.auth_identity (
    id text NOT NULL,
    app_metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auth_identity OWNER TO medusa;

--
-- Name: auth_mfa_factor; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.auth_mfa_factor (
    id text NOT NULL,
    auth_identity_id text NOT NULL,
    provider text NOT NULL,
    status text NOT NULL,
    provider_metadata jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auth_mfa_factor OWNER TO medusa;

--
-- Name: auth_mfa_recovery_code; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.auth_mfa_recovery_code (
    id text NOT NULL,
    auth_identity_id text NOT NULL,
    code_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auth_mfa_recovery_code OWNER TO medusa;

--
-- Name: auth_password_reset_token; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.auth_password_reset_token (
    id text NOT NULL,
    auth_identity_id text NOT NULL,
    provider_identity_id text NOT NULL,
    entity_id text NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auth_password_reset_token OWNER TO medusa;

--
-- Name: auth_verification; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.auth_verification (
    id text NOT NULL,
    auth_identity_id text NOT NULL,
    entity_id text NOT NULL,
    entity_type text NOT NULL,
    code_provider text NOT NULL,
    verified_at timestamp with time zone,
    requested_at timestamp with time zone NOT NULL,
    provider_metadata jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auth_verification OWNER TO medusa;

--
-- Name: capture; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.capture (
    id text NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    payment_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by text,
    metadata jsonb
);


ALTER TABLE public.capture OWNER TO medusa;

--
-- Name: cart; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.cart (
    id text NOT NULL,
    region_id text,
    customer_id text,
    sales_channel_id text,
    email text,
    currency_code text NOT NULL,
    shipping_address_id text,
    billing_address_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    completed_at timestamp with time zone,
    locale text
);


ALTER TABLE public.cart OWNER TO medusa;

--
-- Name: cart_address; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.cart_address (
    id text NOT NULL,
    customer_id text,
    company text,
    first_name text,
    last_name text,
    address_1 text,
    address_2 text,
    city text,
    country_code text,
    province text,
    postal_code text,
    phone text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.cart_address OWNER TO medusa;

--
-- Name: cart_line_item; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.cart_line_item (
    id text NOT NULL,
    cart_id text NOT NULL,
    title text NOT NULL,
    subtitle text,
    thumbnail text,
    quantity integer NOT NULL,
    variant_id text,
    product_id text,
    product_title text,
    product_description text,
    product_subtitle text,
    product_type text,
    product_collection text,
    product_handle text,
    variant_sku text,
    variant_barcode text,
    variant_title text,
    variant_option_values jsonb,
    requires_shipping boolean DEFAULT true NOT NULL,
    is_discountable boolean DEFAULT true NOT NULL,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    compare_at_unit_price numeric,
    raw_compare_at_unit_price jsonb,
    unit_price numeric NOT NULL,
    raw_unit_price jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    product_type_id text,
    is_custom_price boolean DEFAULT false NOT NULL,
    is_giftcard boolean DEFAULT false NOT NULL,
    CONSTRAINT cart_line_item_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


ALTER TABLE public.cart_line_item OWNER TO medusa;

--
-- Name: cart_line_item_adjustment; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.cart_line_item_adjustment (
    id text NOT NULL,
    description text,
    promotion_id text,
    code text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    provider_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    item_id text,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    CONSTRAINT cart_line_item_adjustment_check CHECK ((amount >= (0)::numeric))
);


ALTER TABLE public.cart_line_item_adjustment OWNER TO medusa;

--
-- Name: cart_line_item_tax_line; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.cart_line_item_tax_line (
    id text NOT NULL,
    description text,
    tax_rate_id text,
    code text NOT NULL,
    rate real NOT NULL,
    provider_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    item_id text,
    data jsonb
);


ALTER TABLE public.cart_line_item_tax_line OWNER TO medusa;

--
-- Name: cart_payment_collection; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.cart_payment_collection (
    cart_id character varying(255) NOT NULL,
    payment_collection_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.cart_payment_collection OWNER TO medusa;

--
-- Name: cart_promotion; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.cart_promotion (
    cart_id character varying(255) NOT NULL,
    promotion_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.cart_promotion OWNER TO medusa;

--
-- Name: cart_shipping_method; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.cart_shipping_method (
    id text NOT NULL,
    cart_id text NOT NULL,
    name text NOT NULL,
    description jsonb,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    shipping_option_id text,
    data jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT cart_shipping_method_check CHECK ((amount >= (0)::numeric))
);


ALTER TABLE public.cart_shipping_method OWNER TO medusa;

--
-- Name: cart_shipping_method_adjustment; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.cart_shipping_method_adjustment (
    id text NOT NULL,
    description text,
    promotion_id text,
    code text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    provider_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    shipping_method_id text
);


ALTER TABLE public.cart_shipping_method_adjustment OWNER TO medusa;

--
-- Name: cart_shipping_method_tax_line; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.cart_shipping_method_tax_line (
    id text NOT NULL,
    description text,
    tax_rate_id text,
    code text NOT NULL,
    rate real NOT NULL,
    provider_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    shipping_method_id text,
    data jsonb
);


ALTER TABLE public.cart_shipping_method_tax_line OWNER TO medusa;

--
-- Name: credit_line; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.credit_line (
    id text NOT NULL,
    cart_id text NOT NULL,
    reference text,
    reference_id text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.credit_line OWNER TO medusa;

--
-- Name: currency; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.currency (
    code text NOT NULL,
    symbol text NOT NULL,
    symbol_native text NOT NULL,
    decimal_digits integer DEFAULT 0 NOT NULL,
    rounding numeric DEFAULT 0 NOT NULL,
    raw_rounding jsonb NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.currency OWNER TO medusa;

--
-- Name: custom_design; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.custom_design (
    id character varying(64) NOT NULL,
    product_id character varying(64) NOT NULL,
    variant_id character varying(64),
    original_file_path text NOT NULL,
    original_file_name text NOT NULL,
    file_type character varying(32) NOT NULL,
    file_size integer NOT NULL,
    preview_file_path text,
    color_id character varying(32) NOT NULL,
    color_name character varying(64) NOT NULL,
    color_hex character varying(16) NOT NULL,
    size character varying(32),
    view character varying(16) NOT NULL,
    position_id character varying(64) NOT NULL,
    position_name character varying(128) NOT NULL,
    transform jsonb NOT NULL,
    physical_dimensions jsonb NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    pricing_estimate jsonb,
    status character varying(32) DEFAULT 'draft'::character varying NOT NULL,
    cart_id character varying(64),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.custom_design OWNER TO medusa;

--
-- Name: customer; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.customer (
    id text NOT NULL,
    company_name text,
    first_name text,
    last_name text,
    email text,
    phone text,
    has_account boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by text
);


ALTER TABLE public.customer OWNER TO medusa;

--
-- Name: customer_account_holder; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.customer_account_holder (
    customer_id character varying(255) NOT NULL,
    account_holder_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.customer_account_holder OWNER TO medusa;

--
-- Name: customer_address; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.customer_address (
    id text NOT NULL,
    customer_id text NOT NULL,
    address_name text,
    is_default_shipping boolean DEFAULT false NOT NULL,
    is_default_billing boolean DEFAULT false NOT NULL,
    company text,
    first_name text,
    last_name text,
    address_1 text,
    address_2 text,
    city text,
    country_code text,
    province text,
    postal_code text,
    phone text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.customer_address OWNER TO medusa;

--
-- Name: customer_group; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.customer_group (
    id text NOT NULL,
    name text NOT NULL,
    metadata jsonb,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.customer_group OWNER TO medusa;

--
-- Name: customer_group_customer; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.customer_group_customer (
    id text NOT NULL,
    customer_id text NOT NULL,
    customer_group_id text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    deleted_at timestamp with time zone
);


ALTER TABLE public.customer_group_customer OWNER TO medusa;

--
-- Name: fulfillment; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.fulfillment (
    id text NOT NULL,
    location_id text NOT NULL,
    packed_at timestamp with time zone,
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    canceled_at timestamp with time zone,
    data jsonb,
    provider_id text,
    shipping_option_id text,
    metadata jsonb,
    delivery_address_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    marked_shipped_by text,
    created_by text,
    requires_shipping boolean DEFAULT true NOT NULL
);


ALTER TABLE public.fulfillment OWNER TO medusa;

--
-- Name: fulfillment_address; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.fulfillment_address (
    id text NOT NULL,
    company text,
    first_name text,
    last_name text,
    address_1 text,
    address_2 text,
    city text,
    country_code text,
    province text,
    postal_code text,
    phone text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fulfillment_address OWNER TO medusa;

--
-- Name: fulfillment_item; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.fulfillment_item (
    id text NOT NULL,
    title text NOT NULL,
    sku text NOT NULL,
    barcode text NOT NULL,
    quantity numeric NOT NULL,
    raw_quantity jsonb NOT NULL,
    line_item_id text,
    inventory_item_id text,
    fulfillment_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fulfillment_item OWNER TO medusa;

--
-- Name: fulfillment_label; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.fulfillment_label (
    id text NOT NULL,
    tracking_number text NOT NULL,
    tracking_url text NOT NULL,
    label_url text NOT NULL,
    fulfillment_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fulfillment_label OWNER TO medusa;

--
-- Name: fulfillment_provider; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.fulfillment_provider (
    id text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fulfillment_provider OWNER TO medusa;

--
-- Name: fulfillment_set; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.fulfillment_set (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fulfillment_set OWNER TO medusa;

--
-- Name: geo_zone; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.geo_zone (
    id text NOT NULL,
    type text DEFAULT 'country'::text NOT NULL,
    country_code text NOT NULL,
    province_code text,
    city text,
    service_zone_id text NOT NULL,
    postal_expression jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT geo_zone_type_check CHECK ((type = ANY (ARRAY['country'::text, 'province'::text, 'city'::text, 'zip'::text])))
);


ALTER TABLE public.geo_zone OWNER TO medusa;

--
-- Name: image; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.image (
    id text NOT NULL,
    url text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    rank integer DEFAULT 0 NOT NULL,
    product_id text NOT NULL
);


ALTER TABLE public.image OWNER TO medusa;

--
-- Name: inventory_item; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.inventory_item (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    sku text,
    origin_country text,
    hs_code text,
    mid_code text,
    material text,
    weight integer,
    length integer,
    height integer,
    width integer,
    requires_shipping boolean DEFAULT true NOT NULL,
    description text,
    title text,
    thumbnail text,
    metadata jsonb,
    unit_of_measure text
);


ALTER TABLE public.inventory_item OWNER TO medusa;

--
-- Name: inventory_level; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.inventory_level (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    inventory_item_id text NOT NULL,
    location_id text NOT NULL,
    stocked_quantity numeric DEFAULT 0 NOT NULL,
    reserved_quantity numeric DEFAULT 0 NOT NULL,
    incoming_quantity numeric DEFAULT 0 NOT NULL,
    metadata jsonb,
    raw_stocked_quantity jsonb,
    raw_reserved_quantity jsonb,
    raw_incoming_quantity jsonb
);


ALTER TABLE public.inventory_level OWNER TO medusa;

--
-- Name: invite; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.invite (
    id text NOT NULL,
    email text NOT NULL,
    accepted boolean DEFAULT false NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.invite OWNER TO medusa;

--
-- Name: invite_rbac_role; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.invite_rbac_role (
    invite_id character varying(255) NOT NULL,
    rbac_role_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.invite_rbac_role OWNER TO medusa;

--
-- Name: layout_configuration; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.layout_configuration (
    id text NOT NULL,
    zone text NOT NULL,
    user_id text,
    is_system_default boolean DEFAULT false NOT NULL,
    configuration jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.layout_configuration OWNER TO medusa;

--
-- Name: link_module_migrations; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.link_module_migrations (
    id integer NOT NULL,
    table_name character varying(255) NOT NULL,
    link_descriptor jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.link_module_migrations OWNER TO medusa;

--
-- Name: link_module_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: medusa
--

CREATE SEQUENCE public.link_module_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.link_module_migrations_id_seq OWNER TO medusa;

--
-- Name: link_module_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medusa
--

ALTER SEQUENCE public.link_module_migrations_id_seq OWNED BY public.link_module_migrations.id;


--
-- Name: location_fulfillment_provider; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.location_fulfillment_provider (
    stock_location_id character varying(255) NOT NULL,
    fulfillment_provider_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.location_fulfillment_provider OWNER TO medusa;

--
-- Name: location_fulfillment_set; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.location_fulfillment_set (
    stock_location_id character varying(255) NOT NULL,
    fulfillment_set_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.location_fulfillment_set OWNER TO medusa;

--
-- Name: mikro_orm_migrations; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.mikro_orm_migrations (
    id integer NOT NULL,
    name character varying(255),
    executed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.mikro_orm_migrations OWNER TO medusa;

--
-- Name: mikro_orm_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: medusa
--

CREATE SEQUENCE public.mikro_orm_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mikro_orm_migrations_id_seq OWNER TO medusa;

--
-- Name: mikro_orm_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medusa
--

ALTER SEQUENCE public.mikro_orm_migrations_id_seq OWNED BY public.mikro_orm_migrations.id;


--
-- Name: notification; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.notification (
    id text NOT NULL,
    "to" text NOT NULL,
    channel text NOT NULL,
    template text,
    data jsonb,
    trigger_type text,
    resource_id text,
    resource_type text,
    receiver_id text,
    original_notification_id text,
    idempotency_key text,
    external_id text,
    provider_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    status text DEFAULT 'pending'::text NOT NULL,
    "from" text,
    provider_data jsonb,
    CONSTRAINT notification_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'success'::text, 'failure'::text])))
);


ALTER TABLE public.notification OWNER TO medusa;

--
-- Name: notification_provider; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.notification_provider (
    id text NOT NULL,
    handle text NOT NULL,
    name text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    channels text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.notification_provider OWNER TO medusa;

--
-- Name: order; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public."order" (
    id text NOT NULL,
    region_id text,
    display_id integer,
    customer_id text,
    version integer DEFAULT 1 NOT NULL,
    sales_channel_id text,
    status public.order_status_enum DEFAULT 'pending'::public.order_status_enum NOT NULL,
    is_draft_order boolean DEFAULT false NOT NULL,
    email text,
    currency_code text NOT NULL,
    shipping_address_id text,
    billing_address_id text,
    no_notification boolean,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    canceled_at timestamp with time zone,
    custom_display_id text,
    locale text
);


ALTER TABLE public."order" OWNER TO medusa;

--
-- Name: order_address; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_address (
    id text NOT NULL,
    customer_id text,
    company text,
    first_name text,
    last_name text,
    address_1 text,
    address_2 text,
    city text,
    country_code text,
    province text,
    postal_code text,
    phone text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_address OWNER TO medusa;

--
-- Name: order_cart; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_cart (
    order_id character varying(255) NOT NULL,
    cart_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_cart OWNER TO medusa;

--
-- Name: order_change; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_change (
    id text NOT NULL,
    order_id text NOT NULL,
    version integer NOT NULL,
    description text,
    status text DEFAULT 'pending'::text NOT NULL,
    internal_note text,
    created_by text,
    requested_by text,
    requested_at timestamp with time zone,
    confirmed_by text,
    confirmed_at timestamp with time zone,
    declined_by text,
    declined_reason text,
    metadata jsonb,
    declined_at timestamp with time zone,
    canceled_by text,
    canceled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    change_type text,
    deleted_at timestamp with time zone,
    return_id text,
    claim_id text,
    exchange_id text,
    carry_over_promotions boolean,
    no_notification boolean,
    CONSTRAINT order_change_status_check CHECK ((status = ANY (ARRAY['confirmed'::text, 'declined'::text, 'requested'::text, 'pending'::text, 'canceled'::text])))
);


ALTER TABLE public.order_change OWNER TO medusa;

--
-- Name: order_change_action; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_change_action (
    id text NOT NULL,
    order_id text,
    version integer,
    ordering bigint NOT NULL,
    order_change_id text,
    reference text,
    reference_id text,
    action text NOT NULL,
    details jsonb,
    amount numeric,
    raw_amount jsonb,
    internal_note text,
    applied boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    return_id text,
    claim_id text,
    exchange_id text
);


ALTER TABLE public.order_change_action OWNER TO medusa;

--
-- Name: order_change_action_ordering_seq; Type: SEQUENCE; Schema: public; Owner: medusa
--

CREATE SEQUENCE public.order_change_action_ordering_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_change_action_ordering_seq OWNER TO medusa;

--
-- Name: order_change_action_ordering_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medusa
--

ALTER SEQUENCE public.order_change_action_ordering_seq OWNED BY public.order_change_action.ordering;


--
-- Name: order_claim; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_claim (
    id text NOT NULL,
    order_id text NOT NULL,
    return_id text,
    order_version integer NOT NULL,
    display_id integer NOT NULL,
    type public.order_claim_type_enum NOT NULL,
    no_notification boolean,
    refund_amount numeric,
    raw_refund_amount jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    canceled_at timestamp with time zone,
    created_by text
);


ALTER TABLE public.order_claim OWNER TO medusa;

--
-- Name: order_claim_display_id_seq; Type: SEQUENCE; Schema: public; Owner: medusa
--

CREATE SEQUENCE public.order_claim_display_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_claim_display_id_seq OWNER TO medusa;

--
-- Name: order_claim_display_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medusa
--

ALTER SEQUENCE public.order_claim_display_id_seq OWNED BY public.order_claim.display_id;


--
-- Name: order_claim_item; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_claim_item (
    id text NOT NULL,
    claim_id text NOT NULL,
    item_id text NOT NULL,
    is_additional_item boolean DEFAULT false NOT NULL,
    reason public.claim_reason_enum,
    quantity numeric NOT NULL,
    raw_quantity jsonb NOT NULL,
    note text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_claim_item OWNER TO medusa;

--
-- Name: order_claim_item_image; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_claim_item_image (
    id text NOT NULL,
    claim_item_id text NOT NULL,
    url text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_claim_item_image OWNER TO medusa;

--
-- Name: order_credit_line; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_credit_line (
    id text NOT NULL,
    order_id text NOT NULL,
    reference text,
    reference_id text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.order_credit_line OWNER TO medusa;

--
-- Name: order_display_id_seq; Type: SEQUENCE; Schema: public; Owner: medusa
--

CREATE SEQUENCE public.order_display_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_display_id_seq OWNER TO medusa;

--
-- Name: order_display_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medusa
--

ALTER SEQUENCE public.order_display_id_seq OWNED BY public."order".display_id;


--
-- Name: order_exchange; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_exchange (
    id text NOT NULL,
    order_id text NOT NULL,
    return_id text,
    order_version integer NOT NULL,
    display_id integer NOT NULL,
    no_notification boolean,
    allow_backorder boolean DEFAULT false NOT NULL,
    difference_due numeric,
    raw_difference_due jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    canceled_at timestamp with time zone,
    created_by text
);


ALTER TABLE public.order_exchange OWNER TO medusa;

--
-- Name: order_exchange_display_id_seq; Type: SEQUENCE; Schema: public; Owner: medusa
--

CREATE SEQUENCE public.order_exchange_display_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_exchange_display_id_seq OWNER TO medusa;

--
-- Name: order_exchange_display_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medusa
--

ALTER SEQUENCE public.order_exchange_display_id_seq OWNED BY public.order_exchange.display_id;


--
-- Name: order_exchange_item; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_exchange_item (
    id text NOT NULL,
    exchange_id text NOT NULL,
    item_id text NOT NULL,
    quantity numeric NOT NULL,
    raw_quantity jsonb NOT NULL,
    note text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_exchange_item OWNER TO medusa;

--
-- Name: order_fulfillment; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_fulfillment (
    order_id character varying(255) NOT NULL,
    fulfillment_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_fulfillment OWNER TO medusa;

--
-- Name: order_item; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_item (
    id text NOT NULL,
    order_id text NOT NULL,
    version integer NOT NULL,
    item_id text NOT NULL,
    quantity numeric NOT NULL,
    raw_quantity jsonb NOT NULL,
    fulfilled_quantity numeric NOT NULL,
    raw_fulfilled_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    shipped_quantity numeric NOT NULL,
    raw_shipped_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    return_requested_quantity numeric NOT NULL,
    raw_return_requested_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    return_received_quantity numeric NOT NULL,
    raw_return_received_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    return_dismissed_quantity numeric NOT NULL,
    raw_return_dismissed_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    written_off_quantity numeric NOT NULL,
    raw_written_off_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    delivered_quantity numeric DEFAULT 0 NOT NULL,
    raw_delivered_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    unit_price numeric,
    raw_unit_price jsonb,
    compare_at_unit_price numeric,
    raw_compare_at_unit_price jsonb
);


ALTER TABLE public.order_item OWNER TO medusa;

--
-- Name: order_line_item; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_line_item (
    id text NOT NULL,
    totals_id text,
    title text NOT NULL,
    subtitle text,
    thumbnail text,
    variant_id text,
    product_id text,
    product_title text,
    product_description text,
    product_subtitle text,
    product_type text,
    product_collection text,
    product_handle text,
    variant_sku text,
    variant_barcode text,
    variant_title text,
    variant_option_values jsonb,
    requires_shipping boolean DEFAULT true NOT NULL,
    is_discountable boolean DEFAULT true NOT NULL,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    compare_at_unit_price numeric,
    raw_compare_at_unit_price jsonb,
    unit_price numeric NOT NULL,
    raw_unit_price jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    is_custom_price boolean DEFAULT false NOT NULL,
    product_type_id text,
    is_giftcard boolean DEFAULT false NOT NULL
);


ALTER TABLE public.order_line_item OWNER TO medusa;

--
-- Name: order_line_item_adjustment; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_line_item_adjustment (
    id text NOT NULL,
    description text,
    promotion_id text,
    code text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    provider_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    item_id text NOT NULL,
    deleted_at timestamp with time zone,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.order_line_item_adjustment OWNER TO medusa;

--
-- Name: order_line_item_tax_line; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_line_item_tax_line (
    id text NOT NULL,
    description text,
    tax_rate_id text,
    code text NOT NULL,
    rate numeric NOT NULL,
    raw_rate jsonb NOT NULL,
    provider_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    item_id text NOT NULL,
    deleted_at timestamp with time zone,
    metadata jsonb,
    data jsonb
);


ALTER TABLE public.order_line_item_tax_line OWNER TO medusa;

--
-- Name: order_payment_collection; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_payment_collection (
    order_id character varying(255) NOT NULL,
    payment_collection_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_payment_collection OWNER TO medusa;

--
-- Name: order_promotion; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_promotion (
    order_id character varying(255) NOT NULL,
    promotion_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_promotion OWNER TO medusa;

--
-- Name: order_shipping; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_shipping (
    id text NOT NULL,
    order_id text NOT NULL,
    version integer NOT NULL,
    shipping_method_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    return_id text,
    claim_id text,
    exchange_id text
);


ALTER TABLE public.order_shipping OWNER TO medusa;

--
-- Name: order_shipping_method; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_shipping_method (
    id text NOT NULL,
    name text NOT NULL,
    description jsonb,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    shipping_option_id text,
    data jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    is_custom_amount boolean DEFAULT false NOT NULL
);


ALTER TABLE public.order_shipping_method OWNER TO medusa;

--
-- Name: order_shipping_method_adjustment; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_shipping_method_adjustment (
    id text NOT NULL,
    description text,
    promotion_id text,
    code text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    provider_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    shipping_method_id text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.order_shipping_method_adjustment OWNER TO medusa;

--
-- Name: order_shipping_method_tax_line; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_shipping_method_tax_line (
    id text NOT NULL,
    description text,
    tax_rate_id text,
    code text NOT NULL,
    rate numeric NOT NULL,
    raw_rate jsonb NOT NULL,
    provider_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    shipping_method_id text NOT NULL,
    deleted_at timestamp with time zone,
    metadata jsonb,
    data jsonb
);


ALTER TABLE public.order_shipping_method_tax_line OWNER TO medusa;

--
-- Name: order_summary; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_summary (
    id text NOT NULL,
    order_id text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    totals jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_summary OWNER TO medusa;

--
-- Name: order_transaction; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.order_transaction (
    id text NOT NULL,
    order_id text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    currency_code text NOT NULL,
    reference text,
    reference_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    return_id text,
    claim_id text,
    exchange_id text
);


ALTER TABLE public.order_transaction OWNER TO medusa;

--
-- Name: payment; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.payment (
    id text NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    currency_code text NOT NULL,
    provider_id text NOT NULL,
    data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    captured_at timestamp with time zone,
    canceled_at timestamp with time zone,
    payment_collection_id text NOT NULL,
    payment_session_id text NOT NULL,
    metadata jsonb
);


ALTER TABLE public.payment OWNER TO medusa;

--
-- Name: payment_collection; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.payment_collection (
    id text NOT NULL,
    currency_code text NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    authorized_amount numeric,
    raw_authorized_amount jsonb,
    captured_amount numeric,
    raw_captured_amount jsonb,
    refunded_amount numeric,
    raw_refunded_amount jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    completed_at timestamp with time zone,
    status text DEFAULT 'not_paid'::text NOT NULL,
    metadata jsonb,
    CONSTRAINT payment_collection_status_check CHECK ((status = ANY (ARRAY['not_paid'::text, 'awaiting'::text, 'authorized'::text, 'partially_authorized'::text, 'canceled'::text, 'failed'::text, 'partially_captured'::text, 'completed'::text])))
);


ALTER TABLE public.payment_collection OWNER TO medusa;

--
-- Name: payment_collection_payment_providers; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.payment_collection_payment_providers (
    payment_collection_id text NOT NULL,
    payment_provider_id text NOT NULL
);


ALTER TABLE public.payment_collection_payment_providers OWNER TO medusa;

--
-- Name: payment_provider; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.payment_provider (
    id text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.payment_provider OWNER TO medusa;

--
-- Name: payment_session; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.payment_session (
    id text NOT NULL,
    currency_code text NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    provider_id text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    context jsonb,
    status text DEFAULT 'pending'::text NOT NULL,
    authorized_at timestamp with time zone,
    payment_collection_id text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT payment_session_status_check CHECK ((status = ANY (ARRAY['authorized'::text, 'captured'::text, 'pending'::text, 'requires_more'::text, 'error'::text, 'canceled'::text, 'pending_authorization'::text])))
);


ALTER TABLE public.payment_session OWNER TO medusa;

--
-- Name: price; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.price (
    id text NOT NULL,
    title text,
    price_set_id text NOT NULL,
    currency_code text NOT NULL,
    raw_amount jsonb NOT NULL,
    rules_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    price_list_id text,
    amount numeric NOT NULL,
    min_quantity numeric,
    max_quantity numeric,
    raw_min_quantity jsonb,
    raw_max_quantity jsonb
);


ALTER TABLE public.price OWNER TO medusa;

--
-- Name: price_list; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.price_list (
    id text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    rules_count integer DEFAULT 0,
    title text NOT NULL,
    description text NOT NULL,
    type text DEFAULT 'sale'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    metadata jsonb,
    CONSTRAINT price_list_status_check CHECK ((status = ANY (ARRAY['active'::text, 'draft'::text]))),
    CONSTRAINT price_list_type_check CHECK ((type = ANY (ARRAY['sale'::text, 'override'::text])))
);


ALTER TABLE public.price_list OWNER TO medusa;

--
-- Name: price_list_rule; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.price_list_rule (
    id text NOT NULL,
    price_list_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    value jsonb,
    attribute text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.price_list_rule OWNER TO medusa;

--
-- Name: price_preference; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.price_preference (
    id text NOT NULL,
    attribute text NOT NULL,
    value text,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.price_preference OWNER TO medusa;

--
-- Name: price_rule; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.price_rule (
    id text NOT NULL,
    value text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    price_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    attribute text DEFAULT ''::text NOT NULL,
    operator text DEFAULT 'eq'::text NOT NULL,
    CONSTRAINT price_rule_operator_check CHECK ((operator = ANY (ARRAY['gte'::text, 'lte'::text, 'gt'::text, 'lt'::text, 'eq'::text])))
);


ALTER TABLE public.price_rule OWNER TO medusa;

--
-- Name: price_set; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.price_set (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.price_set OWNER TO medusa;

--
-- Name: product; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product (
    id text NOT NULL,
    title text NOT NULL,
    handle text NOT NULL,
    subtitle text,
    description text,
    is_giftcard boolean DEFAULT false NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    thumbnail text,
    weight real,
    length real,
    height real,
    width real,
    origin_country text,
    hs_code text,
    mid_code text,
    material text,
    collection_id text,
    type_id text,
    discountable boolean DEFAULT true NOT NULL,
    external_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    metadata jsonb,
    CONSTRAINT product_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'proposed'::text, 'published'::text, 'rejected'::text])))
);


ALTER TABLE public.product OWNER TO medusa;

--
-- Name: product_category; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product_category (
    id text NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    handle text NOT NULL,
    mpath text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    is_internal boolean DEFAULT false NOT NULL,
    rank integer DEFAULT 0 NOT NULL,
    parent_category_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    metadata jsonb,
    external_id text
);


ALTER TABLE public.product_category OWNER TO medusa;

--
-- Name: product_category_product; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product_category_product (
    product_id text NOT NULL,
    product_category_id text NOT NULL
);


ALTER TABLE public.product_category_product OWNER TO medusa;

--
-- Name: product_collection; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product_collection (
    id text NOT NULL,
    title text NOT NULL,
    handle text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    external_id text
);


ALTER TABLE public.product_collection OWNER TO medusa;

--
-- Name: product_option; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product_option (
    id text NOT NULL,
    title text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    is_exclusive boolean DEFAULT false NOT NULL
);


ALTER TABLE public.product_option OWNER TO medusa;

--
-- Name: product_option_value; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product_option_value (
    id text NOT NULL,
    value text NOT NULL,
    option_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    rank integer
);


ALTER TABLE public.product_option_value OWNER TO medusa;

--
-- Name: product_product_option; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product_product_option (
    id text NOT NULL,
    product_id text NOT NULL,
    product_option_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_product_option OWNER TO medusa;

--
-- Name: product_product_option_value; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product_product_option_value (
    id text NOT NULL,
    product_product_option_id text NOT NULL,
    product_option_value_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_product_option_value OWNER TO medusa;

--
-- Name: product_sales_channel; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product_sales_channel (
    product_id character varying(255) NOT NULL,
    sales_channel_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_sales_channel OWNER TO medusa;

--
-- Name: product_shipping_profile; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product_shipping_profile (
    product_id character varying(255) NOT NULL,
    shipping_profile_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_shipping_profile OWNER TO medusa;

--
-- Name: product_tag; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product_tag (
    id text NOT NULL,
    value text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    external_id text
);


ALTER TABLE public.product_tag OWNER TO medusa;

--
-- Name: product_tags; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product_tags (
    product_id text NOT NULL,
    product_tag_id text NOT NULL
);


ALTER TABLE public.product_tags OWNER TO medusa;

--
-- Name: product_type; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product_type (
    id text NOT NULL,
    value text NOT NULL,
    metadata json,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    external_id text
);


ALTER TABLE public.product_type OWNER TO medusa;

--
-- Name: product_variant; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product_variant (
    id text NOT NULL,
    title text NOT NULL,
    sku text,
    barcode text,
    ean text,
    upc text,
    allow_backorder boolean DEFAULT false NOT NULL,
    manage_inventory boolean DEFAULT true NOT NULL,
    hs_code text,
    origin_country text,
    mid_code text,
    material text,
    weight real,
    length real,
    height real,
    width real,
    metadata jsonb,
    variant_rank integer DEFAULT 0,
    product_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    thumbnail text
);


ALTER TABLE public.product_variant OWNER TO medusa;

--
-- Name: product_variant_inventory_item; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product_variant_inventory_item (
    variant_id character varying(255) NOT NULL,
    inventory_item_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    required_quantity numeric DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_variant_inventory_item OWNER TO medusa;

--
-- Name: product_variant_option; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product_variant_option (
    variant_id text NOT NULL,
    option_value_id text NOT NULL
);


ALTER TABLE public.product_variant_option OWNER TO medusa;

--
-- Name: product_variant_price_set; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product_variant_price_set (
    variant_id character varying(255) NOT NULL,
    price_set_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_variant_price_set OWNER TO medusa;

--
-- Name: product_variant_product_image; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.product_variant_product_image (
    id text NOT NULL,
    variant_id text NOT NULL,
    image_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_variant_product_image OWNER TO medusa;

--
-- Name: promotion; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.promotion (
    id text NOT NULL,
    code text NOT NULL,
    campaign_id text,
    is_automatic boolean DEFAULT false NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    status text DEFAULT 'draft'::text NOT NULL,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    "limit" integer,
    used integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    CONSTRAINT promotion_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'inactive'::text]))),
    CONSTRAINT promotion_type_check CHECK ((type = ANY (ARRAY['standard'::text, 'buyget'::text])))
);


ALTER TABLE public.promotion OWNER TO medusa;

--
-- Name: promotion_application_method; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.promotion_application_method (
    id text NOT NULL,
    value numeric,
    raw_value jsonb,
    max_quantity integer,
    apply_to_quantity integer,
    buy_rules_min_quantity integer,
    type text NOT NULL,
    target_type text NOT NULL,
    allocation text,
    promotion_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    currency_code text,
    CONSTRAINT promotion_application_method_allocation_check CHECK ((allocation = ANY (ARRAY['each'::text, 'across'::text, 'once'::text]))),
    CONSTRAINT promotion_application_method_target_type_check CHECK ((target_type = ANY (ARRAY['order'::text, 'shipping_methods'::text, 'items'::text]))),
    CONSTRAINT promotion_application_method_type_check CHECK ((type = ANY (ARRAY['fixed'::text, 'percentage'::text])))
);


ALTER TABLE public.promotion_application_method OWNER TO medusa;

--
-- Name: promotion_campaign; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.promotion_campaign (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    campaign_identifier text NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.promotion_campaign OWNER TO medusa;

--
-- Name: promotion_campaign_budget; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.promotion_campaign_budget (
    id text NOT NULL,
    type text NOT NULL,
    campaign_id text NOT NULL,
    "limit" numeric,
    raw_limit jsonb,
    used numeric DEFAULT 0 NOT NULL,
    raw_used jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    currency_code text,
    attribute text,
    CONSTRAINT promotion_campaign_budget_type_check CHECK ((type = ANY (ARRAY['spend'::text, 'usage'::text, 'use_by_attribute'::text, 'spend_by_attribute'::text])))
);


ALTER TABLE public.promotion_campaign_budget OWNER TO medusa;

--
-- Name: promotion_campaign_budget_usage; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.promotion_campaign_budget_usage (
    id text NOT NULL,
    attribute_value text NOT NULL,
    used numeric DEFAULT 0 NOT NULL,
    budget_id text NOT NULL,
    raw_used jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.promotion_campaign_budget_usage OWNER TO medusa;

--
-- Name: promotion_promotion_rule; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.promotion_promotion_rule (
    promotion_id text NOT NULL,
    promotion_rule_id text NOT NULL
);


ALTER TABLE public.promotion_promotion_rule OWNER TO medusa;

--
-- Name: promotion_rule; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.promotion_rule (
    id text NOT NULL,
    description text,
    attribute text NOT NULL,
    operator text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT promotion_rule_operator_check CHECK ((operator = ANY (ARRAY['gte'::text, 'lte'::text, 'gt'::text, 'lt'::text, 'eq'::text, 'ne'::text, 'in'::text])))
);


ALTER TABLE public.promotion_rule OWNER TO medusa;

--
-- Name: promotion_rule_value; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.promotion_rule_value (
    id text NOT NULL,
    promotion_rule_id text NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.promotion_rule_value OWNER TO medusa;

--
-- Name: property_label; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.property_label (
    id text NOT NULL,
    entity text NOT NULL,
    property text NOT NULL,
    label text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.property_label OWNER TO medusa;

--
-- Name: provider_identity; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.provider_identity (
    id text NOT NULL,
    entity_id text NOT NULL,
    provider text NOT NULL,
    auth_identity_id text NOT NULL,
    user_metadata jsonb,
    provider_metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.provider_identity OWNER TO medusa;

--
-- Name: publishable_api_key_sales_channel; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.publishable_api_key_sales_channel (
    publishable_key_id character varying(255) NOT NULL,
    sales_channel_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.publishable_api_key_sales_channel OWNER TO medusa;

--
-- Name: refund; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.refund (
    id text NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    payment_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by text,
    metadata jsonb,
    refund_reason_id text,
    note text,
    status text DEFAULT 'pending'::text NOT NULL,
    idempotency_key text,
    CONSTRAINT refund_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'succeeded'::text, 'failed'::text])))
);


ALTER TABLE public.refund OWNER TO medusa;

--
-- Name: refund_reason; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.refund_reason (
    id text NOT NULL,
    label text NOT NULL,
    description text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    code text NOT NULL
);


ALTER TABLE public.refund_reason OWNER TO medusa;

--
-- Name: region; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.region (
    id text NOT NULL,
    name text NOT NULL,
    currency_code text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    automatic_taxes boolean DEFAULT true NOT NULL
);


ALTER TABLE public.region OWNER TO medusa;

--
-- Name: region_country; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.region_country (
    iso_2 text NOT NULL,
    iso_3 text NOT NULL,
    num_code text NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    region_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.region_country OWNER TO medusa;

--
-- Name: region_payment_provider; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.region_payment_provider (
    region_id character varying(255) NOT NULL,
    payment_provider_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.region_payment_provider OWNER TO medusa;

--
-- Name: reservation_item; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.reservation_item (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    line_item_id text,
    location_id text NOT NULL,
    quantity numeric NOT NULL,
    external_id text,
    description text,
    created_by text,
    metadata jsonb,
    inventory_item_id text NOT NULL,
    allow_backorder boolean DEFAULT false,
    raw_quantity jsonb
);


ALTER TABLE public.reservation_item OWNER TO medusa;

--
-- Name: return; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.return (
    id text NOT NULL,
    order_id text NOT NULL,
    claim_id text,
    exchange_id text,
    order_version integer NOT NULL,
    display_id integer NOT NULL,
    status public.return_status_enum DEFAULT 'open'::public.return_status_enum NOT NULL,
    no_notification boolean,
    refund_amount numeric,
    raw_refund_amount jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    received_at timestamp with time zone,
    canceled_at timestamp with time zone,
    location_id text,
    requested_at timestamp with time zone,
    created_by text
);


ALTER TABLE public.return OWNER TO medusa;

--
-- Name: return_display_id_seq; Type: SEQUENCE; Schema: public; Owner: medusa
--

CREATE SEQUENCE public.return_display_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.return_display_id_seq OWNER TO medusa;

--
-- Name: return_display_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medusa
--

ALTER SEQUENCE public.return_display_id_seq OWNED BY public.return.display_id;


--
-- Name: return_fulfillment; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.return_fulfillment (
    return_id character varying(255) NOT NULL,
    fulfillment_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.return_fulfillment OWNER TO medusa;

--
-- Name: return_item; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.return_item (
    id text NOT NULL,
    return_id text NOT NULL,
    reason_id text,
    item_id text NOT NULL,
    quantity numeric NOT NULL,
    raw_quantity jsonb NOT NULL,
    received_quantity numeric DEFAULT 0 NOT NULL,
    raw_received_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    note text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    damaged_quantity numeric DEFAULT 0 NOT NULL,
    raw_damaged_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL
);


ALTER TABLE public.return_item OWNER TO medusa;

--
-- Name: return_reason; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.return_reason (
    id character varying NOT NULL,
    value character varying NOT NULL,
    label character varying NOT NULL,
    description character varying,
    metadata jsonb,
    parent_return_reason_id character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.return_reason OWNER TO medusa;

--
-- Name: sales_channel; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.sales_channel (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    is_disabled boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.sales_channel OWNER TO medusa;

--
-- Name: sales_channel_stock_location; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.sales_channel_stock_location (
    sales_channel_id character varying(255) NOT NULL,
    stock_location_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.sales_channel_stock_location OWNER TO medusa;

--
-- Name: script_migrations; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.script_migrations (
    id integer NOT NULL,
    script_name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    finished_at timestamp with time zone
);


ALTER TABLE public.script_migrations OWNER TO medusa;

--
-- Name: script_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: medusa
--

CREATE SEQUENCE public.script_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.script_migrations_id_seq OWNER TO medusa;

--
-- Name: script_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: medusa
--

ALTER SEQUENCE public.script_migrations_id_seq OWNED BY public.script_migrations.id;


--
-- Name: search_index; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.search_index (
    id text NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    active_version integer
);


ALTER TABLE public.search_index OWNER TO medusa;

--
-- Name: search_index_sync; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.search_index_sync (
    id text NOT NULL,
    job_id text,
    status text DEFAULT 'pending'::text NOT NULL,
    filters jsonb,
    last_key text,
    documents_synced integer DEFAULT 0 NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    error text,
    search_index_version_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    resumable boolean DEFAULT true NOT NULL,
    CONSTRAINT search_index_sync_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'done'::text, 'failed'::text, 'canceled'::text])))
);


ALTER TABLE public.search_index_sync OWNER TO medusa;

--
-- Name: search_index_version; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.search_index_version (
    id text NOT NULL,
    version integer NOT NULL,
    provider text NOT NULL,
    physical_name text NOT NULL,
    definition_hash text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    search_index_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT search_index_version_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'building'::text, 'ready'::text, 'error'::text])))
);


ALTER TABLE public.search_index_version OWNER TO medusa;

--
-- Name: search_pg_product_v1; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.search_pg_product_v1 (
    id text NOT NULL,
    document jsonb NOT NULL,
    indexed jsonb DEFAULT '{}'::jsonb NOT NULL,
    search_vector tsvector DEFAULT ''::tsvector NOT NULL,
    search_text text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.search_pg_product_v1 OWNER TO medusa;

--
-- Name: search_postgres_index; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.search_postgres_index (
    name text NOT NULL,
    table_name text NOT NULL,
    schema_hash text NOT NULL,
    plan jsonb NOT NULL,
    document_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.search_postgres_index OWNER TO medusa;

--
-- Name: service_zone; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.service_zone (
    id text NOT NULL,
    name text NOT NULL,
    metadata jsonb,
    fulfillment_set_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.service_zone OWNER TO medusa;

--
-- Name: shipping_option; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.shipping_option (
    id text NOT NULL,
    name text NOT NULL,
    price_type text DEFAULT 'flat'::text NOT NULL,
    service_zone_id text NOT NULL,
    shipping_profile_id text,
    provider_id text,
    data jsonb,
    metadata jsonb,
    shipping_option_type_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT shipping_option_price_type_check CHECK ((price_type = ANY (ARRAY['calculated'::text, 'flat'::text])))
);


ALTER TABLE public.shipping_option OWNER TO medusa;

--
-- Name: shipping_option_price_set; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.shipping_option_price_set (
    shipping_option_id character varying(255) NOT NULL,
    price_set_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.shipping_option_price_set OWNER TO medusa;

--
-- Name: shipping_option_rule; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.shipping_option_rule (
    id text NOT NULL,
    attribute text NOT NULL,
    operator text NOT NULL,
    value jsonb,
    shipping_option_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT shipping_option_rule_operator_check CHECK ((operator = ANY (ARRAY['in'::text, 'eq'::text, 'ne'::text, 'gt'::text, 'gte'::text, 'lt'::text, 'lte'::text, 'nin'::text])))
);


ALTER TABLE public.shipping_option_rule OWNER TO medusa;

--
-- Name: shipping_option_type; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.shipping_option_type (
    id text NOT NULL,
    label text NOT NULL,
    description text,
    code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.shipping_option_type OWNER TO medusa;

--
-- Name: shipping_profile; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.shipping_profile (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.shipping_profile OWNER TO medusa;

--
-- Name: stock_location; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.stock_location (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    name text NOT NULL,
    address_id text,
    metadata jsonb
);


ALTER TABLE public.stock_location OWNER TO medusa;

--
-- Name: stock_location_address; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.stock_location_address (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    address_1 text NOT NULL,
    address_2 text,
    company text,
    city text,
    country_code text NOT NULL,
    phone text,
    province text,
    postal_code text,
    metadata jsonb
);


ALTER TABLE public.stock_location_address OWNER TO medusa;

--
-- Name: store; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.store (
    id text NOT NULL,
    name text DEFAULT 'Medusa Store'::text NOT NULL,
    default_sales_channel_id text,
    default_region_id text,
    default_location_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.store OWNER TO medusa;

--
-- Name: store_currency; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.store_currency (
    id text NOT NULL,
    currency_code text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    store_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.store_currency OWNER TO medusa;

--
-- Name: store_locale; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.store_locale (
    id text NOT NULL,
    locale_code text NOT NULL,
    store_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.store_locale OWNER TO medusa;

--
-- Name: tax_provider; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.tax_provider (
    id text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.tax_provider OWNER TO medusa;

--
-- Name: tax_rate; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.tax_rate (
    id text NOT NULL,
    rate real,
    code text NOT NULL,
    name text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_combinable boolean DEFAULT false NOT NULL,
    tax_region_id text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    deleted_at timestamp with time zone
);


ALTER TABLE public.tax_rate OWNER TO medusa;

--
-- Name: tax_rate_rule; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.tax_rate_rule (
    id text NOT NULL,
    tax_rate_id text NOT NULL,
    reference_id text NOT NULL,
    reference text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    deleted_at timestamp with time zone
);


ALTER TABLE public.tax_rate_rule OWNER TO medusa;

--
-- Name: tax_region; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.tax_region (
    id text NOT NULL,
    provider_id text,
    country_code text NOT NULL,
    province_code text,
    parent_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    deleted_at timestamp with time zone,
    CONSTRAINT "CK_tax_region_country_top_level" CHECK (((parent_id IS NULL) OR (province_code IS NOT NULL))),
    CONSTRAINT "CK_tax_region_provider_top_level" CHECK (((parent_id IS NULL) OR (provider_id IS NULL)))
);


ALTER TABLE public.tax_region OWNER TO medusa;

--
-- Name: user; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public."user" (
    id text NOT NULL,
    first_name text,
    last_name text,
    email text NOT NULL,
    avatar_url text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public."user" OWNER TO medusa;

--
-- Name: user_preference; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.user_preference (
    id text NOT NULL,
    user_id text NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.user_preference OWNER TO medusa;

--
-- Name: user_rbac_role; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.user_rbac_role (
    user_id character varying(255) NOT NULL,
    rbac_role_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.user_rbac_role OWNER TO medusa;

--
-- Name: view_configuration; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.view_configuration (
    id text NOT NULL,
    entity text NOT NULL,
    name text,
    user_id text,
    is_system_default boolean DEFAULT false NOT NULL,
    configuration jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.view_configuration OWNER TO medusa;

--
-- Name: workflow_execution; Type: TABLE; Schema: public; Owner: medusa
--

CREATE TABLE public.workflow_execution (
    id character varying NOT NULL,
    workflow_id character varying NOT NULL,
    transaction_id character varying NOT NULL,
    execution jsonb,
    context jsonb,
    state character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    retention_time integer,
    run_id text DEFAULT '01M6GP7B87HBDCQY7SQBKXZYY2'::text NOT NULL
);


ALTER TABLE public.workflow_execution OWNER TO medusa;

--
-- Name: link_module_migrations id; Type: DEFAULT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.link_module_migrations ALTER COLUMN id SET DEFAULT nextval('public.link_module_migrations_id_seq'::regclass);


--
-- Name: mikro_orm_migrations id; Type: DEFAULT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.mikro_orm_migrations ALTER COLUMN id SET DEFAULT nextval('public.mikro_orm_migrations_id_seq'::regclass);


--
-- Name: order display_id; Type: DEFAULT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public."order" ALTER COLUMN display_id SET DEFAULT nextval('public.order_display_id_seq'::regclass);


--
-- Name: order_change_action ordering; Type: DEFAULT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_change_action ALTER COLUMN ordering SET DEFAULT nextval('public.order_change_action_ordering_seq'::regclass);


--
-- Name: order_claim display_id; Type: DEFAULT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_claim ALTER COLUMN display_id SET DEFAULT nextval('public.order_claim_display_id_seq'::regclass);


--
-- Name: order_exchange display_id; Type: DEFAULT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_exchange ALTER COLUMN display_id SET DEFAULT nextval('public.order_exchange_display_id_seq'::regclass);


--
-- Name: return display_id; Type: DEFAULT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.return ALTER COLUMN display_id SET DEFAULT nextval('public.return_display_id_seq'::regclass);


--
-- Name: script_migrations id; Type: DEFAULT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.script_migrations ALTER COLUMN id SET DEFAULT nextval('public.script_migrations_id_seq'::regclass);


--
-- Data for Name: account_holder; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.account_holder (id, provider_id, external_id, email, data, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: api_key; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.api_key (id, token, salt, redacted, title, type, last_used_at, created_by, created_at, revoked_by, revoked_at, updated_at, deleted_at) FROM stdin;
apk_01M6GP7HC3KGW8V9SJSRZDPH19	pk_0a79f3d5cf6d94e1b78d382788f4c59ead1824c818ff9c8542d80c8dab0462cc		pk_0a7***2cc	Default Publishable API Key	publishable	\N		2026-11-03 12:30:32.835+00	\N	\N	2026-11-03 12:30:32.835+00	\N
\.


--
-- Data for Name: application_method_buy_rules; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.application_method_buy_rules (application_method_id, promotion_rule_id) FROM stdin;
\.


--
-- Data for Name: application_method_target_rules; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.application_method_target_rules (application_method_id, promotion_rule_id) FROM stdin;
\.


--
-- Data for Name: auth_identity; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.auth_identity (id, app_metadata, created_at, updated_at, deleted_at) FROM stdin;
authid_01M6GP85KE5ZP3H0AVNGQWV039	{"user_id": "user_01M6GP85GWCW9HZXM6JWCAY3FQ"}	2026-11-03 12:30:53.55+00	2026-11-03 12:30:53.56+00	\N
\.


--
-- Data for Name: auth_mfa_factor; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.auth_mfa_factor (id, auth_identity_id, provider, status, provider_metadata, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: auth_mfa_recovery_code; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.auth_mfa_recovery_code (id, auth_identity_id, code_hash, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: auth_password_reset_token; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.auth_password_reset_token (id, auth_identity_id, provider_identity_id, entity_id, token_hash, expires_at, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: auth_verification; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.auth_verification (id, auth_identity_id, entity_id, entity_type, code_provider, verified_at, requested_at, provider_metadata, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: capture; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.capture (id, amount, raw_amount, payment_id, created_at, updated_at, deleted_at, created_by, metadata) FROM stdin;
\.


--
-- Data for Name: cart; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.cart (id, region_id, customer_id, sales_channel_id, email, currency_code, shipping_address_id, billing_address_id, metadata, created_at, updated_at, deleted_at, completed_at, locale) FROM stdin;
cart_01M6GPSFWA0CNFZB7GCY6FM4S0	reg_01M6GP9DKF11TP8BQSB5Q3EF53	\N	sc_01M6GP7HBXGBAJ70C7ZFYX8RV9	\N	try	caaddr_01M6GPSFWBY7SN0G4271H99RJ8	\N	\N	2026-11-03 12:40:21.132+00	2026-11-03 12:40:21.132+00	\N	\N	\N
cart_01M6GTHMRCT7JHQ53YGQ265477	reg_01M6GP9DKF11TP8BQSB5Q3EF53	\N	sc_01M6GP7HBXGBAJ70C7ZFYX8RV9	\N	try	caaddr_01M6GTHMREX3WJSC8NDAF869TV	\N	\N	2026-11-03 13:45:58.29+00	2026-11-03 13:45:58.29+00	\N	\N	\N
cart_01M6GVRZMXV0HJ4FK1XHMY6SCS	reg_01M6GP9DKF11TP8BQSB5Q3EF53	\N	sc_01M6GP7HBXGBAJ70C7ZFYX8RV9	\N	try	caaddr_01M6GVRZMYJ6CB0E5SCJZNJ9XG	\N	\N	2026-11-03 14:07:27.391+00	2026-11-03 14:07:27.391+00	\N	\N	\N
\.


--
-- Data for Name: cart_address; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.cart_address (id, customer_id, company, first_name, last_name, address_1, address_2, city, country_code, province, postal_code, phone, metadata, created_at, updated_at, deleted_at) FROM stdin;
caaddr_01M6GPSFWBY7SN0G4271H99RJ8	\N	\N	\N	\N	\N	\N	\N	tr	\N	\N	\N	\N	2026-11-03 12:40:21.132+00	2026-11-03 12:40:21.132+00	\N
caaddr_01M6GTHMREX3WJSC8NDAF869TV	\N	\N	\N	\N	\N	\N	\N	tr	\N	\N	\N	\N	2026-11-03 13:45:58.289+00	2026-11-03 13:45:58.289+00	\N
caaddr_01M6GVRZMYJ6CB0E5SCJZNJ9XG	\N	\N	\N	\N	\N	\N	\N	tr	\N	\N	\N	\N	2026-11-03 14:07:27.39+00	2026-11-03 14:07:27.39+00	\N
\.


--
-- Data for Name: cart_line_item; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.cart_line_item (id, cart_id, title, subtitle, thumbnail, quantity, variant_id, product_id, product_title, product_description, product_subtitle, product_type, product_collection, product_handle, variant_sku, variant_barcode, variant_title, variant_option_values, requires_shipping, is_discountable, is_tax_inclusive, compare_at_unit_price, raw_compare_at_unit_price, unit_price, raw_unit_price, metadata, created_at, updated_at, deleted_at, product_type_id, is_custom_price, is_giftcard) FROM stdin;
cali_01M6GPVTKHZ9H51ABENTA5BTQ9	cart_01M6GPSFWA0CNFZB7GCY6FM4S0	Premium Oversize Penye T-Shirt	Siyah / L	https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop	2	variant_01M6GP9DQ46KD0999Z1V1GBGDH	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	Premium Oversize Penye T-Shirt	240 GSM %100 Pamuk, yumuşak tuşeli, birinci sınıf penye kumaş. Dayanıklı çift iğne dikiş ve fit kesim.	\N	\N	\N	premium-oversize-penye-t-shirt	NZM-TSH-BLK-L	\N	Siyah / L	\N	t	t	f	\N	\N	450	{"value": "450", "precision": 20}	{}	2026-11-03 12:41:37.649+00	2026-11-03 12:41:37.649+00	\N	\N	f	f
cali_01M6GT5R5BMEYJN4RVGV4H59MY	cart_01M6GPSFWA0CNFZB7GCY6FM4S0	Premium Oversize Penye T-Shirt	Siyah / L	https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop	1	variant_01M6GP9DQ46KD0999Z1V1GBGDH	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	Premium Oversize Penye T-Shirt	240 GSM %100 Pamuk, yumuşak tuşeli, birinci sınıf penye kumaş. Dayanıklı çift iğne dikiş ve fit kesim.	\N	\N	\N	premium-oversize-penye-t-shirt	NZM-TSH-BLK-L	\N	Siyah / L	\N	t	t	f	\N	\N	450	{"value": "450", "precision": 20}	{"design_id": "des_test_123", "print_mode": "custom"}	2026-11-03 13:39:28.556+00	2026-11-03 13:39:44.787+00	2026-11-03 13:39:44.785+00	\N	f	f
cali_01M6GT61W9WMRRAQ9CVQ5NP7YR	cart_01M6GPSFWA0CNFZB7GCY6FM4S0	Premium Oversize Penye T-Shirt	Siyah / L	https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop	1	variant_01M6GP9DQ46KD0999Z1V1GBGDH	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	Premium Oversize Penye T-Shirt	240 GSM %100 Pamuk, yumuşak tuşeli, birinci sınıf penye kumaş. Dayanıklı çift iğne dikiş ve fit kesim.	\N	\N	\N	premium-oversize-penye-t-shirt	NZM-TSH-BLK-L	\N	Siyah / L	\N	t	t	f	\N	\N	450	{"value": "450", "precision": 20}	{"design_id": "des_test_999", "print_mode": "custom"}	2026-11-03 13:39:38.505+00	2026-11-03 13:39:44.919+00	2026-11-03 13:39:44.919+00	\N	f	f
cali_01M6GTHVYSB77P7GRPBWK0YTWY	cart_01M6GTHMRCT7JHQ53YGQ265477	Premium Oversize Penye T-Shirt	Siyah / L	https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop	1	variant_01M6GP9DQ46KD0999Z1V1GBGDH	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	Premium Oversize Penye T-Shirt	240 GSM %100 Pamuk, yumuşak tuşeli, birinci sınıf penye kumaş. Dayanıklı çift iğne dikiş ve fit kesim.	\N	\N	\N	premium-oversize-penye-t-shirt	NZM-TSH-BLK-L	\N	Siyah / L	\N	t	t	f	\N	\N	450	{"value": "450", "precision": 20}	{}	2026-11-03 13:46:05.657+00	2026-11-03 13:46:05.657+00	\N	\N	f	f
cali_01M6GTJYW3KEYXEZAYJE9C8C86	cart_01M6GTHMRCT7JHQ53YGQ265477	Premium Oversize Penye T-Shirt	Siyah / L	https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop	1	variant_01M6GP9DQ46KD0999Z1V1GBGDH	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	Premium Oversize Penye T-Shirt	240 GSM %100 Pamuk, yumuşak tuşeli, birinci sınıf penye kumaş. Dayanıklı çift iğne dikiş ve fit kesim.	\N	\N	\N	premium-oversize-penye-t-shirt	NZM-TSH-BLK-L	\N	Siyah / L	\N	t	t	f	\N	\N	450	{"value": "450", "precision": 20}	{"design_id": "des_665ffc3a28165cda11c4d3b8", "print_mode": "custom"}	2026-11-03 13:46:41.411+00	2026-11-03 13:46:41.411+00	\N	\N	f	f
cali_01M6GTJZ0V81XBR85PCADH9KQB	cart_01M6GTHMRCT7JHQ53YGQ265477	Premium Oversize Penye T-Shirt	Siyah / L	https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop	1	variant_01M6GP9DQ46KD0999Z1V1GBGDH	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	Premium Oversize Penye T-Shirt	240 GSM %100 Pamuk, yumuşak tuşeli, birinci sınıf penye kumaş. Dayanıklı çift iğne dikiş ve fit kesim.	\N	\N	\N	premium-oversize-penye-t-shirt	NZM-TSH-BLK-L	\N	Siyah / L	\N	t	t	f	\N	\N	450	{"value": "450", "precision": 20}	{"design_id": "des_294f8b8c22d52ca84d01506c", "print_mode": "custom"}	2026-11-03 13:46:41.563+00	2026-11-03 13:46:41.563+00	\N	\N	f	f
cali_01M6GVRZSNDG8CHPAJFPZPZC8V	cart_01M6GVRZMXV0HJ4FK1XHMY6SCS	Özel Baskılı Kanvas Bez Çanta (Tote Bag)	Ham Ekru / Standart	https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1000&auto=format&fit=crop	1	variant_01M6GP9DQ53N02E734JCKBS6FQ	prod_01M6GP9DMYJAAWWCA3CZC6548Y	Özel Baskılı Kanvas Bez Çanta (Tote Bag)	320 GSM %100 Ham Pamuk Kanvas Kumaş. 35x40 cm standart ölçü, uzun omuz askılı. Promosyon, marka ve etkinlikler için ideal.	\N	\N	\N	ozel-baskili-kanvas-bez-canta	NZM-BAG-EKR-STD	\N	Ham Ekru / Standart	\N	t	t	f	\N	\N	190	{"value": "190", "precision": 20}	{}	2026-11-03 14:07:27.542+00	2026-11-03 14:07:27.542+00	\N	\N	f	f
\.


--
-- Data for Name: cart_line_item_adjustment; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.cart_line_item_adjustment (id, description, promotion_id, code, amount, raw_amount, provider_id, metadata, created_at, updated_at, deleted_at, item_id, is_tax_inclusive) FROM stdin;
\.


--
-- Data for Name: cart_line_item_tax_line; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.cart_line_item_tax_line (id, description, tax_rate_id, code, rate, provider_id, metadata, created_at, updated_at, deleted_at, item_id, data) FROM stdin;
\.


--
-- Data for Name: cart_payment_collection; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.cart_payment_collection (cart_id, payment_collection_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: cart_promotion; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.cart_promotion (cart_id, promotion_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: cart_shipping_method; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.cart_shipping_method (id, cart_id, name, description, amount, raw_amount, is_tax_inclusive, shipping_option_id, data, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: cart_shipping_method_adjustment; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.cart_shipping_method_adjustment (id, description, promotion_id, code, amount, raw_amount, provider_id, metadata, created_at, updated_at, deleted_at, shipping_method_id) FROM stdin;
\.


--
-- Data for Name: cart_shipping_method_tax_line; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.cart_shipping_method_tax_line (id, description, tax_rate_id, code, rate, provider_id, metadata, created_at, updated_at, deleted_at, shipping_method_id, data) FROM stdin;
\.


--
-- Data for Name: credit_line; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.credit_line (id, cart_id, reference, reference_id, amount, raw_amount, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: currency; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.currency (code, symbol, symbol_native, decimal_digits, rounding, raw_rounding, name, created_at, updated_at, deleted_at) FROM stdin;
usd	$	$	2	0	{"value": "0", "precision": 20}	US Dollar	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
cad	CA$	$	2	0	{"value": "0", "precision": 20}	Canadian Dollar	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
eur	€	€	2	0	{"value": "0", "precision": 20}	Euro	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
aed	AED	د.إ.‏	2	0	{"value": "0", "precision": 20}	United Arab Emirates Dirham	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
afn	Af	؋	0	0	{"value": "0", "precision": 20}	Afghan Afghani	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
all	ALL	Lek	0	0	{"value": "0", "precision": 20}	Albanian Lek	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
amd	AMD	դր.	0	0	{"value": "0", "precision": 20}	Armenian Dram	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
aoa	AOA	Kz	2	0	{"value": "0", "precision": 20}	Angolan Kwanza	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
ars	AR$	$	2	0	{"value": "0", "precision": 20}	Argentine Peso	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
aud	AU$	$	2	0	{"value": "0", "precision": 20}	Australian Dollar	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
azn	man.	ман.	2	0	{"value": "0", "precision": 20}	Azerbaijani Manat	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
bam	KM	KM	2	0	{"value": "0", "precision": 20}	Bosnia-Herzegovina Convertible Mark	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
bdt	Tk	৳	2	0	{"value": "0", "precision": 20}	Bangladeshi Taka	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
bgn	BGN	лв.	2	0	{"value": "0", "precision": 20}	Bulgarian Lev	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
bhd	BD	د.ب.‏	3	0	{"value": "0", "precision": 20}	Bahraini Dinar	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
bif	FBu	FBu	0	0	{"value": "0", "precision": 20}	Burundian Franc	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
bnd	BN$	$	2	0	{"value": "0", "precision": 20}	Brunei Dollar	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
bob	Bs	Bs	2	0	{"value": "0", "precision": 20}	Bolivian Boliviano	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
brl	R$	R$	2	0	{"value": "0", "precision": 20}	Brazilian Real	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
bwp	BWP	P	2	0	{"value": "0", "precision": 20}	Botswanan Pula	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
byn	Br	руб.	2	0	{"value": "0", "precision": 20}	Belarusian Ruble	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
bzd	BZ$	$	2	0	{"value": "0", "precision": 20}	Belize Dollar	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
cdf	CDF	FrCD	2	0	{"value": "0", "precision": 20}	Congolese Franc	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
chf	CHF	CHF	2	0.05	{"value": "0.05", "precision": 20}	Swiss Franc	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
clp	CL$	$	0	0	{"value": "0", "precision": 20}	Chilean Peso	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
cny	CN¥	CN¥	2	0	{"value": "0", "precision": 20}	Chinese Yuan	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
cop	CO$	$	0	0	{"value": "0", "precision": 20}	Colombian Peso	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
crc	₡	₡	0	0	{"value": "0", "precision": 20}	Costa Rican Colón	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
cve	CV$	CV$	2	0	{"value": "0", "precision": 20}	Cape Verdean Escudo	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
czk	Kč	Kč	2	0	{"value": "0", "precision": 20}	Czech Republic Koruna	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
djf	Fdj	Fdj	0	0	{"value": "0", "precision": 20}	Djiboutian Franc	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
dkk	Dkr	kr	2	0	{"value": "0", "precision": 20}	Danish Krone	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
dop	RD$	RD$	2	0	{"value": "0", "precision": 20}	Dominican Peso	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
dzd	DA	د.ج.‏	2	0	{"value": "0", "precision": 20}	Algerian Dinar	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
eek	Ekr	kr	2	0	{"value": "0", "precision": 20}	Estonian Kroon	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
egp	EGP	ج.م.‏	2	0	{"value": "0", "precision": 20}	Egyptian Pound	2026-11-03 12:30:29.453+00	2026-11-03 12:30:29.453+00	\N
ern	Nfk	Nfk	2	0	{"value": "0", "precision": 20}	Eritrean Nakfa	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
etb	Br	Br	2	0	{"value": "0", "precision": 20}	Ethiopian Birr	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
gbp	£	£	2	0	{"value": "0", "precision": 20}	British Pound Sterling	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
gel	GEL	GEL	2	0	{"value": "0", "precision": 20}	Georgian Lari	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
ghs	GH₵	GH₵	2	0	{"value": "0", "precision": 20}	Ghanaian Cedi	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
gmd	D	D	2	0	{"value": "0", "precision": 20}	Gambian Dalasi	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
gnf	FG	FG	0	0	{"value": "0", "precision": 20}	Guinean Franc	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
gtq	GTQ	Q	2	0	{"value": "0", "precision": 20}	Guatemalan Quetzal	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
hkd	HK$	$	2	0	{"value": "0", "precision": 20}	Hong Kong Dollar	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
hnl	HNL	L	2	0	{"value": "0", "precision": 20}	Honduran Lempira	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
hrk	kn	kn	2	0	{"value": "0", "precision": 20}	Croatian Kuna	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
htg	HTG	G	2	0	{"value": "0", "precision": 20}	Haitian Gourde	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
huf	Ft	Ft	0	0	{"value": "0", "precision": 20}	Hungarian Forint	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
idr	Rp	Rp	0	0	{"value": "0", "precision": 20}	Indonesian Rupiah	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
ils	₪	₪	2	0	{"value": "0", "precision": 20}	Israeli New Sheqel	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
inr	Rs	₹	2	0	{"value": "0", "precision": 20}	Indian Rupee	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
iqd	IQD	د.ع.‏	0	0	{"value": "0", "precision": 20}	Iraqi Dinar	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
irr	IRR	﷼	0	0	{"value": "0", "precision": 20}	Iranian Rial	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
irt	IRT	تومان	0	0	{"value": "0", "precision": 20}	Iranian Toman	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
isk	Ikr	kr	0	0	{"value": "0", "precision": 20}	Icelandic Króna	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
jmd	J$	$	2	0	{"value": "0", "precision": 20}	Jamaican Dollar	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
jod	JD	د.أ.‏	3	0	{"value": "0", "precision": 20}	Jordanian Dinar	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
jpy	¥	￥	0	0	{"value": "0", "precision": 20}	Japanese Yen	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
kes	Ksh	Ksh	2	0	{"value": "0", "precision": 20}	Kenyan Shilling	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
khr	KHR	៛	2	0	{"value": "0", "precision": 20}	Cambodian Riel	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
kmf	CF	FC	0	0	{"value": "0", "precision": 20}	Comorian Franc	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
krw	₩	₩	0	0	{"value": "0", "precision": 20}	South Korean Won	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
kwd	KD	د.ك.‏	3	0	{"value": "0", "precision": 20}	Kuwaiti Dinar	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
kzt	KZT	тңг.	2	0	{"value": "0", "precision": 20}	Kazakhstani Tenge	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
lbp	LB£	ل.ل.‏	0	0	{"value": "0", "precision": 20}	Lebanese Pound	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
lkr	SLRs	SL Re	2	0	{"value": "0", "precision": 20}	Sri Lankan Rupee	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
ltl	Lt	Lt	2	0	{"value": "0", "precision": 20}	Lithuanian Litas	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
lvl	Ls	Ls	2	0	{"value": "0", "precision": 20}	Latvian Lats	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
lyd	LD	د.ل.‏	3	0	{"value": "0", "precision": 20}	Libyan Dinar	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
mad	MAD	د.م.‏	2	0	{"value": "0", "precision": 20}	Moroccan Dirham	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
mdl	MDL	MDL	2	0	{"value": "0", "precision": 20}	Moldovan Leu	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
mga	MGA	MGA	0	0	{"value": "0", "precision": 20}	Malagasy Ariary	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
mkd	MKD	MKD	2	0	{"value": "0", "precision": 20}	Macedonian Denar	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
mmk	MMK	K	0	0	{"value": "0", "precision": 20}	Myanma Kyat	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
mnt	MNT	₮	0	0	{"value": "0", "precision": 20}	Mongolian Tugrig	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
mop	MOP$	MOP$	2	0	{"value": "0", "precision": 20}	Macanese Pataca	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
mur	MURs	MURs	0	0	{"value": "0", "precision": 20}	Mauritian Rupee	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
mwk	K	K	2	0	{"value": "0", "precision": 20}	Malawian Kwacha	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
mxn	MX$	$	2	0	{"value": "0", "precision": 20}	Mexican Peso	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
myr	RM	RM	2	0	{"value": "0", "precision": 20}	Malaysian Ringgit	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
mzn	MTn	MTn	2	0	{"value": "0", "precision": 20}	Mozambican Metical	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
nad	N$	N$	2	0	{"value": "0", "precision": 20}	Namibian Dollar	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
ngn	₦	₦	2	0	{"value": "0", "precision": 20}	Nigerian Naira	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
nio	C$	C$	2	0	{"value": "0", "precision": 20}	Nicaraguan Córdoba	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
nok	Nkr	kr	2	0	{"value": "0", "precision": 20}	Norwegian Krone	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
npr	NPRs	नेरू	2	0	{"value": "0", "precision": 20}	Nepalese Rupee	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
nzd	NZ$	$	2	0	{"value": "0", "precision": 20}	New Zealand Dollar	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
omr	OMR	ر.ع.‏	3	0	{"value": "0", "precision": 20}	Omani Rial	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
pab	B/.	B/.	2	0	{"value": "0", "precision": 20}	Panamanian Balboa	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
pen	S/.	S/.	2	0	{"value": "0", "precision": 20}	Peruvian Nuevo Sol	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
php	₱	₱	2	0	{"value": "0", "precision": 20}	Philippine Peso	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
pkr	PKRs	₨	0	0	{"value": "0", "precision": 20}	Pakistani Rupee	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
pln	zł	zł	2	0	{"value": "0", "precision": 20}	Polish Zloty	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
pyg	₲	₲	0	0	{"value": "0", "precision": 20}	Paraguayan Guarani	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
qar	QR	ر.ق.‏	2	0	{"value": "0", "precision": 20}	Qatari Rial	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
ron	RON	RON	2	0	{"value": "0", "precision": 20}	Romanian Leu	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
rsd	din.	дин.	0	0	{"value": "0", "precision": 20}	Serbian Dinar	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
rub	RUB	₽.	2	0	{"value": "0", "precision": 20}	Russian Ruble	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
rwf	RWF	FR	0	0	{"value": "0", "precision": 20}	Rwandan Franc	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
sar	SR	ر.س.‏	2	0	{"value": "0", "precision": 20}	Saudi Riyal	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
sdg	SDG	SDG	2	0	{"value": "0", "precision": 20}	Sudanese Pound	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
sek	Skr	kr	2	0	{"value": "0", "precision": 20}	Swedish Krona	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
sgd	S$	$	2	0	{"value": "0", "precision": 20}	Singapore Dollar	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
sos	Ssh	Ssh	0	0	{"value": "0", "precision": 20}	Somali Shilling	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
syp	SY£	ل.س.‏	0	0	{"value": "0", "precision": 20}	Syrian Pound	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
thb	฿	฿	2	0	{"value": "0", "precision": 20}	Thai Baht	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
tnd	DT	د.ت.‏	3	0	{"value": "0", "precision": 20}	Tunisian Dinar	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
top	T$	T$	2	0	{"value": "0", "precision": 20}	Tongan Paʻanga	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
tjs	TJS	с.	2	0	{"value": "0", "precision": 20}	Tajikistani Somoni	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
try	₺	₺	2	0	{"value": "0", "precision": 20}	Turkish Lira	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
ttd	TT$	$	2	0	{"value": "0", "precision": 20}	Trinidad and Tobago Dollar	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
twd	NT$	NT$	2	0	{"value": "0", "precision": 20}	New Taiwan Dollar	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
tzs	TSh	TSh	0	0	{"value": "0", "precision": 20}	Tanzanian Shilling	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
uah	₴	₴	2	0	{"value": "0", "precision": 20}	Ukrainian Hryvnia	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
ugx	USh	USh	0	0	{"value": "0", "precision": 20}	Ugandan Shilling	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
uyu	$U	$	2	0	{"value": "0", "precision": 20}	Uruguayan Peso	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
uzs	UZS	UZS	0	0	{"value": "0", "precision": 20}	Uzbekistan Som	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
vef	Bs.F.	Bs.F.	2	0	{"value": "0", "precision": 20}	Venezuelan Bolívar	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
vnd	₫	₫	0	0	{"value": "0", "precision": 20}	Vietnamese Dong	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
xaf	FCFA	FCFA	0	0	{"value": "0", "precision": 20}	CFA Franc BEAC	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
xof	CFA	CFA	0	0	{"value": "0", "precision": 20}	CFA Franc BCEAO	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
xpf	₣	₣	0	0	{"value": "0", "precision": 20}	CFP Franc	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
yer	YR	ر.ي.‏	0	0	{"value": "0", "precision": 20}	Yemeni Rial	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
zar	R	R	2	0	{"value": "0", "precision": 20}	South African Rand	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
zmk	ZK	ZK	0	0	{"value": "0", "precision": 20}	Zambian Kwacha	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
zwl	ZWL$	ZWL$	0	0	{"value": "0", "precision": 20}	Zimbabwean Dollar	2026-11-03 12:30:29.454+00	2026-11-03 12:30:29.454+00	\N
\.


--
-- Data for Name: custom_design; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.custom_design (id, product_id, variant_id, original_file_path, original_file_name, file_type, file_size, preview_file_path, color_id, color_name, color_hex, size, view, position_id, position_name, transform, physical_dimensions, quantity, pricing_estimate, status, cart_id, created_at, updated_at) FROM stdin;
des_7cc9cf1f5548da4663339e25	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	variant_01M6GP9DQ46KD0999Z1V1GBGDH	/Volumes/KIOXIA/nizamlar-shop/apps/backend/uploads/custom-designs/des_7cc9cf1f5548da4663339e25_original.png	logo-test.png	image/png	70	\N	siyah	Siyah	#202020	L	front	buyuk_on	Büyük Ön Baskı	{}	{"x": 300, "y": 330, "scale": 1, "areaCm2": 980, "widthMm": 280, "heightMm": 350, "rotation": 0}	5	{"totalAmount": 2815, "currencyCode": "TRY", "finalUnitPrice": 563, "isPriceVerified": true, "setupFeePerOrder": 0, "verificationNote": "Sunucu tarafı Nizamlar Baskı Fiyat Motoru v1 ile hesaplandı.", "printCostUnitPrice": 113, "baseProductUnitPrice": 450, "quantityDiscountPercent": 5}	active	\N	2026-11-03 13:42:06.110127+00	2026-11-03 13:42:06.110127+00
des_665ffc3a28165cda11c4d3b8	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	variant_01M6GP9DQ46KD0999Z1V1GBGDH	/Volumes/KIOXIA/nizamlar-shop/apps/backend/uploads/custom-designs/des_665ffc3a28165cda11c4d3b8_original.svg	nizamlar-gold-crest.svg	image/svg+xml	118	\N	siyah	Siyah	#202020	L	front	sol_gogus	Sol Göğüs (Arma)	{}	{"x": 245, "y": 205, "scale": 0.45, "areaCm2": 100, "widthMm": 100, "heightMm": 100, "rotation": 0}	1	{"totalAmount": 501, "currencyCode": "TRY", "finalUnitPrice": 501, "isPriceVerified": true, "setupFeePerOrder": 0, "verificationNote": "Sunucu tarafı Nizamlar Baskı Fiyat Motoru v1 ile hesaplandı.", "printCostUnitPrice": 51, "baseProductUnitPrice": 450, "quantityDiscountPercent": 0}	active	\N	2026-11-03 13:46:13.4265+00	2026-11-03 13:46:13.4265+00
des_294f8b8c22d52ca84d01506c	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	variant_01M6GP9DQ46KD0999Z1V1GBGDH	/Volumes/KIOXIA/nizamlar-shop/apps/backend/uploads/custom-designs/des_294f8b8c22d52ca84d01506c_original.png	cyber-artwork.png	image/png	76	\N	siyah	Siyah	#202020	L	back	buyuk_sirt	Mega Sırt Baskısı (A3+)	{}	{"x": 300, "y": 320, "scale": 1.1, "areaCm2": 1575, "widthMm": 350, "heightMm": 450, "rotation": 0}	1	{"totalAmount": 603, "currencyCode": "TRY", "finalUnitPrice": 603, "isPriceVerified": true, "setupFeePerOrder": 0, "verificationNote": "Sunucu tarafı Nizamlar Baskı Fiyat Motoru v1 ile hesaplandı.", "printCostUnitPrice": 153, "baseProductUnitPrice": 450, "quantityDiscountPercent": 0}	active	\N	2026-11-03 13:46:20.846106+00	2026-11-03 13:46:20.846106+00
\.


--
-- Data for Name: customer; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.customer (id, company_name, first_name, last_name, email, phone, has_account, metadata, created_at, updated_at, deleted_at, created_by) FROM stdin;
\.


--
-- Data for Name: customer_account_holder; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.customer_account_holder (customer_id, account_holder_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: customer_address; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.customer_address (id, customer_id, address_name, is_default_shipping, is_default_billing, company, first_name, last_name, address_1, address_2, city, country_code, province, postal_code, phone, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: customer_group; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.customer_group (id, name, metadata, created_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: customer_group_customer; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.customer_group_customer (id, customer_id, customer_group_id, metadata, created_at, updated_at, created_by, deleted_at) FROM stdin;
\.


--
-- Data for Name: fulfillment; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.fulfillment (id, location_id, packed_at, shipped_at, delivered_at, canceled_at, data, provider_id, shipping_option_id, metadata, delivery_address_id, created_at, updated_at, deleted_at, marked_shipped_by, created_by, requires_shipping) FROM stdin;
\.


--
-- Data for Name: fulfillment_address; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.fulfillment_address (id, company, first_name, last_name, address_1, address_2, city, country_code, province, postal_code, phone, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: fulfillment_item; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.fulfillment_item (id, title, sku, barcode, quantity, raw_quantity, line_item_id, inventory_item_id, fulfillment_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: fulfillment_label; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.fulfillment_label (id, tracking_number, tracking_url, label_url, fulfillment_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: fulfillment_provider; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.fulfillment_provider (id, is_enabled, created_at, updated_at, deleted_at) FROM stdin;
manual_manual	t	2026-11-03 12:30:29.45+00	2026-11-03 12:30:29.45+00	\N
\.


--
-- Data for Name: fulfillment_set; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.fulfillment_set (id, name, type, metadata, created_at, updated_at, deleted_at) FROM stdin;
fuset_01M6GP7HEQEDP2J5CQ2HJ8RMNG	European Warehouse delivery	shipping	\N	2026-11-03 12:30:32.919+00	2026-11-03 12:30:32.919+00	\N
\.


--
-- Data for Name: geo_zone; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.geo_zone (id, type, country_code, province_code, city, service_zone_id, postal_expression, metadata, created_at, updated_at, deleted_at) FROM stdin;
fgz_01M6GP7HEP5K0TZMZVT5DRWZ1M	country	gb	\N	\N	serzo_01M6GP7HEQ6FW4YX8E2G543VE3	\N	\N	2026-11-03 12:30:32.919+00	2026-11-03 12:30:32.919+00	\N
fgz_01M6GP7HEP5DQHVSRWC79K5AC2	country	de	\N	\N	serzo_01M6GP7HEQ6FW4YX8E2G543VE3	\N	\N	2026-11-03 12:30:32.919+00	2026-11-03 12:30:32.919+00	\N
fgz_01M6GP7HEP3Q8Q554Z65S36A52	country	dk	\N	\N	serzo_01M6GP7HEQ6FW4YX8E2G543VE3	\N	\N	2026-11-03 12:30:32.919+00	2026-11-03 12:30:32.919+00	\N
fgz_01M6GP7HEP9W5PKM2X8RNGBGXY	country	se	\N	\N	serzo_01M6GP7HEQ6FW4YX8E2G543VE3	\N	\N	2026-11-03 12:30:32.919+00	2026-11-03 12:30:32.919+00	\N
fgz_01M6GP7HEPTT071YVY8TF9X6TA	country	fr	\N	\N	serzo_01M6GP7HEQ6FW4YX8E2G543VE3	\N	\N	2026-11-03 12:30:32.919+00	2026-11-03 12:30:32.919+00	\N
fgz_01M6GP7HEPJEKHCK47PWZTRQP7	country	es	\N	\N	serzo_01M6GP7HEQ6FW4YX8E2G543VE3	\N	\N	2026-11-03 12:30:32.919+00	2026-11-03 12:30:32.919+00	\N
fgz_01M6GP7HEPSJBD5DH6A822CRNH	country	it	\N	\N	serzo_01M6GP7HEQ6FW4YX8E2G543VE3	\N	\N	2026-11-03 12:30:32.919+00	2026-11-03 12:30:32.919+00	\N
\.


--
-- Data for Name: image; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.image (id, url, metadata, created_at, updated_at, deleted_at, rank, product_id) FROM stdin;
img_01M6GP7HK48PBHVXXC73QRYS27	https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png	\N	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N	0	prod_01M6GP7HK3N0KX01F0CHPQZB4J
img_01M6GP7HK44XX9MRJ0GNYYF2XS	https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-back.png	\N	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N	1	prod_01M6GP7HK3N0KX01F0CHPQZB4J
img_01M6GP7HK4J5SMF1Z2A0NHHFFZ	https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png	\N	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N	2	prod_01M6GP7HK3N0KX01F0CHPQZB4J
img_01M6GP7HK42XZDZ7RHAFRM0YK5	https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-back.png	\N	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N	3	prod_01M6GP7HK3N0KX01F0CHPQZB4J
img_01M6GP7HK53RTH7CNHW22AQZ9X	https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png	\N	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N	0	prod_01M6GP7HK38KNM15QBV8KMYP2Z
img_01M6GP7HK541YS2DXYKVGPQTKA	https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-back.png	\N	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N	1	prod_01M6GP7HK38KNM15QBV8KMYP2Z
img_01M6GP7HK5X7H2QT4NVH3TJ2K9	https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png	\N	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N	0	prod_01M6GP7HK3CYBGS7DDY58J8XD5
img_01M6GP7HK5M9JV4QJJJHZFY0F3	https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-back.png	\N	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N	1	prod_01M6GP7HK3CYBGS7DDY58J8XD5
img_01M6GP7HK5SQZK14K0F5YDDMDF	https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png	\N	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N	0	prod_01M6GP7HK3J69S3YARJ8W2P4W1
img_01M6GP7HK5CQKWJMPMWQWSJ2FM	https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-back.png	\N	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N	1	prod_01M6GP7HK3J69S3YARJ8W2P4W1
img_01M6GP9DMY9985WAQ5THJENA1H	https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	0	prod_01M6GP9DMYQ1Z62JTV01V1BGT2
img_01M6GP9DMY0P7ER7YPAEZNPPRG	https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	1	prod_01M6GP9DMYQ1Z62JTV01V1BGT2
img_01M6GP9DMZ1K42BF4JGGD5F06W	https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	0	prod_01M6GP9DMYEQV47FQGQ8Z09FB0
img_01M6GP9DMZVD49WTD5A2MH30ST	https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1000&auto=format&fit=crop	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	1	prod_01M6GP9DMYEQV47FQGQ8Z09FB0
img_01M6GP9DMZ414S8203WQNN8X1N	https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1000&auto=format&fit=crop	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	0	prod_01M6GP9DMYJAAWWCA3CZC6548Y
\.


--
-- Data for Name: inventory_item; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.inventory_item (id, created_at, updated_at, deleted_at, sku, origin_country, hs_code, mid_code, material, weight, length, height, width, requires_shipping, description, title, thumbnail, metadata, unit_of_measure) FROM stdin;
iitem_01M6GP7HP4WACGZB5N27BQGY36	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SHIRT-S-BLACK	\N	\N	\N	\N	\N	\N	\N	\N	t	S / Black	S / Black	\N	\N	\N
iitem_01M6GP7HP48BGA50BFAWA1Z3TF	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SHIRT-S-WHITE	\N	\N	\N	\N	\N	\N	\N	\N	t	S / White	S / White	\N	\N	\N
iitem_01M6GP7HP4XYAK7NH6SATC0HSS	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SHIRT-M-BLACK	\N	\N	\N	\N	\N	\N	\N	\N	t	M / Black	M / Black	\N	\N	\N
iitem_01M6GP7HP49FPP396XDKQ3JVXQ	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SHIRT-M-WHITE	\N	\N	\N	\N	\N	\N	\N	\N	t	M / White	M / White	\N	\N	\N
iitem_01M6GP7HP4B4PST8CEDNF9G6W6	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SHIRT-L-BLACK	\N	\N	\N	\N	\N	\N	\N	\N	t	L / Black	L / Black	\N	\N	\N
iitem_01M6GP7HP44P9N3K76A3EBFJ1X	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SHIRT-L-WHITE	\N	\N	\N	\N	\N	\N	\N	\N	t	L / White	L / White	\N	\N	\N
iitem_01M6GP7HP4Y322A5HRDK8Y5R4V	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SHIRT-XL-BLACK	\N	\N	\N	\N	\N	\N	\N	\N	t	XL / Black	XL / Black	\N	\N	\N
iitem_01M6GP7HP45BC91V3RXPR3K4E1	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SHIRT-XL-WHITE	\N	\N	\N	\N	\N	\N	\N	\N	t	XL / White	XL / White	\N	\N	\N
iitem_01M6GP7HP4FEVAQH2NASJDT4DY	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SWEATSHIRT-S	\N	\N	\N	\N	\N	\N	\N	\N	t	S	S	\N	\N	\N
iitem_01M6GP7HP4AF46Z0AED3Q8SE6S	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SWEATSHIRT-M	\N	\N	\N	\N	\N	\N	\N	\N	t	M	M	\N	\N	\N
iitem_01M6GP7HP4QVM6VGRDRYH4AE1Q	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SWEATSHIRT-L	\N	\N	\N	\N	\N	\N	\N	\N	t	L	L	\N	\N	\N
iitem_01M6GP7HP4E4C1PG63G49VFRWJ	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SWEATSHIRT-XL	\N	\N	\N	\N	\N	\N	\N	\N	t	XL	XL	\N	\N	\N
iitem_01M6GP7HP4F1NNYR13ZHD0Z8DR	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SWEATPANTS-S	\N	\N	\N	\N	\N	\N	\N	\N	t	S	S	\N	\N	\N
iitem_01M6GP7HP4NDQ60FA1CXSKDSEC	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SWEATPANTS-M	\N	\N	\N	\N	\N	\N	\N	\N	t	M	M	\N	\N	\N
iitem_01M6GP7HP5NM093AR0QBYQ5R5K	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SWEATPANTS-L	\N	\N	\N	\N	\N	\N	\N	\N	t	L	L	\N	\N	\N
iitem_01M6GP7HP5V7JF00C8MABHKP8Z	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SWEATPANTS-XL	\N	\N	\N	\N	\N	\N	\N	\N	t	XL	XL	\N	\N	\N
iitem_01M6GP7HP5S160QR50QVW8188H	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SHORTS-S	\N	\N	\N	\N	\N	\N	\N	\N	t	S	S	\N	\N	\N
iitem_01M6GP7HP5XXK3HNP46APPBZNB	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SHORTS-M	\N	\N	\N	\N	\N	\N	\N	\N	t	M	M	\N	\N	\N
iitem_01M6GP7HP5VB01G83ZCGJRSFM3	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SHORTS-L	\N	\N	\N	\N	\N	\N	\N	\N	t	L	L	\N	\N	\N
iitem_01M6GP7HP5VYGVAP0TZNQ6VR00	2026-11-03 12:30:33.157+00	2026-11-03 12:30:33.157+00	\N	SHORTS-XL	\N	\N	\N	\N	\N	\N	\N	\N	t	XL	XL	\N	\N	\N
iitem_01M6GP9DQKXGYRBK1AFREBZ5M6	2026-11-03 12:31:34.644+00	2026-11-03 12:31:34.644+00	\N	NZM-TSH-BLK-S	\N	\N	\N	\N	\N	\N	\N	\N	t	Siyah / S	Siyah / S	\N	\N	\N
iitem_01M6GP9DQK6XCD7D6QZC9E2CKG	2026-11-03 12:31:34.644+00	2026-11-03 12:31:34.644+00	\N	NZM-TSH-BLK-M	\N	\N	\N	\N	\N	\N	\N	\N	t	Siyah / M	Siyah / M	\N	\N	\N
iitem_01M6GP9DQKNJ2NCQ8BPNGMX99E	2026-11-03 12:31:34.644+00	2026-11-03 12:31:34.644+00	\N	NZM-TSH-BLK-L	\N	\N	\N	\N	\N	\N	\N	\N	t	Siyah / L	Siyah / L	\N	\N	\N
iitem_01M6GP9DQKMFJT43G560H3J3ZA	2026-11-03 12:31:34.644+00	2026-11-03 12:31:34.644+00	\N	NZM-TSH-BLK-XL	\N	\N	\N	\N	\N	\N	\N	\N	t	Siyah / XL	Siyah / XL	\N	\N	\N
iitem_01M6GP9DQKEG39RTD1R5YVM2K5	2026-11-03 12:31:34.644+00	2026-11-03 12:31:34.644+00	\N	NZM-TSH-WHT-S	\N	\N	\N	\N	\N	\N	\N	\N	t	Beyaz / S	Beyaz / S	\N	\N	\N
iitem_01M6GP9DQKS2XBB6FR0XSACK83	2026-11-03 12:31:34.644+00	2026-11-03 12:31:34.644+00	\N	NZM-TSH-WHT-M	\N	\N	\N	\N	\N	\N	\N	\N	t	Beyaz / M	Beyaz / M	\N	\N	\N
iitem_01M6GP9DQK31VWV9A3KP28FE27	2026-11-03 12:31:34.644+00	2026-11-03 12:31:34.644+00	\N	NZM-TSH-WHT-L	\N	\N	\N	\N	\N	\N	\N	\N	t	Beyaz / L	Beyaz / L	\N	\N	\N
iitem_01M6GP9DQKS0VYFTPPEQ9JY64F	2026-11-03 12:31:34.644+00	2026-11-03 12:31:34.644+00	\N	NZM-TSH-ANT-M	\N	\N	\N	\N	\N	\N	\N	\N	t	Antrasit / M	Antrasit / M	\N	\N	\N
iitem_01M6GP9DQK1W9FAT9YYKWDSP19	2026-11-03 12:31:34.644+00	2026-11-03 12:31:34.644+00	\N	NZM-TSH-ANT-L	\N	\N	\N	\N	\N	\N	\N	\N	t	Antrasit / L	Antrasit / L	\N	\N	\N
iitem_01M6GP9DQK8AHG7R7VJJSDEZXH	2026-11-03 12:31:34.644+00	2026-11-03 12:31:34.644+00	\N	NZM-HD-CUST-BLK-S	\N	\N	\N	\N	\N	\N	\N	\N	t	Siyah / S	Siyah / S	\N	\N	\N
iitem_01M6GP9DQMV0JCTGKK092G7K56	2026-11-03 12:31:34.644+00	2026-11-03 12:31:34.644+00	\N	NZM-HD-CUST-BLK-M	\N	\N	\N	\N	\N	\N	\N	\N	t	Siyah / M	Siyah / M	\N	\N	\N
iitem_01M6GP9DQMFX074EZXKJDTNEB5	2026-11-03 12:31:34.644+00	2026-11-03 12:31:34.644+00	\N	NZM-HD-CUST-BLK-L	\N	\N	\N	\N	\N	\N	\N	\N	t	Siyah / L	Siyah / L	\N	\N	\N
iitem_01M6GP9DQMFVGY4BMJFCSWYEGK	2026-11-03 12:31:34.644+00	2026-11-03 12:31:34.644+00	\N	NZM-HD-CUST-ANT-M	\N	\N	\N	\N	\N	\N	\N	\N	t	Antrasit / M	Antrasit / M	\N	\N	\N
iitem_01M6GP9DQMTX0FEKSS3CST6V80	2026-11-03 12:31:34.644+00	2026-11-03 12:31:34.644+00	\N	NZM-HD-CUST-ANT-L	\N	\N	\N	\N	\N	\N	\N	\N	t	Antrasit / L	Antrasit / L	\N	\N	\N
iitem_01M6GP9DQMS1E4W968YE3K0ZQ7	2026-11-03 12:31:34.644+00	2026-11-03 12:31:34.644+00	\N	NZM-BAG-EKR-STD	\N	\N	\N	\N	\N	\N	\N	\N	t	Ham Ekru / Standart	Ham Ekru / Standart	\N	\N	\N
iitem_01M6GP9DQM8N7CXJFG4CXV0V2Z	2026-11-03 12:31:34.644+00	2026-11-03 12:31:34.644+00	\N	NZM-BAG-BLK-STD	\N	\N	\N	\N	\N	\N	\N	\N	t	Siyah / Standart	Siyah / Standart	\N	\N	\N
\.


--
-- Data for Name: inventory_level; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.inventory_level (id, created_at, updated_at, deleted_at, inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity, metadata, raw_stocked_quantity, raw_reserved_quantity, raw_incoming_quantity) FROM stdin;
ilev_01M6GP7HRD9DXE7TPEZKPGZ1B3	2026-11-03 12:30:33.229+00	2026-11-03 12:30:33.229+00	\N	iitem_01M6GP7HP44P9N3K76A3EBFJ1X	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRDJYXA85AJKJJMX93D	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP45BC91V3RXPR3K4E1	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRDPRZH8WRSAD7N0RY0	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP48BGA50BFAWA1Z3TF	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRD9SR85KC4NVXRETX3	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP49FPP396XDKQ3JVXQ	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRD87P62GCVSZ6KXFF6	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP4AF46Z0AED3Q8SE6S	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRDESQDEDF6AS5A4DPH	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP4B4PST8CEDNF9G6W6	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRDV78RFYQEXMXF37CK	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP4E4C1PG63G49VFRWJ	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRDX5APHHA7B7X9GVZS	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP4F1NNYR13ZHD0Z8DR	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRD448NFT2X5CJS5G42	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP4FEVAQH2NASJDT4DY	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRDHBPRTZ65B94WK9T1	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP4NDQ60FA1CXSKDSEC	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRDSZ1FMY6V86Y96G4Y	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP4QVM6VGRDRYH4AE1Q	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRD8CGPCEWJR0SP4DYH	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP4WACGZB5N27BQGY36	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRD51HDVMZJN5SVB69A	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP4XYAK7NH6SATC0HSS	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRDTWMJ50F3ZSEHR8R7	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP4Y322A5HRDK8Y5R4V	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRDYEQ7G8GJF2REFDJ4	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP5NM093AR0QBYQ5R5K	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRD4TC6275YD07GF30X	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP5S160QR50QVW8188H	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRDW1NBVHR8N1FP02QB	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP5V7JF00C8MABHKP8Z	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRDVC2QSEWEKXTT3R7D	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP5VB01G83ZCGJRSFM3	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRDDHNVYAQ5GKCJR08D	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP5VYGVAP0TZNQ6VR00	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GP7HRDJHQFDZMGR93MT0R2	2026-11-03 12:30:33.23+00	2026-11-03 12:30:33.23+00	\N	iitem_01M6GP7HP5XXK3HNP46APPBZNB	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	1000000	0	0	\N	{"value": "1000000", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS3EA6BEH9ZRBYT57HG	2026-11-03 12:41:32.708+00	2026-11-03 12:41:32.708+00	\N	iitem_01M6GP7HP44P9N3K76A3EBFJ1X	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS3KDC4GVZGWVZ0SDE2	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP45BC91V3RXPR3K4E1	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS3VQB24D8G826VQD7A	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP48BGA50BFAWA1Z3TF	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS3NQ6FPS8H6XCYBVXM	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP49FPP396XDKQ3JVXQ	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS301SVWCTDJGHHBAE8	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP4AF46Z0AED3Q8SE6S	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS37JTWJM8HJZNNNW1H	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP4B4PST8CEDNF9G6W6	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS3GQN10T522975FRT9	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP4E4C1PG63G49VFRWJ	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS31JF098V0BTCYV3SN	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP4F1NNYR13ZHD0Z8DR	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4W6091F9TZT0HB5HK	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP4FEVAQH2NASJDT4DY	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4WC38A32VCSMYFNZE	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP4NDQ60FA1CXSKDSEC	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4WEJF6SVJH4PEAJ72	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP4QVM6VGRDRYH4AE1Q	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4QF1T7NNEQDFWKGM8	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP4WACGZB5N27BQGY36	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4DH4XPKEX9X3VM11X	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP4XYAK7NH6SATC0HSS	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4PND6RT3A8X5FC1J3	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP4Y322A5HRDK8Y5R4V	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4QCDMHHN9HVH6ZDN0	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP5NM093AR0QBYQ5R5K	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4PM333E8X80JSD6DE	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP5S160QR50QVW8188H	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4YV5AXZAPY6SCZJBT	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP5V7JF00C8MABHKP8Z	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4BKTBARP5XYA8ETYS	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP5VB01G83ZCGJRSFM3	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS48RN8FVFN8MJ5TG5J	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP5VYGVAP0TZNQ6VR00	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS47K37CN0M9F2Y6ZT7	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP7HP5XXK3HNP46APPBZNB	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4SZ6XD1ZG530DQAHK	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP9DQK1W9FAT9YYKWDSP19	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4YQW2F3MCPYFSGJ8Y	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP9DQK31VWV9A3KP28FE27	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4MTGJJPCJ08GC2CYC	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP9DQK6XCD7D6QZC9E2CKG	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4N9VH6TED1EE4PGEQ	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP9DQK8AHG7R7VJJSDEZXH	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4E6JH6REXJR8XKTYX	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP9DQKEG39RTD1R5YVM2K5	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4QHY3W48AEFPGF7PY	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP9DQKMFJT43G560H3J3ZA	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS44YBJEQ3X6Q19V7HE	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP9DQKNJ2NCQ8BPNGMX99E	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4JPHHK71MR8NQ2HQN	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP9DQKS0VYFTPPEQ9JY64F	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS447V177YG9J7K2JAQ	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP9DQKS2XBB6FR0XSACK83	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4J9QS6SK9P13B91PK	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP9DQKXGYRBK1AFREBZ5M6	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS47MDWCJ799BJFNQ70	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP9DQM8N7CXJFG4CXV0V2Z	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4E84X1Q6291YKF759	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP9DQMFVGY4BMJFCSWYEGK	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4N8ZYDYD66D2TWW53	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP9DQMFX074EZXKJDTNEB5	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4NA1QR1QJ0Q8B5R83	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP9DQMS1E4W968YE3K0ZQ7	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4G3RDDMYSZFARQ23E	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP9DQMTX0FEKSS3CST6V80	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
ilev_01M6GPVNS4JC3EKSY6DYF8RWZ8	2026-11-03 12:41:32.709+00	2026-11-03 12:41:32.709+00	\N	iitem_01M6GP9DQMV0JCTGKK092G7K56	sloc_01M6GP9DMABX8XJDS92E9N0B05	500	0	0	\N	{"value": "500", "precision": 20}	{"value": "0", "precision": 20}	{"value": "0", "precision": 20}
\.


--
-- Data for Name: invite; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.invite (id, email, accepted, token, expires_at, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: invite_rbac_role; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.invite_rbac_role (invite_id, rbac_role_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: layout_configuration; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.layout_configuration (id, zone, user_id, is_system_default, configuration, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: link_module_migrations; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.link_module_migrations (id, table_name, link_descriptor, created_at) FROM stdin;
1	cart_payment_collection	{"toModel": "payment_collection", "toModule": "payment", "fromModel": "cart", "fromModule": "cart"}	2026-11-03 12:30:26.692279
2	cart_promotion	{"toModel": "promotions", "toModule": "promotion", "fromModel": "cart", "fromModule": "cart"}	2026-11-03 12:30:26.697569
3	customer_account_holder	{"toModel": "account_holder", "toModule": "payment", "fromModel": "customer", "fromModule": "customer"}	2026-11-03 12:30:26.700123
4	location_fulfillment_provider	{"toModel": "fulfillment_provider", "toModule": "fulfillment", "fromModel": "location", "fromModule": "stock_location"}	2026-11-03 12:30:26.70287
5	location_fulfillment_set	{"toModel": "fulfillment_set", "toModule": "fulfillment", "fromModel": "location", "fromModule": "stock_location"}	2026-11-03 12:30:26.705423
6	invite_rbac_role	{"toModel": "rbac_role", "toModule": "rbac", "fromModel": "invite", "fromModule": "user"}	2026-11-03 12:30:26.708099
7	order_cart	{"toModel": "cart", "toModule": "cart", "fromModel": "order", "fromModule": "order"}	2026-11-03 12:30:26.710544
8	order_fulfillment	{"toModel": "fulfillments", "toModule": "fulfillment", "fromModel": "order", "fromModule": "order"}	2026-11-03 12:30:26.713436
9	order_payment_collection	{"toModel": "payment_collection", "toModule": "payment", "fromModel": "order", "fromModule": "order"}	2026-11-03 12:30:26.716039
10	order_promotion	{"toModel": "promotions", "toModule": "promotion", "fromModel": "order", "fromModule": "order"}	2026-11-03 12:30:26.718525
11	return_fulfillment	{"toModel": "fulfillments", "toModule": "fulfillment", "fromModel": "return", "fromModule": "order"}	2026-11-03 12:30:26.720679
12	product_sales_channel	{"toModel": "sales_channel", "toModule": "sales_channel", "fromModel": "product", "fromModule": "product"}	2026-11-03 12:30:26.723339
13	product_shipping_profile	{"toModel": "shipping_profile", "toModule": "fulfillment", "fromModel": "product", "fromModule": "product"}	2026-11-03 12:30:26.726225
14	product_variant_inventory_item	{"toModel": "inventory", "toModule": "inventory", "fromModel": "variant", "fromModule": "product"}	2026-11-03 12:30:26.728231
15	product_variant_price_set	{"toModel": "price_set", "toModule": "pricing", "fromModel": "variant", "fromModule": "product"}	2026-11-03 12:30:26.761502
16	publishable_api_key_sales_channel	{"toModel": "sales_channel", "toModule": "sales_channel", "fromModel": "api_key", "fromModule": "api_key"}	2026-11-03 12:30:26.764483
17	region_payment_provider	{"toModel": "payment_provider", "toModule": "payment", "fromModel": "region", "fromModule": "region"}	2026-11-03 12:30:26.766814
18	sales_channel_stock_location	{"toModel": "location", "toModule": "stock_location", "fromModel": "sales_channel", "fromModule": "sales_channel"}	2026-11-03 12:30:26.769135
19	shipping_option_price_set	{"toModel": "price_set", "toModule": "pricing", "fromModel": "shipping_option", "fromModule": "fulfillment"}	2026-11-03 12:30:26.772182
20	user_rbac_role	{"toModel": "rbac_role", "toModule": "rbac", "fromModel": "user", "fromModule": "user"}	2026-11-03 12:30:26.774965
\.


--
-- Data for Name: location_fulfillment_provider; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.location_fulfillment_provider (stock_location_id, fulfillment_provider_id, id, created_at, updated_at, deleted_at) FROM stdin;
sloc_01M6GP7HE6PXEXG9R0YVGDM48M	manual_manual	locfp_01M6GP7HEDPXG8KJQMWHCM9EH9	2026-11-03 12:30:32.90831+00	2026-11-03 12:30:32.90831+00	\N
sloc_01M6GP9DMABX8XJDS92E9N0B05	manual_manual	locfp_01M6GP9DMMZZCSS43RM05BJRR7	2026-11-03 12:31:34.54676+00	2026-11-03 12:31:34.54676+00	\N
\.


--
-- Data for Name: location_fulfillment_set; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.location_fulfillment_set (stock_location_id, fulfillment_set_id, id, created_at, updated_at, deleted_at) FROM stdin;
sloc_01M6GP7HE6PXEXG9R0YVGDM48M	fuset_01M6GP7HEQEDP2J5CQ2HJ8RMNG	locfs_01M6GP7HF7C6NJXJEA2V6209N1	2026-11-03 12:30:32.934021+00	2026-11-03 12:30:32.934021+00	\N
\.


--
-- Data for Name: mikro_orm_migrations; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.mikro_orm_migrations (id, name, executed_at) FROM stdin;
1	Migration20240307161216	2026-11-03 12:30:24.772614+00
2	Migration20241210073813	2026-11-03 12:30:24.772614+00
3	Migration20250106142624	2026-11-03 12:30:24.772614+00
4	Migration20250120110820	2026-11-03 12:30:24.772614+00
5	Migration20240307132720	2026-11-03 12:30:24.829204+00
6	Migration20240719123015	2026-11-03 12:30:24.829204+00
7	Migration20241213063611	2026-11-03 12:30:24.829204+00
8	Migration20251010131115	2026-11-03 12:30:24.829204+00
9	Migration20260815185216	2026-11-03 12:30:24.829204+00
10	InitialSetup20240401153642	2026-11-03 12:30:24.894021+00
11	Migration20240601111544	2026-11-03 12:30:24.894021+00
12	Migration202408271511	2026-11-03 12:30:24.894021+00
13	Migration20241122120331	2026-11-03 12:30:24.894021+00
14	Migration20241125090957	2026-11-03 12:30:24.894021+00
15	Migration20250411073236	2026-11-03 12:30:24.894021+00
16	Migration20250516081326	2026-11-03 12:30:24.894021+00
17	Migration20250910154539	2026-11-03 12:30:24.894021+00
18	Migration20250911092221	2026-11-03 12:30:24.894021+00
19	Migration20250929204438	2026-11-03 12:30:24.894021+00
20	Migration20251008132218	2026-11-03 12:30:24.894021+00
21	Migration20251011090511	2026-11-03 12:30:24.894021+00
22	Migration20251022153442	2026-11-03 12:30:24.894021+00
23	Migration20251029150809	2026-11-03 12:30:24.894021+00
24	Migration20251110180907	2026-11-03 12:30:24.894021+00
25	Migration20251113183352	2026-11-03 12:30:24.894021+00
26	Migration20260224120000	2026-11-03 12:30:24.894021+00
27	Migration20260301002050	2026-11-03 12:30:24.894021+00
28	Migration20260306120000	2026-11-03 12:30:24.894021+00
29	Migration20260623180000	2026-11-03 12:30:24.894021+00
30	Migration20260730104846	2026-11-03 12:30:24.894021+00
31	Migration20230929122253	2026-11-03 12:30:25.062097+00
32	Migration20240322094407	2026-11-03 12:30:25.062097+00
33	Migration20240322113359	2026-11-03 12:30:25.062097+00
34	Migration20240322120125	2026-11-03 12:30:25.062097+00
35	Migration20240626133555	2026-11-03 12:30:25.062097+00
36	Migration20240704094505	2026-11-03 12:30:25.062097+00
37	Migration20241127114534	2026-11-03 12:30:25.062097+00
38	Migration20241127223829	2026-11-03 12:30:25.062097+00
39	Migration20241128055359	2026-11-03 12:30:25.062097+00
40	Migration20241212190401	2026-11-03 12:30:25.062097+00
41	Migration20250408145122	2026-11-03 12:30:25.062097+00
42	Migration20250409122219	2026-11-03 12:30:25.062097+00
43	Migration20251009110625	2026-11-03 12:30:25.062097+00
44	Migration20251112192723	2026-11-03 12:30:25.062097+00
45	Migration20260429163502	2026-11-03 12:30:25.062097+00
46	Migration20240227120221	2026-11-03 12:30:25.177117+00
47	Migration20240617102917	2026-11-03 12:30:25.177117+00
48	Migration20240624153824	2026-11-03 12:30:25.177117+00
49	Migration20241211061114	2026-11-03 12:30:25.177117+00
50	Migration20250113094144	2026-11-03 12:30:25.177117+00
51	Migration20250120110700	2026-11-03 12:30:25.177117+00
52	Migration20250226130616	2026-11-03 12:30:25.177117+00
53	Migration20250508081510	2026-11-03 12:30:25.177117+00
54	Migration20250828075407	2026-11-03 12:30:25.177117+00
55	Migration20250909083125	2026-11-03 12:30:25.177117+00
56	Migration20250916120552	2026-11-03 12:30:25.177117+00
57	Migration20250917143818	2026-11-03 12:30:25.177117+00
58	Migration20250919122137	2026-11-03 12:30:25.177117+00
59	Migration20251006000000	2026-11-03 12:30:25.177117+00
60	Migration20251015113934	2026-11-03 12:30:25.177117+00
61	Migration20251107050148	2026-11-03 12:30:25.177117+00
62	Migration20240124154000	2026-11-03 12:30:25.296875+00
63	Migration20240524123112	2026-11-03 12:30:25.296875+00
64	Migration20240602110946	2026-11-03 12:30:25.296875+00
65	Migration20241211074630	2026-11-03 12:30:25.296875+00
66	Migration20251010130829	2026-11-03 12:30:25.296875+00
67	Migration20240115152146	2026-11-03 12:30:25.350108+00
68	Migration20240222170223	2026-11-03 12:30:25.371909+00
69	Migration20240831125857	2026-11-03 12:30:25.371909+00
70	Migration20241106085918	2026-11-03 12:30:25.371909+00
71	Migration20241205095237	2026-11-03 12:30:25.371909+00
72	Migration20241216183049	2026-11-03 12:30:25.371909+00
73	Migration20241218091938	2026-11-03 12:30:25.371909+00
74	Migration20250120115059	2026-11-03 12:30:25.371909+00
75	Migration20250212131240	2026-11-03 12:30:25.371909+00
76	Migration20250326151602	2026-11-03 12:30:25.371909+00
77	Migration20250508081553	2026-11-03 12:30:25.371909+00
78	Migration20251017153909	2026-11-03 12:30:25.371909+00
79	Migration20251208130704	2026-11-03 12:30:25.371909+00
80	Migration20260626000000	2026-11-03 12:30:25.371909+00
81	Migration20240205173216	2026-11-03 12:30:25.473141+00
82	Migration20240624200006	2026-11-03 12:30:25.473141+00
83	Migration20250120110744	2026-11-03 12:30:25.473141+00
84	InitialSetup20240221144943	2026-11-03 12:30:25.54505+00
85	Migration20240604080145	2026-11-03 12:30:25.54505+00
86	Migration20241205122700	2026-11-03 12:30:25.54505+00
87	Migration20251015123842	2026-11-03 12:30:25.54505+00
88	InitialSetup20240227075933	2026-11-03 12:30:25.591113+00
89	Migration20240621145944	2026-11-03 12:30:25.591113+00
90	Migration20241206083313	2026-11-03 12:30:25.591113+00
91	Migration20251202184737	2026-11-03 12:30:25.591113+00
92	Migration20251212161429	2026-11-03 12:30:25.591113+00
93	Migration20240227090331	2026-11-03 12:30:25.634884+00
94	Migration20240710135844	2026-11-03 12:30:25.634884+00
95	Migration20240924114005	2026-11-03 12:30:25.634884+00
96	Migration20241212052837	2026-11-03 12:30:25.634884+00
97	InitialSetup20240228133303	2026-11-03 12:30:25.690434+00
98	Migration20240624082354	2026-11-03 12:30:25.690434+00
99	Migration20240225134525	2026-11-03 12:30:25.717055+00
100	Migration20240806072619	2026-11-03 12:30:25.717055+00
101	Migration20241211151053	2026-11-03 12:30:25.717055+00
102	Migration20250115160517	2026-11-03 12:30:25.717055+00
103	Migration20250120110552	2026-11-03 12:30:25.717055+00
104	Migration20250123122334	2026-11-03 12:30:25.717055+00
105	Migration20250206105639	2026-11-03 12:30:25.717055+00
106	Migration20250207132723	2026-11-03 12:30:25.717055+00
107	Migration20250625084134	2026-11-03 12:30:25.717055+00
108	Migration20250924135437	2026-11-03 12:30:25.717055+00
109	Migration20250929124701	2026-11-03 12:30:25.717055+00
110	Migration20260411223700	2026-11-03 12:30:25.717055+00
111	Migration20260924125937	2026-11-03 12:30:25.717055+00
112	Migration20240219102530	2026-11-03 12:30:25.830484+00
113	Migration20240604100512	2026-11-03 12:30:25.830484+00
114	Migration20240715102100	2026-11-03 12:30:25.830484+00
115	Migration20240715174100	2026-11-03 12:30:25.830484+00
116	Migration20240716081800	2026-11-03 12:30:25.830484+00
117	Migration20240801085921	2026-11-03 12:30:25.830484+00
118	Migration20240821164505	2026-11-03 12:30:25.830484+00
119	Migration20240821170920	2026-11-03 12:30:25.830484+00
120	Migration20240827133639	2026-11-03 12:30:25.830484+00
121	Migration20240902195921	2026-11-03 12:30:25.830484+00
122	Migration20240913092514	2026-11-03 12:30:25.830484+00
123	Migration20240930122627	2026-11-03 12:30:25.830484+00
124	Migration20241014142943	2026-11-03 12:30:25.830484+00
125	Migration20241106085223	2026-11-03 12:30:25.830484+00
126	Migration20241129124827	2026-11-03 12:30:25.830484+00
127	Migration20241217162224	2026-11-03 12:30:25.830484+00
128	Migration20250326151554	2026-11-03 12:30:25.830484+00
129	Migration20250522181137	2026-11-03 12:30:25.830484+00
130	Migration20250702095353	2026-11-03 12:30:25.830484+00
131	Migration20250704120229	2026-11-03 12:30:25.830484+00
132	Migration20250910130000	2026-11-03 12:30:25.830484+00
133	Migration20251016160403	2026-11-03 12:30:25.830484+00
134	Migration20251016182939	2026-11-03 12:30:25.830484+00
135	Migration20251017155709	2026-11-03 12:30:25.830484+00
136	Migration20251114100559	2026-11-03 12:30:25.830484+00
137	Migration20251125164002	2026-11-03 12:30:25.830484+00
138	Migration20251210112909	2026-11-03 12:30:25.830484+00
139	Migration20251210112924	2026-11-03 12:30:25.830484+00
140	Migration20251225120947	2026-11-03 12:30:25.830484+00
141	Migration20260106185528	2026-11-03 12:30:25.830484+00
142	Migration20260625000000	2026-11-03 12:30:25.830484+00
143	Migration20260729154253	2026-11-03 12:30:25.830484+00
144	Migration20250717162007	2026-11-03 12:30:26.044435+00
145	Migration20260127081758	2026-11-03 12:30:26.044435+00
146	Migration20260615151246	2026-11-03 12:30:26.044435+00
147	Migration20240205025928	2026-11-03 12:30:26.092839+00
148	Migration20240529080336	2026-11-03 12:30:26.092839+00
149	Migration20241202100304	2026-11-03 12:30:26.092839+00
150	Migration20260514083900	2026-11-03 12:30:26.092839+00
151	Migration20260525090000	2026-11-03 12:30:26.092839+00
152	Migration20260604120000	2026-11-03 12:30:26.092839+00
153	Migration20260616075929	2026-11-03 12:30:26.092839+00
154	Migration20240214033943	2026-11-03 12:30:26.185346+00
155	Migration20240703095850	2026-11-03 12:30:26.185346+00
156	Migration20241202103352	2026-11-03 12:30:26.185346+00
157	Migration20240311145700_InitialSetupMigration	2026-11-03 12:30:26.243262+00
158	Migration20240821170957	2026-11-03 12:30:26.243262+00
159	Migration20240917161003	2026-11-03 12:30:26.243262+00
160	Migration20241217110416	2026-11-03 12:30:26.243262+00
161	Migration20250113122235	2026-11-03 12:30:26.243262+00
162	Migration20250120115002	2026-11-03 12:30:26.243262+00
163	Migration20250822130931	2026-11-03 12:30:26.243262+00
164	Migration20250825132614	2026-11-03 12:30:26.243262+00
165	Migration20251114133146	2026-11-03 12:30:26.243262+00
166	Migration20240509083918_InitialSetupMigration	2026-11-03 12:30:26.37471+00
167	Migration20240628075401	2026-11-03 12:30:26.37471+00
168	Migration20240830094712	2026-11-03 12:30:26.37471+00
169	Migration20250120110514	2026-11-03 12:30:26.37471+00
170	Migration20251028172715	2026-11-03 12:30:26.37471+00
171	Migration20251121123942	2026-11-03 12:30:26.37471+00
172	Migration20251121150408	2026-11-03 12:30:26.37471+00
173	Migration20260805085626	2026-11-03 12:30:26.448127+00
174	Migration20260903085616	2026-11-03 12:30:26.448127+00
175	Migration20260911115931	2026-11-03 12:30:26.448127+00
176	Migration20260807120000	2026-11-03 12:30:26.500169+00
177	Migration20231228143900	2026-11-03 12:30:26.544924+00
178	Migration20241206101446	2026-11-03 12:30:26.544924+00
179	Migration20250128174331	2026-11-03 12:30:26.544924+00
180	Migration20250505092459	2026-11-03 12:30:26.544924+00
181	Migration20250819104213	2026-11-03 12:30:26.544924+00
182	Migration20250819110924	2026-11-03 12:30:26.544924+00
183	Migration20250908080305	2026-11-03 12:30:26.544924+00
\.


--
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.notification (id, "to", channel, template, data, trigger_type, resource_id, resource_type, receiver_id, original_notification_id, idempotency_key, external_id, provider_id, created_at, updated_at, deleted_at, status, "from", provider_data) FROM stdin;
\.


--
-- Data for Name: notification_provider; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.notification_provider (id, handle, name, is_enabled, channels, created_at, updated_at, deleted_at) FROM stdin;
local	local	local	t	{feed}	2026-11-03 12:30:29.463+00	2026-11-03 12:30:29.463+00	\N
\.


--
-- Data for Name: order; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public."order" (id, region_id, display_id, customer_id, version, sales_channel_id, status, is_draft_order, email, currency_code, shipping_address_id, billing_address_id, no_notification, metadata, created_at, updated_at, deleted_at, canceled_at, custom_display_id, locale) FROM stdin;
\.


--
-- Data for Name: order_address; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_address (id, customer_id, company, first_name, last_name, address_1, address_2, city, country_code, province, postal_code, phone, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_cart; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_cart (order_id, cart_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_change; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_change (id, order_id, version, description, status, internal_note, created_by, requested_by, requested_at, confirmed_by, confirmed_at, declined_by, declined_reason, metadata, declined_at, canceled_by, canceled_at, created_at, updated_at, change_type, deleted_at, return_id, claim_id, exchange_id, carry_over_promotions, no_notification) FROM stdin;
\.


--
-- Data for Name: order_change_action; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_change_action (id, order_id, version, ordering, order_change_id, reference, reference_id, action, details, amount, raw_amount, internal_note, applied, created_at, updated_at, deleted_at, return_id, claim_id, exchange_id) FROM stdin;
\.


--
-- Data for Name: order_claim; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_claim (id, order_id, return_id, order_version, display_id, type, no_notification, refund_amount, raw_refund_amount, metadata, created_at, updated_at, deleted_at, canceled_at, created_by) FROM stdin;
\.


--
-- Data for Name: order_claim_item; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_claim_item (id, claim_id, item_id, is_additional_item, reason, quantity, raw_quantity, note, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_claim_item_image; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_claim_item_image (id, claim_item_id, url, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_credit_line; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_credit_line (id, order_id, reference, reference_id, amount, raw_amount, metadata, created_at, updated_at, deleted_at, version) FROM stdin;
\.


--
-- Data for Name: order_exchange; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_exchange (id, order_id, return_id, order_version, display_id, no_notification, allow_backorder, difference_due, raw_difference_due, metadata, created_at, updated_at, deleted_at, canceled_at, created_by) FROM stdin;
\.


--
-- Data for Name: order_exchange_item; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_exchange_item (id, exchange_id, item_id, quantity, raw_quantity, note, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_fulfillment; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_fulfillment (order_id, fulfillment_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_item; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_item (id, order_id, version, item_id, quantity, raw_quantity, fulfilled_quantity, raw_fulfilled_quantity, shipped_quantity, raw_shipped_quantity, return_requested_quantity, raw_return_requested_quantity, return_received_quantity, raw_return_received_quantity, return_dismissed_quantity, raw_return_dismissed_quantity, written_off_quantity, raw_written_off_quantity, metadata, created_at, updated_at, deleted_at, delivered_quantity, raw_delivered_quantity, unit_price, raw_unit_price, compare_at_unit_price, raw_compare_at_unit_price) FROM stdin;
\.


--
-- Data for Name: order_line_item; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_line_item (id, totals_id, title, subtitle, thumbnail, variant_id, product_id, product_title, product_description, product_subtitle, product_type, product_collection, product_handle, variant_sku, variant_barcode, variant_title, variant_option_values, requires_shipping, is_discountable, is_tax_inclusive, compare_at_unit_price, raw_compare_at_unit_price, unit_price, raw_unit_price, metadata, created_at, updated_at, deleted_at, is_custom_price, product_type_id, is_giftcard) FROM stdin;
\.


--
-- Data for Name: order_line_item_adjustment; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_line_item_adjustment (id, description, promotion_id, code, amount, raw_amount, provider_id, created_at, updated_at, item_id, deleted_at, is_tax_inclusive, version) FROM stdin;
\.


--
-- Data for Name: order_line_item_tax_line; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_line_item_tax_line (id, description, tax_rate_id, code, rate, raw_rate, provider_id, created_at, updated_at, item_id, deleted_at, metadata, data) FROM stdin;
\.


--
-- Data for Name: order_payment_collection; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_payment_collection (order_id, payment_collection_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_promotion; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_promotion (order_id, promotion_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_shipping; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_shipping (id, order_id, version, shipping_method_id, created_at, updated_at, deleted_at, return_id, claim_id, exchange_id) FROM stdin;
\.


--
-- Data for Name: order_shipping_method; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_shipping_method (id, name, description, amount, raw_amount, is_tax_inclusive, shipping_option_id, data, metadata, created_at, updated_at, deleted_at, is_custom_amount) FROM stdin;
\.


--
-- Data for Name: order_shipping_method_adjustment; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_shipping_method_adjustment (id, description, promotion_id, code, amount, raw_amount, provider_id, created_at, updated_at, shipping_method_id, deleted_at, version) FROM stdin;
\.


--
-- Data for Name: order_shipping_method_tax_line; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_shipping_method_tax_line (id, description, tax_rate_id, code, rate, raw_rate, provider_id, created_at, updated_at, shipping_method_id, deleted_at, metadata, data) FROM stdin;
\.


--
-- Data for Name: order_summary; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_summary (id, order_id, version, totals, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_transaction; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.order_transaction (id, order_id, version, amount, raw_amount, currency_code, reference, reference_id, created_at, updated_at, deleted_at, return_id, claim_id, exchange_id) FROM stdin;
\.


--
-- Data for Name: payment; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.payment (id, amount, raw_amount, currency_code, provider_id, data, created_at, updated_at, deleted_at, captured_at, canceled_at, payment_collection_id, payment_session_id, metadata) FROM stdin;
\.


--
-- Data for Name: payment_collection; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.payment_collection (id, currency_code, amount, raw_amount, authorized_amount, raw_authorized_amount, captured_amount, raw_captured_amount, refunded_amount, raw_refunded_amount, created_at, updated_at, deleted_at, completed_at, status, metadata) FROM stdin;
\.


--
-- Data for Name: payment_collection_payment_providers; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.payment_collection_payment_providers (payment_collection_id, payment_provider_id) FROM stdin;
\.


--
-- Data for Name: payment_provider; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.payment_provider (id, is_enabled, created_at, updated_at, deleted_at) FROM stdin;
pp_system_default	t	2026-11-03 12:30:29.458+00	2026-11-03 12:30:29.458+00	\N
\.


--
-- Data for Name: payment_session; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.payment_session (id, currency_code, amount, raw_amount, provider_id, data, context, status, authorized_at, payment_collection_id, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: price; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.price (id, title, price_set_id, currency_code, raw_amount, rules_count, created_at, updated_at, deleted_at, price_list_id, amount, min_quantity, max_quantity, raw_min_quantity, raw_max_quantity) FROM stdin;
price_01M6GP7HGJC7QKAGVP9SSC1NFS	\N	pset_01M6GP7HGKD0WKMJ0498ZFTYWG	usd	{"value": "10", "precision": 20}	0	2026-11-03 12:30:32.98+00	2026-11-03 12:30:32.98+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HGKSFKY758XB42QB9KF	\N	pset_01M6GP7HGKD0WKMJ0498ZFTYWG	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:32.98+00	2026-11-03 12:30:32.98+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HGKVZ60W3RC88PRH9KD	\N	pset_01M6GP7HGKD0WKMJ0498ZFTYWG	eur	{"value": "10", "precision": 20}	1	2026-11-03 12:30:32.98+00	2026-11-03 12:30:32.98+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HGK7M4TH0B6XC04F8TB	\N	pset_01M6GP7HGKASH5NVGCG0243QEE	usd	{"value": "10", "precision": 20}	0	2026-11-03 12:30:32.98+00	2026-11-03 12:30:32.98+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HGKDWS8XS9JQ4848RW2	\N	pset_01M6GP7HGKASH5NVGCG0243QEE	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:32.98+00	2026-11-03 12:30:32.98+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HGK9SY1XX2QJ2NGFB5J	\N	pset_01M6GP7HGKASH5NVGCG0243QEE	eur	{"value": "10", "precision": 20}	1	2026-11-03 12:30:32.98+00	2026-11-03 12:30:32.98+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HPZWSXR51P3G233HPYW	\N	pset_01M6GP7HPZKYQMPKNE50E3AKDM	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HPZQ37HXW06YJSEA87N	\N	pset_01M6GP7HPZKYQMPKNE50E3AKDM	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HPZA15BV0RZ3HWHHVXV	\N	pset_01M6GP7HPZCGS5MB65PDRK99VA	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HPZ7C6918V2QDWR8THP	\N	pset_01M6GP7HPZCGS5MB65PDRK99VA	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HPZ5CY021XJC1VSKEYV	\N	pset_01M6GP7HPZAMKEANXTYBXCEZNZ	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HPZV6PMFNACQGRZTM4R	\N	pset_01M6GP7HPZAMKEANXTYBXCEZNZ	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HPZ9FNR7Z6QXYWMQSZB	\N	pset_01M6GP7HPZAQJPVPHT1345YWEF	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HPZ21R4R4JEJFJQD8HY	\N	pset_01M6GP7HPZAQJPVPHT1345YWEF	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HPZA8SPZ37P55W69780	\N	pset_01M6GP7HPZD8XM9J5686EXN526	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HPZEC24A96C7VYJT3WS	\N	pset_01M6GP7HPZD8XM9J5686EXN526	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HPZ5F7WQVGPK5S190F3	\N	pset_01M6GP7HQ098ET8ED1KF6J2S0R	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HQ0PHFKB1JCWT7H268P	\N	pset_01M6GP7HQ098ET8ED1KF6J2S0R	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HQ0SQAXZ99C55F08WKS	\N	pset_01M6GP7HQ0VCQNWRG0JMBTPXYV	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HQ0B8NSNV961AXTZXHD	\N	pset_01M6GP7HQ0VCQNWRG0JMBTPXYV	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HQ0MRXMJTYJ5297SVX7	\N	pset_01M6GP7HQ0TZ735P984GHXD4GH	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HQ0CD5P31P5NWJ19ZDE	\N	pset_01M6GP7HQ0TZ735P984GHXD4GH	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HQ03ERQH3HYTM29MHRM	\N	pset_01M6GP7HQ0TAP41X47D9WRQJ0F	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HQ07EYAP90R0YJKCJHR	\N	pset_01M6GP7HQ0TAP41X47D9WRQJ0F	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HQ0YVNSZR02HWRE4CA7	\N	pset_01M6GP7HQ0VBS1K66VPA959G9G	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HQ0T8SY3CYBWPDR0HXE	\N	pset_01M6GP7HQ0VBS1K66VPA959G9G	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HQ0XMY69PS1GJKP4KZM	\N	pset_01M6GP7HQ0K7D8PRYCZ04H71B3	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HQ0A7C39S3H8K7BX15Z	\N	pset_01M6GP7HQ0K7D8PRYCZ04H71B3	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HQ0BHE3NWTGMBCVZ83T	\N	pset_01M6GP7HQ0YEV84D97BW2FZVY5	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HQ0ZZGV4VRC90Z7VXZ9	\N	pset_01M6GP7HQ0YEV84D97BW2FZVY5	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HQ04VH3G5PBAWN7DCEZ	\N	pset_01M6GP7HQ0H6W1SACQ25NSYMDH	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HQ07XBF0JA83H6WCDWT	\N	pset_01M6GP7HQ0H6W1SACQ25NSYMDH	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HQ0MNZQA1EQW4WVFNZX	\N	pset_01M6GP7HQ0QB2DZJS3ACDV37FN	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HQ0X2G6WJY0TAA99PV3	\N	pset_01M6GP7HQ0QB2DZJS3ACDV37FN	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HQ1VP4804YBCM61YBJB	\N	pset_01M6GP7HQ1WKX79RA15NGGHXQ5	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HQ19T629FWSFWYMB43Q	\N	pset_01M6GP7HQ1WKX79RA15NGGHXQ5	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HQ1MKX3B379YAF5YEB8	\N	pset_01M6GP7HQ1PHQ7D4NN0VSDX06K	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HQ19TVT7N4A2YH5NW9P	\N	pset_01M6GP7HQ1PHQ7D4NN0VSDX06K	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HQ1F0X7SDY9MR6ZD46E	\N	pset_01M6GP7HQ195JGDA66GQRA28RN	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HQ1R36TY47JD2CX3CSX	\N	pset_01M6GP7HQ195JGDA66GQRA28RN	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HQ1QGW1F4ZTNAGPE1JP	\N	pset_01M6GP7HQ1NA7ZDQM3JF1QX9NH	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HQ1E09PHMAYE246W0CP	\N	pset_01M6GP7HQ1NA7ZDQM3JF1QX9NH	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HQ13DRBS0J79R4V8WS4	\N	pset_01M6GP7HQ1EJSX4ZZEZ021E8JD	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HQ1G2H3ZW36N1203GBK	\N	pset_01M6GP7HQ1EJSX4ZZEZ021E8JD	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP7HQ1T9BYMFB0FRSECJHJ	\N	pset_01M6GP7HQ1J9KH96S4RDN58K40	eur	{"value": "10", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	10	\N	\N	\N	\N
price_01M6GP7HQ15DCW737WBFVBQ8YJ	\N	pset_01M6GP7HQ1J9KH96S4RDN58K40	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP9DR3QB4E5NAARTYYR09H	\N	pset_01M6GP9DR3ABVFMACVB7RMF1ST	try	{"value": "450", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	450	\N	\N	\N	\N
price_01M6GP9DR3XYE4J5X9YK5KA4PM	\N	pset_01M6GP9DR3ABVFMACVB7RMF1ST	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP9DR3W74J4FWPY3S81BSY	\N	pset_01M6GP9DR3ERMA9ADPGZKT9589	try	{"value": "450", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	450	\N	\N	\N	\N
price_01M6GP9DR3MDKS8BX0XPD7J3WT	\N	pset_01M6GP9DR3ERMA9ADPGZKT9589	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP9DR345H5K0DNCMKDA07F	\N	pset_01M6GP9DR3XQPVNDWXN3YS6VA3	try	{"value": "450", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	450	\N	\N	\N	\N
price_01M6GP9DR300JGGJ1SYNXKG54D	\N	pset_01M6GP9DR3XQPVNDWXN3YS6VA3	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP9DR44CCS8DXWV4JBFMEQ	\N	pset_01M6GP9DR46KS338702B88SXQY	try	{"value": "450", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	450	\N	\N	\N	\N
price_01M6GP9DR4P2AMBJHQYZF9NASJ	\N	pset_01M6GP9DR46KS338702B88SXQY	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP9DR4JYAT3VA4KS1HCEB0	\N	pset_01M6GP9DR4PBTRMXNK8FAXW0AG	try	{"value": "450", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	450	\N	\N	\N	\N
price_01M6GP9DR4NHWGAGZRDD95VFC6	\N	pset_01M6GP9DR4PBTRMXNK8FAXW0AG	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP9DR4CDDG8AQAJW5QYZTB	\N	pset_01M6GP9DR4M6Q8EM6Y53JPNZ42	try	{"value": "450", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	450	\N	\N	\N	\N
price_01M6GP9DR41MD2K5QRKSEMKQP4	\N	pset_01M6GP9DR4M6Q8EM6Y53JPNZ42	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP9DR4GR7NAYRT52NQ81RP	\N	pset_01M6GP9DR4KX96EY1V1MYGZFV8	try	{"value": "450", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	450	\N	\N	\N	\N
price_01M6GP9DR4V9R1GVWKDSY7WGEY	\N	pset_01M6GP9DR4KX96EY1V1MYGZFV8	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP9DR4AERC4AJKC0ACACPK	\N	pset_01M6GP9DR4GKV9T39J2YDYZF40	try	{"value": "450", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	450	\N	\N	\N	\N
price_01M6GP9DR4CPMJ951MDREND1GR	\N	pset_01M6GP9DR4GKV9T39J2YDYZF40	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP9DR44CKQK5PYSFRRKZXA	\N	pset_01M6GP9DR4CSJQ4AAC2ADP8ZK2	try	{"value": "450", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	450	\N	\N	\N	\N
price_01M6GP9DR4XDPCSEFME3SVJ9P1	\N	pset_01M6GP9DR4CSJQ4AAC2ADP8ZK2	usd	{"value": "15", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	15	\N	\N	\N	\N
price_01M6GP9DR484ZJ23BMXS6NBR6P	\N	pset_01M6GP9DR4R2MBWJ9ST3A34FZC	try	{"value": "890", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	890	\N	\N	\N	\N
price_01M6GP9DR4C0M818BTV195M75N	\N	pset_01M6GP9DR4R2MBWJ9ST3A34FZC	usd	{"value": "28", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	28	\N	\N	\N	\N
price_01M6GP9DR40VD9FXWPBEQ28A8Z	\N	pset_01M6GP9DR40AAYHVCF4MFXMYT0	try	{"value": "890", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	890	\N	\N	\N	\N
price_01M6GP9DR43DZHBJA08B8ACZ7B	\N	pset_01M6GP9DR40AAYHVCF4MFXMYT0	usd	{"value": "28", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	28	\N	\N	\N	\N
price_01M6GP9DR48C114V2D83SZ7ACZ	\N	pset_01M6GP9DR4FQS18P3GZ2WAAA8G	try	{"value": "890", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	890	\N	\N	\N	\N
price_01M6GP9DR4A064PEC616RTQQT3	\N	pset_01M6GP9DR4FQS18P3GZ2WAAA8G	usd	{"value": "28", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	28	\N	\N	\N	\N
price_01M6GP9DR4F3YX55K2115QX8XV	\N	pset_01M6GP9DR4N4VPGNPNDGQ4Q07B	try	{"value": "890", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	890	\N	\N	\N	\N
price_01M6GP9DR444RWXCDP8NT71CBC	\N	pset_01M6GP9DR4N4VPGNPNDGQ4Q07B	usd	{"value": "28", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	28	\N	\N	\N	\N
price_01M6GP9DR403EGD1Q5JTSZYK5Q	\N	pset_01M6GP9DR4V1C2D58TYB1EE1DK	try	{"value": "890", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	890	\N	\N	\N	\N
price_01M6GP9DR4CKBD7YMSKCWTKE6X	\N	pset_01M6GP9DR4V1C2D58TYB1EE1DK	usd	{"value": "28", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	28	\N	\N	\N	\N
price_01M6GP9DR4P1Q1PEKW417S02EN	\N	pset_01M6GP9DR5777F1RE3SJX41H9T	try	{"value": "190", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	190	\N	\N	\N	\N
price_01M6GP9DR5W9JB291F9QR29FRF	\N	pset_01M6GP9DR5777F1RE3SJX41H9T	usd	{"value": "6", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	6	\N	\N	\N	\N
price_01M6GP9DR5EX5321X6V43VK4H4	\N	pset_01M6GP9DR5KSXW7DBTDMBRS2W9	try	{"value": "220", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	220	\N	\N	\N	\N
price_01M6GP9DR5C04TV1RMGVVKGQYS	\N	pset_01M6GP9DR5KSXW7DBTDMBRS2W9	usd	{"value": "7", "precision": 20}	0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N	\N	7	\N	\N	\N	\N
\.


--
-- Data for Name: price_list; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.price_list (id, status, starts_at, ends_at, rules_count, title, description, type, created_at, updated_at, deleted_at, metadata) FROM stdin;
\.


--
-- Data for Name: price_list_rule; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.price_list_rule (id, price_list_id, created_at, updated_at, deleted_at, value, attribute) FROM stdin;
\.


--
-- Data for Name: price_preference; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.price_preference (id, attribute, value, is_tax_inclusive, created_at, updated_at, deleted_at) FROM stdin;
prpref_01M6GP7HCY8VA21ND5XZ5G91XT	currency_code	eur	f	2026-11-03 12:30:32.862+00	2026-11-03 12:30:32.862+00	\N
prpref_01M6GP7HCY5VJYYS0K4DGXQF4N	currency_code	usd	f	2026-11-03 12:30:32.862+00	2026-11-03 12:30:32.862+00	\N
prpref_01M6GP7HDQA2981YR7Z954MKB5	region_id	reg_01M6GP7HD4B30BY9RYEMWPEC9Q	f	2026-11-03 12:30:32.887+00	2026-11-03 12:30:32.887+00	\N
prpref_01M6GP9DK58E8722CHEP12KMT6	currency_code	try	f	2026-11-03 12:31:34.501+00	2026-11-03 12:31:34.501+00	\N
prpref_01M6GP9DKW7GW6WDMXVFWZ1BCR	region_id	reg_01M6GP9DKF11TP8BQSB5Q3EF53	f	2026-11-03 12:31:34.524+00	2026-11-03 12:31:34.524+00	\N
\.


--
-- Data for Name: price_rule; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.price_rule (id, value, priority, price_id, created_at, updated_at, deleted_at, attribute, operator) FROM stdin;
prule_01M6GP7HGKJ65876AWH9AGDG66	reg_01M6GP7HD4B30BY9RYEMWPEC9Q	0	price_01M6GP7HGKVZ60W3RC88PRH9KD	2026-11-03 12:30:32.98+00	2026-11-03 12:30:32.98+00	\N	region_id	eq
prule_01M6GP7HGK1END1H16B84TKAKK	reg_01M6GP7HD4B30BY9RYEMWPEC9Q	0	price_01M6GP7HGK9SY1XX2QJ2NGFB5J	2026-11-03 12:30:32.98+00	2026-11-03 12:30:32.98+00	\N	region_id	eq
\.


--
-- Data for Name: price_set; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.price_set (id, created_at, updated_at, deleted_at) FROM stdin;
pset_01M6GP7HGKD0WKMJ0498ZFTYWG	2026-11-03 12:30:32.979+00	2026-11-03 12:30:32.979+00	\N
pset_01M6GP7HGKASH5NVGCG0243QEE	2026-11-03 12:30:32.979+00	2026-11-03 12:30:32.979+00	\N
pset_01M6GP7HPZKYQMPKNE50E3AKDM	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HPZCGS5MB65PDRK99VA	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HPZAMKEANXTYBXCEZNZ	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HPZAQJPVPHT1345YWEF	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HPZD8XM9J5686EXN526	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HQ098ET8ED1KF6J2S0R	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HQ0VCQNWRG0JMBTPXYV	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HQ0TZ735P984GHXD4GH	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HQ0TAP41X47D9WRQJ0F	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HQ0VBS1K66VPA959G9G	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HQ0K7D8PRYCZ04H71B3	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HQ0YEV84D97BW2FZVY5	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HQ0H6W1SACQ25NSYMDH	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HQ0QB2DZJS3ACDV37FN	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HQ1WKX79RA15NGGHXQ5	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HQ1PHQ7D4NN0VSDX06K	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HQ195JGDA66GQRA28RN	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HQ1NA7ZDQM3JF1QX9NH	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HQ1EJSX4ZZEZ021E8JD	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP7HQ1J9KH96S4RDN58K40	2026-11-03 12:30:33.186+00	2026-11-03 12:30:33.186+00	\N
pset_01M6GP9DR3ABVFMACVB7RMF1ST	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N
pset_01M6GP9DR3ERMA9ADPGZKT9589	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N
pset_01M6GP9DR3XQPVNDWXN3YS6VA3	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N
pset_01M6GP9DR46KS338702B88SXQY	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N
pset_01M6GP9DR4PBTRMXNK8FAXW0AG	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N
pset_01M6GP9DR4M6Q8EM6Y53JPNZ42	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N
pset_01M6GP9DR4KX96EY1V1MYGZFV8	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N
pset_01M6GP9DR4GKV9T39J2YDYZF40	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N
pset_01M6GP9DR4CSJQ4AAC2ADP8ZK2	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N
pset_01M6GP9DR4R2MBWJ9ST3A34FZC	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N
pset_01M6GP9DR40AAYHVCF4MFXMYT0	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N
pset_01M6GP9DR4FQS18P3GZ2WAAA8G	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N
pset_01M6GP9DR4N4VPGNPNDGQ4Q07B	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N
pset_01M6GP9DR4V1C2D58TYB1EE1DK	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N
pset_01M6GP9DR5777F1RE3SJX41H9T	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N
pset_01M6GP9DR5KSXW7DBTDMBRS2W9	2026-11-03 12:31:34.661+00	2026-11-03 12:31:34.661+00	\N
\.


--
-- Data for Name: product; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product (id, title, handle, subtitle, description, is_giftcard, status, thumbnail, weight, length, height, width, origin_country, hs_code, mid_code, material, collection_id, type_id, discountable, external_id, created_at, updated_at, deleted_at, metadata) FROM stdin;
prod_01M6GP7HK3N0KX01F0CHPQZB4J	Medusa T-Shirt	t-shirt	\N	Reimagine the feeling of a classic T-shirt. With our cotton T-shirts, everyday essentials no longer have to be ordinary.	f	published	https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png	400	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	2026-11-03 12:30:33.068+00	2026-11-03 12:30:33.068+00	\N	\N
prod_01M6GP7HK38KNM15QBV8KMYP2Z	Medusa Sweatshirt	sweatshirt	\N	Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.	f	published	https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png	400	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	2026-11-03 12:30:33.068+00	2026-11-03 12:30:33.068+00	\N	\N
prod_01M6GP7HK3CYBGS7DDY58J8XD5	Medusa Sweatpants	sweatpants	\N	Reimagine the feeling of classic sweatpants. With our cotton sweatpants, everyday essentials no longer have to be ordinary.	f	published	https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png	400	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	2026-11-03 12:30:33.068+00	2026-11-03 12:30:33.068+00	\N	\N
prod_01M6GP7HK3J69S3YARJ8W2P4W1	Medusa Shorts	shorts	\N	Reimagine the feeling of classic shorts. With our cotton shorts, everyday essentials no longer have to be ordinary.	f	published	https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png	400	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N	\N
prod_01M6GP9DMYQ1Z62JTV01V1BGT2	Premium Oversize Penye T-Shirt	premium-oversize-penye-t-shirt	\N	240 GSM %100 Pamuk, yumuşak tuşeli, birinci sınıf penye kumaş. Dayanıklı çift iğne dikiş ve fit kesim.	f	published	https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	{"cut": "Oversize", "fabric": "240 GSM %100 Pamuk", "wash_care": "30 derecede tersten yıkayınız.", "sales_model": "ready", "product_type": "ready_product"}
prod_01M6GP9DMYEQV47FQGQ8Z09FB0	Özel Baskılı Kapüşonlu Sweatshirt (Hoodie)	ozel-baskili-kapusonlu-sweatshirt-hoodie	\N	320 GSM 3 İplik Şardonlu pamuk kumaş. Göğüs, sırt veya kol bölgesine kendi tasarımınızı yüksek çözünürlüklü DTF veya Serigrafi baskı tekniğiyle uygulayın.	f	published	https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	{"fabric": "320 GSM 3 İplik Şardonlu", "print_areas": [{"id": "front", "name": "Ön Göğüs", "max_width_cm": 30, "max_height_cm": 35}, {"id": "back", "name": "Sırt", "max_width_cm": 35, "max_height_cm": 45}, {"id": "left_chest", "name": "Sol Göğüs Logo", "max_width_cm": 10, "max_height_cm": 10}], "print_ready": true, "sales_model": "custom_print", "product_type": "custom_print", "mockup_model_id": "hoodie", "supported_print_techniques": ["DTF Dijital Baskı", "Serigrafi Baskı", "Nakkaş Nakış"]}
prod_01M6GP9DMYJAAWWCA3CZC6548Y	Özel Baskılı Kanvas Bez Çanta (Tote Bag)	ozel-baskili-kanvas-bez-canta	\N	320 GSM %100 Ham Pamuk Kanvas Kumaş. 35x40 cm standart ölçü, uzun omuz askılı. Promosyon, marka ve etkinlikler için ideal.	f	published	https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1000&auto=format&fit=crop	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	{"fabric": "320 GSM Ham Pamuk Kanvas", "print_areas": [{"id": "front", "name": "Ön Yüz", "max_width_cm": 28, "max_height_cm": 32}], "print_ready": true, "sales_model": "custom_print", "product_type": "custom_print", "mockup_model_id": "canta", "supported_print_techniques": ["DTF Dijital Baskı", "Serigrafi Baskı"]}
\.


--
-- Data for Name: product_category; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product_category (id, name, description, handle, mpath, is_active, is_internal, rank, parent_category_id, created_at, updated_at, deleted_at, metadata, external_id) FROM stdin;
pcat_01M6GP7HJ4TRG84H43065FZCC7	Shirts		shirts	pcat_01M6GP7HJ4TRG84H43065FZCC7	t	f	0	\N	2026-11-03 12:30:33.03+00	2026-11-03 12:30:33.03+00	\N	\N	\N
pcat_01M6GP7HJ5HVN0R1X1T5HRJ0XK	Sweatshirts		sweatshirts	pcat_01M6GP7HJ5HVN0R1X1T5HRJ0XK	t	f	1	\N	2026-11-03 12:30:33.03+00	2026-11-03 12:30:33.03+00	\N	\N	\N
pcat_01M6GP7HJ617PHW4C90DYX7P2R	Pants		pants	pcat_01M6GP7HJ617PHW4C90DYX7P2R	t	f	2	\N	2026-11-03 12:30:33.03+00	2026-11-03 12:30:33.03+00	\N	\N	\N
pcat_01M6GP7HJ6WE20BM6JCZ8EBQH2	Merch		merch	pcat_01M6GP7HJ6WE20BM6JCZ8EBQH2	t	f	3	\N	2026-11-03 12:30:33.03+00	2026-11-03 12:30:33.03+00	\N	\N	\N
\.


--
-- Data for Name: product_category_product; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product_category_product (product_id, product_category_id) FROM stdin;
prod_01M6GP7HK3N0KX01F0CHPQZB4J	pcat_01M6GP7HJ4TRG84H43065FZCC7
prod_01M6GP7HK38KNM15QBV8KMYP2Z	pcat_01M6GP7HJ5HVN0R1X1T5HRJ0XK
prod_01M6GP7HK3CYBGS7DDY58J8XD5	pcat_01M6GP7HJ617PHW4C90DYX7P2R
prod_01M6GP7HK3J69S3YARJ8W2P4W1	pcat_01M6GP7HJ6WE20BM6JCZ8EBQH2
\.


--
-- Data for Name: product_collection; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product_collection (id, title, handle, metadata, created_at, updated_at, deleted_at, external_id) FROM stdin;
\.


--
-- Data for Name: product_option; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product_option (id, title, metadata, created_at, updated_at, deleted_at, is_exclusive) FROM stdin;
opt_01M6GP7HJFWRFA2F0VA8QMTM37	Size	\N	2026-11-03 12:30:33.039+00	2026-11-03 12:30:33.039+00	\N	f
opt_01M6GP7HJFPPAHE35Z8W5RYS4V	Color	\N	2026-11-03 12:30:33.039+00	2026-11-03 12:30:33.039+00	\N	f
opt_01M6GP9DMYX54D77BJKA4WZ6BJ	Beden	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	t
opt_01M6GP9DMYZZ8DE2DWYMR4ZPG5	Renk	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	t
opt_01M6GP9DMY3GF2QF1YJTNHFKRE	Beden	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	t
opt_01M6GP9DMY33HX46H793QGWJBY	Renk	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	t
opt_01M6GP9DMYP78EN5VJQAR23GBD	Boyut	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	t
opt_01M6GP9DMYAZCK2RK2S8Z07SZ9	Renk	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	t
\.


--
-- Data for Name: product_option_value; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product_option_value (id, value, option_id, metadata, created_at, updated_at, deleted_at, rank) FROM stdin;
optval_01M6GP7HJEC0D6DZR9C6P38H9N	S	opt_01M6GP7HJFWRFA2F0VA8QMTM37	\N	2026-11-03 12:30:33.039+00	2026-11-03 12:30:33.039+00	\N	\N
optval_01M6GP7HJEQJZQW14NENYM1N53	M	opt_01M6GP7HJFWRFA2F0VA8QMTM37	\N	2026-11-03 12:30:33.039+00	2026-11-03 12:30:33.039+00	\N	\N
optval_01M6GP7HJEYS33XZPSEGVKC2PJ	L	opt_01M6GP7HJFWRFA2F0VA8QMTM37	\N	2026-11-03 12:30:33.039+00	2026-11-03 12:30:33.039+00	\N	\N
optval_01M6GP7HJENY968858A8MZBKKG	XL	opt_01M6GP7HJFWRFA2F0VA8QMTM37	\N	2026-11-03 12:30:33.039+00	2026-11-03 12:30:33.039+00	\N	\N
optval_01M6GP7HJF39PQX2FWXHGDVJXP	Black	opt_01M6GP7HJFPPAHE35Z8W5RYS4V	\N	2026-11-03 12:30:33.039+00	2026-11-03 12:30:33.039+00	\N	\N
optval_01M6GP7HJF9MQS3NYGTB686QC1	White	opt_01M6GP7HJFPPAHE35Z8W5RYS4V	\N	2026-11-03 12:30:33.039+00	2026-11-03 12:30:33.039+00	\N	\N
optval_01M6GP9DMZ0TNCHV4E1HKRGS58	S	opt_01M6GP9DMYX54D77BJKA4WZ6BJ	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DMZ01YYDXDPPNAV4EYS	M	opt_01M6GP9DMYX54D77BJKA4WZ6BJ	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DMZB82G2KPHK9DR55RY	L	opt_01M6GP9DMYX54D77BJKA4WZ6BJ	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DMZMESX1FBNV2VZ8RZQ	XL	opt_01M6GP9DMYX54D77BJKA4WZ6BJ	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DMZ4BJ962AMC593QGBQ	Siyah	opt_01M6GP9DMYZZ8DE2DWYMR4ZPG5	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DMZH49ZGDY3FM9NDFSB	Beyaz	opt_01M6GP9DMYZZ8DE2DWYMR4ZPG5	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DMZW8H99JB4D5Q1EW4M	Antrasit	opt_01M6GP9DMYZZ8DE2DWYMR4ZPG5	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DMZ5593AG7FWH79PB43	Bej	opt_01M6GP9DMYZZ8DE2DWYMR4ZPG5	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DMZNP08D3HH872SWXJD	S	opt_01M6GP9DMY3GF2QF1YJTNHFKRE	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DMZDFQYP25F2T106PSG	M	opt_01M6GP9DMY3GF2QF1YJTNHFKRE	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DMZKHNZC7NERQTRSB57	L	opt_01M6GP9DMY3GF2QF1YJTNHFKRE	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DMZ2ZM6VRRZX9EWAQQZ	XL	opt_01M6GP9DMY3GF2QF1YJTNHFKRE	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DMZVVK3QDY61BEFGJEV	2XL	opt_01M6GP9DMY3GF2QF1YJTNHFKRE	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DMZ9ZFNMZ4S9VEQTQWG	Siyah	opt_01M6GP9DMY33HX46H793QGWJBY	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DN0NFBD86FGAWZQZ96F	Antrasit	opt_01M6GP9DMY33HX46H793QGWJBY	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DN051GT1RD69BMZ0HKA	Haki	opt_01M6GP9DMY33HX46H793QGWJBY	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DN0MBJSZ2PF8DKRGMNC	Ekru	opt_01M6GP9DMY33HX46H793QGWJBY	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DN02H2R2P87ABRXBE2S	Standart (35x40 cm)	opt_01M6GP9DMYP78EN5VJQAR23GBD	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DN0X48HPN4S2VYYYDYF	Ham Ekru	opt_01M6GP9DMYAZCK2RK2S8Z07SZ9	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
optval_01M6GP9DN0NSZ0C7DJ83HGBMP6	Siyah	opt_01M6GP9DMYAZCK2RK2S8Z07SZ9	\N	2026-11-03 12:31:34.56+00	2026-11-03 12:31:34.56+00	\N	\N
\.


--
-- Data for Name: product_product_option; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product_product_option (id, product_id, product_option_id, created_at, updated_at, deleted_at) FROM stdin;
prodopt_01M6GP7HKB8Y3G0FP4AQYTREY5	prod_01M6GP7HK3N0KX01F0CHPQZB4J	opt_01M6GP7HJFWRFA2F0VA8QMTM37	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodopt_01M6GP7HKB9EPES5V8VDWKH9PQ	prod_01M6GP7HK3N0KX01F0CHPQZB4J	opt_01M6GP7HJFPPAHE35Z8W5RYS4V	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodopt_01M6GP7HKBEXE5BNYSFJTP0W83	prod_01M6GP7HK38KNM15QBV8KMYP2Z	opt_01M6GP7HJFWRFA2F0VA8QMTM37	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodopt_01M6GP7HKB0T16FJNEGARZ6Y59	prod_01M6GP7HK3CYBGS7DDY58J8XD5	opt_01M6GP7HJFWRFA2F0VA8QMTM37	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodopt_01M6GP7HKBTFX7KKQWGM74N9J3	prod_01M6GP7HK3J69S3YARJ8W2P4W1	opt_01M6GP7HJFWRFA2F0VA8QMTM37	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodopt_01M6GP9DNHGQ9E9VN053C5ZQVV	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	opt_01M6GP9DMYX54D77BJKA4WZ6BJ	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodopt_01M6GP9DNHQNR64QD5NRB47BBC	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	opt_01M6GP9DMYZZ8DE2DWYMR4ZPG5	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodopt_01M6GP9DNHB2G4J6K0S4NXHJ5X	prod_01M6GP9DMYEQV47FQGQ8Z09FB0	opt_01M6GP9DMY3GF2QF1YJTNHFKRE	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodopt_01M6GP9DNHG2N3S8QB8V4JJ00W	prod_01M6GP9DMYEQV47FQGQ8Z09FB0	opt_01M6GP9DMY33HX46H793QGWJBY	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodopt_01M6GP9DNHY60XFPFC1JN3E5VH	prod_01M6GP9DMYJAAWWCA3CZC6548Y	opt_01M6GP9DMYP78EN5VJQAR23GBD	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodopt_01M6GP9DNHQ3WWMR7D8YKYPMER	prod_01M6GP9DMYJAAWWCA3CZC6548Y	opt_01M6GP9DMYAZCK2RK2S8Z07SZ9	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
\.


--
-- Data for Name: product_product_option_value; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product_product_option_value (id, product_product_option_id, product_option_value_id, created_at, updated_at, deleted_at) FROM stdin;
prodoptval_01M6GP7HKB88W8CSV4NXN8KGB1	prodopt_01M6GP7HKB8Y3G0FP4AQYTREY5	optval_01M6GP7HJEYS33XZPSEGVKC2PJ	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP7HKBTEW8338PQ30N58C1	prodopt_01M6GP7HKB8Y3G0FP4AQYTREY5	optval_01M6GP7HJEQJZQW14NENYM1N53	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP7HKBH0JA6GGSTV6BRYR6	prodopt_01M6GP7HKB8Y3G0FP4AQYTREY5	optval_01M6GP7HJEC0D6DZR9C6P38H9N	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP7HKBHAH4E3Y0GJV2N5C2	prodopt_01M6GP7HKB8Y3G0FP4AQYTREY5	optval_01M6GP7HJENY968858A8MZBKKG	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP7HKB1TNRVG9QWJBYHQ85	prodopt_01M6GP7HKB9EPES5V8VDWKH9PQ	optval_01M6GP7HJF39PQX2FWXHGDVJXP	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP7HKBRDBWZ9RZ69B8REMH	prodopt_01M6GP7HKB9EPES5V8VDWKH9PQ	optval_01M6GP7HJF9MQS3NYGTB686QC1	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP7HKCZ8JF55M7HGDHF6VE	prodopt_01M6GP7HKBEXE5BNYSFJTP0W83	optval_01M6GP7HJEYS33XZPSEGVKC2PJ	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP7HKC4ZANP3R2B9Q61Y6X	prodopt_01M6GP7HKBEXE5BNYSFJTP0W83	optval_01M6GP7HJEQJZQW14NENYM1N53	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP7HKC3X1B8XNQBG9T2RDF	prodopt_01M6GP7HKBEXE5BNYSFJTP0W83	optval_01M6GP7HJEC0D6DZR9C6P38H9N	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP7HKC8P0B30K553K63ETV	prodopt_01M6GP7HKBEXE5BNYSFJTP0W83	optval_01M6GP7HJENY968858A8MZBKKG	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP7HKCCF04F74XHDHKZHGJ	prodopt_01M6GP7HKB0T16FJNEGARZ6Y59	optval_01M6GP7HJEYS33XZPSEGVKC2PJ	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP7HKCKB7QZH5QDC8GS89D	prodopt_01M6GP7HKB0T16FJNEGARZ6Y59	optval_01M6GP7HJEQJZQW14NENYM1N53	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP7HKCTPVYRV0WSDH1086X	prodopt_01M6GP7HKB0T16FJNEGARZ6Y59	optval_01M6GP7HJEC0D6DZR9C6P38H9N	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP7HKCSZ19FJ4QSHE5AMX4	prodopt_01M6GP7HKB0T16FJNEGARZ6Y59	optval_01M6GP7HJENY968858A8MZBKKG	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP7HKCN62Q55BYNYQQAXK8	prodopt_01M6GP7HKBTFX7KKQWGM74N9J3	optval_01M6GP7HJEYS33XZPSEGVKC2PJ	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP7HKCD2EFDVSE6HB1F9BJ	prodopt_01M6GP7HKBTFX7KKQWGM74N9J3	optval_01M6GP7HJEQJZQW14NENYM1N53	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP7HKCN9DG93YSPFVFHRPV	prodopt_01M6GP7HKBTFX7KKQWGM74N9J3	optval_01M6GP7HJEC0D6DZR9C6P38H9N	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP7HKCFBNH4W1W399C3P5B	prodopt_01M6GP7HKBTFX7KKQWGM74N9J3	optval_01M6GP7HJENY968858A8MZBKKG	2026-11-03 12:30:33.069+00	2026-11-03 12:30:33.069+00	\N
prodoptval_01M6GP9DNHHCQ4VQXCQNR459P9	prodopt_01M6GP9DNHGQ9E9VN053C5ZQVV	optval_01M6GP9DMZB82G2KPHK9DR55RY	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNHJ8HPVB8K3FMKFNA7	prodopt_01M6GP9DNHGQ9E9VN053C5ZQVV	optval_01M6GP9DMZ01YYDXDPPNAV4EYS	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNHYHHXXJJTHDBRS1FE	prodopt_01M6GP9DNHGQ9E9VN053C5ZQVV	optval_01M6GP9DMZ0TNCHV4E1HKRGS58	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNH2C9CMV6ZH7VCY0NK	prodopt_01M6GP9DNHGQ9E9VN053C5ZQVV	optval_01M6GP9DMZMESX1FBNV2VZ8RZQ	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNHH92YVRCJH6MQ4A8B	prodopt_01M6GP9DNHQNR64QD5NRB47BBC	optval_01M6GP9DMZW8H99JB4D5Q1EW4M	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNHXFHRFSAW31ATVPAP	prodopt_01M6GP9DNHQNR64QD5NRB47BBC	optval_01M6GP9DMZ5593AG7FWH79PB43	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNHTJHVD47WC4ZGFPRB	prodopt_01M6GP9DNHQNR64QD5NRB47BBC	optval_01M6GP9DMZH49ZGDY3FM9NDFSB	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNH7TZ8XVFVGNTK02V7	prodopt_01M6GP9DNHQNR64QD5NRB47BBC	optval_01M6GP9DMZ4BJ962AMC593QGBQ	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNHJ02WTGP75AKHJD44	prodopt_01M6GP9DNHB2G4J6K0S4NXHJ5X	optval_01M6GP9DMZVVK3QDY61BEFGJEV	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNHQHQRR36TZSQBC5M4	prodopt_01M6GP9DNHB2G4J6K0S4NXHJ5X	optval_01M6GP9DMZKHNZC7NERQTRSB57	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNHPA3A1XGYWPHN24JQ	prodopt_01M6GP9DNHB2G4J6K0S4NXHJ5X	optval_01M6GP9DMZDFQYP25F2T106PSG	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNHQZ4TH476RS07F8ZX	prodopt_01M6GP9DNHB2G4J6K0S4NXHJ5X	optval_01M6GP9DMZNP08D3HH872SWXJD	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNHEZ2Z2C8FDAKKANBC	prodopt_01M6GP9DNHB2G4J6K0S4NXHJ5X	optval_01M6GP9DMZ2ZM6VRRZX9EWAQQZ	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNJZGAX6ZAK8WAW6JFQ	prodopt_01M6GP9DNHG2N3S8QB8V4JJ00W	optval_01M6GP9DN0NFBD86FGAWZQZ96F	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNJT2VVTC3CY5MK3V84	prodopt_01M6GP9DNHG2N3S8QB8V4JJ00W	optval_01M6GP9DN0MBJSZ2PF8DKRGMNC	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNJAGA84T2864KTP3F0	prodopt_01M6GP9DNHG2N3S8QB8V4JJ00W	optval_01M6GP9DN051GT1RD69BMZ0HKA	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNJ1XET4MCCZ3NT1S3D	prodopt_01M6GP9DNHG2N3S8QB8V4JJ00W	optval_01M6GP9DMZ9ZFNMZ4S9VEQTQWG	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNJKPKHTHP68HB2YNK4	prodopt_01M6GP9DNHY60XFPFC1JN3E5VH	optval_01M6GP9DN02H2R2P87ABRXBE2S	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNJ4MXRMVAD0QWQPF6Q	prodopt_01M6GP9DNHQ3WWMR7D8YKYPMER	optval_01M6GP9DN0X48HPN4S2VYYYDYF	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
prodoptval_01M6GP9DNJAJC598GTQ6P3XSK7	prodopt_01M6GP9DNHQ3WWMR7D8YKYPMER	optval_01M6GP9DN0NSZ0C7DJ83HGBMP6	2026-11-03 12:31:34.578+00	2026-11-03 12:31:34.578+00	\N
\.


--
-- Data for Name: product_sales_channel; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product_sales_channel (product_id, sales_channel_id, id, created_at, updated_at, deleted_at) FROM stdin;
prod_01M6GP7HK3N0KX01F0CHPQZB4J	sc_01M6GP7HBXGBAJ70C7ZFYX8RV9	prodsc_01M6GP7HMV1QWFX83PHTW2N3ED	2026-11-03 12:30:33.11363+00	2026-11-03 12:30:33.11363+00	\N
prod_01M6GP7HK38KNM15QBV8KMYP2Z	sc_01M6GP7HBXGBAJ70C7ZFYX8RV9	prodsc_01M6GP7HMVPPTFZ3N84MV9P2SE	2026-11-03 12:30:33.11363+00	2026-11-03 12:30:33.11363+00	\N
prod_01M6GP7HK3CYBGS7DDY58J8XD5	sc_01M6GP7HBXGBAJ70C7ZFYX8RV9	prodsc_01M6GP7HMVGY7SF5SX2WS8JVTB	2026-11-03 12:30:33.11363+00	2026-11-03 12:30:33.11363+00	\N
prod_01M6GP7HK3J69S3YARJ8W2P4W1	sc_01M6GP7HBXGBAJ70C7ZFYX8RV9	prodsc_01M6GP7HMVEQXYZ92Q1RHH6CT8	2026-11-03 12:30:33.11363+00	2026-11-03 12:30:33.11363+00	\N
prod_01M6GP9DMYQ1Z62JTV01V1BGT2	sc_01M6GP7HBXGBAJ70C7ZFYX8RV9	prodsc_01M6GP9DPJCBVP8827QD5PA0FP	2026-11-03 12:31:34.609405+00	2026-11-03 12:31:34.609405+00	\N
prod_01M6GP9DMYEQV47FQGQ8Z09FB0	sc_01M6GP7HBXGBAJ70C7ZFYX8RV9	prodsc_01M6GP9DPKEK5EGVMJNDGDC4SX	2026-11-03 12:31:34.609405+00	2026-11-03 12:31:34.609405+00	\N
prod_01M6GP9DMYJAAWWCA3CZC6548Y	sc_01M6GP7HBXGBAJ70C7ZFYX8RV9	prodsc_01M6GP9DPKAK0DRBMEERGC6CPA	2026-11-03 12:31:34.609405+00	2026-11-03 12:31:34.609405+00	\N
\.


--
-- Data for Name: product_shipping_profile; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product_shipping_profile (product_id, shipping_profile_id, id, created_at, updated_at, deleted_at) FROM stdin;
prod_01M6GP7HK3N0KX01F0CHPQZB4J	sp_01M6GP7HABVA2E552YNW2NQJHP	prodsp_01M6GP7HN4NPEQW6WKXFKJKW3Z	2026-11-03 12:30:33.122733+00	2026-11-03 12:30:33.122733+00	\N
prod_01M6GP7HK38KNM15QBV8KMYP2Z	sp_01M6GP7HABVA2E552YNW2NQJHP	prodsp_01M6GP7HN4VCE907G0P6SHD7TT	2026-11-03 12:30:33.122733+00	2026-11-03 12:30:33.122733+00	\N
prod_01M6GP7HK3CYBGS7DDY58J8XD5	sp_01M6GP7HABVA2E552YNW2NQJHP	prodsp_01M6GP7HN4QRYZDYCRVRBJ49X0	2026-11-03 12:30:33.122733+00	2026-11-03 12:30:33.122733+00	\N
prod_01M6GP7HK3J69S3YARJ8W2P4W1	sp_01M6GP7HABVA2E552YNW2NQJHP	prodsp_01M6GP7HN42NSWWMV47CT6PDMQ	2026-11-03 12:30:33.122733+00	2026-11-03 12:30:33.122733+00	\N
prod_01M6GP9DMYQ1Z62JTV01V1BGT2	sp_01M6GP7HABVA2E552YNW2NQJHP	prodsp_01M6GP9DPT6VZ7T75AR5E4VH63	2026-11-03 12:31:34.617468+00	2026-11-03 12:31:34.617468+00	\N
prod_01M6GP9DMYEQV47FQGQ8Z09FB0	sp_01M6GP7HABVA2E552YNW2NQJHP	prodsp_01M6GP9DPTCTFZ1TJHR0ZFW25N	2026-11-03 12:31:34.617468+00	2026-11-03 12:31:34.617468+00	\N
prod_01M6GP9DMYJAAWWCA3CZC6548Y	sp_01M6GP7HABVA2E552YNW2NQJHP	prodsp_01M6GP9DPVGW0225H1KQN9438Y	2026-11-03 12:31:34.617468+00	2026-11-03 12:31:34.617468+00	\N
\.


--
-- Data for Name: product_tag; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product_tag (id, value, metadata, created_at, updated_at, deleted_at, external_id) FROM stdin;
\.


--
-- Data for Name: product_tags; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product_tags (product_id, product_tag_id) FROM stdin;
\.


--
-- Data for Name: product_type; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product_type (id, value, metadata, created_at, updated_at, deleted_at, external_id) FROM stdin;
\.


--
-- Data for Name: product_variant; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product_variant (id, title, sku, barcode, ean, upc, allow_backorder, manage_inventory, hs_code, origin_country, mid_code, material, weight, length, height, width, metadata, variant_rank, product_id, created_at, updated_at, deleted_at, thumbnail) FROM stdin;
variant_01M6GP7HNG7RKSDHRCXX29NFQQ	S / Black	SHIRT-S-BLACK	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK3N0KX01F0CHPQZB4J	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNGW3PX07W8469Z86V8	S / White	SHIRT-S-WHITE	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK3N0KX01F0CHPQZB4J	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNG6CY2AERD26JE3ZM5	M / Black	SHIRT-M-BLACK	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK3N0KX01F0CHPQZB4J	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNGQ6CMW3WJB0R4CGGJ	M / White	SHIRT-M-WHITE	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK3N0KX01F0CHPQZB4J	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNG4VSHDXQ35J2TGTMR	L / Black	SHIRT-L-BLACK	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK3N0KX01F0CHPQZB4J	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNH9F52A4BV4RQAWPXM	L / White	SHIRT-L-WHITE	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK3N0KX01F0CHPQZB4J	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNHDPKX4BS24KDFBF25	XL / Black	SHIRT-XL-BLACK	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK3N0KX01F0CHPQZB4J	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNHG118ZYT1A09WPHGK	XL / White	SHIRT-XL-WHITE	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK3N0KX01F0CHPQZB4J	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNHBMPHTMHZPG2MCZMN	S	SWEATSHIRT-S	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK38KNM15QBV8KMYP2Z	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNH2WFZ52QFR0A1WRR9	M	SWEATSHIRT-M	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK38KNM15QBV8KMYP2Z	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNHZJYQYQ483XAH0WTF	L	SWEATSHIRT-L	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK38KNM15QBV8KMYP2Z	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNHEA0M32QAJH45TBBC	XL	SWEATSHIRT-XL	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK38KNM15QBV8KMYP2Z	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNHBB26NMMGRPDZWSSC	S	SWEATPANTS-S	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK3CYBGS7DDY58J8XD5	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNHDF83Z0R72W0KHVDP	M	SWEATPANTS-M	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK3CYBGS7DDY58J8XD5	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNH2AMCYGMTQPZRBQB1	L	SWEATPANTS-L	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK3CYBGS7DDY58J8XD5	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNHRHQT5445DE1QTBVM	XL	SWEATPANTS-XL	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK3CYBGS7DDY58J8XD5	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNHSD5FS1JXSHR28VDW	S	SHORTS-S	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK3J69S3YARJ8W2P4W1	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNHPSPP99JJSCP9X5QG	M	SHORTS-M	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK3J69S3YARJ8W2P4W1	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNH9AKMYE819957KGK3	L	SHORTS-L	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK3J69S3YARJ8W2P4W1	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP7HNHPDXY71MY728VFDKK	XL	SHORTS-XL	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP7HK3J69S3YARJ8W2P4W1	2026-11-03 12:30:33.138+00	2026-11-03 12:30:33.138+00	\N	\N
variant_01M6GP9DQ4F5XRJ4WMEZJ7GZ9W	Siyah / S	NZM-TSH-BLK-S	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	2026-11-03 12:31:34.629+00	2026-11-03 12:31:34.629+00	\N	\N
variant_01M6GP9DQ49SWWRSEJMG74SM35	Siyah / M	NZM-TSH-BLK-M	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	2026-11-03 12:31:34.629+00	2026-11-03 12:31:34.629+00	\N	\N
variant_01M6GP9DQ46KD0999Z1V1GBGDH	Siyah / L	NZM-TSH-BLK-L	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	2026-11-03 12:31:34.629+00	2026-11-03 12:31:34.629+00	\N	\N
variant_01M6GP9DQ4ADS2AHTYQH22HF4N	Siyah / XL	NZM-TSH-BLK-XL	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	2026-11-03 12:31:34.629+00	2026-11-03 12:31:34.629+00	\N	\N
variant_01M6GP9DQ4Z1H04813MGEPDBGN	Beyaz / S	NZM-TSH-WHT-S	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	2026-11-03 12:31:34.629+00	2026-11-03 12:31:34.629+00	\N	\N
variant_01M6GP9DQ4GTDCK055QDAS0KVZ	Beyaz / M	NZM-TSH-WHT-M	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	2026-11-03 12:31:34.629+00	2026-11-03 12:31:34.629+00	\N	\N
variant_01M6GP9DQ4R1777N9VNMC48BGM	Beyaz / L	NZM-TSH-WHT-L	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	2026-11-03 12:31:34.629+00	2026-11-03 12:31:34.629+00	\N	\N
variant_01M6GP9DQ52EZXQHGHJMEYXB8Q	Antrasit / M	NZM-TSH-ANT-M	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	2026-11-03 12:31:34.629+00	2026-11-03 12:31:34.629+00	\N	\N
variant_01M6GP9DQ53RHEAX5JS0PMM25C	Antrasit / L	NZM-TSH-ANT-L	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	2026-11-03 12:31:34.629+00	2026-11-03 12:31:34.629+00	\N	\N
variant_01M6GP9DQ51YF4V7KYRA8P7ZSQ	Siyah / S	NZM-HD-CUST-BLK-S	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP9DMYEQV47FQGQ8Z09FB0	2026-11-03 12:31:34.629+00	2026-11-03 12:31:34.629+00	\N	\N
variant_01M6GP9DQ5XJ8X3ZKZ08HV2RR7	Siyah / M	NZM-HD-CUST-BLK-M	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP9DMYEQV47FQGQ8Z09FB0	2026-11-03 12:31:34.629+00	2026-11-03 12:31:34.629+00	\N	\N
variant_01M6GP9DQ534H2YQ1B8Z7XJ608	Siyah / L	NZM-HD-CUST-BLK-L	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP9DMYEQV47FQGQ8Z09FB0	2026-11-03 12:31:34.629+00	2026-11-03 12:31:34.629+00	\N	\N
variant_01M6GP9DQ5HEEVKH6M3WQ2WV8R	Antrasit / M	NZM-HD-CUST-ANT-M	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP9DMYEQV47FQGQ8Z09FB0	2026-11-03 12:31:34.629+00	2026-11-03 12:31:34.629+00	\N	\N
variant_01M6GP9DQ5B1G91MFR7S2KMXMV	Antrasit / L	NZM-HD-CUST-ANT-L	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP9DMYEQV47FQGQ8Z09FB0	2026-11-03 12:31:34.629+00	2026-11-03 12:31:34.629+00	\N	\N
variant_01M6GP9DQ53N02E734JCKBS6FQ	Ham Ekru / Standart	NZM-BAG-EKR-STD	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP9DMYJAAWWCA3CZC6548Y	2026-11-03 12:31:34.629+00	2026-11-03 12:31:34.629+00	\N	\N
variant_01M6GP9DQ5VTHQ116E4N86QPAP	Siyah / Standart	NZM-BAG-BLK-STD	\N	\N	\N	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	prod_01M6GP9DMYJAAWWCA3CZC6548Y	2026-11-03 12:31:34.629+00	2026-11-03 12:31:34.629+00	\N	\N
\.


--
-- Data for Name: product_variant_inventory_item; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product_variant_inventory_item (variant_id, inventory_item_id, id, required_quantity, created_at, updated_at, deleted_at) FROM stdin;
variant_01M6GP7HNG7RKSDHRCXX29NFQQ	iitem_01M6GP7HP4WACGZB5N27BQGY36	pvitem_01M6GP7HPMTEC9HZF9APJ4ZQ5W	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNGW3PX07W8469Z86V8	iitem_01M6GP7HP48BGA50BFAWA1Z3TF	pvitem_01M6GP7HPMNXVA3R02B6883R1V	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNG6CY2AERD26JE3ZM5	iitem_01M6GP7HP4XYAK7NH6SATC0HSS	pvitem_01M6GP7HPMZXQH9QB1407HXC3Q	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNGQ6CMW3WJB0R4CGGJ	iitem_01M6GP7HP49FPP396XDKQ3JVXQ	pvitem_01M6GP7HPMNTEXQ74EPQWEKMT4	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNG4VSHDXQ35J2TGTMR	iitem_01M6GP7HP4B4PST8CEDNF9G6W6	pvitem_01M6GP7HPMXK47ZGD5TWSJ1DMN	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNH9F52A4BV4RQAWPXM	iitem_01M6GP7HP44P9N3K76A3EBFJ1X	pvitem_01M6GP7HPMAV5KDVBZY69K90QS	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNHDPKX4BS24KDFBF25	iitem_01M6GP7HP4Y322A5HRDK8Y5R4V	pvitem_01M6GP7HPMPBFRQW355YTNJ9BG	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNHG118ZYT1A09WPHGK	iitem_01M6GP7HP45BC91V3RXPR3K4E1	pvitem_01M6GP7HPMEKWQEK5SCYRB2G98	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNHBMPHTMHZPG2MCZMN	iitem_01M6GP7HP4FEVAQH2NASJDT4DY	pvitem_01M6GP7HPMCNMB0R859G8111CH	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNH2WFZ52QFR0A1WRR9	iitem_01M6GP7HP4AF46Z0AED3Q8SE6S	pvitem_01M6GP7HPMGD4RK1V6Z60W5JPZ	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNHZJYQYQ483XAH0WTF	iitem_01M6GP7HP4QVM6VGRDRYH4AE1Q	pvitem_01M6GP7HPMAH1JRHZXCCYKSGX2	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNHEA0M32QAJH45TBBC	iitem_01M6GP7HP4E4C1PG63G49VFRWJ	pvitem_01M6GP7HPMRTA68E6E9BDE07BF	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNHBB26NMMGRPDZWSSC	iitem_01M6GP7HP4F1NNYR13ZHD0Z8DR	pvitem_01M6GP7HPNQCPEXFX480Y70VMK	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNHDF83Z0R72W0KHVDP	iitem_01M6GP7HP4NDQ60FA1CXSKDSEC	pvitem_01M6GP7HPNDEJKGXMZNNX29XQ1	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNH2AMCYGMTQPZRBQB1	iitem_01M6GP7HP5NM093AR0QBYQ5R5K	pvitem_01M6GP7HPN57BKAT1CWZ300G3T	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNHRHQT5445DE1QTBVM	iitem_01M6GP7HP5V7JF00C8MABHKP8Z	pvitem_01M6GP7HPNCHEVFX65AHE18W4F	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNHSD5FS1JXSHR28VDW	iitem_01M6GP7HP5S160QR50QVW8188H	pvitem_01M6GP7HPN25YWCYKKJP7KRZFB	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNHPSPP99JJSCP9X5QG	iitem_01M6GP7HP5XXK3HNP46APPBZNB	pvitem_01M6GP7HPNEQ9ZBNSXM121TZD7	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNH9AKMYE819957KGK3	iitem_01M6GP7HP5VB01G83ZCGJRSFM3	pvitem_01M6GP7HPN0C7C8703JVKYCXZH	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP7HNHPDXY71MY728VFDKK	iitem_01M6GP7HP5VYGVAP0TZNQ6VR00	pvitem_01M6GP7HPN1XHTXECXAYGYQAXK	1	2026-11-03 12:30:33.170487+00	2026-11-03 12:30:33.170487+00	\N
variant_01M6GP9DQ4F5XRJ4WMEZJ7GZ9W	iitem_01M6GP9DQKXGYRBK1AFREBZ5M6	pvitem_01M6GP9DQXSKXJDVQF2M2PX9K1	1	2026-11-03 12:31:34.652409+00	2026-11-03 12:31:34.652409+00	\N
variant_01M6GP9DQ49SWWRSEJMG74SM35	iitem_01M6GP9DQK6XCD7D6QZC9E2CKG	pvitem_01M6GP9DQXTSEWWK7SQEHY492Y	1	2026-11-03 12:31:34.652409+00	2026-11-03 12:31:34.652409+00	\N
variant_01M6GP9DQ46KD0999Z1V1GBGDH	iitem_01M6GP9DQKNJ2NCQ8BPNGMX99E	pvitem_01M6GP9DQX4059MVRW0BV5RZ83	1	2026-11-03 12:31:34.652409+00	2026-11-03 12:31:34.652409+00	\N
variant_01M6GP9DQ4ADS2AHTYQH22HF4N	iitem_01M6GP9DQKMFJT43G560H3J3ZA	pvitem_01M6GP9DQXW44B4RHWEJ0W78ZE	1	2026-11-03 12:31:34.652409+00	2026-11-03 12:31:34.652409+00	\N
variant_01M6GP9DQ4Z1H04813MGEPDBGN	iitem_01M6GP9DQKEG39RTD1R5YVM2K5	pvitem_01M6GP9DQX6X1J7V5JBE7T4R9G	1	2026-11-03 12:31:34.652409+00	2026-11-03 12:31:34.652409+00	\N
variant_01M6GP9DQ4GTDCK055QDAS0KVZ	iitem_01M6GP9DQKS2XBB6FR0XSACK83	pvitem_01M6GP9DQXF740ZT7MJTM4ANKW	1	2026-11-03 12:31:34.652409+00	2026-11-03 12:31:34.652409+00	\N
variant_01M6GP9DQ4R1777N9VNMC48BGM	iitem_01M6GP9DQK31VWV9A3KP28FE27	pvitem_01M6GP9DQYG4CPCDEDYHQ9EJ7H	1	2026-11-03 12:31:34.652409+00	2026-11-03 12:31:34.652409+00	\N
variant_01M6GP9DQ52EZXQHGHJMEYXB8Q	iitem_01M6GP9DQKS0VYFTPPEQ9JY64F	pvitem_01M6GP9DQYWCJHNQF0N5GVST0P	1	2026-11-03 12:31:34.652409+00	2026-11-03 12:31:34.652409+00	\N
variant_01M6GP9DQ53RHEAX5JS0PMM25C	iitem_01M6GP9DQK1W9FAT9YYKWDSP19	pvitem_01M6GP9DQY0YQZR9BKF4CQPR0W	1	2026-11-03 12:31:34.652409+00	2026-11-03 12:31:34.652409+00	\N
variant_01M6GP9DQ51YF4V7KYRA8P7ZSQ	iitem_01M6GP9DQK8AHG7R7VJJSDEZXH	pvitem_01M6GP9DQYZFN9KCA567YYZ2P8	1	2026-11-03 12:31:34.652409+00	2026-11-03 12:31:34.652409+00	\N
variant_01M6GP9DQ5XJ8X3ZKZ08HV2RR7	iitem_01M6GP9DQMV0JCTGKK092G7K56	pvitem_01M6GP9DQYNP4KAEZ6RNMAFPH3	1	2026-11-03 12:31:34.652409+00	2026-11-03 12:31:34.652409+00	\N
variant_01M6GP9DQ534H2YQ1B8Z7XJ608	iitem_01M6GP9DQMFX074EZXKJDTNEB5	pvitem_01M6GP9DQYEARCKJTTMZDXZREW	1	2026-11-03 12:31:34.652409+00	2026-11-03 12:31:34.652409+00	\N
variant_01M6GP9DQ5HEEVKH6M3WQ2WV8R	iitem_01M6GP9DQMFVGY4BMJFCSWYEGK	pvitem_01M6GP9DQYAPQ44PNM8H597Z56	1	2026-11-03 12:31:34.652409+00	2026-11-03 12:31:34.652409+00	\N
variant_01M6GP9DQ5B1G91MFR7S2KMXMV	iitem_01M6GP9DQMTX0FEKSS3CST6V80	pvitem_01M6GP9DQY8ER587JX3DRR25SS	1	2026-11-03 12:31:34.652409+00	2026-11-03 12:31:34.652409+00	\N
variant_01M6GP9DQ53N02E734JCKBS6FQ	iitem_01M6GP9DQMS1E4W968YE3K0ZQ7	pvitem_01M6GP9DQY4THPZES7QBEPTQ70	1	2026-11-03 12:31:34.652409+00	2026-11-03 12:31:34.652409+00	\N
variant_01M6GP9DQ5VTHQ116E4N86QPAP	iitem_01M6GP9DQM8N7CXJFG4CXV0V2Z	pvitem_01M6GP9DQY56CG7BDDQ7DFG2J4	1	2026-11-03 12:31:34.652409+00	2026-11-03 12:31:34.652409+00	\N
\.


--
-- Data for Name: product_variant_option; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product_variant_option (variant_id, option_value_id) FROM stdin;
variant_01M6GP7HNG7RKSDHRCXX29NFQQ	optval_01M6GP7HJEC0D6DZR9C6P38H9N
variant_01M6GP7HNG7RKSDHRCXX29NFQQ	optval_01M6GP7HJF39PQX2FWXHGDVJXP
variant_01M6GP7HNGW3PX07W8469Z86V8	optval_01M6GP7HJEC0D6DZR9C6P38H9N
variant_01M6GP7HNGW3PX07W8469Z86V8	optval_01M6GP7HJF9MQS3NYGTB686QC1
variant_01M6GP7HNG6CY2AERD26JE3ZM5	optval_01M6GP7HJEQJZQW14NENYM1N53
variant_01M6GP7HNG6CY2AERD26JE3ZM5	optval_01M6GP7HJF39PQX2FWXHGDVJXP
variant_01M6GP7HNGQ6CMW3WJB0R4CGGJ	optval_01M6GP7HJEQJZQW14NENYM1N53
variant_01M6GP7HNGQ6CMW3WJB0R4CGGJ	optval_01M6GP7HJF9MQS3NYGTB686QC1
variant_01M6GP7HNG4VSHDXQ35J2TGTMR	optval_01M6GP7HJEYS33XZPSEGVKC2PJ
variant_01M6GP7HNG4VSHDXQ35J2TGTMR	optval_01M6GP7HJF39PQX2FWXHGDVJXP
variant_01M6GP7HNH9F52A4BV4RQAWPXM	optval_01M6GP7HJEYS33XZPSEGVKC2PJ
variant_01M6GP7HNH9F52A4BV4RQAWPXM	optval_01M6GP7HJF9MQS3NYGTB686QC1
variant_01M6GP7HNHDPKX4BS24KDFBF25	optval_01M6GP7HJENY968858A8MZBKKG
variant_01M6GP7HNHDPKX4BS24KDFBF25	optval_01M6GP7HJF39PQX2FWXHGDVJXP
variant_01M6GP7HNHG118ZYT1A09WPHGK	optval_01M6GP7HJENY968858A8MZBKKG
variant_01M6GP7HNHG118ZYT1A09WPHGK	optval_01M6GP7HJF9MQS3NYGTB686QC1
variant_01M6GP7HNHBMPHTMHZPG2MCZMN	optval_01M6GP7HJEC0D6DZR9C6P38H9N
variant_01M6GP7HNH2WFZ52QFR0A1WRR9	optval_01M6GP7HJEQJZQW14NENYM1N53
variant_01M6GP7HNHZJYQYQ483XAH0WTF	optval_01M6GP7HJEYS33XZPSEGVKC2PJ
variant_01M6GP7HNHEA0M32QAJH45TBBC	optval_01M6GP7HJENY968858A8MZBKKG
variant_01M6GP7HNHBB26NMMGRPDZWSSC	optval_01M6GP7HJEC0D6DZR9C6P38H9N
variant_01M6GP7HNHDF83Z0R72W0KHVDP	optval_01M6GP7HJEQJZQW14NENYM1N53
variant_01M6GP7HNH2AMCYGMTQPZRBQB1	optval_01M6GP7HJEYS33XZPSEGVKC2PJ
variant_01M6GP7HNHRHQT5445DE1QTBVM	optval_01M6GP7HJENY968858A8MZBKKG
variant_01M6GP7HNHSD5FS1JXSHR28VDW	optval_01M6GP7HJEC0D6DZR9C6P38H9N
variant_01M6GP7HNHPSPP99JJSCP9X5QG	optval_01M6GP7HJEQJZQW14NENYM1N53
variant_01M6GP7HNH9AKMYE819957KGK3	optval_01M6GP7HJEYS33XZPSEGVKC2PJ
variant_01M6GP7HNHPDXY71MY728VFDKK	optval_01M6GP7HJENY968858A8MZBKKG
variant_01M6GP9DQ4F5XRJ4WMEZJ7GZ9W	optval_01M6GP9DMZ0TNCHV4E1HKRGS58
variant_01M6GP9DQ4F5XRJ4WMEZJ7GZ9W	optval_01M6GP9DMZ4BJ962AMC593QGBQ
variant_01M6GP9DQ49SWWRSEJMG74SM35	optval_01M6GP9DMZ01YYDXDPPNAV4EYS
variant_01M6GP9DQ49SWWRSEJMG74SM35	optval_01M6GP9DMZ4BJ962AMC593QGBQ
variant_01M6GP9DQ46KD0999Z1V1GBGDH	optval_01M6GP9DMZB82G2KPHK9DR55RY
variant_01M6GP9DQ46KD0999Z1V1GBGDH	optval_01M6GP9DMZ4BJ962AMC593QGBQ
variant_01M6GP9DQ4ADS2AHTYQH22HF4N	optval_01M6GP9DMZMESX1FBNV2VZ8RZQ
variant_01M6GP9DQ4ADS2AHTYQH22HF4N	optval_01M6GP9DMZ4BJ962AMC593QGBQ
variant_01M6GP9DQ4Z1H04813MGEPDBGN	optval_01M6GP9DMZ0TNCHV4E1HKRGS58
variant_01M6GP9DQ4Z1H04813MGEPDBGN	optval_01M6GP9DMZH49ZGDY3FM9NDFSB
variant_01M6GP9DQ4GTDCK055QDAS0KVZ	optval_01M6GP9DMZ01YYDXDPPNAV4EYS
variant_01M6GP9DQ4GTDCK055QDAS0KVZ	optval_01M6GP9DMZH49ZGDY3FM9NDFSB
variant_01M6GP9DQ4R1777N9VNMC48BGM	optval_01M6GP9DMZB82G2KPHK9DR55RY
variant_01M6GP9DQ4R1777N9VNMC48BGM	optval_01M6GP9DMZH49ZGDY3FM9NDFSB
variant_01M6GP9DQ52EZXQHGHJMEYXB8Q	optval_01M6GP9DMZ01YYDXDPPNAV4EYS
variant_01M6GP9DQ52EZXQHGHJMEYXB8Q	optval_01M6GP9DMZW8H99JB4D5Q1EW4M
variant_01M6GP9DQ53RHEAX5JS0PMM25C	optval_01M6GP9DMZB82G2KPHK9DR55RY
variant_01M6GP9DQ53RHEAX5JS0PMM25C	optval_01M6GP9DMZW8H99JB4D5Q1EW4M
variant_01M6GP9DQ51YF4V7KYRA8P7ZSQ	optval_01M6GP9DMZNP08D3HH872SWXJD
variant_01M6GP9DQ51YF4V7KYRA8P7ZSQ	optval_01M6GP9DMZ9ZFNMZ4S9VEQTQWG
variant_01M6GP9DQ5XJ8X3ZKZ08HV2RR7	optval_01M6GP9DMZDFQYP25F2T106PSG
variant_01M6GP9DQ5XJ8X3ZKZ08HV2RR7	optval_01M6GP9DMZ9ZFNMZ4S9VEQTQWG
variant_01M6GP9DQ534H2YQ1B8Z7XJ608	optval_01M6GP9DMZKHNZC7NERQTRSB57
variant_01M6GP9DQ534H2YQ1B8Z7XJ608	optval_01M6GP9DMZ9ZFNMZ4S9VEQTQWG
variant_01M6GP9DQ5HEEVKH6M3WQ2WV8R	optval_01M6GP9DMZDFQYP25F2T106PSG
variant_01M6GP9DQ5HEEVKH6M3WQ2WV8R	optval_01M6GP9DN0NFBD86FGAWZQZ96F
variant_01M6GP9DQ5B1G91MFR7S2KMXMV	optval_01M6GP9DMZKHNZC7NERQTRSB57
variant_01M6GP9DQ5B1G91MFR7S2KMXMV	optval_01M6GP9DN0NFBD86FGAWZQZ96F
variant_01M6GP9DQ53N02E734JCKBS6FQ	optval_01M6GP9DN02H2R2P87ABRXBE2S
variant_01M6GP9DQ53N02E734JCKBS6FQ	optval_01M6GP9DN0X48HPN4S2VYYYDYF
variant_01M6GP9DQ5VTHQ116E4N86QPAP	optval_01M6GP9DN02H2R2P87ABRXBE2S
variant_01M6GP9DQ5VTHQ116E4N86QPAP	optval_01M6GP9DN0NSZ0C7DJ83HGBMP6
\.


--
-- Data for Name: product_variant_price_set; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product_variant_price_set (variant_id, price_set_id, id, created_at, updated_at, deleted_at) FROM stdin;
variant_01M6GP7HNG7RKSDHRCXX29NFQQ	pset_01M6GP7HPZKYQMPKNE50E3AKDM	pvps_01M6GP7HQSQF681RA0M4QDFPYS	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNGW3PX07W8469Z86V8	pset_01M6GP7HPZCGS5MB65PDRK99VA	pvps_01M6GP7HQT5T735RJ7G7GC1P9N	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNG6CY2AERD26JE3ZM5	pset_01M6GP7HPZAMKEANXTYBXCEZNZ	pvps_01M6GP7HQT922CB0WBMZEB3XVH	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNGQ6CMW3WJB0R4CGGJ	pset_01M6GP7HPZAQJPVPHT1345YWEF	pvps_01M6GP7HQT47W2H3BX6JHF3CJ4	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNG4VSHDXQ35J2TGTMR	pset_01M6GP7HPZD8XM9J5686EXN526	pvps_01M6GP7HQTDE4YV0RYFGT7YX5E	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNH9F52A4BV4RQAWPXM	pset_01M6GP7HQ098ET8ED1KF6J2S0R	pvps_01M6GP7HQTATPEQX12DMWFPGDF	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNHDPKX4BS24KDFBF25	pset_01M6GP7HQ0VCQNWRG0JMBTPXYV	pvps_01M6GP7HQTAQSPJVEK4RYNAE87	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNHG118ZYT1A09WPHGK	pset_01M6GP7HQ0TZ735P984GHXD4GH	pvps_01M6GP7HQT63PA7ATH3ERRHN57	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNHBMPHTMHZPG2MCZMN	pset_01M6GP7HQ0TAP41X47D9WRQJ0F	pvps_01M6GP7HQT2HJ1ADHHFHXB8YKD	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNH2WFZ52QFR0A1WRR9	pset_01M6GP7HQ0VBS1K66VPA959G9G	pvps_01M6GP7HQTQH90BYB0PYDTPYEK	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNHZJYQYQ483XAH0WTF	pset_01M6GP7HQ0K7D8PRYCZ04H71B3	pvps_01M6GP7HQT04BMRXDSMTFPR3AN	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNHEA0M32QAJH45TBBC	pset_01M6GP7HQ0YEV84D97BW2FZVY5	pvps_01M6GP7HQT81MRRB43XFKHMG1T	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNHBB26NMMGRPDZWSSC	pset_01M6GP7HQ0H6W1SACQ25NSYMDH	pvps_01M6GP7HQT75TK01AMN252113K	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNHDF83Z0R72W0KHVDP	pset_01M6GP7HQ0QB2DZJS3ACDV37FN	pvps_01M6GP7HQTBTS1CP8RGSYSA13P	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNH2AMCYGMTQPZRBQB1	pset_01M6GP7HQ1WKX79RA15NGGHXQ5	pvps_01M6GP7HQTEKMZ57K8HSTTJJHY	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNHRHQT5445DE1QTBVM	pset_01M6GP7HQ1PHQ7D4NN0VSDX06K	pvps_01M6GP7HQTF3QWN4QD2FSNS2YA	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNHSD5FS1JXSHR28VDW	pset_01M6GP7HQ195JGDA66GQRA28RN	pvps_01M6GP7HQT8R74Y3AB78P7WC9Z	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNHPSPP99JJSCP9X5QG	pset_01M6GP7HQ1NA7ZDQM3JF1QX9NH	pvps_01M6GP7HQTBCYWYCRC7AX3AH2Z	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNH9AKMYE819957KGK3	pset_01M6GP7HQ1EJSX4ZZEZ021E8JD	pvps_01M6GP7HQT5YYBJKRTWPX3TW2R	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP7HNHPDXY71MY728VFDKK	pset_01M6GP7HQ1J9KH96S4RDN58K40	pvps_01M6GP7HQTFJG6FFKNSDP3H87Q	2026-11-03 12:30:33.208104+00	2026-11-03 12:30:33.208104+00	\N
variant_01M6GP9DQ4F5XRJ4WMEZJ7GZ9W	pset_01M6GP9DR3ABVFMACVB7RMF1ST	pvps_01M6GP9DRVMTDN7N56Q7WRR4W8	2026-11-03 12:31:34.681829+00	2026-11-03 12:31:34.681829+00	\N
variant_01M6GP9DQ49SWWRSEJMG74SM35	pset_01M6GP9DR3ERMA9ADPGZKT9589	pvps_01M6GP9DRVFN0WYYWFCMNESABE	2026-11-03 12:31:34.681829+00	2026-11-03 12:31:34.681829+00	\N
variant_01M6GP9DQ46KD0999Z1V1GBGDH	pset_01M6GP9DR3XQPVNDWXN3YS6VA3	pvps_01M6GP9DRVQGV85XTQ08B5FT46	2026-11-03 12:31:34.681829+00	2026-11-03 12:31:34.681829+00	\N
variant_01M6GP9DQ4ADS2AHTYQH22HF4N	pset_01M6GP9DR46KS338702B88SXQY	pvps_01M6GP9DRV61TG65M0QTABS5Z7	2026-11-03 12:31:34.681829+00	2026-11-03 12:31:34.681829+00	\N
variant_01M6GP9DQ4Z1H04813MGEPDBGN	pset_01M6GP9DR4PBTRMXNK8FAXW0AG	pvps_01M6GP9DRV4JQCNNJF0318JB47	2026-11-03 12:31:34.681829+00	2026-11-03 12:31:34.681829+00	\N
variant_01M6GP9DQ4GTDCK055QDAS0KVZ	pset_01M6GP9DR4M6Q8EM6Y53JPNZ42	pvps_01M6GP9DRVYYYG6TA8FTWF58JH	2026-11-03 12:31:34.681829+00	2026-11-03 12:31:34.681829+00	\N
variant_01M6GP9DQ4R1777N9VNMC48BGM	pset_01M6GP9DR4KX96EY1V1MYGZFV8	pvps_01M6GP9DRVAVXC2FF3K27X1P25	2026-11-03 12:31:34.681829+00	2026-11-03 12:31:34.681829+00	\N
variant_01M6GP9DQ52EZXQHGHJMEYXB8Q	pset_01M6GP9DR4GKV9T39J2YDYZF40	pvps_01M6GP9DRVJZDBXNE6TNDQMP67	2026-11-03 12:31:34.681829+00	2026-11-03 12:31:34.681829+00	\N
variant_01M6GP9DQ53RHEAX5JS0PMM25C	pset_01M6GP9DR4CSJQ4AAC2ADP8ZK2	pvps_01M6GP9DRVW45G1F4ZC5FFPD42	2026-11-03 12:31:34.681829+00	2026-11-03 12:31:34.681829+00	\N
variant_01M6GP9DQ51YF4V7KYRA8P7ZSQ	pset_01M6GP9DR4R2MBWJ9ST3A34FZC	pvps_01M6GP9DRVCJHJDHA71JEYVA2Y	2026-11-03 12:31:34.681829+00	2026-11-03 12:31:34.681829+00	\N
variant_01M6GP9DQ5XJ8X3ZKZ08HV2RR7	pset_01M6GP9DR40AAYHVCF4MFXMYT0	pvps_01M6GP9DRVJ5PWB22CS292RZBX	2026-11-03 12:31:34.681829+00	2026-11-03 12:31:34.681829+00	\N
variant_01M6GP9DQ534H2YQ1B8Z7XJ608	pset_01M6GP9DR4FQS18P3GZ2WAAA8G	pvps_01M6GP9DRVFM4BHE1YEC6V7ZQ8	2026-11-03 12:31:34.681829+00	2026-11-03 12:31:34.681829+00	\N
variant_01M6GP9DQ5HEEVKH6M3WQ2WV8R	pset_01M6GP9DR4N4VPGNPNDGQ4Q07B	pvps_01M6GP9DRV29B808D4B23NJBQB	2026-11-03 12:31:34.681829+00	2026-11-03 12:31:34.681829+00	\N
variant_01M6GP9DQ5B1G91MFR7S2KMXMV	pset_01M6GP9DR4V1C2D58TYB1EE1DK	pvps_01M6GP9DRV7SBJT5CK68K89Q5R	2026-11-03 12:31:34.681829+00	2026-11-03 12:31:34.681829+00	\N
variant_01M6GP9DQ53N02E734JCKBS6FQ	pset_01M6GP9DR5777F1RE3SJX41H9T	pvps_01M6GP9DRV4KWD2VPC164GWEWH	2026-11-03 12:31:34.681829+00	2026-11-03 12:31:34.681829+00	\N
variant_01M6GP9DQ5VTHQ116E4N86QPAP	pset_01M6GP9DR5KSXW7DBTDMBRS2W9	pvps_01M6GP9DRVQZWSX9CXVAMKTVH3	2026-11-03 12:31:34.681829+00	2026-11-03 12:31:34.681829+00	\N
\.


--
-- Data for Name: product_variant_product_image; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.product_variant_product_image (id, variant_id, image_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: promotion; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.promotion (id, code, campaign_id, is_automatic, type, created_at, updated_at, deleted_at, status, is_tax_inclusive, "limit", used, metadata) FROM stdin;
\.


--
-- Data for Name: promotion_application_method; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.promotion_application_method (id, value, raw_value, max_quantity, apply_to_quantity, buy_rules_min_quantity, type, target_type, allocation, promotion_id, created_at, updated_at, deleted_at, currency_code) FROM stdin;
\.


--
-- Data for Name: promotion_campaign; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.promotion_campaign (id, name, description, campaign_identifier, starts_at, ends_at, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: promotion_campaign_budget; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.promotion_campaign_budget (id, type, campaign_id, "limit", raw_limit, used, raw_used, created_at, updated_at, deleted_at, currency_code, attribute) FROM stdin;
\.


--
-- Data for Name: promotion_campaign_budget_usage; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.promotion_campaign_budget_usage (id, attribute_value, used, budget_id, raw_used, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: promotion_promotion_rule; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.promotion_promotion_rule (promotion_id, promotion_rule_id) FROM stdin;
\.


--
-- Data for Name: promotion_rule; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.promotion_rule (id, description, attribute, operator, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: promotion_rule_value; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.promotion_rule_value (id, promotion_rule_id, value, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: property_label; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.property_label (id, entity, property, label, description, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: provider_identity; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.provider_identity (id, entity_id, provider, auth_identity_id, user_metadata, provider_metadata, created_at, updated_at, deleted_at) FROM stdin;
01M6GP85KDT7F747FQ99W94V5H	admin@nizamlarbaski.com	emailpass	authid_01M6GP85KE5ZP3H0AVNGQWV039	\N	{"password": "c2NyeXB0AA8AAAAIAAAAAdAnZfNoyzhAL0yWvem07Yzl7Gr+ep8HZJUiTwNWPEtYBSse+s9fphKnsXtjs03Wo5NIs8L7Xak1gfS++3CexN9RSI2YIPPucbMgeoQn+3qm"}	2026-11-03 12:30:53.55+00	2026-11-03 12:30:53.55+00	\N
\.


--
-- Data for Name: publishable_api_key_sales_channel; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.publishable_api_key_sales_channel (publishable_key_id, sales_channel_id, id, created_at, updated_at, deleted_at) FROM stdin;
apk_01M6GP7HC3KGW8V9SJSRZDPH19	sc_01M6GP7HBXGBAJ70C7ZFYX8RV9	pksc_01M6GP7HCB3KG7435WX39M5MKX	2026-11-03 12:30:32.841841+00	2026-11-03 12:30:32.841841+00	\N
\.


--
-- Data for Name: refund; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.refund (id, amount, raw_amount, payment_id, created_at, updated_at, deleted_at, created_by, metadata, refund_reason_id, note, status, idempotency_key) FROM stdin;
\.


--
-- Data for Name: refund_reason; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.refund_reason (id, label, description, metadata, created_at, updated_at, deleted_at, code) FROM stdin;
refr_01M6GP7AGBRXQVF7V7BPH7GSQ2	Shipping Issue	Refund due to lost, delayed, or misdelivered shipment	\N	2026-11-03 12:30:25.717055+00	2026-11-03 12:30:25.717055+00	\N	shipping_issue
refr_01M6GP7AGB1Z8REKEAVXGBD21Z	Customer Care Adjustment	Refund given as goodwill or compensation for inconvenience	\N	2026-11-03 12:30:25.717055+00	2026-11-03 12:30:25.717055+00	\N	customer_care_adjustment
refr_01M6GP7AGBRKKGJK82A4X9VSQ8	Pricing Error	Refund to correct an overcharge, missing discount, or incorrect price	\N	2026-11-03 12:30:25.717055+00	2026-11-03 12:30:25.717055+00	\N	pricing_error
\.


--
-- Data for Name: region; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.region (id, name, currency_code, metadata, created_at, updated_at, deleted_at, automatic_taxes) FROM stdin;
reg_01M6GP7HD4B30BY9RYEMWPEC9Q	Europe	eur	{"free_returns": false, "shipping_rate": 10, "transit_days_max": 3, "transit_days_min": 2, "handling_days_max": 1, "handling_days_min": 0, "return_window_days": 30}	2026-11-03 12:30:32.872+00	2026-11-03 12:30:32.872+00	\N	t
reg_01M6GP9DKF11TP8BQSB5Q3EF53	Türkiye	try	{"free_returns": false, "shipping_rate": 75, "transit_days_max": 3, "transit_days_min": 1, "handling_days_max": 3, "handling_days_min": 1, "return_window_days": 14}	2026-11-03 12:31:34.514+00	2026-11-03 12:31:34.514+00	\N	t
\.


--
-- Data for Name: region_country; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.region_country (iso_2, iso_3, num_code, name, display_name, region_id, metadata, created_at, updated_at, deleted_at) FROM stdin;
af	afg	004	AFGHANISTAN	Afghanistan	\N	\N	2026-11-03 12:30:29.426+00	2026-11-03 12:30:29.426+00	\N
al	alb	008	ALBANIA	Albania	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
dz	dza	012	ALGERIA	Algeria	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
as	asm	016	AMERICAN SAMOA	American Samoa	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ad	and	020	ANDORRA	Andorra	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ao	ago	024	ANGOLA	Angola	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ai	aia	660	ANGUILLA	Anguilla	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
aq	ata	010	ANTARCTICA	Antarctica	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ag	atg	028	ANTIGUA AND BARBUDA	Antigua and Barbuda	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ar	arg	032	ARGENTINA	Argentina	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
am	arm	051	ARMENIA	Armenia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
aw	abw	533	ARUBA	Aruba	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
au	aus	036	AUSTRALIA	Australia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
at	aut	040	AUSTRIA	Austria	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
az	aze	031	AZERBAIJAN	Azerbaijan	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
bs	bhs	044	BAHAMAS	Bahamas	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
bh	bhr	048	BAHRAIN	Bahrain	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
bd	bgd	050	BANGLADESH	Bangladesh	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
bb	brb	052	BARBADOS	Barbados	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
by	blr	112	BELARUS	Belarus	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
be	bel	056	BELGIUM	Belgium	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
bz	blz	084	BELIZE	Belize	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
bj	ben	204	BENIN	Benin	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
bm	bmu	060	BERMUDA	Bermuda	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
bt	btn	064	BHUTAN	Bhutan	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
bo	bol	068	BOLIVIA	Bolivia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
bq	bes	535	BONAIRE, SINT EUSTATIUS AND SABA	Bonaire, Sint Eustatius and Saba	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ba	bih	070	BOSNIA AND HERZEGOVINA	Bosnia and Herzegovina	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
bw	bwa	072	BOTSWANA	Botswana	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
bv	bvd	074	BOUVET ISLAND	Bouvet Island	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
br	bra	076	BRAZIL	Brazil	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
io	iot	086	BRITISH INDIAN OCEAN TERRITORY	British Indian Ocean Territory	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
bn	brn	096	BRUNEI DARUSSALAM	Brunei Darussalam	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
bg	bgr	100	BULGARIA	Bulgaria	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
bf	bfa	854	BURKINA FASO	Burkina Faso	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
bi	bdi	108	BURUNDI	Burundi	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
kh	khm	116	CAMBODIA	Cambodia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
cm	cmr	120	CAMEROON	Cameroon	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ca	can	124	CANADA	Canada	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
cv	cpv	132	CAPE VERDE	Cape Verde	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ky	cym	136	CAYMAN ISLANDS	Cayman Islands	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
cf	caf	140	CENTRAL AFRICAN REPUBLIC	Central African Republic	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
td	tcd	148	CHAD	Chad	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
cl	chl	152	CHILE	Chile	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
cn	chn	156	CHINA	China	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
cx	cxr	162	CHRISTMAS ISLAND	Christmas Island	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
cc	cck	166	COCOS (KEELING) ISLANDS	Cocos (Keeling) Islands	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
co	col	170	COLOMBIA	Colombia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
km	com	174	COMOROS	Comoros	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
cg	cog	178	CONGO	Congo	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
cd	cod	180	CONGO, THE DEMOCRATIC REPUBLIC OF THE	Congo, the Democratic Republic of the	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ck	cok	184	COOK ISLANDS	Cook Islands	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
cr	cri	188	COSTA RICA	Costa Rica	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ci	civ	384	COTE D'IVOIRE	Cote D'Ivoire	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
hr	hrv	191	CROATIA	Croatia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
cu	cub	192	CUBA	Cuba	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
cw	cuw	531	CURAÇAO	Curaçao	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
cy	cyp	196	CYPRUS	Cyprus	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
cz	cze	203	CZECH REPUBLIC	Czech Republic	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
dj	dji	262	DJIBOUTI	Djibouti	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
dm	dma	212	DOMINICA	Dominica	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
do	dom	214	DOMINICAN REPUBLIC	Dominican Republic	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ec	ecu	218	ECUADOR	Ecuador	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
eg	egy	818	EGYPT	Egypt	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
sv	slv	222	EL SALVADOR	El Salvador	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
gq	gnq	226	EQUATORIAL GUINEA	Equatorial Guinea	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
er	eri	232	ERITREA	Eritrea	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ee	est	233	ESTONIA	Estonia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
et	eth	231	ETHIOPIA	Ethiopia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
fk	flk	238	FALKLAND ISLANDS (MALVINAS)	Falkland Islands (Malvinas)	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
fo	fro	234	FAROE ISLANDS	Faroe Islands	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
fj	fji	242	FIJI	Fiji	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
fi	fin	246	FINLAND	Finland	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
gf	guf	254	FRENCH GUIANA	French Guiana	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
pf	pyf	258	FRENCH POLYNESIA	French Polynesia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
tf	atf	260	FRENCH SOUTHERN TERRITORIES	French Southern Territories	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ga	gab	266	GABON	Gabon	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
gm	gmb	270	GAMBIA	Gambia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ge	geo	268	GEORGIA	Georgia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
gh	gha	288	GHANA	Ghana	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
gi	gib	292	GIBRALTAR	Gibraltar	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
gr	grc	300	GREECE	Greece	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
gl	grl	304	GREENLAND	Greenland	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
gd	grd	308	GRENADA	Grenada	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
gp	glp	312	GUADELOUPE	Guadeloupe	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
gu	gum	316	GUAM	Guam	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
gt	gtm	320	GUATEMALA	Guatemala	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
gg	ggy	831	GUERNSEY	Guernsey	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
gn	gin	324	GUINEA	Guinea	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
gw	gnb	624	GUINEA-BISSAU	Guinea-Bissau	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
gy	guy	328	GUYANA	Guyana	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ht	hti	332	HAITI	Haiti	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
hm	hmd	334	HEARD ISLAND AND MCDONALD ISLANDS	Heard Island And Mcdonald Islands	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
va	vat	336	HOLY SEE (VATICAN CITY STATE)	Holy See (Vatican City State)	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
hn	hnd	340	HONDURAS	Honduras	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
hk	hkg	344	HONG KONG	Hong Kong	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
hu	hun	348	HUNGARY	Hungary	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
is	isl	352	ICELAND	Iceland	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
in	ind	356	INDIA	India	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
id	idn	360	INDONESIA	Indonesia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ir	irn	364	IRAN, ISLAMIC REPUBLIC OF	Iran, Islamic Republic of	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
iq	irq	368	IRAQ	Iraq	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ie	irl	372	IRELAND	Ireland	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
im	imn	833	ISLE OF MAN	Isle Of Man	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
il	isr	376	ISRAEL	Israel	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
jm	jam	388	JAMAICA	Jamaica	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
jp	jpn	392	JAPAN	Japan	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
je	jey	832	JERSEY	Jersey	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
jo	jor	400	JORDAN	Jordan	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
kz	kaz	398	KAZAKHSTAN	Kazakhstan	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ke	ken	404	KENYA	Kenya	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ki	kir	296	KIRIBATI	Kiribati	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
kp	prk	408	KOREA, DEMOCRATIC PEOPLE'S REPUBLIC OF	Korea, Democratic People's Republic of	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
kr	kor	410	KOREA, REPUBLIC OF	Korea, Republic of	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
xk	xkx	900	KOSOVO	Kosovo	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
kw	kwt	414	KUWAIT	Kuwait	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
kg	kgz	417	KYRGYZSTAN	Kyrgyzstan	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
la	lao	418	LAO PEOPLE'S DEMOCRATIC REPUBLIC	Lao People's Democratic Republic	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
lv	lva	428	LATVIA	Latvia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
lb	lbn	422	LEBANON	Lebanon	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ls	lso	426	LESOTHO	Lesotho	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
lr	lbr	430	LIBERIA	Liberia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ly	lby	434	LIBYA	Libya	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
li	lie	438	LIECHTENSTEIN	Liechtenstein	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
lt	ltu	440	LITHUANIA	Lithuania	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
lu	lux	442	LUXEMBOURG	Luxembourg	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
mo	mac	446	MACAO	Macao	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
mg	mdg	450	MADAGASCAR	Madagascar	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
mw	mwi	454	MALAWI	Malawi	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
my	mys	458	MALAYSIA	Malaysia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
mv	mdv	462	MALDIVES	Maldives	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ml	mli	466	MALI	Mali	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
mt	mlt	470	MALTA	Malta	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
mh	mhl	584	MARSHALL ISLANDS	Marshall Islands	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
mq	mtq	474	MARTINIQUE	Martinique	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
mr	mrt	478	MAURITANIA	Mauritania	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
mu	mus	480	MAURITIUS	Mauritius	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
yt	myt	175	MAYOTTE	Mayotte	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
mx	mex	484	MEXICO	Mexico	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
fm	fsm	583	MICRONESIA, FEDERATED STATES OF	Micronesia, Federated States of	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
md	mda	498	MOLDOVA, REPUBLIC OF	Moldova, Republic of	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
mc	mco	492	MONACO	Monaco	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
mn	mng	496	MONGOLIA	Mongolia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
me	mne	499	MONTENEGRO	Montenegro	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ms	msr	500	MONTSERRAT	Montserrat	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ma	mar	504	MOROCCO	Morocco	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
mz	moz	508	MOZAMBIQUE	Mozambique	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
mm	mmr	104	MYANMAR	Myanmar	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
na	nam	516	NAMIBIA	Namibia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
nr	nru	520	NAURU	Nauru	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
np	npl	524	NEPAL	Nepal	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
nl	nld	528	NETHERLANDS	Netherlands	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
nc	ncl	540	NEW CALEDONIA	New Caledonia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
nz	nzl	554	NEW ZEALAND	New Zealand	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ni	nic	558	NICARAGUA	Nicaragua	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ne	ner	562	NIGER	Niger	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ng	nga	566	NIGERIA	Nigeria	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
nu	niu	570	NIUE	Niue	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
nf	nfk	574	NORFOLK ISLAND	Norfolk Island	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
mk	mkd	807	NORTH MACEDONIA	North Macedonia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
mp	mnp	580	NORTHERN MARIANA ISLANDS	Northern Mariana Islands	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
no	nor	578	NORWAY	Norway	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
om	omn	512	OMAN	Oman	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
pk	pak	586	PAKISTAN	Pakistan	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
pw	plw	585	PALAU	Palau	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ps	pse	275	PALESTINIAN TERRITORY, OCCUPIED	Palestinian Territory, Occupied	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
pa	pan	591	PANAMA	Panama	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
pg	png	598	PAPUA NEW GUINEA	Papua New Guinea	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
py	pry	600	PARAGUAY	Paraguay	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
pe	per	604	PERU	Peru	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ph	phl	608	PHILIPPINES	Philippines	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
pn	pcn	612	PITCAIRN	Pitcairn	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
pl	pol	616	POLAND	Poland	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
pt	prt	620	PORTUGAL	Portugal	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
pr	pri	630	PUERTO RICO	Puerto Rico	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
qa	qat	634	QATAR	Qatar	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
re	reu	638	REUNION	Reunion	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ro	rom	642	ROMANIA	Romania	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ru	rus	643	RUSSIAN FEDERATION	Russian Federation	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
rw	rwa	646	RWANDA	Rwanda	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
bl	blm	652	SAINT BARTHÉLEMY	Saint Barthélemy	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
sh	shn	654	SAINT HELENA	Saint Helena	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
kn	kna	659	SAINT KITTS AND NEVIS	Saint Kitts and Nevis	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
lc	lca	662	SAINT LUCIA	Saint Lucia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
mf	maf	663	SAINT MARTIN (FRENCH PART)	Saint Martin (French part)	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
pm	spm	666	SAINT PIERRE AND MIQUELON	Saint Pierre and Miquelon	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
vc	vct	670	SAINT VINCENT AND THE GRENADINES	Saint Vincent and the Grenadines	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ws	wsm	882	SAMOA	Samoa	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
sm	smr	674	SAN MARINO	San Marino	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
st	stp	678	SAO TOME AND PRINCIPE	Sao Tome and Principe	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
sa	sau	682	SAUDI ARABIA	Saudi Arabia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
sn	sen	686	SENEGAL	Senegal	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
rs	srb	688	SERBIA	Serbia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
sc	syc	690	SEYCHELLES	Seychelles	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
sl	sle	694	SIERRA LEONE	Sierra Leone	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
sg	sgp	702	SINGAPORE	Singapore	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
sx	sxm	534	SINT MAARTEN	Sint Maarten	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
sk	svk	703	SLOVAKIA	Slovakia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
si	svn	705	SLOVENIA	Slovenia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
sb	slb	090	SOLOMON ISLANDS	Solomon Islands	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
so	som	706	SOMALIA	Somalia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
za	zaf	710	SOUTH AFRICA	South Africa	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
gs	sgs	239	SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS	South Georgia and the South Sandwich Islands	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ss	ssd	728	SOUTH SUDAN	South Sudan	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
lk	lka	144	SRI LANKA	Sri Lanka	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
sd	sdn	729	SUDAN	Sudan	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
sr	sur	740	SURINAME	Suriname	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
sj	sjm	744	SVALBARD AND JAN MAYEN	Svalbard and Jan Mayen	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
sz	swz	748	SWAZILAND	Swaziland	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ch	che	756	SWITZERLAND	Switzerland	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
sy	syr	760	SYRIAN ARAB REPUBLIC	Syrian Arab Republic	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
tw	twn	158	TAIWAN, PROVINCE OF CHINA	Taiwan, Province of China	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
tj	tjk	762	TAJIKISTAN	Tajikistan	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
tz	tza	834	TANZANIA, UNITED REPUBLIC OF	Tanzania, United Republic of	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
th	tha	764	THAILAND	Thailand	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
tl	tls	626	TIMOR LESTE	Timor Leste	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
tg	tgo	768	TOGO	Togo	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
tk	tkl	772	TOKELAU	Tokelau	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
to	ton	776	TONGA	Tonga	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
tt	tto	780	TRINIDAD AND TOBAGO	Trinidad and Tobago	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
tn	tun	788	TUNISIA	Tunisia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
tm	tkm	795	TURKMENISTAN	Turkmenistan	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
tc	tca	796	TURKS AND CAICOS ISLANDS	Turks and Caicos Islands	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
tv	tuv	798	TUVALU	Tuvalu	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ug	uga	800	UGANDA	Uganda	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ua	ukr	804	UKRAINE	Ukraine	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ae	are	784	UNITED ARAB EMIRATES	United Arab Emirates	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
us	usa	840	UNITED STATES	United States	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
um	umi	581	UNITED STATES MINOR OUTLYING ISLANDS	United States Minor Outlying Islands	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
uy	ury	858	URUGUAY	Uruguay	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
uz	uzb	860	UZBEKISTAN	Uzbekistan	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
vu	vut	548	VANUATU	Vanuatu	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ve	ven	862	VENEZUELA	Venezuela	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
vn	vnm	704	VIET NAM	Viet Nam	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
vg	vgb	092	VIRGIN ISLANDS, BRITISH	Virgin Islands, British	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
vi	vir	850	VIRGIN ISLANDS, U.S.	Virgin Islands, U.S.	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
wf	wlf	876	WALLIS AND FUTUNA	Wallis and Futuna	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
eh	esh	732	WESTERN SAHARA	Western Sahara	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ye	yem	887	YEMEN	Yemen	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
zm	zmb	894	ZAMBIA	Zambia	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
zw	zwe	716	ZIMBABWE	Zimbabwe	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
ax	ala	248	ÅLAND ISLANDS	Åland Islands	\N	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:29.427+00	\N
dk	dnk	208	DENMARK	Denmark	reg_01M6GP7HD4B30BY9RYEMWPEC9Q	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:32.873+00	\N
fr	fra	250	FRANCE	France	reg_01M6GP7HD4B30BY9RYEMWPEC9Q	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:32.873+00	\N
de	deu	276	GERMANY	Germany	reg_01M6GP7HD4B30BY9RYEMWPEC9Q	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:32.873+00	\N
it	ita	380	ITALY	Italy	reg_01M6GP7HD4B30BY9RYEMWPEC9Q	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:32.873+00	\N
es	esp	724	SPAIN	Spain	reg_01M6GP7HD4B30BY9RYEMWPEC9Q	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:32.873+00	\N
se	swe	752	SWEDEN	Sweden	reg_01M6GP7HD4B30BY9RYEMWPEC9Q	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:32.873+00	\N
gb	gbr	826	UNITED KINGDOM	United Kingdom	reg_01M6GP7HD4B30BY9RYEMWPEC9Q	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:30:32.873+00	\N
tr	tur	792	TURKEY	Turkey	reg_01M6GP9DKF11TP8BQSB5Q3EF53	\N	2026-11-03 12:30:29.427+00	2026-11-03 12:31:34.514+00	\N
\.


--
-- Data for Name: region_payment_provider; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.region_payment_provider (region_id, payment_provider_id, id, created_at, updated_at, deleted_at) FROM stdin;
reg_01M6GP7HD4B30BY9RYEMWPEC9Q	pp_system_default	regpp_01M6GP7HDP43FXA2Q26YH7BRVG	2026-11-03 12:30:32.884513+00	2026-11-03 12:30:32.884513+00	\N
reg_01M6GP9DKF11TP8BQSB5Q3EF53	pp_system_default	regpp_01M6GP9DKVWHFT2ZDT0GD035HH	2026-11-03 12:31:34.522658+00	2026-11-03 12:31:34.522658+00	\N
\.


--
-- Data for Name: reservation_item; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.reservation_item (id, created_at, updated_at, deleted_at, line_item_id, location_id, quantity, external_id, description, created_by, metadata, inventory_item_id, allow_backorder, raw_quantity) FROM stdin;
\.


--
-- Data for Name: return; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.return (id, order_id, claim_id, exchange_id, order_version, display_id, status, no_notification, refund_amount, raw_refund_amount, metadata, created_at, updated_at, deleted_at, received_at, canceled_at, location_id, requested_at, created_by) FROM stdin;
\.


--
-- Data for Name: return_fulfillment; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.return_fulfillment (return_id, fulfillment_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: return_item; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.return_item (id, return_id, reason_id, item_id, quantity, raw_quantity, received_quantity, raw_received_quantity, note, metadata, created_at, updated_at, deleted_at, damaged_quantity, raw_damaged_quantity) FROM stdin;
\.


--
-- Data for Name: return_reason; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.return_reason (id, value, label, description, metadata, parent_return_reason_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: sales_channel; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.sales_channel (id, name, description, is_disabled, metadata, created_at, updated_at, deleted_at) FROM stdin;
sc_01M6GP7HBXGBAJ70C7ZFYX8RV9	Default Sales Channel	Created by Medusa	f	\N	2026-11-03 12:30:32.829+00	2026-11-03 12:30:32.829+00	\N
\.


--
-- Data for Name: sales_channel_stock_location; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.sales_channel_stock_location (sales_channel_id, stock_location_id, id, created_at, updated_at, deleted_at) FROM stdin;
sc_01M6GP7HBXGBAJ70C7ZFYX8RV9	sloc_01M6GP7HE6PXEXG9R0YVGDM48M	scloc_01M6GP7HHN5SFEAGRR7VQZWJM6	2026-11-03 12:30:33.012104+00	2026-11-03 12:30:33.012104+00	\N
sc_01M6GP7HBXGBAJ70C7ZFYX8RV9	sloc_01M6GP9DMABX8XJDS92E9N0B05	scloc_01M6GP9DMGKFM2ZDY8W4Z45V85	2026-11-03 12:31:34.54302+00	2026-11-03 12:31:34.54302+00	\N
\.


--
-- Data for Name: script_migrations; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.script_migrations (id, script_name, created_at, finished_at) FROM stdin;
1	backfill-refund-status.js	2026-11-03 12:30:31.411805+00	2026-11-03 12:30:31.423883+00
2	migrate-normalize-currency-codes-normalization.js	2026-11-03 12:30:31.431385+00	2026-11-03 12:30:31.447573+00
3	migrate-product-option-link-ids.js	2026-11-03 12:30:31.451228+00	2026-11-03 12:30:31.453811+00
4	migrate-product-shipping-profile.js	2026-11-03 12:30:32.764322+00	2026-11-03 12:30:32.784735+00
5	migrate-tax-region-provider.js	2026-11-03 12:30:32.788971+00	2026-11-03 12:30:32.794699+00
6	reconcile-inventory-reserved-quantity.js	2026-11-03 12:30:32.798513+00	2026-11-03 12:30:32.805952+00
7	initial-data-seed.ts	2026-11-03 12:30:32.823807+00	2026-11-03 12:30:33.236757+00
8	region-store-policies.ts	2026-11-03 12:30:33.24256+00	2026-11-03 12:30:33.245232+00
\.


--
-- Data for Name: search_index; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.search_index (id, name, created_at, updated_at, deleted_at, active_version) FROM stdin;
srhidx_01M6GP7E62C7P47TVS4B8NYXYP	product	2026-11-03 12:30:29.57+00	2026-11-03 12:38:40.236+00	\N	1
\.


--
-- Data for Name: search_index_sync; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.search_index_sync (id, job_id, status, filters, last_key, documents_synced, started_at, completed_at, error, search_index_version_id, created_at, updated_at, deleted_at, resumable) FROM stdin;
srhsync_01M6GPPD6AFEM01NYC5EFX7PF4	54ba8ca0-9918-4f25-84d2-557620e0cf37	done	\N	\N	0	2026-11-03 12:38:40.056+00	2026-11-03 12:38:40.193+00	\N	srhver_01M6GP7E64MX7ZNNCQA56T7MQT	2026-11-03 12:38:40.083+00	2026-11-03 12:38:40.2+00	\N	f
srhsync_01M6GPPCHZN7JQRJ3FJEE66XVT	54ba8ca0-9918-4f25-84d2-557620e0cf37	done	\N	prod_01M6GP9DMYQ1Z62JTV01V1BGT2	7	2026-11-03 12:38:39.273+00	2026-11-03 12:38:40.263+00	\N	srhver_01M6GP7E64MX7ZNNCQA56T7MQT	2026-11-03 12:38:39.424+00	2026-11-03 12:38:40.348+00	\N	f
\.


--
-- Data for Name: search_index_version; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.search_index_version (id, version, provider, physical_name, definition_hash, status, search_index_id, created_at, updated_at, deleted_at) FROM stdin;
srhver_01M6GP7E64MX7ZNNCQA56T7MQT	1	search-postgres	product_v1	324ab6ef68362abc058dc1b556ccf9f4	ready	srhidx_01M6GP7E62C7P47TVS4B8NYXYP	2026-11-03 12:30:29.572+00	2026-11-03 12:38:40.218+00	\N
\.


--
-- Data for Name: search_pg_product_v1; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.search_pg_product_v1 (id, document, indexed, search_vector, search_text, created_at, updated_at) FROM stdin;
prod_01M6GP7HK38KNM15QBV8KMYP2Z	{"id": "prod_01M6GP7HK38KNM15QBV8KMYP2Z", "title": "Medusa Sweatshirt", "handle": "sweatshirt", "labels": [], "status": "published", "category": ["Sweatshirts"], "thumbnail": "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png", "created_at": "2026-11-03T12:30:33.068Z", "description": "Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.", "on_sale_eur": false, "on_sale_usd": false, "max_price_eur": 10, "max_price_usd": 15, "min_price_eur": 10, "min_price_usd": 15, "option_values": ["Size:L", "Size:M", "Size:S", "Size:XL"], "sales_channel_ids": ["sc_01M6GP7HBXGBAJ70C7ZFYX8RV9"], "original_price_eur": 10, "original_price_usd": 15}	{"id": "prod_01M6GP7HK38KNM15QBV8KMYP2Z", "title": "Medusa Sweatshirt", "handle": "sweatshirt", "status": "published", "category": ["Sweatshirts"], "thumbnail": "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png", "created_at": 1793709033068, "description": "Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.", "on_sale_eur": false, "on_sale_usd": false, "max_price_eur": 10, "max_price_usd": 15, "min_price_eur": 10, "min_price_usd": 15, "option_values": ["Size:L", "Size:M", "Size:S", "Size:XL"], "sales_channel_ids": ["sc_01M6GP7HBXGBAJ70C7ZFYX8RV9"], "original_price_eur": 10, "original_price_usd": 15}	'classic':8 'cotton':12 'essenti':15 'everyday':14 'feel':5 'l':23B 'longer':17 'm':25B 'medusa':1A 'ordinari':21 'reimagin':3 'size':22B,24B,26B,28B 'sweatshirt':2A,9,13 'xl':29B	Medusa Sweatshirt Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary. Size:L Size:M Size:S Size:XL	2026-11-03 12:38:39.79098+00	2026-11-03 12:38:39.79098+00
prod_01M6GP7HK3CYBGS7DDY58J8XD5	{"id": "prod_01M6GP7HK3CYBGS7DDY58J8XD5", "title": "Medusa Sweatpants", "handle": "sweatpants", "labels": [], "status": "published", "category": ["Pants"], "thumbnail": "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png", "created_at": "2026-11-03T12:30:33.068Z", "description": "Reimagine the feeling of classic sweatpants. With our cotton sweatpants, everyday essentials no longer have to be ordinary.", "on_sale_eur": false, "on_sale_usd": false, "max_price_eur": 10, "max_price_usd": 15, "min_price_eur": 10, "min_price_usd": 15, "option_values": ["Size:L", "Size:M", "Size:S", "Size:XL"], "sales_channel_ids": ["sc_01M6GP7HBXGBAJ70C7ZFYX8RV9"], "original_price_eur": 10, "original_price_usd": 15}	{"id": "prod_01M6GP7HK3CYBGS7DDY58J8XD5", "title": "Medusa Sweatpants", "handle": "sweatpants", "status": "published", "category": ["Pants"], "thumbnail": "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png", "created_at": 1793709033068, "description": "Reimagine the feeling of classic sweatpants. With our cotton sweatpants, everyday essentials no longer have to be ordinary.", "on_sale_eur": false, "on_sale_usd": false, "max_price_eur": 10, "max_price_usd": 15, "min_price_eur": 10, "min_price_usd": 15, "option_values": ["Size:L", "Size:M", "Size:S", "Size:XL"], "sales_channel_ids": ["sc_01M6GP7HBXGBAJ70C7ZFYX8RV9"], "original_price_eur": 10, "original_price_usd": 15}	'classic':7 'cotton':11 'essenti':14 'everyday':13 'feel':5 'l':22B 'longer':16 'm':24B 'medusa':1A 'ordinari':20 'reimagin':3 'size':21B,23B,25B,27B 'sweatpant':2A,8,12 'xl':28B	Medusa Sweatpants Reimagine the feeling of classic sweatpants. With our cotton sweatpants, everyday essentials no longer have to be ordinary. Size:L Size:M Size:S Size:XL	2026-11-03 12:38:39.79098+00	2026-11-03 12:38:39.79098+00
prod_01M6GP7HK3J69S3YARJ8W2P4W1	{"id": "prod_01M6GP7HK3J69S3YARJ8W2P4W1", "title": "Medusa Shorts", "handle": "shorts", "labels": [], "status": "published", "category": ["Merch"], "thumbnail": "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png", "created_at": "2026-11-03T12:30:33.069Z", "description": "Reimagine the feeling of classic shorts. With our cotton shorts, everyday essentials no longer have to be ordinary.", "on_sale_eur": false, "on_sale_usd": false, "max_price_eur": 10, "max_price_usd": 15, "min_price_eur": 10, "min_price_usd": 15, "option_values": ["Size:L", "Size:M", "Size:S", "Size:XL"], "sales_channel_ids": ["sc_01M6GP7HBXGBAJ70C7ZFYX8RV9"], "original_price_eur": 10, "original_price_usd": 15}	{"id": "prod_01M6GP7HK3J69S3YARJ8W2P4W1", "title": "Medusa Shorts", "handle": "shorts", "status": "published", "category": ["Merch"], "thumbnail": "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png", "created_at": 1793709033069, "description": "Reimagine the feeling of classic shorts. With our cotton shorts, everyday essentials no longer have to be ordinary.", "on_sale_eur": false, "on_sale_usd": false, "max_price_eur": 10, "max_price_usd": 15, "min_price_eur": 10, "min_price_usd": 15, "option_values": ["Size:L", "Size:M", "Size:S", "Size:XL"], "sales_channel_ids": ["sc_01M6GP7HBXGBAJ70C7ZFYX8RV9"], "original_price_eur": 10, "original_price_usd": 15}	'classic':7 'cotton':11 'essenti':14 'everyday':13 'feel':5 'l':22B 'longer':16 'm':24B 'medusa':1A 'ordinari':20 'reimagin':3 'short':2A,8,12 'size':21B,23B,25B,27B 'xl':28B	Medusa Shorts Reimagine the feeling of classic shorts. With our cotton shorts, everyday essentials no longer have to be ordinary. Size:L Size:M Size:S Size:XL	2026-11-03 12:38:39.79098+00	2026-11-03 12:38:39.79098+00
prod_01M6GP7HK3N0KX01F0CHPQZB4J	{"id": "prod_01M6GP7HK3N0KX01F0CHPQZB4J", "title": "Medusa T-Shirt", "handle": "t-shirt", "labels": [], "status": "published", "category": ["Shirts"], "thumbnail": "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png", "created_at": "2026-11-03T12:30:33.068Z", "description": "Reimagine the feeling of a classic T-shirt. With our cotton T-shirts, everyday essentials no longer have to be ordinary.", "on_sale_eur": false, "on_sale_usd": false, "max_price_eur": 10, "max_price_usd": 15, "min_price_eur": 10, "min_price_usd": 15, "option_values": ["Size:L", "Size:M", "Size:S", "Size:XL", "Color:Black", "Color:White"], "sales_channel_ids": ["sc_01M6GP7HBXGBAJ70C7ZFYX8RV9"], "original_price_eur": 10, "original_price_usd": 15}	{"id": "prod_01M6GP7HK3N0KX01F0CHPQZB4J", "title": "Medusa T-Shirt", "handle": "t-shirt", "status": "published", "category": ["Shirts"], "thumbnail": "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png", "created_at": 1793709033068, "description": "Reimagine the feeling of a classic T-shirt. With our cotton T-shirts, everyday essentials no longer have to be ordinary.", "on_sale_eur": false, "on_sale_usd": false, "max_price_eur": 10, "max_price_usd": 15, "min_price_eur": 10, "min_price_usd": 15, "option_values": ["Size:L", "Size:M", "Size:S", "Size:XL", "Color:Black", "Color:White"], "sales_channel_ids": ["sc_01M6GP7HBXGBAJ70C7ZFYX8RV9"], "original_price_eur": 10, "original_price_usd": 15}	'black':37B 'classic':10 'color':36B,38B 'cotton':16 'essenti':21 'everyday':20 'feel':7 'l':29B 'longer':23 'm':31B 'medusa':1A 'ordinari':27 'reimagin':5 'shirt':4A,13,19 'size':28B,30B,32B,34B 't-shirt':2A,11,17 'white':39B 'xl':35B	Medusa T-Shirt Reimagine the feeling of a classic T-shirt. With our cotton T-shirts, everyday essentials no longer have to be ordinary. Size:L Size:M Size:S Size:XL Color:Black Color:White	2026-11-03 12:38:39.79098+00	2026-11-03 12:38:39.79098+00
prod_01M6GP9DMYEQV47FQGQ8Z09FB0	{"id": "prod_01M6GP9DMYEQV47FQGQ8Z09FB0", "title": "Özel Baskılı Kapüşonlu Sweatshirt (Hoodie)", "handle": "ozel-baskili-kapusonlu-sweatshirt-hoodie", "labels": [], "status": "published", "category": [], "thumbnail": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop", "created_at": "2026-11-03T12:31:34.560Z", "description": "320 GSM 3 İplik Şardonlu pamuk kumaş. Göğüs, sırt veya kol bölgesine kendi tasarımınızı yüksek çözünürlüklü DTF veya Serigrafi baskı tekniğiyle uygulayın.", "on_sale_usd": false, "max_price_usd": 28, "min_price_usd": 28, "option_values": ["Beden:2XL", "Beden:L", "Beden:M", "Beden:S", "Beden:XL", "Renk:Antrasit", "Renk:Ekru", "Renk:Haki", "Renk:Siyah"], "sales_channel_ids": ["sc_01M6GP7HBXGBAJ70C7ZFYX8RV9"], "original_price_usd": 28}	{"id": "prod_01M6GP9DMYEQV47FQGQ8Z09FB0", "title": "Özel Baskılı Kapüşonlu Sweatshirt (Hoodie)", "handle": "ozel-baskili-kapusonlu-sweatshirt-hoodie", "status": "published", "thumbnail": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop", "created_at": 1793709094560, "description": "320 GSM 3 İplik Şardonlu pamuk kumaş. Göğüs, sırt veya kol bölgesine kendi tasarımınızı yüksek çözünürlüklü DTF veya Serigrafi baskı tekniğiyle uygulayın.", "on_sale_usd": false, "max_price_usd": 28, "min_price_usd": 28, "option_values": ["Beden:2XL", "Beden:L", "Beden:M", "Beden:S", "Beden:XL", "Renk:Antrasit", "Renk:Ekru", "Renk:Haki", "Renk:Siyah"], "sales_channel_ids": ["sc_01M6GP7HBXGBAJ70C7ZFYX8RV9"], "original_price_usd": 28}	'2xl':29B '3':8 '320':6 'antrasit':39B 'baski':25 'baskili':2A 'beden':28B,30B,32B,34B,36B 'bolgesin':17 'cozunurluklu':21 'dtf':22 'ekru':41B 'gogus':13 'gsm':7 'haki':43B 'hoodi':5A 'iplik':9 'kapusonlu':3A 'kendi':18 'kol':16 'kuma':12 'l':31B 'm':33B 'ozel':1A 'pamuk':11 'renk':38B,40B,42B,44B 'sardonlu':10 'serigrafi':24 'sirt':14 'siyah':45B 'sweatshirt':4A 'tasariminizi':19 'teknigiyl':26 'uygulayin':27 'veya':15,23 'xl':37B 'yuksek':20	Özel Baskılı Kapüşonlu Sweatshirt (Hoodie) 320 GSM 3 İplik Şardonlu pamuk kumaş. Göğüs, sırt veya kol bölgesine kendi tasarımınızı yüksek çözünürlüklü DTF veya Serigrafi baskı tekniğiyle uygulayın. Beden:2XL Beden:L Beden:M Beden:S Beden:XL Renk:Antrasit Renk:Ekru Renk:Haki Renk:Siyah	2026-11-03 12:38:39.79098+00	2026-11-03 12:38:39.79098+00
prod_01M6GP9DMYJAAWWCA3CZC6548Y	{"id": "prod_01M6GP9DMYJAAWWCA3CZC6548Y", "title": "Özel Baskılı Kanvas Bez Çanta (Tote Bag)", "handle": "ozel-baskili-kanvas-bez-canta", "labels": [], "status": "published", "category": [], "thumbnail": "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1000&auto=format&fit=crop", "created_at": "2026-11-03T12:31:34.560Z", "description": "320 GSM %100 Ham Pamuk Kanvas Kumaş. 35x40 cm standart ölçü, uzun omuz askılı. Promosyon, marka ve etkinlikler için ideal.", "on_sale_usd": false, "max_price_usd": 7, "min_price_usd": 6, "option_values": ["Renk:Ham Ekru", "Renk:Siyah", "Boyut:Standart (35x40 cm)"], "sales_channel_ids": ["sc_01M6GP7HBXGBAJ70C7ZFYX8RV9"], "original_price_usd": 6}	{"id": "prod_01M6GP9DMYJAAWWCA3CZC6548Y", "title": "Özel Baskılı Kanvas Bez Çanta (Tote Bag)", "handle": "ozel-baskili-kanvas-bez-canta", "status": "published", "thumbnail": "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1000&auto=format&fit=crop", "created_at": 1793709094560, "description": "320 GSM %100 Ham Pamuk Kanvas Kumaş. 35x40 cm standart ölçü, uzun omuz askılı. Promosyon, marka ve etkinlikler için ideal.", "on_sale_usd": false, "max_price_usd": 7, "min_price_usd": 6, "option_values": ["Renk:Ham Ekru", "Renk:Siyah", "Boyut:Standart (35x40 cm)"], "sales_channel_ids": ["sc_01M6GP7HBXGBAJ70C7ZFYX8RV9"], "original_price_usd": 6}	'100':10 '320':8 '35x40':15,35B 'askili':21 'bag':7A 'baskili':2A 'bez':4A 'boyut':33B 'canta':5A 'cm':16,36B 'ekru':30B 'etkinlikl':25 'gsm':9 'ham':11,29B 'icin':26 'ideal':27 'kanva':3A,13 'kuma':14 'marka':23 'olcu':18 'omuz':20 'ozel':1A 'pamuk':12 'promosyon':22 'renk':28B,31B 'siyah':32B 'standart':17,34B 'tote':6A 'uzun':19 've':24	Özel Baskılı Kanvas Bez Çanta (Tote Bag) 320 GSM %100 Ham Pamuk Kanvas Kumaş. 35x40 cm standart ölçü, uzun omuz askılı. Promosyon, marka ve etkinlikler için ideal. Renk:Ham Ekru Renk:Siyah Boyut:Standart (35x40 cm)	2026-11-03 12:38:39.79098+00	2026-11-03 12:38:39.79098+00
prod_01M6GP9DMYQ1Z62JTV01V1BGT2	{"id": "prod_01M6GP9DMYQ1Z62JTV01V1BGT2", "title": "Premium Oversize Penye T-Shirt", "handle": "premium-oversize-penye-t-shirt", "labels": [], "status": "published", "category": [], "thumbnail": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop", "created_at": "2026-11-03T12:31:34.560Z", "description": "240 GSM %100 Pamuk, yumuşak tuşeli, birinci sınıf penye kumaş. Dayanıklı çift iğne dikiş ve fit kesim.", "on_sale_usd": false, "max_price_usd": 15, "min_price_usd": 15, "option_values": ["Beden:L", "Beden:M", "Beden:S", "Beden:XL", "Renk:Antrasit", "Renk:Bej", "Renk:Beyaz", "Renk:Siyah"], "sales_channel_ids": ["sc_01M6GP7HBXGBAJ70C7ZFYX8RV9"], "original_price_usd": 15}	{"id": "prod_01M6GP9DMYQ1Z62JTV01V1BGT2", "title": "Premium Oversize Penye T-Shirt", "handle": "premium-oversize-penye-t-shirt", "status": "published", "thumbnail": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop", "created_at": 1793709094560, "description": "240 GSM %100 Pamuk, yumuşak tuşeli, birinci sınıf penye kumaş. Dayanıklı çift iğne dikiş ve fit kesim.", "on_sale_usd": false, "max_price_usd": 15, "min_price_usd": 15, "option_values": ["Beden:L", "Beden:M", "Beden:S", "Beden:XL", "Renk:Antrasit", "Renk:Bej", "Renk:Beyaz", "Renk:Siyah"], "sales_channel_ids": ["sc_01M6GP7HBXGBAJ70C7ZFYX8RV9"], "original_price_usd": 15}	'100':9 '240':7 'antrasit':33B 'beden':24B,26B,28B,30B 'bej':35B 'beyaz':37B 'birinci':13 'cift':18 'dayanik':17 'diki':20 'fit':22 'gsm':8 'ign':19 'kesim':23 'kuma':16 'l':25B 'm':27B 'overs':2A 'pamuk':10 'peny':3A,15 'premium':1A 'renk':32B,34B,36B,38B 'shirt':6A 'sinif':14 'siyah':39B 't-shirt':4A 'tuse':12 've':21 'xl':31B 'yumusak':11	Premium Oversize Penye T-Shirt 240 GSM %100 Pamuk, yumuşak tuşeli, birinci sınıf penye kumaş. Dayanıklı çift iğne dikiş ve fit kesim. Beden:L Beden:M Beden:S Beden:XL Renk:Antrasit Renk:Bej Renk:Beyaz Renk:Siyah	2026-11-03 12:38:39.79098+00	2026-11-03 12:38:39.79098+00
\.


--
-- Data for Name: search_postgres_index; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.search_postgres_index (name, table_name, schema_hash, plan, document_count, created_at, updated_at) FROM stdin;
product_v1	search_pg_product_v1	6a867764af1115440210b465fe11db3c1627a9a818c408f9b3c16e778b4b4b40	{"fields": [{"kind": "keyword", "path": "id", "field": {"type": "keyword", "filterable": true, "retrievable": true}, "is_date": false, "is_array": false}, {"kind": "keyword", "path": "status", "field": {"type": "keyword", "filterable": true, "retrievable": false}, "is_date": false, "is_array": false}, {"kind": "keyword", "path": "sales_channel_ids", "field": {"type": "keyword", "array": true, "filterable": true, "retrievable": false}, "is_date": false, "is_array": true}, {"kind": "text", "path": "title", "field": {"type": "text", "sortable": true, "searchable": {"weight": 3}, "retrievable": true}, "is_date": false, "is_array": false}, {"kind": "text", "path": "description", "field": {"type": "text", "searchable": {"weight": 1}}, "is_date": false, "is_array": false}, {"kind": "keyword", "path": "handle", "field": {"type": "keyword", "retrievable": true}, "is_date": false, "is_array": false}, {"kind": "keyword", "path": "thumbnail", "field": {"type": "keyword", "retrievable": true}, "is_date": false, "is_array": false}, {"kind": "number", "path": "created_at", "field": {"type": "date", "sortable": true, "retrievable": true}, "is_date": true, "is_array": false}, {"kind": "keyword", "path": "category", "field": {"type": "keyword", "array": true, "facetable": true, "filterable": true, "retrievable": true}, "is_date": false, "is_array": true}, {"kind": "keyword", "path": "labels", "field": {"type": "keyword", "array": true, "facetable": true, "filterable": true, "retrievable": true}, "is_date": false, "is_array": true}, {"kind": "keyword", "path": "option_values", "field": {"type": "keyword", "array": true, "facetable": true, "filterable": true, "searchable": {"weight": 2}, "retrievable": true}, "is_date": false, "is_array": true}, {"kind": "number", "path": "min_price_eur", "field": {"type": "float", "sortable": true, "facetable": {"types": ["stats"]}, "filterable": true, "retrievable": true}, "is_date": false, "is_array": false}, {"kind": "number", "path": "max_price_eur", "field": {"type": "float", "sortable": true, "facetable": {"types": ["stats"]}, "filterable": true, "retrievable": true}, "is_date": false, "is_array": false}, {"kind": "number", "path": "original_price_eur", "field": {"type": "float", "retrievable": true}, "is_date": false, "is_array": false}, {"kind": "boolean", "path": "on_sale_eur", "field": {"type": "boolean", "facetable": true, "filterable": true, "retrievable": true}, "is_date": false, "is_array": false}, {"kind": "number", "path": "min_price_usd", "field": {"type": "float", "sortable": true, "facetable": {"types": ["stats"]}, "filterable": true, "retrievable": true}, "is_date": false, "is_array": false}, {"kind": "number", "path": "max_price_usd", "field": {"type": "float", "sortable": true, "facetable": {"types": ["stats"]}, "filterable": true, "retrievable": true}, "is_date": false, "is_array": false}, {"kind": "number", "path": "original_price_usd", "field": {"type": "float", "retrievable": true}, "is_date": false, "is_array": false}, {"kind": "boolean", "path": "on_sale_usd", "field": {"type": "boolean", "facetable": true, "filterable": true, "retrievable": true}, "is_date": false, "is_array": false}], "vectors": [], "searchable": ["title", "description", "option_values"], "primary_key": "id", "schema_hash": "6a867764af1115440210b465fe11db3c1627a9a818c408f9b3c16e778b4b4b40"}	7	2026-11-03 12:30:29.559028+00	2026-11-03 12:38:39.79098+00
\.


--
-- Data for Name: service_zone; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.service_zone (id, name, metadata, fulfillment_set_id, created_at, updated_at, deleted_at) FROM stdin;
serzo_01M6GP7HEQ6FW4YX8E2G543VE3	Europe	\N	fuset_01M6GP7HEQEDP2J5CQ2HJ8RMNG	2026-11-03 12:30:32.919+00	2026-11-03 12:30:32.919+00	\N
\.


--
-- Data for Name: shipping_option; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.shipping_option (id, name, price_type, service_zone_id, shipping_profile_id, provider_id, data, metadata, shipping_option_type_id, created_at, updated_at, deleted_at) FROM stdin;
so_01M6GP7HG3T0PDBZG6FXNAQ80X	Standard Shipping	flat	serzo_01M6GP7HEQ6FW4YX8E2G543VE3	sp_01M6GP7HABVA2E552YNW2NQJHP	manual_manual	\N	\N	sotype_01M6GP7HG3NX56E6Z1T3S44RT2	2026-11-03 12:30:32.963+00	2026-11-03 12:30:32.963+00	\N
so_01M6GP7HG3D629FC9028SW9GNM	Express Shipping	flat	serzo_01M6GP7HEQ6FW4YX8E2G543VE3	sp_01M6GP7HABVA2E552YNW2NQJHP	manual_manual	\N	\N	sotype_01M6GP7HG3ARTM987PX99M2W3E	2026-11-03 12:30:32.964+00	2026-11-03 12:30:32.964+00	\N
\.


--
-- Data for Name: shipping_option_price_set; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.shipping_option_price_set (shipping_option_id, price_set_id, id, created_at, updated_at, deleted_at) FROM stdin;
so_01M6GP7HG3T0PDBZG6FXNAQ80X	pset_01M6GP7HGKD0WKMJ0498ZFTYWG	sops_01M6GP7HHE7BPDKV98BC6NHNKS	2026-11-03 12:30:33.005118+00	2026-11-03 12:30:33.005118+00	\N
so_01M6GP7HG3D629FC9028SW9GNM	pset_01M6GP7HGKASH5NVGCG0243QEE	sops_01M6GP7HHENBYEF2X02G9WGASV	2026-11-03 12:30:33.005118+00	2026-11-03 12:30:33.005118+00	\N
\.


--
-- Data for Name: shipping_option_rule; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.shipping_option_rule (id, attribute, operator, value, shipping_option_id, created_at, updated_at, deleted_at) FROM stdin;
sorul_01M6GP7HG3C7QNAGR63VX29B2Y	enabled_in_store	eq	"true"	so_01M6GP7HG3T0PDBZG6FXNAQ80X	2026-11-03 12:30:32.964+00	2026-11-03 12:30:32.964+00	\N
sorul_01M6GP7HG3CNRAF7BZSW9V2C1N	is_return	eq	"false"	so_01M6GP7HG3T0PDBZG6FXNAQ80X	2026-11-03 12:30:32.964+00	2026-11-03 12:30:32.964+00	\N
sorul_01M6GP7HG30AGZ8CB51TX8SVJJ	enabled_in_store	eq	"true"	so_01M6GP7HG3D629FC9028SW9GNM	2026-11-03 12:30:32.964+00	2026-11-03 12:30:32.964+00	\N
sorul_01M6GP7HG3B2MVQJ1Y0AHY8A77	is_return	eq	"false"	so_01M6GP7HG3D629FC9028SW9GNM	2026-11-03 12:30:32.964+00	2026-11-03 12:30:32.964+00	\N
\.


--
-- Data for Name: shipping_option_type; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.shipping_option_type (id, label, description, code, created_at, updated_at, deleted_at) FROM stdin;
sotype_01M6GP7HG3NX56E6Z1T3S44RT2	Standard	Ship in 2-3 days.	standard	2026-11-03 12:30:32.963+00	2026-11-03 12:30:32.963+00	\N
sotype_01M6GP7HG3ARTM987PX99M2W3E	Express	Ship in 24 hours.	express	2026-11-03 12:30:32.964+00	2026-11-03 12:30:32.964+00	\N
\.


--
-- Data for Name: shipping_profile; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.shipping_profile (id, name, type, metadata, created_at, updated_at, deleted_at) FROM stdin;
sp_01M6GP7HABVA2E552YNW2NQJHP	Default Shipping Profile	default	\N	2026-11-03 12:30:32.779+00	2026-11-03 12:30:32.779+00	\N
\.


--
-- Data for Name: stock_location; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.stock_location (id, created_at, updated_at, deleted_at, name, address_id, metadata) FROM stdin;
sloc_01M6GP7HE6PXEXG9R0YVGDM48M	2026-11-03 12:30:32.903+00	2026-11-03 12:30:32.903+00	\N	European Warehouse	laddr_01M6GP7HE64CKHS57B817N8ZBN	\N
sloc_01M6GP9DMABX8XJDS92E9N0B05	2026-11-03 12:31:34.538+00	2026-11-03 12:31:34.538+00	\N	Nizamlar Baskı Atölyesi	laddr_01M6GP9DMA07VR7M3CSTSGD2TY	\N
\.


--
-- Data for Name: stock_location_address; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.stock_location_address (id, created_at, updated_at, deleted_at, address_1, address_2, company, city, country_code, phone, province, postal_code, metadata) FROM stdin;
laddr_01M6GP7HE64CKHS57B817N8ZBN	2026-11-03 12:30:32.902+00	2026-11-03 12:30:32.902+00	\N		\N	\N	Copenhagen	DK	\N	\N	\N	\N
laddr_01M6GP9DMA07VR7M3CSTSGD2TY	2026-11-03 12:31:34.538+00	2026-11-03 12:31:34.538+00	\N	İkitelli OSB	\N	\N	İstanbul	tr	\N	\N	\N	\N
\.


--
-- Data for Name: store; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.store (id, name, default_sales_channel_id, default_region_id, default_location_id, metadata, created_at, updated_at, deleted_at) FROM stdin;
store_01M6GP7HCMZHYA2HGJW3HFJXT9	Nizamlar Baskı	sc_01M6GP7HBXGBAJ70C7ZFYX8RV9	\N	\N	\N	2026-11-03 12:30:32.849825+00	2026-11-03 12:31:34.49+00	\N
\.


--
-- Data for Name: store_currency; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.store_currency (id, currency_code, is_default, store_id, created_at, updated_at, deleted_at) FROM stdin;
stocur_01M6GP9DJWTQ7XGA599ZKBSP80	try	t	store_01M6GP7HCMZHYA2HGJW3HFJXT9	2026-11-03 12:31:34.487143+00	2026-11-03 12:31:34.487143+00	\N
stocur_01M6GP9DJWHTCFTKEH519EDQGE	usd	f	store_01M6GP7HCMZHYA2HGJW3HFJXT9	2026-11-03 12:31:34.487143+00	2026-11-03 12:31:34.487143+00	\N
stocur_01M6GP9DJWXCGY6QSQS9XKQDFT	eur	f	store_01M6GP7HCMZHYA2HGJW3HFJXT9	2026-11-03 12:31:34.487143+00	2026-11-03 12:31:34.487143+00	\N
\.


--
-- Data for Name: store_locale; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.store_locale (id, locale_code, store_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: tax_provider; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.tax_provider (id, is_enabled, created_at, updated_at, deleted_at) FROM stdin;
tp_system	t	2026-11-03 12:30:29.457+00	2026-11-03 12:30:29.457+00	\N
\.


--
-- Data for Name: tax_rate; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.tax_rate (id, rate, code, name, is_default, is_combinable, tax_region_id, metadata, created_at, updated_at, created_by, deleted_at) FROM stdin;
\.


--
-- Data for Name: tax_rate_rule; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.tax_rate_rule (id, tax_rate_id, reference_id, reference, metadata, created_at, updated_at, created_by, deleted_at) FROM stdin;
\.


--
-- Data for Name: tax_region; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.tax_region (id, provider_id, country_code, province_code, parent_id, metadata, created_at, updated_at, created_by, deleted_at) FROM stdin;
txreg_01M6GP7HDX6FQBVKX3B6XPCNWG	tp_system	gb	\N	\N	\N	2026-11-03 12:30:32.893+00	2026-11-03 12:30:32.893+00	\N	\N
txreg_01M6GP7HDXXSJ9VDGV2TB1KMN6	tp_system	de	\N	\N	\N	2026-11-03 12:30:32.893+00	2026-11-03 12:30:32.893+00	\N	\N
txreg_01M6GP7HDX4XJQ0JAPFYCEC1R5	tp_system	dk	\N	\N	\N	2026-11-03 12:30:32.893+00	2026-11-03 12:30:32.893+00	\N	\N
txreg_01M6GP7HDXRNKVGNJ56PNNZAR7	tp_system	se	\N	\N	\N	2026-11-03 12:30:32.893+00	2026-11-03 12:30:32.893+00	\N	\N
txreg_01M6GP7HDX0FW9XNTXHEFP9BD0	tp_system	fr	\N	\N	\N	2026-11-03 12:30:32.893+00	2026-11-03 12:30:32.893+00	\N	\N
txreg_01M6GP7HDXCGRKA9G838JQM4HB	tp_system	es	\N	\N	\N	2026-11-03 12:30:32.893+00	2026-11-03 12:30:32.893+00	\N	\N
txreg_01M6GP7HDXCZG2WS5B9RTEHEX4	tp_system	it	\N	\N	\N	2026-11-03 12:30:32.893+00	2026-11-03 12:30:32.893+00	\N	\N
txreg_01M6GP9DM1QHTV6Y4QAE50RZEJ	tp_system	tr	\N	\N	\N	2026-11-03 12:31:34.53+00	2026-11-03 12:31:34.53+00	\N	\N
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public."user" (id, first_name, last_name, email, avatar_url, metadata, created_at, updated_at, deleted_at) FROM stdin;
user_01M6GP85GWCW9HZXM6JWCAY3FQ	\N	\N	admin@nizamlarbaski.com	\N	\N	2026-11-03 12:30:53.469+00	2026-11-03 12:30:53.469+00	\N
\.


--
-- Data for Name: user_preference; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.user_preference (id, user_id, key, value, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: user_rbac_role; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.user_rbac_role (user_id, rbac_role_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: view_configuration; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.view_configuration (id, entity, name, user_id, is_system_default, configuration, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: workflow_execution; Type: TABLE DATA; Schema: public; Owner: medusa
--

COPY public.workflow_execution (id, workflow_id, transaction_id, execution, context, state, created_at, updated_at, deleted_at, retention_time, run_id) FROM stdin;
\.


--
-- Name: link_module_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: medusa
--

SELECT pg_catalog.setval('public.link_module_migrations_id_seq', 20, true);


--
-- Name: mikro_orm_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: medusa
--

SELECT pg_catalog.setval('public.mikro_orm_migrations_id_seq', 183, true);


--
-- Name: order_change_action_ordering_seq; Type: SEQUENCE SET; Schema: public; Owner: medusa
--

SELECT pg_catalog.setval('public.order_change_action_ordering_seq', 1, false);


--
-- Name: order_claim_display_id_seq; Type: SEQUENCE SET; Schema: public; Owner: medusa
--

SELECT pg_catalog.setval('public.order_claim_display_id_seq', 1, false);


--
-- Name: order_display_id_seq; Type: SEQUENCE SET; Schema: public; Owner: medusa
--

SELECT pg_catalog.setval('public.order_display_id_seq', 1, false);


--
-- Name: order_exchange_display_id_seq; Type: SEQUENCE SET; Schema: public; Owner: medusa
--

SELECT pg_catalog.setval('public.order_exchange_display_id_seq', 1, false);


--
-- Name: return_display_id_seq; Type: SEQUENCE SET; Schema: public; Owner: medusa
--

SELECT pg_catalog.setval('public.return_display_id_seq', 1, false);


--
-- Name: script_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: medusa
--

SELECT pg_catalog.setval('public.script_migrations_id_seq', 8, true);


--
-- Name: account_holder account_holder_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.account_holder
    ADD CONSTRAINT account_holder_pkey PRIMARY KEY (id);


--
-- Name: api_key api_key_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.api_key
    ADD CONSTRAINT api_key_pkey PRIMARY KEY (id);


--
-- Name: application_method_buy_rules application_method_buy_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.application_method_buy_rules
    ADD CONSTRAINT application_method_buy_rules_pkey PRIMARY KEY (application_method_id, promotion_rule_id);


--
-- Name: application_method_target_rules application_method_target_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.application_method_target_rules
    ADD CONSTRAINT application_method_target_rules_pkey PRIMARY KEY (application_method_id, promotion_rule_id);


--
-- Name: auth_identity auth_identity_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.auth_identity
    ADD CONSTRAINT auth_identity_pkey PRIMARY KEY (id);


--
-- Name: auth_mfa_factor auth_mfa_factor_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.auth_mfa_factor
    ADD CONSTRAINT auth_mfa_factor_pkey PRIMARY KEY (id);


--
-- Name: auth_mfa_recovery_code auth_mfa_recovery_code_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.auth_mfa_recovery_code
    ADD CONSTRAINT auth_mfa_recovery_code_pkey PRIMARY KEY (id);


--
-- Name: auth_password_reset_token auth_password_reset_token_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.auth_password_reset_token
    ADD CONSTRAINT auth_password_reset_token_pkey PRIMARY KEY (id);


--
-- Name: auth_verification auth_verification_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.auth_verification
    ADD CONSTRAINT auth_verification_pkey PRIMARY KEY (id);


--
-- Name: capture capture_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.capture
    ADD CONSTRAINT capture_pkey PRIMARY KEY (id);


--
-- Name: cart_address cart_address_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart_address
    ADD CONSTRAINT cart_address_pkey PRIMARY KEY (id);


--
-- Name: cart_line_item_adjustment cart_line_item_adjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart_line_item_adjustment
    ADD CONSTRAINT cart_line_item_adjustment_pkey PRIMARY KEY (id);


--
-- Name: cart_line_item cart_line_item_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart_line_item
    ADD CONSTRAINT cart_line_item_pkey PRIMARY KEY (id);


--
-- Name: cart_line_item_tax_line cart_line_item_tax_line_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart_line_item_tax_line
    ADD CONSTRAINT cart_line_item_tax_line_pkey PRIMARY KEY (id);


--
-- Name: cart_payment_collection cart_payment_collection_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart_payment_collection
    ADD CONSTRAINT cart_payment_collection_pkey PRIMARY KEY (cart_id, payment_collection_id);


--
-- Name: cart cart_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (id);


--
-- Name: cart_promotion cart_promotion_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart_promotion
    ADD CONSTRAINT cart_promotion_pkey PRIMARY KEY (cart_id, promotion_id);


--
-- Name: cart_shipping_method_adjustment cart_shipping_method_adjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart_shipping_method_adjustment
    ADD CONSTRAINT cart_shipping_method_adjustment_pkey PRIMARY KEY (id);


--
-- Name: cart_shipping_method cart_shipping_method_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart_shipping_method
    ADD CONSTRAINT cart_shipping_method_pkey PRIMARY KEY (id);


--
-- Name: cart_shipping_method_tax_line cart_shipping_method_tax_line_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart_shipping_method_tax_line
    ADD CONSTRAINT cart_shipping_method_tax_line_pkey PRIMARY KEY (id);


--
-- Name: credit_line credit_line_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.credit_line
    ADD CONSTRAINT credit_line_pkey PRIMARY KEY (id);


--
-- Name: currency currency_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.currency
    ADD CONSTRAINT currency_pkey PRIMARY KEY (code);


--
-- Name: custom_design custom_design_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.custom_design
    ADD CONSTRAINT custom_design_pkey PRIMARY KEY (id);


--
-- Name: customer_account_holder customer_account_holder_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.customer_account_holder
    ADD CONSTRAINT customer_account_holder_pkey PRIMARY KEY (customer_id, account_holder_id);


--
-- Name: customer_address customer_address_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.customer_address
    ADD CONSTRAINT customer_address_pkey PRIMARY KEY (id);


--
-- Name: customer_group_customer customer_group_customer_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.customer_group_customer
    ADD CONSTRAINT customer_group_customer_pkey PRIMARY KEY (id);


--
-- Name: customer_group customer_group_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.customer_group
    ADD CONSTRAINT customer_group_pkey PRIMARY KEY (id);


--
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (id);


--
-- Name: fulfillment_address fulfillment_address_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.fulfillment_address
    ADD CONSTRAINT fulfillment_address_pkey PRIMARY KEY (id);


--
-- Name: fulfillment_item fulfillment_item_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.fulfillment_item
    ADD CONSTRAINT fulfillment_item_pkey PRIMARY KEY (id);


--
-- Name: fulfillment_label fulfillment_label_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.fulfillment_label
    ADD CONSTRAINT fulfillment_label_pkey PRIMARY KEY (id);


--
-- Name: fulfillment fulfillment_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.fulfillment
    ADD CONSTRAINT fulfillment_pkey PRIMARY KEY (id);


--
-- Name: fulfillment_provider fulfillment_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.fulfillment_provider
    ADD CONSTRAINT fulfillment_provider_pkey PRIMARY KEY (id);


--
-- Name: fulfillment_set fulfillment_set_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.fulfillment_set
    ADD CONSTRAINT fulfillment_set_pkey PRIMARY KEY (id);


--
-- Name: geo_zone geo_zone_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.geo_zone
    ADD CONSTRAINT geo_zone_pkey PRIMARY KEY (id);


--
-- Name: image image_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.image
    ADD CONSTRAINT image_pkey PRIMARY KEY (id);


--
-- Name: inventory_item inventory_item_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.inventory_item
    ADD CONSTRAINT inventory_item_pkey PRIMARY KEY (id);


--
-- Name: inventory_level inventory_level_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.inventory_level
    ADD CONSTRAINT inventory_level_pkey PRIMARY KEY (id);


--
-- Name: invite invite_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.invite
    ADD CONSTRAINT invite_pkey PRIMARY KEY (id);


--
-- Name: invite_rbac_role invite_rbac_role_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.invite_rbac_role
    ADD CONSTRAINT invite_rbac_role_pkey PRIMARY KEY (invite_id, rbac_role_id);


--
-- Name: layout_configuration layout_configuration_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.layout_configuration
    ADD CONSTRAINT layout_configuration_pkey PRIMARY KEY (id);


--
-- Name: link_module_migrations link_module_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.link_module_migrations
    ADD CONSTRAINT link_module_migrations_pkey PRIMARY KEY (id);


--
-- Name: link_module_migrations link_module_migrations_table_name_key; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.link_module_migrations
    ADD CONSTRAINT link_module_migrations_table_name_key UNIQUE (table_name);


--
-- Name: location_fulfillment_provider location_fulfillment_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.location_fulfillment_provider
    ADD CONSTRAINT location_fulfillment_provider_pkey PRIMARY KEY (stock_location_id, fulfillment_provider_id);


--
-- Name: location_fulfillment_set location_fulfillment_set_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.location_fulfillment_set
    ADD CONSTRAINT location_fulfillment_set_pkey PRIMARY KEY (stock_location_id, fulfillment_set_id);


--
-- Name: mikro_orm_migrations mikro_orm_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.mikro_orm_migrations
    ADD CONSTRAINT mikro_orm_migrations_pkey PRIMARY KEY (id);


--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);


--
-- Name: notification_provider notification_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.notification_provider
    ADD CONSTRAINT notification_provider_pkey PRIMARY KEY (id);


--
-- Name: order_address order_address_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_address
    ADD CONSTRAINT order_address_pkey PRIMARY KEY (id);


--
-- Name: order_cart order_cart_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_cart
    ADD CONSTRAINT order_cart_pkey PRIMARY KEY (order_id, cart_id);


--
-- Name: order_change_action order_change_action_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_change_action
    ADD CONSTRAINT order_change_action_pkey PRIMARY KEY (id);


--
-- Name: order_change order_change_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_change
    ADD CONSTRAINT order_change_pkey PRIMARY KEY (id);


--
-- Name: order_claim_item_image order_claim_item_image_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_claim_item_image
    ADD CONSTRAINT order_claim_item_image_pkey PRIMARY KEY (id);


--
-- Name: order_claim_item order_claim_item_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_claim_item
    ADD CONSTRAINT order_claim_item_pkey PRIMARY KEY (id);


--
-- Name: order_claim order_claim_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_claim
    ADD CONSTRAINT order_claim_pkey PRIMARY KEY (id);


--
-- Name: order_credit_line order_credit_line_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_credit_line
    ADD CONSTRAINT order_credit_line_pkey PRIMARY KEY (id);


--
-- Name: order_exchange_item order_exchange_item_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_exchange_item
    ADD CONSTRAINT order_exchange_item_pkey PRIMARY KEY (id);


--
-- Name: order_exchange order_exchange_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_exchange
    ADD CONSTRAINT order_exchange_pkey PRIMARY KEY (id);


--
-- Name: order_fulfillment order_fulfillment_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_fulfillment
    ADD CONSTRAINT order_fulfillment_pkey PRIMARY KEY (order_id, fulfillment_id);


--
-- Name: order_item order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_pkey PRIMARY KEY (id);


--
-- Name: order_line_item_adjustment order_line_item_adjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_line_item_adjustment
    ADD CONSTRAINT order_line_item_adjustment_pkey PRIMARY KEY (id);


--
-- Name: order_line_item order_line_item_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_line_item
    ADD CONSTRAINT order_line_item_pkey PRIMARY KEY (id);


--
-- Name: order_line_item_tax_line order_line_item_tax_line_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_line_item_tax_line
    ADD CONSTRAINT order_line_item_tax_line_pkey PRIMARY KEY (id);


--
-- Name: order_payment_collection order_payment_collection_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_payment_collection
    ADD CONSTRAINT order_payment_collection_pkey PRIMARY KEY (order_id, payment_collection_id);


--
-- Name: order order_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_pkey PRIMARY KEY (id);


--
-- Name: order_promotion order_promotion_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_promotion
    ADD CONSTRAINT order_promotion_pkey PRIMARY KEY (order_id, promotion_id);


--
-- Name: order_shipping_method_adjustment order_shipping_method_adjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_shipping_method_adjustment
    ADD CONSTRAINT order_shipping_method_adjustment_pkey PRIMARY KEY (id);


--
-- Name: order_shipping_method order_shipping_method_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_shipping_method
    ADD CONSTRAINT order_shipping_method_pkey PRIMARY KEY (id);


--
-- Name: order_shipping_method_tax_line order_shipping_method_tax_line_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_shipping_method_tax_line
    ADD CONSTRAINT order_shipping_method_tax_line_pkey PRIMARY KEY (id);


--
-- Name: order_shipping order_shipping_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_shipping
    ADD CONSTRAINT order_shipping_pkey PRIMARY KEY (id);


--
-- Name: order_summary order_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_summary
    ADD CONSTRAINT order_summary_pkey PRIMARY KEY (id);


--
-- Name: order_transaction order_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_transaction
    ADD CONSTRAINT order_transaction_pkey PRIMARY KEY (id);


--
-- Name: payment_collection_payment_providers payment_collection_payment_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.payment_collection_payment_providers
    ADD CONSTRAINT payment_collection_payment_providers_pkey PRIMARY KEY (payment_collection_id, payment_provider_id);


--
-- Name: payment_collection payment_collection_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.payment_collection
    ADD CONSTRAINT payment_collection_pkey PRIMARY KEY (id);


--
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (id);


--
-- Name: payment_provider payment_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.payment_provider
    ADD CONSTRAINT payment_provider_pkey PRIMARY KEY (id);


--
-- Name: payment_session payment_session_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.payment_session
    ADD CONSTRAINT payment_session_pkey PRIMARY KEY (id);


--
-- Name: price_list price_list_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.price_list
    ADD CONSTRAINT price_list_pkey PRIMARY KEY (id);


--
-- Name: price_list_rule price_list_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.price_list_rule
    ADD CONSTRAINT price_list_rule_pkey PRIMARY KEY (id);


--
-- Name: price price_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.price
    ADD CONSTRAINT price_pkey PRIMARY KEY (id);


--
-- Name: price_preference price_preference_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.price_preference
    ADD CONSTRAINT price_preference_pkey PRIMARY KEY (id);


--
-- Name: price_rule price_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.price_rule
    ADD CONSTRAINT price_rule_pkey PRIMARY KEY (id);


--
-- Name: price_set price_set_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.price_set
    ADD CONSTRAINT price_set_pkey PRIMARY KEY (id);


--
-- Name: product_category product_category_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_category
    ADD CONSTRAINT product_category_pkey PRIMARY KEY (id);


--
-- Name: product_category_product product_category_product_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_category_product
    ADD CONSTRAINT product_category_product_pkey PRIMARY KEY (product_id, product_category_id);


--
-- Name: product_collection product_collection_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_collection
    ADD CONSTRAINT product_collection_pkey PRIMARY KEY (id);


--
-- Name: product_option product_option_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_option
    ADD CONSTRAINT product_option_pkey PRIMARY KEY (id);


--
-- Name: product_option_value product_option_value_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_option_value
    ADD CONSTRAINT product_option_value_pkey PRIMARY KEY (id);


--
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);


--
-- Name: product_product_option product_product_option_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_product_option
    ADD CONSTRAINT product_product_option_pkey PRIMARY KEY (id);


--
-- Name: product_product_option_value product_product_option_value_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_product_option_value
    ADD CONSTRAINT product_product_option_value_pkey PRIMARY KEY (id);


--
-- Name: product_sales_channel product_sales_channel_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_sales_channel
    ADD CONSTRAINT product_sales_channel_pkey PRIMARY KEY (product_id, sales_channel_id);


--
-- Name: product_shipping_profile product_shipping_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_shipping_profile
    ADD CONSTRAINT product_shipping_profile_pkey PRIMARY KEY (product_id, shipping_profile_id);


--
-- Name: product_tag product_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_tag
    ADD CONSTRAINT product_tag_pkey PRIMARY KEY (id);


--
-- Name: product_tags product_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT product_tags_pkey PRIMARY KEY (product_id, product_tag_id);


--
-- Name: product_type product_type_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_type
    ADD CONSTRAINT product_type_pkey PRIMARY KEY (id);


--
-- Name: product_variant_inventory_item product_variant_inventory_item_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_variant_inventory_item
    ADD CONSTRAINT product_variant_inventory_item_pkey PRIMARY KEY (variant_id, inventory_item_id);


--
-- Name: product_variant_option product_variant_option_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_variant_option
    ADD CONSTRAINT product_variant_option_pkey PRIMARY KEY (variant_id, option_value_id);


--
-- Name: product_variant product_variant_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_variant
    ADD CONSTRAINT product_variant_pkey PRIMARY KEY (id);


--
-- Name: product_variant_price_set product_variant_price_set_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_variant_price_set
    ADD CONSTRAINT product_variant_price_set_pkey PRIMARY KEY (variant_id, price_set_id);


--
-- Name: product_variant_product_image product_variant_product_image_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_variant_product_image
    ADD CONSTRAINT product_variant_product_image_pkey PRIMARY KEY (id);


--
-- Name: promotion_application_method promotion_application_method_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.promotion_application_method
    ADD CONSTRAINT promotion_application_method_pkey PRIMARY KEY (id);


--
-- Name: promotion_campaign_budget promotion_campaign_budget_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.promotion_campaign_budget
    ADD CONSTRAINT promotion_campaign_budget_pkey PRIMARY KEY (id);


--
-- Name: promotion_campaign_budget_usage promotion_campaign_budget_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.promotion_campaign_budget_usage
    ADD CONSTRAINT promotion_campaign_budget_usage_pkey PRIMARY KEY (id);


--
-- Name: promotion_campaign promotion_campaign_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.promotion_campaign
    ADD CONSTRAINT promotion_campaign_pkey PRIMARY KEY (id);


--
-- Name: promotion promotion_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.promotion
    ADD CONSTRAINT promotion_pkey PRIMARY KEY (id);


--
-- Name: promotion_promotion_rule promotion_promotion_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.promotion_promotion_rule
    ADD CONSTRAINT promotion_promotion_rule_pkey PRIMARY KEY (promotion_id, promotion_rule_id);


--
-- Name: promotion_rule promotion_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.promotion_rule
    ADD CONSTRAINT promotion_rule_pkey PRIMARY KEY (id);


--
-- Name: promotion_rule_value promotion_rule_value_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.promotion_rule_value
    ADD CONSTRAINT promotion_rule_value_pkey PRIMARY KEY (id);


--
-- Name: property_label property_label_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.property_label
    ADD CONSTRAINT property_label_pkey PRIMARY KEY (id);


--
-- Name: provider_identity provider_identity_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.provider_identity
    ADD CONSTRAINT provider_identity_pkey PRIMARY KEY (id);


--
-- Name: publishable_api_key_sales_channel publishable_api_key_sales_channel_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.publishable_api_key_sales_channel
    ADD CONSTRAINT publishable_api_key_sales_channel_pkey PRIMARY KEY (publishable_key_id, sales_channel_id);


--
-- Name: refund refund_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.refund
    ADD CONSTRAINT refund_pkey PRIMARY KEY (id);


--
-- Name: refund_reason refund_reason_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.refund_reason
    ADD CONSTRAINT refund_reason_pkey PRIMARY KEY (id);


--
-- Name: region_country region_country_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.region_country
    ADD CONSTRAINT region_country_pkey PRIMARY KEY (iso_2);


--
-- Name: region_payment_provider region_payment_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.region_payment_provider
    ADD CONSTRAINT region_payment_provider_pkey PRIMARY KEY (region_id, payment_provider_id);


--
-- Name: region region_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.region
    ADD CONSTRAINT region_pkey PRIMARY KEY (id);


--
-- Name: reservation_item reservation_item_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.reservation_item
    ADD CONSTRAINT reservation_item_pkey PRIMARY KEY (id);


--
-- Name: return_fulfillment return_fulfillment_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.return_fulfillment
    ADD CONSTRAINT return_fulfillment_pkey PRIMARY KEY (return_id, fulfillment_id);


--
-- Name: return_item return_item_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.return_item
    ADD CONSTRAINT return_item_pkey PRIMARY KEY (id);


--
-- Name: return return_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.return
    ADD CONSTRAINT return_pkey PRIMARY KEY (id);


--
-- Name: return_reason return_reason_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.return_reason
    ADD CONSTRAINT return_reason_pkey PRIMARY KEY (id);


--
-- Name: sales_channel sales_channel_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.sales_channel
    ADD CONSTRAINT sales_channel_pkey PRIMARY KEY (id);


--
-- Name: sales_channel_stock_location sales_channel_stock_location_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.sales_channel_stock_location
    ADD CONSTRAINT sales_channel_stock_location_pkey PRIMARY KEY (sales_channel_id, stock_location_id);


--
-- Name: script_migrations script_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.script_migrations
    ADD CONSTRAINT script_migrations_pkey PRIMARY KEY (id);


--
-- Name: search_index search_index_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.search_index
    ADD CONSTRAINT search_index_pkey PRIMARY KEY (id);


--
-- Name: search_index_sync search_index_sync_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.search_index_sync
    ADD CONSTRAINT search_index_sync_pkey PRIMARY KEY (id);


--
-- Name: search_index_version search_index_version_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.search_index_version
    ADD CONSTRAINT search_index_version_pkey PRIMARY KEY (id);


--
-- Name: search_pg_product_v1 search_pg_product_v1_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.search_pg_product_v1
    ADD CONSTRAINT search_pg_product_v1_pkey PRIMARY KEY (id);


--
-- Name: search_postgres_index search_postgres_index_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.search_postgres_index
    ADD CONSTRAINT search_postgres_index_pkey PRIMARY KEY (name);


--
-- Name: service_zone service_zone_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.service_zone
    ADD CONSTRAINT service_zone_pkey PRIMARY KEY (id);


--
-- Name: shipping_option shipping_option_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.shipping_option
    ADD CONSTRAINT shipping_option_pkey PRIMARY KEY (id);


--
-- Name: shipping_option_price_set shipping_option_price_set_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.shipping_option_price_set
    ADD CONSTRAINT shipping_option_price_set_pkey PRIMARY KEY (shipping_option_id, price_set_id);


--
-- Name: shipping_option_rule shipping_option_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.shipping_option_rule
    ADD CONSTRAINT shipping_option_rule_pkey PRIMARY KEY (id);


--
-- Name: shipping_option_type shipping_option_type_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.shipping_option_type
    ADD CONSTRAINT shipping_option_type_pkey PRIMARY KEY (id);


--
-- Name: shipping_profile shipping_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.shipping_profile
    ADD CONSTRAINT shipping_profile_pkey PRIMARY KEY (id);


--
-- Name: stock_location_address stock_location_address_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.stock_location_address
    ADD CONSTRAINT stock_location_address_pkey PRIMARY KEY (id);


--
-- Name: stock_location stock_location_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.stock_location
    ADD CONSTRAINT stock_location_pkey PRIMARY KEY (id);


--
-- Name: store_currency store_currency_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.store_currency
    ADD CONSTRAINT store_currency_pkey PRIMARY KEY (id);


--
-- Name: store_locale store_locale_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.store_locale
    ADD CONSTRAINT store_locale_pkey PRIMARY KEY (id);


--
-- Name: store store_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.store
    ADD CONSTRAINT store_pkey PRIMARY KEY (id);


--
-- Name: tax_provider tax_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.tax_provider
    ADD CONSTRAINT tax_provider_pkey PRIMARY KEY (id);


--
-- Name: tax_rate tax_rate_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.tax_rate
    ADD CONSTRAINT tax_rate_pkey PRIMARY KEY (id);


--
-- Name: tax_rate_rule tax_rate_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.tax_rate_rule
    ADD CONSTRAINT tax_rate_rule_pkey PRIMARY KEY (id);


--
-- Name: tax_region tax_region_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.tax_region
    ADD CONSTRAINT tax_region_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: user_preference user_preference_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.user_preference
    ADD CONSTRAINT user_preference_pkey PRIMARY KEY (id);


--
-- Name: user_rbac_role user_rbac_role_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.user_rbac_role
    ADD CONSTRAINT user_rbac_role_pkey PRIMARY KEY (user_id, rbac_role_id);


--
-- Name: view_configuration view_configuration_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.view_configuration
    ADD CONSTRAINT view_configuration_pkey PRIMARY KEY (id);


--
-- Name: workflow_execution workflow_execution_pkey; Type: CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.workflow_execution
    ADD CONSTRAINT workflow_execution_pkey PRIMARY KEY (workflow_id, transaction_id, run_id);


--
-- Name: IDX_account_holder_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_account_holder_deleted_at" ON public.account_holder USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_account_holder_id_5cb3a0c0; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_account_holder_id_5cb3a0c0" ON public.customer_account_holder USING btree (account_holder_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_account_holder_provider_id_external_id_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_account_holder_provider_id_external_id_unique" ON public.account_holder USING btree (provider_id, external_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_api_key_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_api_key_deleted_at" ON public.api_key USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_api_key_redacted; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_api_key_redacted" ON public.api_key USING btree (redacted) WHERE (deleted_at IS NULL);


--
-- Name: IDX_api_key_revoked_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_api_key_revoked_at" ON public.api_key USING btree (revoked_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_api_key_token_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_api_key_token_unique" ON public.api_key USING btree (token);


--
-- Name: IDX_api_key_type; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_api_key_type" ON public.api_key USING btree (type);


--
-- Name: IDX_application_method_allocation; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_application_method_allocation" ON public.promotion_application_method USING btree (allocation);


--
-- Name: IDX_application_method_target_type; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_application_method_target_type" ON public.promotion_application_method USING btree (target_type);


--
-- Name: IDX_application_method_type; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_application_method_type" ON public.promotion_application_method USING btree (type);


--
-- Name: IDX_auth_identity_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_auth_identity_deleted_at" ON public.auth_identity USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_mfa_factor_auth_identity_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_auth_mfa_factor_auth_identity_id" ON public.auth_mfa_factor USING btree (auth_identity_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_mfa_factor_auth_identity_provider_active; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_auth_mfa_factor_auth_identity_provider_active" ON public.auth_mfa_factor USING btree (auth_identity_id, provider) WHERE ((deleted_at IS NULL) AND (status = ANY (ARRAY['pending'::text, 'enabled'::text])));


--
-- Name: IDX_auth_mfa_factor_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_auth_mfa_factor_deleted_at" ON public.auth_mfa_factor USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_mfa_recovery_code_auth_identity_code_hash; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_auth_mfa_recovery_code_auth_identity_code_hash" ON public.auth_mfa_recovery_code USING btree (auth_identity_id, code_hash) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_mfa_recovery_code_auth_identity_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_auth_mfa_recovery_code_auth_identity_id" ON public.auth_mfa_recovery_code USING btree (auth_identity_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_mfa_recovery_code_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_auth_mfa_recovery_code_deleted_at" ON public.auth_mfa_recovery_code USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_password_reset_token_auth_identity_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_auth_password_reset_token_auth_identity_id" ON public.auth_password_reset_token USING btree (auth_identity_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_password_reset_token_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_auth_password_reset_token_deleted_at" ON public.auth_password_reset_token USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_password_reset_token_expires_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_auth_password_reset_token_expires_at" ON public.auth_password_reset_token USING btree (expires_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_password_reset_token_provider_identity_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_auth_password_reset_token_provider_identity_id" ON public.auth_password_reset_token USING btree (provider_identity_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_password_reset_token_token_hash; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_auth_password_reset_token_token_hash" ON public.auth_password_reset_token USING btree (token_hash) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_verification_auth_identity_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_auth_verification_auth_identity_id" ON public.auth_verification USING btree (auth_identity_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_verification_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_auth_verification_deleted_at" ON public.auth_verification USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_verification_unique_auth_identity_entity_id_entity_typ; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_auth_verification_unique_auth_identity_entity_id_entity_typ" ON public.auth_verification USING btree (auth_identity_id, entity_id, entity_type) WHERE (deleted_at IS NULL);


--
-- Name: IDX_campaign_budget_type; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_campaign_budget_type" ON public.promotion_campaign_budget USING btree (type);


--
-- Name: IDX_capture_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_capture_deleted_at" ON public.capture USING btree (deleted_at);


--
-- Name: IDX_capture_payment_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_capture_payment_id" ON public.capture USING btree (payment_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_address_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_address_deleted_at" ON public.cart_address USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_billing_address_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_billing_address_id" ON public.cart USING btree (billing_address_id) WHERE ((deleted_at IS NULL) AND (billing_address_id IS NOT NULL));


--
-- Name: IDX_cart_credit_line_reference_reference_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_credit_line_reference_reference_id" ON public.credit_line USING btree (reference, reference_id) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_currency_code; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_currency_code" ON public.cart USING btree (currency_code);


--
-- Name: IDX_cart_customer_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_customer_id" ON public.cart USING btree (customer_id) WHERE ((deleted_at IS NULL) AND (customer_id IS NOT NULL));


--
-- Name: IDX_cart_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_deleted_at" ON public.cart USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_id_-4a39f6c9; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_id_-4a39f6c9" ON public.cart_payment_collection USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_id_-71069c16; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_id_-71069c16" ON public.order_cart USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_id_-a9d4a70b; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_id_-a9d4a70b" ON public.cart_promotion USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_line_item_adjustment_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_line_item_adjustment_deleted_at" ON public.cart_line_item_adjustment USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_line_item_adjustment_item_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_line_item_adjustment_item_id" ON public.cart_line_item_adjustment USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_line_item_cart_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_line_item_cart_id" ON public.cart_line_item USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_line_item_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_line_item_deleted_at" ON public.cart_line_item USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_line_item_tax_line_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_line_item_tax_line_deleted_at" ON public.cart_line_item_tax_line USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_line_item_tax_line_item_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_line_item_tax_line_item_id" ON public.cart_line_item_tax_line USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_region_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_region_id" ON public.cart USING btree (region_id) WHERE ((deleted_at IS NULL) AND (region_id IS NOT NULL));


--
-- Name: IDX_cart_sales_channel_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_sales_channel_id" ON public.cart USING btree (sales_channel_id) WHERE ((deleted_at IS NULL) AND (sales_channel_id IS NOT NULL));


--
-- Name: IDX_cart_shipping_address_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_shipping_address_id" ON public.cart USING btree (shipping_address_id) WHERE ((deleted_at IS NULL) AND (shipping_address_id IS NOT NULL));


--
-- Name: IDX_cart_shipping_method_adjustment_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_shipping_method_adjustment_deleted_at" ON public.cart_shipping_method_adjustment USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_shipping_method_adjustment_shipping_method_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_shipping_method_adjustment_shipping_method_id" ON public.cart_shipping_method_adjustment USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_shipping_method_cart_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_shipping_method_cart_id" ON public.cart_shipping_method USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_shipping_method_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_shipping_method_deleted_at" ON public.cart_shipping_method USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_shipping_method_tax_line_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_shipping_method_tax_line_deleted_at" ON public.cart_shipping_method_tax_line USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_shipping_method_tax_line_shipping_method_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_cart_shipping_method_tax_line_shipping_method_id" ON public.cart_shipping_method_tax_line USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_category_handle_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_category_handle_unique" ON public.product_category USING btree (handle) WHERE (deleted_at IS NULL);


--
-- Name: IDX_collection_handle_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_collection_handle_unique" ON public.product_collection USING btree (handle) WHERE (deleted_at IS NULL);


--
-- Name: IDX_credit_line_cart_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_credit_line_cart_id" ON public.credit_line USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_credit_line_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_credit_line_deleted_at" ON public.credit_line USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_address_customer_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_customer_address_customer_id" ON public.customer_address USING btree (customer_id);


--
-- Name: IDX_customer_address_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_customer_address_deleted_at" ON public.customer_address USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_address_unique_customer_billing; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_customer_address_unique_customer_billing" ON public.customer_address USING btree (customer_id) WHERE (is_default_billing = true);


--
-- Name: IDX_customer_address_unique_customer_shipping; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_customer_address_unique_customer_shipping" ON public.customer_address USING btree (customer_id) WHERE (is_default_shipping = true);


--
-- Name: IDX_customer_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_customer_deleted_at" ON public.customer USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_email_has_account_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_customer_email_has_account_unique" ON public.customer USING btree (email, has_account) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_group_customer_customer_group_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_customer_group_customer_customer_group_id" ON public.customer_group_customer USING btree (customer_group_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_group_customer_customer_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_customer_group_customer_customer_id" ON public.customer_group_customer USING btree (customer_id);


--
-- Name: IDX_customer_group_customer_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_customer_group_customer_deleted_at" ON public.customer_group_customer USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_group_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_customer_group_deleted_at" ON public.customer_group USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_group_name_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_customer_group_name_unique" ON public.customer_group USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_id_5cb3a0c0; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_customer_id_5cb3a0c0" ON public.customer_account_holder USING btree (customer_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_deleted_at_-1d67bae40; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_-1d67bae40" ON public.publishable_api_key_sales_channel USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-1e5992737; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_-1e5992737" ON public.location_fulfillment_provider USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-31ea43a; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_-31ea43a" ON public.return_fulfillment USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-4a39f6c9; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_-4a39f6c9" ON public.cart_payment_collection USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-71069c16; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_-71069c16" ON public.order_cart USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-71518339; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_-71518339" ON public.order_promotion USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-85069d44; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_-85069d44" ON public.invite_rbac_role USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-a9d4a70b; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_-a9d4a70b" ON public.cart_promotion USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-e88adb96; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_-e88adb96" ON public.location_fulfillment_set USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-e8d2543e; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_-e8d2543e" ON public.order_fulfillment USING btree (deleted_at);


--
-- Name: IDX_deleted_at_17a262437; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_17a262437" ON public.product_shipping_profile USING btree (deleted_at);


--
-- Name: IDX_deleted_at_17b4c4e35; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_17b4c4e35" ON public.product_variant_inventory_item USING btree (deleted_at);


--
-- Name: IDX_deleted_at_1c934dab0; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_1c934dab0" ON public.region_payment_provider USING btree (deleted_at);


--
-- Name: IDX_deleted_at_20b454295; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_20b454295" ON public.product_sales_channel USING btree (deleted_at);


--
-- Name: IDX_deleted_at_26d06f470; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_26d06f470" ON public.sales_channel_stock_location USING btree (deleted_at);


--
-- Name: IDX_deleted_at_52b23597; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_52b23597" ON public.product_variant_price_set USING btree (deleted_at);


--
-- Name: IDX_deleted_at_5cb3a0c0; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_5cb3a0c0" ON public.customer_account_holder USING btree (deleted_at);


--
-- Name: IDX_deleted_at_64ff0c4c; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_64ff0c4c" ON public.user_rbac_role USING btree (deleted_at);


--
-- Name: IDX_deleted_at_ba32fa9c; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_ba32fa9c" ON public.shipping_option_price_set USING btree (deleted_at);


--
-- Name: IDX_deleted_at_f42b9949; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_deleted_at_f42b9949" ON public.order_payment_collection USING btree (deleted_at);


--
-- Name: IDX_fulfillment_address_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_fulfillment_address_deleted_at" ON public.fulfillment_address USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_fulfillment_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_fulfillment_deleted_at" ON public.fulfillment USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_fulfillment_id_-31ea43a; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_fulfillment_id_-31ea43a" ON public.return_fulfillment USING btree (fulfillment_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_id_-e8d2543e; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_fulfillment_id_-e8d2543e" ON public.order_fulfillment USING btree (fulfillment_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_item_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_fulfillment_item_deleted_at" ON public.fulfillment_item USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_fulfillment_item_fulfillment_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_fulfillment_item_fulfillment_id" ON public.fulfillment_item USING btree (fulfillment_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_item_inventory_item_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_fulfillment_item_inventory_item_id" ON public.fulfillment_item USING btree (inventory_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_item_line_item_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_fulfillment_item_line_item_id" ON public.fulfillment_item USING btree (line_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_label_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_fulfillment_label_deleted_at" ON public.fulfillment_label USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_fulfillment_label_fulfillment_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_fulfillment_label_fulfillment_id" ON public.fulfillment_label USING btree (fulfillment_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_location_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_fulfillment_location_id" ON public.fulfillment USING btree (location_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_provider_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_fulfillment_provider_deleted_at" ON public.fulfillment_provider USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_provider_id_-1e5992737; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_fulfillment_provider_id_-1e5992737" ON public.location_fulfillment_provider USING btree (fulfillment_provider_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_set_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_fulfillment_set_deleted_at" ON public.fulfillment_set USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_fulfillment_set_id_-e88adb96; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_fulfillment_set_id_-e88adb96" ON public.location_fulfillment_set USING btree (fulfillment_set_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_set_name_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_fulfillment_set_name_unique" ON public.fulfillment_set USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_shipping_option_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_fulfillment_shipping_option_id" ON public.fulfillment USING btree (shipping_option_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_geo_zone_city; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_geo_zone_city" ON public.geo_zone USING btree (city) WHERE ((deleted_at IS NULL) AND (city IS NOT NULL));


--
-- Name: IDX_geo_zone_country_code; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_geo_zone_country_code" ON public.geo_zone USING btree (country_code) WHERE (deleted_at IS NULL);


--
-- Name: IDX_geo_zone_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_geo_zone_deleted_at" ON public.geo_zone USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_geo_zone_province_code; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_geo_zone_province_code" ON public.geo_zone USING btree (province_code) WHERE ((deleted_at IS NULL) AND (province_code IS NOT NULL));


--
-- Name: IDX_geo_zone_service_zone_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_geo_zone_service_zone_id" ON public.geo_zone USING btree (service_zone_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_id_-1d67bae40; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_-1d67bae40" ON public.publishable_api_key_sales_channel USING btree (id);


--
-- Name: IDX_id_-1e5992737; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_-1e5992737" ON public.location_fulfillment_provider USING btree (id);


--
-- Name: IDX_id_-31ea43a; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_-31ea43a" ON public.return_fulfillment USING btree (id);


--
-- Name: IDX_id_-4a39f6c9; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_-4a39f6c9" ON public.cart_payment_collection USING btree (id);


--
-- Name: IDX_id_-71069c16; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_-71069c16" ON public.order_cart USING btree (id);


--
-- Name: IDX_id_-71518339; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_-71518339" ON public.order_promotion USING btree (id);


--
-- Name: IDX_id_-85069d44; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_-85069d44" ON public.invite_rbac_role USING btree (id);


--
-- Name: IDX_id_-a9d4a70b; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_-a9d4a70b" ON public.cart_promotion USING btree (id);


--
-- Name: IDX_id_-e88adb96; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_-e88adb96" ON public.location_fulfillment_set USING btree (id);


--
-- Name: IDX_id_-e8d2543e; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_-e8d2543e" ON public.order_fulfillment USING btree (id);


--
-- Name: IDX_id_17a262437; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_17a262437" ON public.product_shipping_profile USING btree (id);


--
-- Name: IDX_id_17b4c4e35; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_17b4c4e35" ON public.product_variant_inventory_item USING btree (id);


--
-- Name: IDX_id_1c934dab0; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_1c934dab0" ON public.region_payment_provider USING btree (id);


--
-- Name: IDX_id_20b454295; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_20b454295" ON public.product_sales_channel USING btree (id);


--
-- Name: IDX_id_26d06f470; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_26d06f470" ON public.sales_channel_stock_location USING btree (id);


--
-- Name: IDX_id_52b23597; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_52b23597" ON public.product_variant_price_set USING btree (id);


--
-- Name: IDX_id_5cb3a0c0; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_5cb3a0c0" ON public.customer_account_holder USING btree (id);


--
-- Name: IDX_id_64ff0c4c; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_64ff0c4c" ON public.user_rbac_role USING btree (id);


--
-- Name: IDX_id_ba32fa9c; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_ba32fa9c" ON public.shipping_option_price_set USING btree (id);


--
-- Name: IDX_id_f42b9949; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_id_f42b9949" ON public.order_payment_collection USING btree (id);


--
-- Name: IDX_image_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_image_deleted_at" ON public.image USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_image_product_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_image_product_id" ON public.image USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_inventory_item_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_inventory_item_deleted_at" ON public.inventory_item USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_inventory_item_id_17b4c4e35; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_inventory_item_id_17b4c4e35" ON public.product_variant_inventory_item USING btree (inventory_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_inventory_item_sku; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_inventory_item_sku" ON public.inventory_item USING btree (sku) WHERE (deleted_at IS NULL);


--
-- Name: IDX_inventory_level_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_inventory_level_deleted_at" ON public.inventory_level USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_inventory_level_inventory_item_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_inventory_level_inventory_item_id" ON public.inventory_level USING btree (inventory_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_inventory_level_location_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_inventory_level_location_id" ON public.inventory_level USING btree (location_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_inventory_level_location_id_inventory_item_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_inventory_level_location_id_inventory_item_id" ON public.inventory_level USING btree (inventory_item_id, location_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_invite_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_invite_deleted_at" ON public.invite USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_invite_email_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_invite_email_unique" ON public.invite USING btree (email) WHERE (deleted_at IS NULL);


--
-- Name: IDX_invite_id_-85069d44; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_invite_id_-85069d44" ON public.invite_rbac_role USING btree (invite_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_invite_token; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_invite_token" ON public.invite USING btree (token) WHERE (deleted_at IS NULL);


--
-- Name: IDX_layout_configuration_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_layout_configuration_deleted_at" ON public.layout_configuration USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_layout_configuration_zone_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_layout_configuration_zone_unique" ON public.layout_configuration USING btree (zone) WHERE ((is_system_default = true) AND (deleted_at IS NULL));


--
-- Name: IDX_layout_configuration_zone_user_id_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_layout_configuration_zone_user_id_unique" ON public.layout_configuration USING btree (zone, user_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_line_item_adjustment_promotion_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_line_item_adjustment_promotion_id" ON public.cart_line_item_adjustment USING btree (promotion_id) WHERE ((deleted_at IS NULL) AND (promotion_id IS NOT NULL));


--
-- Name: IDX_line_item_product_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_line_item_product_id" ON public.cart_line_item USING btree (product_id) WHERE ((deleted_at IS NULL) AND (product_id IS NOT NULL));


--
-- Name: IDX_line_item_product_type_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_line_item_product_type_id" ON public.order_line_item USING btree (product_type_id) WHERE ((deleted_at IS NULL) AND (product_type_id IS NOT NULL));


--
-- Name: IDX_line_item_tax_line_tax_rate_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_line_item_tax_line_tax_rate_id" ON public.cart_line_item_tax_line USING btree (tax_rate_id) WHERE ((deleted_at IS NULL) AND (tax_rate_id IS NOT NULL));


--
-- Name: IDX_line_item_variant_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_line_item_variant_id" ON public.cart_line_item USING btree (variant_id) WHERE ((deleted_at IS NULL) AND (variant_id IS NOT NULL));


--
-- Name: IDX_notification_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_notification_deleted_at" ON public.notification USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_notification_idempotency_key_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_notification_idempotency_key_unique" ON public.notification USING btree (idempotency_key) WHERE (deleted_at IS NULL);


--
-- Name: IDX_notification_provider_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_notification_provider_deleted_at" ON public.notification_provider USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_notification_provider_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_notification_provider_id" ON public.notification USING btree (provider_id);


--
-- Name: IDX_notification_receiver_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_notification_receiver_id" ON public.notification USING btree (receiver_id);


--
-- Name: IDX_option_value_option_id_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_option_value_option_id_unique" ON public.product_option_value USING btree (option_id, value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_address_customer_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_address_customer_id" ON public.order_address USING btree (customer_id);


--
-- Name: IDX_order_address_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_address_deleted_at" ON public.order_address USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_billing_address_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_billing_address_id" ON public."order" USING btree (billing_address_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_change_action_claim_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_change_action_claim_id" ON public.order_change_action USING btree (claim_id) WHERE ((claim_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_change_action_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_change_action_deleted_at" ON public.order_change_action USING btree (deleted_at);


--
-- Name: IDX_order_change_action_exchange_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_change_action_exchange_id" ON public.order_change_action USING btree (exchange_id) WHERE ((exchange_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_change_action_order_change_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_change_action_order_change_id" ON public.order_change_action USING btree (order_change_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_change_action_order_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_change_action_order_id" ON public.order_change_action USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_change_action_ordering; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_change_action_ordering" ON public.order_change_action USING btree (ordering) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_change_action_return_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_change_action_return_id" ON public.order_change_action USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_change_change_type; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_change_change_type" ON public.order_change USING btree (change_type);


--
-- Name: IDX_order_change_claim_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_change_claim_id" ON public.order_change USING btree (claim_id) WHERE ((claim_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_change_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_change_deleted_at" ON public.order_change USING btree (deleted_at);


--
-- Name: IDX_order_change_exchange_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_change_exchange_id" ON public.order_change USING btree (exchange_id) WHERE ((exchange_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_change_order_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_change_order_id" ON public.order_change USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_change_order_id_version; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_change_order_id_version" ON public.order_change USING btree (order_id, version);


--
-- Name: IDX_order_change_return_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_change_return_id" ON public.order_change USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_change_status; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_change_status" ON public.order_change USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_change_version; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_change_version" ON public.order_change USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_claim_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_claim_deleted_at" ON public.order_claim USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_claim_display_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_claim_display_id" ON public.order_claim USING btree (display_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_claim_item_claim_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_claim_item_claim_id" ON public.order_claim_item USING btree (claim_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_claim_item_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_claim_item_deleted_at" ON public.order_claim_item USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_claim_item_image_claim_item_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_claim_item_image_claim_item_id" ON public.order_claim_item_image USING btree (claim_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_claim_item_image_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_claim_item_image_deleted_at" ON public.order_claim_item_image USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_order_claim_item_item_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_claim_item_item_id" ON public.order_claim_item USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_claim_order_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_claim_order_id" ON public.order_claim USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_claim_return_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_claim_return_id" ON public.order_claim USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_credit_line_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_credit_line_deleted_at" ON public.order_credit_line USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_order_credit_line_order_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_credit_line_order_id" ON public.order_credit_line USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_credit_line_order_id_version; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_credit_line_order_id_version" ON public.order_credit_line USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_currency_code; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_currency_code" ON public."order" USING btree (currency_code) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_custom_display_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_order_custom_display_id" ON public."order" USING btree (custom_display_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_customer_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_customer_id" ON public."order" USING btree (customer_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_deleted_at" ON public."order" USING btree (deleted_at);


--
-- Name: IDX_order_display_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_display_id" ON public."order" USING btree (display_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_exchange_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_exchange_deleted_at" ON public.order_exchange USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_exchange_display_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_exchange_display_id" ON public.order_exchange USING btree (display_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_exchange_item_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_exchange_item_deleted_at" ON public.order_exchange_item USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_exchange_item_exchange_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_exchange_item_exchange_id" ON public.order_exchange_item USING btree (exchange_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_exchange_item_item_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_exchange_item_item_id" ON public.order_exchange_item USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_exchange_order_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_exchange_order_id" ON public.order_exchange USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_exchange_return_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_exchange_return_id" ON public.order_exchange USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_id_-71069c16; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_id_-71069c16" ON public.order_cart USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_id_-71518339; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_id_-71518339" ON public.order_promotion USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_id_-e8d2543e; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_id_-e8d2543e" ON public.order_fulfillment USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_id_f42b9949; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_id_f42b9949" ON public.order_payment_collection USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_is_draft_order; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_is_draft_order" ON public."order" USING btree (is_draft_order) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_item_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_item_deleted_at" ON public.order_item USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_order_item_item_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_item_item_id" ON public.order_item USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_item_order_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_item_order_id" ON public.order_item USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_item_order_id_version; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_item_order_id_version" ON public.order_item USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_line_item_adjustment_item_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_line_item_adjustment_item_id" ON public.order_line_item_adjustment USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_line_item_product_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_line_item_product_id" ON public.order_line_item USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_line_item_tax_line_item_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_line_item_tax_line_item_id" ON public.order_line_item_tax_line USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_line_item_variant_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_line_item_variant_id" ON public.order_line_item USING btree (variant_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_region_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_region_id" ON public."order" USING btree (region_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_sales_channel_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_sales_channel_id" ON public."order" USING btree (sales_channel_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_address_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_shipping_address_id" ON public."order" USING btree (shipping_address_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_claim_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_shipping_claim_id" ON public.order_shipping USING btree (claim_id) WHERE ((claim_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_shipping_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_shipping_deleted_at" ON public.order_shipping USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_order_shipping_exchange_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_shipping_exchange_id" ON public.order_shipping USING btree (exchange_id) WHERE ((exchange_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_shipping_item_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_shipping_item_id" ON public.order_shipping USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_method_adjustment_shipping_method_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_shipping_method_adjustment_shipping_method_id" ON public.order_shipping_method_adjustment USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_method_adjustment_version_shipping_method; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_order_shipping_method_adjustment_version_shipping_method" ON public.order_shipping_method_adjustment USING btree (version, shipping_method_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_method_shipping_option_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_shipping_method_shipping_option_id" ON public.order_shipping_method USING btree (shipping_option_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_method_tax_line_shipping_method_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_shipping_method_tax_line_shipping_method_id" ON public.order_shipping_method_tax_line USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_order_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_shipping_order_id" ON public.order_shipping USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_order_id_version; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_shipping_order_id_version" ON public.order_shipping USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_return_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_shipping_return_id" ON public.order_shipping USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_shipping_shipping_method_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_shipping_shipping_method_id" ON public.order_shipping USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_summary_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_summary_deleted_at" ON public.order_summary USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_order_summary_order_id_version; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_summary_order_id_version" ON public.order_summary USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_transaction_claim_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_transaction_claim_id" ON public.order_transaction USING btree (claim_id) WHERE ((claim_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_transaction_currency_code; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_transaction_currency_code" ON public.order_transaction USING btree (currency_code) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_transaction_exchange_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_transaction_exchange_id" ON public.order_transaction USING btree (exchange_id) WHERE ((exchange_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_transaction_order_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_transaction_order_id" ON public.order_transaction USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_transaction_order_id_version; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_transaction_order_id_version" ON public.order_transaction USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_transaction_reference_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_transaction_reference_id" ON public.order_transaction USING btree (reference_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_transaction_return_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_order_transaction_return_id" ON public.order_transaction USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_payment_collection_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_payment_collection_deleted_at" ON public.payment_collection USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_payment_collection_id_-4a39f6c9; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_payment_collection_id_-4a39f6c9" ON public.cart_payment_collection USING btree (payment_collection_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payment_collection_id_f42b9949; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_payment_collection_id_f42b9949" ON public.order_payment_collection USING btree (payment_collection_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payment_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_payment_deleted_at" ON public.payment USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_payment_payment_collection_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_payment_payment_collection_id" ON public.payment USING btree (payment_collection_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payment_payment_session_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_payment_payment_session_id" ON public.payment USING btree (payment_session_id);


--
-- Name: IDX_payment_payment_session_id_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_payment_payment_session_id_unique" ON public.payment USING btree (payment_session_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payment_provider_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_payment_provider_deleted_at" ON public.payment_provider USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payment_provider_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_payment_provider_id" ON public.payment USING btree (provider_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payment_provider_id_1c934dab0; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_payment_provider_id_1c934dab0" ON public.region_payment_provider USING btree (payment_provider_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payment_session_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_payment_session_deleted_at" ON public.payment_session USING btree (deleted_at);


--
-- Name: IDX_payment_session_payment_collection_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_payment_session_payment_collection_id" ON public.payment_session USING btree (payment_collection_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_currency_code; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_currency_code" ON public.price USING btree (currency_code) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_deleted_at" ON public.price USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_price_list_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_list_deleted_at" ON public.price_list USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_price_list_id_status_starts_at_ends_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_list_id_status_starts_at_ends_at" ON public.price_list USING btree (id, status, starts_at, ends_at) WHERE ((deleted_at IS NULL) AND (status = 'active'::text));


--
-- Name: IDX_price_list_rule_attribute; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_list_rule_attribute" ON public.price_list_rule USING btree (attribute) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_list_rule_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_list_rule_deleted_at" ON public.price_list_rule USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_price_list_rule_price_list_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_list_rule_price_list_id" ON public.price_list_rule USING btree (price_list_id) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_price_list_rule_value; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_list_rule_value" ON public.price_list_rule USING gin (value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_preference_attribute_value; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_price_preference_attribute_value" ON public.price_preference USING btree (attribute, value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_preference_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_preference_deleted_at" ON public.price_preference USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_price_price_list_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_price_list_id" ON public.price USING btree (price_list_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_price_set_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_price_set_id" ON public.price USING btree (price_set_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_rule_attribute; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_rule_attribute" ON public.price_rule USING btree (attribute) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_rule_attribute_value; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_rule_attribute_value" ON public.price_rule USING btree (attribute, value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_rule_attribute_value_price_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_rule_attribute_value_price_id" ON public.price_rule USING btree (attribute, value, price_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_rule_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_rule_deleted_at" ON public.price_rule USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_price_rule_operator; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_rule_operator" ON public.price_rule USING btree (operator);


--
-- Name: IDX_price_rule_operator_value; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_rule_operator_value" ON public.price_rule USING btree (operator, value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_rule_price_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_rule_price_id" ON public.price_rule USING btree (price_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_rule_price_id_attribute_operator_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_price_rule_price_id_attribute_operator_unique" ON public.price_rule USING btree (price_id, attribute, operator) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_set_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_set_deleted_at" ON public.price_set USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_price_set_id_52b23597; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_set_id_52b23597" ON public.product_variant_price_set USING btree (price_set_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_set_id_ba32fa9c; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_price_set_id_ba32fa9c" ON public.shipping_option_price_set USING btree (price_set_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_category_parent_category_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_category_parent_category_id" ON public.product_category USING btree (parent_category_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_category_path; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_category_path" ON public.product_category USING btree (mpath) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_collection_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_collection_deleted_at" ON public.product_collection USING btree (deleted_at);


--
-- Name: IDX_product_collection_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_collection_id" ON public.product USING btree (collection_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_deleted_at" ON public.product USING btree (deleted_at);


--
-- Name: IDX_product_handle_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_product_handle_unique" ON public.product USING btree (handle) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_id_17a262437; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_id_17a262437" ON public.product_shipping_profile USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_id_20b454295; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_id_20b454295" ON public.product_sales_channel USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_image_rank; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_image_rank" ON public.image USING btree (rank) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_image_rank_product_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_image_rank_product_id" ON public.image USING btree (rank, product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_image_url; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_image_url" ON public.image USING btree (url) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_image_url_rank_product_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_image_url_rank_product_id" ON public.image USING btree (url, rank, product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_option_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_option_deleted_at" ON public.product_option USING btree (deleted_at);


--
-- Name: IDX_product_option_global_title_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_product_option_global_title_unique" ON public.product_option USING btree (title) WHERE ((deleted_at IS NULL) AND (is_exclusive = false));


--
-- Name: IDX_product_option_value_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_option_value_deleted_at" ON public.product_option_value USING btree (deleted_at);


--
-- Name: IDX_product_option_value_option_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_option_value_option_id" ON public.product_option_value USING btree (option_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_product_option_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_product_option_deleted_at" ON public.product_product_option USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_product_option_product_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_product_option_product_id" ON public.product_product_option USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_product_option_product_option_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_product_option_product_option_id" ON public.product_product_option USING btree (product_option_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_product_option_value_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_product_option_value_deleted_at" ON public.product_product_option_value USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_product_option_value_product_option_value_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_product_option_value_product_option_value_id" ON public.product_product_option_value USING btree (product_option_value_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_product_option_value_product_product_option_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_product_option_value_product_product_option_id" ON public.product_product_option_value USING btree (product_product_option_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_product_option_value_product_product_option_id_fk; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_product_option_value_product_product_option_id_fk" ON public.product_product_option_value USING btree (product_product_option_id);


--
-- Name: IDX_product_status; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_status" ON public.product USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_tag_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_tag_deleted_at" ON public.product_tag USING btree (deleted_at);


--
-- Name: IDX_product_type_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_type_deleted_at" ON public.product_type USING btree (deleted_at);


--
-- Name: IDX_product_type_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_type_id" ON public.product USING btree (type_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_barcode_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_product_variant_barcode_unique" ON public.product_variant USING btree (barcode) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_variant_deleted_at" ON public.product_variant USING btree (deleted_at);


--
-- Name: IDX_product_variant_ean_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_product_variant_ean_unique" ON public.product_variant USING btree (ean) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_id_product_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_variant_id_product_id" ON public.product_variant USING btree (id, product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_product_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_variant_product_id" ON public.product_variant USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_product_image_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_variant_product_image_deleted_at" ON public.product_variant_product_image USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_product_image_image_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_variant_product_image_image_id" ON public.product_variant_product_image USING btree (image_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_product_image_variant_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_product_variant_product_image_variant_id" ON public.product_variant_product_image USING btree (variant_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_sku_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_product_variant_sku_unique" ON public.product_variant USING btree (sku) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_upc_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_product_variant_upc_unique" ON public.product_variant USING btree (upc) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_application_method_currency_code; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_application_method_currency_code" ON public.promotion_application_method USING btree (currency_code) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_promotion_application_method_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_application_method_deleted_at" ON public.promotion_application_method USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_application_method_promotion_id_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_promotion_application_method_promotion_id_unique" ON public.promotion_application_method USING btree (promotion_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_campaign_budget_campaign_id_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_promotion_campaign_budget_campaign_id_unique" ON public.promotion_campaign_budget USING btree (campaign_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_campaign_budget_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_campaign_budget_deleted_at" ON public.promotion_campaign_budget USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_campaign_budget_usage_attribute_value_budget_id_u; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_promotion_campaign_budget_usage_attribute_value_budget_id_u" ON public.promotion_campaign_budget_usage USING btree (attribute_value, budget_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_campaign_budget_usage_budget_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_campaign_budget_usage_budget_id" ON public.promotion_campaign_budget_usage USING btree (budget_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_campaign_budget_usage_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_campaign_budget_usage_deleted_at" ON public.promotion_campaign_budget_usage USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_campaign_campaign_identifier_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_promotion_campaign_campaign_identifier_unique" ON public.promotion_campaign USING btree (campaign_identifier) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_campaign_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_campaign_deleted_at" ON public.promotion_campaign USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_campaign_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_campaign_id" ON public.promotion USING btree (campaign_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_deleted_at" ON public.promotion USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_id_-71518339; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_id_-71518339" ON public.order_promotion USING btree (promotion_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_id_-a9d4a70b; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_id_-a9d4a70b" ON public.cart_promotion USING btree (promotion_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_is_automatic; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_is_automatic" ON public.promotion USING btree (is_automatic) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_rule_attribute; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_rule_attribute" ON public.promotion_rule USING btree (attribute);


--
-- Name: IDX_promotion_rule_attribute_operator; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_rule_attribute_operator" ON public.promotion_rule USING btree (attribute, operator) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_rule_attribute_operator_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_rule_attribute_operator_id" ON public.promotion_rule USING btree (operator, attribute, id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_rule_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_rule_deleted_at" ON public.promotion_rule USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_rule_operator; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_rule_operator" ON public.promotion_rule USING btree (operator);


--
-- Name: IDX_promotion_rule_value_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_rule_value_deleted_at" ON public.promotion_rule_value USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_rule_value_promotion_rule_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_rule_value_promotion_rule_id" ON public.promotion_rule_value USING btree (promotion_rule_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_rule_value_rule_id_value; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_rule_value_rule_id_value" ON public.promotion_rule_value USING btree (promotion_rule_id, value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_rule_value_value; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_rule_value_value" ON public.promotion_rule_value USING btree (value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_status; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_status" ON public.promotion USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_type; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_promotion_type" ON public.promotion USING btree (type);


--
-- Name: IDX_property_label_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_property_label_deleted_at" ON public.property_label USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_property_label_entity; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_property_label_entity" ON public.property_label USING btree (entity) WHERE (deleted_at IS NULL);


--
-- Name: IDX_property_label_entity_property_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_property_label_entity_property_unique" ON public.property_label USING btree (entity, property) WHERE (deleted_at IS NULL);


--
-- Name: IDX_provider_identity_auth_identity_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_provider_identity_auth_identity_id" ON public.provider_identity USING btree (auth_identity_id);


--
-- Name: IDX_provider_identity_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_provider_identity_deleted_at" ON public.provider_identity USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_provider_identity_provider_entity_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_provider_identity_provider_entity_id" ON public.provider_identity USING btree (entity_id, provider);


--
-- Name: IDX_publishable_key_id_-1d67bae40; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_publishable_key_id_-1d67bae40" ON public.publishable_api_key_sales_channel USING btree (publishable_key_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_role_id_-85069d44; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_rbac_role_id_-85069d44" ON public.invite_rbac_role USING btree (rbac_role_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_role_id_64ff0c4c; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_rbac_role_id_64ff0c4c" ON public.user_rbac_role USING btree (rbac_role_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_refund_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_refund_deleted_at" ON public.refund USING btree (deleted_at);


--
-- Name: IDX_refund_payment_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_refund_payment_id" ON public.refund USING btree (payment_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_refund_payment_id_idempotency_key_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_refund_payment_id_idempotency_key_unique" ON public.refund USING btree (payment_id, idempotency_key) WHERE ((idempotency_key IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_refund_reason_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_refund_reason_deleted_at" ON public.refund_reason USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_refund_refund_reason_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_refund_refund_reason_id" ON public.refund USING btree (refund_reason_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_region_country_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_region_country_deleted_at" ON public.region_country USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_region_country_region_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_region_country_region_id" ON public.region_country USING btree (region_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_region_country_region_id_iso_2_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_region_country_region_id_iso_2_unique" ON public.region_country USING btree (region_id, iso_2);


--
-- Name: IDX_region_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_region_deleted_at" ON public.region USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_region_id_1c934dab0; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_region_id_1c934dab0" ON public.region_payment_provider USING btree (region_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_reservation_item_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_reservation_item_deleted_at" ON public.reservation_item USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_reservation_item_inventory_item_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_reservation_item_inventory_item_id" ON public.reservation_item USING btree (inventory_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_reservation_item_line_item_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_reservation_item_line_item_id" ON public.reservation_item USING btree (line_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_reservation_item_location_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_reservation_item_location_id" ON public.reservation_item USING btree (location_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_claim_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_return_claim_id" ON public.return USING btree (claim_id) WHERE ((claim_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_return_display_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_return_display_id" ON public.return USING btree (display_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_exchange_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_return_exchange_id" ON public.return USING btree (exchange_id) WHERE ((exchange_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_return_id_-31ea43a; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_return_id_-31ea43a" ON public.return_fulfillment USING btree (return_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_item_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_return_item_deleted_at" ON public.return_item USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_item_item_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_return_item_item_id" ON public.return_item USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_item_reason_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_return_item_reason_id" ON public.return_item USING btree (reason_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_item_return_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_return_item_return_id" ON public.return_item USING btree (return_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_order_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_return_order_id" ON public.return USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_reason_parent_return_reason_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_return_reason_parent_return_reason_id" ON public.return_reason USING btree (parent_return_reason_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_reason_value; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_return_reason_value" ON public.return_reason USING btree (value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_sales_channel_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_sales_channel_deleted_at" ON public.sales_channel USING btree (deleted_at);


--
-- Name: IDX_sales_channel_id_-1d67bae40; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_sales_channel_id_-1d67bae40" ON public.publishable_api_key_sales_channel USING btree (sales_channel_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_sales_channel_id_20b454295; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_sales_channel_id_20b454295" ON public.product_sales_channel USING btree (sales_channel_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_sales_channel_id_26d06f470; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_sales_channel_id_26d06f470" ON public.sales_channel_stock_location USING btree (sales_channel_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_search_index_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_search_index_deleted_at" ON public.search_index USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_search_index_name; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_search_index_name" ON public.search_index USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: IDX_search_index_sync_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_search_index_sync_deleted_at" ON public.search_index_sync USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_search_index_sync_job_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_search_index_sync_job_id" ON public.search_index_sync USING btree (job_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_search_index_sync_search_index_version_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_search_index_sync_search_index_version_id" ON public.search_index_sync USING btree (search_index_version_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_search_index_version_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_search_index_version_deleted_at" ON public.search_index_version USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_search_index_version_search_index_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_search_index_version_search_index_id" ON public.search_index_version USING btree (search_index_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_search_index_version_search_index_id_version; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_search_index_version_search_index_id_version" ON public.search_index_version USING btree (search_index_id, version) WHERE (deleted_at IS NULL);


--
-- Name: IDX_service_zone_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_service_zone_deleted_at" ON public.service_zone USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_service_zone_fulfillment_set_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_service_zone_fulfillment_set_id" ON public.service_zone USING btree (fulfillment_set_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_service_zone_name_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_service_zone_name_unique" ON public.service_zone USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: IDX_shipping_method_adjustment_promotion_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_shipping_method_adjustment_promotion_id" ON public.cart_shipping_method_adjustment USING btree (promotion_id) WHERE ((deleted_at IS NULL) AND (promotion_id IS NOT NULL));


--
-- Name: IDX_shipping_method_option_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_shipping_method_option_id" ON public.cart_shipping_method USING btree (shipping_option_id) WHERE ((deleted_at IS NULL) AND (shipping_option_id IS NOT NULL));


--
-- Name: IDX_shipping_method_tax_line_tax_rate_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_shipping_method_tax_line_tax_rate_id" ON public.cart_shipping_method_tax_line USING btree (tax_rate_id) WHERE ((deleted_at IS NULL) AND (tax_rate_id IS NOT NULL));


--
-- Name: IDX_shipping_option_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_shipping_option_deleted_at" ON public.shipping_option USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_shipping_option_id_ba32fa9c; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_shipping_option_id_ba32fa9c" ON public.shipping_option_price_set USING btree (shipping_option_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_shipping_option_provider_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_shipping_option_provider_id" ON public.shipping_option USING btree (provider_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_shipping_option_rule_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_shipping_option_rule_deleted_at" ON public.shipping_option_rule USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_shipping_option_rule_shipping_option_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_shipping_option_rule_shipping_option_id" ON public.shipping_option_rule USING btree (shipping_option_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_shipping_option_service_zone_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_shipping_option_service_zone_id" ON public.shipping_option USING btree (service_zone_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_shipping_option_shipping_option_type_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_shipping_option_shipping_option_type_id" ON public.shipping_option USING btree (shipping_option_type_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_shipping_option_shipping_profile_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_shipping_option_shipping_profile_id" ON public.shipping_option USING btree (shipping_profile_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_shipping_option_type_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_shipping_option_type_deleted_at" ON public.shipping_option_type USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_shipping_profile_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_shipping_profile_deleted_at" ON public.shipping_profile USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_shipping_profile_id_17a262437; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_shipping_profile_id_17a262437" ON public.product_shipping_profile USING btree (shipping_profile_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_shipping_profile_name_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_shipping_profile_name_unique" ON public.shipping_profile USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: IDX_single_default_region; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_single_default_region" ON public.tax_rate USING btree (tax_region_id) WHERE ((is_default = true) AND (deleted_at IS NULL));


--
-- Name: IDX_stock_location_address_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_stock_location_address_deleted_at" ON public.stock_location_address USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_stock_location_address_id_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_stock_location_address_id_unique" ON public.stock_location USING btree (address_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_stock_location_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_stock_location_deleted_at" ON public.stock_location USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_stock_location_id_-1e5992737; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_stock_location_id_-1e5992737" ON public.location_fulfillment_provider USING btree (stock_location_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_stock_location_id_-e88adb96; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_stock_location_id_-e88adb96" ON public.location_fulfillment_set USING btree (stock_location_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_stock_location_id_26d06f470; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_stock_location_id_26d06f470" ON public.sales_channel_stock_location USING btree (stock_location_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_store_currency_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_store_currency_deleted_at" ON public.store_currency USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_store_currency_store_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_store_currency_store_id" ON public.store_currency USING btree (store_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_store_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_store_deleted_at" ON public.store USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_store_locale_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_store_locale_deleted_at" ON public.store_locale USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_store_locale_store_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_store_locale_store_id" ON public.store_locale USING btree (store_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_tag_value_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_tag_value_unique" ON public.product_tag USING btree (value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_tax_provider_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_tax_provider_deleted_at" ON public.tax_provider USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_tax_rate_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_tax_rate_deleted_at" ON public.tax_rate USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_tax_rate_rule_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_tax_rate_rule_deleted_at" ON public.tax_rate_rule USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_tax_rate_rule_reference_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_tax_rate_rule_reference_id" ON public.tax_rate_rule USING btree (reference_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_tax_rate_rule_tax_rate_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_tax_rate_rule_tax_rate_id" ON public.tax_rate_rule USING btree (tax_rate_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_tax_rate_rule_unique_rate_reference; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_tax_rate_rule_unique_rate_reference" ON public.tax_rate_rule USING btree (tax_rate_id, reference_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_tax_rate_tax_region_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_tax_rate_tax_region_id" ON public.tax_rate USING btree (tax_region_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_tax_region_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_tax_region_deleted_at" ON public.tax_region USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_tax_region_parent_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_tax_region_parent_id" ON public.tax_region USING btree (parent_id);


--
-- Name: IDX_tax_region_provider_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_tax_region_provider_id" ON public.tax_region USING btree (provider_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_tax_region_unique_country_nullable_province; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_tax_region_unique_country_nullable_province" ON public.tax_region USING btree (country_code) WHERE ((province_code IS NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_tax_region_unique_country_province; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_tax_region_unique_country_province" ON public.tax_region USING btree (country_code, province_code) WHERE (deleted_at IS NULL);


--
-- Name: IDX_type_value_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_type_value_unique" ON public.product_type USING btree (value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_unique_promotion_code; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_unique_promotion_code" ON public.promotion USING btree (code) WHERE (deleted_at IS NULL);


--
-- Name: IDX_user_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_user_deleted_at" ON public."user" USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_user_email_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_user_email_unique" ON public."user" USING btree (email) WHERE (deleted_at IS NULL);


--
-- Name: IDX_user_id_64ff0c4c; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_user_id_64ff0c4c" ON public.user_rbac_role USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_user_preference_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_user_preference_deleted_at" ON public.user_preference USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_user_preference_user_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_user_preference_user_id" ON public.user_preference USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_user_preference_user_id_key_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_user_preference_user_id_key_unique" ON public.user_preference USING btree (user_id, key) WHERE (deleted_at IS NULL);


--
-- Name: IDX_variant_id_17b4c4e35; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_variant_id_17b4c4e35" ON public.product_variant_inventory_item USING btree (variant_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_variant_id_52b23597; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_variant_id_52b23597" ON public.product_variant_price_set USING btree (variant_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_view_configuration_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_view_configuration_deleted_at" ON public.view_configuration USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_view_configuration_entity_is_system_default; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_view_configuration_entity_is_system_default" ON public.view_configuration USING btree (entity, is_system_default) WHERE (deleted_at IS NULL);


--
-- Name: IDX_view_configuration_entity_user_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_view_configuration_entity_user_id" ON public.view_configuration USING btree (entity, user_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_view_configuration_user_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_view_configuration_user_id" ON public.view_configuration USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_deleted_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_workflow_execution_deleted_at" ON public.workflow_execution USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_workflow_execution_id" ON public.workflow_execution USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_retention_time_updated_at_state; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_workflow_execution_retention_time_updated_at_state" ON public.workflow_execution USING btree (retention_time, updated_at, state) WHERE ((deleted_at IS NULL) AND (retention_time IS NOT NULL));


--
-- Name: IDX_workflow_execution_run_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_workflow_execution_run_id" ON public.workflow_execution USING btree (run_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_state; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_workflow_execution_state" ON public.workflow_execution USING btree (state) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_state_updated_at; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_workflow_execution_state_updated_at" ON public.workflow_execution USING btree (state, updated_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_transaction_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_workflow_execution_transaction_id" ON public.workflow_execution USING btree (transaction_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_updated_at_retention_time; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_workflow_execution_updated_at_retention_time" ON public.workflow_execution USING btree (updated_at, retention_time) WHERE ((deleted_at IS NULL) AND (retention_time IS NOT NULL) AND ((state)::text = ANY ((ARRAY['done'::character varying, 'failed'::character varying, 'reverted'::character varying])::text[])));


--
-- Name: IDX_workflow_execution_workflow_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_workflow_execution_workflow_id" ON public.workflow_execution USING btree (workflow_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_workflow_id_transaction_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX "IDX_workflow_execution_workflow_id_transaction_id" ON public.workflow_execution USING btree (workflow_id, transaction_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_workflow_id_transaction_id_run_id_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX "IDX_workflow_execution_workflow_id_transaction_id_run_id_unique" ON public.workflow_execution USING btree (workflow_id, transaction_id, run_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_custom_design_cart_id; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX idx_custom_design_cart_id ON public.custom_design USING btree (cart_id);


--
-- Name: idx_script_name_unique; Type: INDEX; Schema: public; Owner: medusa
--

CREATE UNIQUE INDEX idx_script_name_unique ON public.script_migrations USING btree (script_name);


--
-- Name: search_pg_product_v1_fts_idx; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX search_pg_product_v1_fts_idx ON public.search_pg_product_v1 USING gin (search_vector);


--
-- Name: search_pg_product_v1_indexed_idx; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX search_pg_product_v1_indexed_idx ON public.search_pg_product_v1 USING gin (indexed jsonb_path_ops);


--
-- Name: search_pg_product_v1_trgm_idx; Type: INDEX; Schema: public; Owner: medusa
--

CREATE INDEX search_pg_product_v1_trgm_idx ON public.search_pg_product_v1 USING gin (search_text public.gin_trgm_ops);


--
-- Name: tax_rate_rule FK_tax_rate_rule_tax_rate_id; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.tax_rate_rule
    ADD CONSTRAINT "FK_tax_rate_rule_tax_rate_id" FOREIGN KEY (tax_rate_id) REFERENCES public.tax_rate(id) ON DELETE CASCADE;


--
-- Name: tax_rate FK_tax_rate_tax_region_id; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.tax_rate
    ADD CONSTRAINT "FK_tax_rate_tax_region_id" FOREIGN KEY (tax_region_id) REFERENCES public.tax_region(id) ON DELETE CASCADE;


--
-- Name: tax_region FK_tax_region_parent_id; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.tax_region
    ADD CONSTRAINT "FK_tax_region_parent_id" FOREIGN KEY (parent_id) REFERENCES public.tax_region(id) ON DELETE CASCADE;


--
-- Name: tax_region FK_tax_region_provider_id; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.tax_region
    ADD CONSTRAINT "FK_tax_region_provider_id" FOREIGN KEY (provider_id) REFERENCES public.tax_provider(id) ON DELETE SET NULL;


--
-- Name: application_method_buy_rules application_method_buy_rules_application_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.application_method_buy_rules
    ADD CONSTRAINT application_method_buy_rules_application_method_id_foreign FOREIGN KEY (application_method_id) REFERENCES public.promotion_application_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_method_buy_rules application_method_buy_rules_promotion_rule_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.application_method_buy_rules
    ADD CONSTRAINT application_method_buy_rules_promotion_rule_id_foreign FOREIGN KEY (promotion_rule_id) REFERENCES public.promotion_rule(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_method_target_rules application_method_target_rules_application_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.application_method_target_rules
    ADD CONSTRAINT application_method_target_rules_application_method_id_foreign FOREIGN KEY (application_method_id) REFERENCES public.promotion_application_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_method_target_rules application_method_target_rules_promotion_rule_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.application_method_target_rules
    ADD CONSTRAINT application_method_target_rules_promotion_rule_id_foreign FOREIGN KEY (promotion_rule_id) REFERENCES public.promotion_rule(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: auth_mfa_factor auth_mfa_factor_auth_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.auth_mfa_factor
    ADD CONSTRAINT auth_mfa_factor_auth_identity_id_foreign FOREIGN KEY (auth_identity_id) REFERENCES public.auth_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: auth_mfa_recovery_code auth_mfa_recovery_code_auth_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.auth_mfa_recovery_code
    ADD CONSTRAINT auth_mfa_recovery_code_auth_identity_id_foreign FOREIGN KEY (auth_identity_id) REFERENCES public.auth_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: auth_password_reset_token auth_password_reset_token_auth_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.auth_password_reset_token
    ADD CONSTRAINT auth_password_reset_token_auth_identity_id_foreign FOREIGN KEY (auth_identity_id) REFERENCES public.auth_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: auth_password_reset_token auth_password_reset_token_provider_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.auth_password_reset_token
    ADD CONSTRAINT auth_password_reset_token_provider_identity_id_foreign FOREIGN KEY (provider_identity_id) REFERENCES public.provider_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: auth_verification auth_verification_auth_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.auth_verification
    ADD CONSTRAINT auth_verification_auth_identity_id_foreign FOREIGN KEY (auth_identity_id) REFERENCES public.auth_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: capture capture_payment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.capture
    ADD CONSTRAINT capture_payment_id_foreign FOREIGN KEY (payment_id) REFERENCES public.payment(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart cart_billing_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_billing_address_id_foreign FOREIGN KEY (billing_address_id) REFERENCES public.cart_address(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cart_line_item_adjustment cart_line_item_adjustment_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart_line_item_adjustment
    ADD CONSTRAINT cart_line_item_adjustment_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.cart_line_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_line_item cart_line_item_cart_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart_line_item
    ADD CONSTRAINT cart_line_item_cart_id_foreign FOREIGN KEY (cart_id) REFERENCES public.cart(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_line_item_tax_line cart_line_item_tax_line_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart_line_item_tax_line
    ADD CONSTRAINT cart_line_item_tax_line_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.cart_line_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart cart_shipping_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_shipping_address_id_foreign FOREIGN KEY (shipping_address_id) REFERENCES public.cart_address(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cart_shipping_method_adjustment cart_shipping_method_adjustment_shipping_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart_shipping_method_adjustment
    ADD CONSTRAINT cart_shipping_method_adjustment_shipping_method_id_foreign FOREIGN KEY (shipping_method_id) REFERENCES public.cart_shipping_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_shipping_method cart_shipping_method_cart_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart_shipping_method
    ADD CONSTRAINT cart_shipping_method_cart_id_foreign FOREIGN KEY (cart_id) REFERENCES public.cart(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_shipping_method_tax_line cart_shipping_method_tax_line_shipping_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.cart_shipping_method_tax_line
    ADD CONSTRAINT cart_shipping_method_tax_line_shipping_method_id_foreign FOREIGN KEY (shipping_method_id) REFERENCES public.cart_shipping_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: credit_line credit_line_cart_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.credit_line
    ADD CONSTRAINT credit_line_cart_id_foreign FOREIGN KEY (cart_id) REFERENCES public.cart(id) ON UPDATE CASCADE;


--
-- Name: customer_address customer_address_customer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.customer_address
    ADD CONSTRAINT customer_address_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES public.customer(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_group_customer customer_group_customer_customer_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.customer_group_customer
    ADD CONSTRAINT customer_group_customer_customer_group_id_foreign FOREIGN KEY (customer_group_id) REFERENCES public.customer_group(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_group_customer customer_group_customer_customer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.customer_group_customer
    ADD CONSTRAINT customer_group_customer_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES public.customer(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fulfillment fulfillment_delivery_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.fulfillment
    ADD CONSTRAINT fulfillment_delivery_address_id_foreign FOREIGN KEY (delivery_address_id) REFERENCES public.fulfillment_address(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fulfillment_item fulfillment_item_fulfillment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.fulfillment_item
    ADD CONSTRAINT fulfillment_item_fulfillment_id_foreign FOREIGN KEY (fulfillment_id) REFERENCES public.fulfillment(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fulfillment_label fulfillment_label_fulfillment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.fulfillment_label
    ADD CONSTRAINT fulfillment_label_fulfillment_id_foreign FOREIGN KEY (fulfillment_id) REFERENCES public.fulfillment(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fulfillment fulfillment_provider_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.fulfillment
    ADD CONSTRAINT fulfillment_provider_id_foreign FOREIGN KEY (provider_id) REFERENCES public.fulfillment_provider(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fulfillment fulfillment_shipping_option_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.fulfillment
    ADD CONSTRAINT fulfillment_shipping_option_id_foreign FOREIGN KEY (shipping_option_id) REFERENCES public.shipping_option(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: geo_zone geo_zone_service_zone_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.geo_zone
    ADD CONSTRAINT geo_zone_service_zone_id_foreign FOREIGN KEY (service_zone_id) REFERENCES public.service_zone(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: image image_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.image
    ADD CONSTRAINT image_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventory_level inventory_level_inventory_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.inventory_level
    ADD CONSTRAINT inventory_level_inventory_item_id_foreign FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notification notification_provider_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_provider_id_foreign FOREIGN KEY (provider_id) REFERENCES public.notification_provider(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order order_billing_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_billing_address_id_foreign FOREIGN KEY (billing_address_id) REFERENCES public.order_address(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_change_action order_change_action_order_change_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_change_action
    ADD CONSTRAINT order_change_action_order_change_id_foreign FOREIGN KEY (order_change_id) REFERENCES public.order_change(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_change order_change_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_change
    ADD CONSTRAINT order_change_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_credit_line order_credit_line_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_credit_line
    ADD CONSTRAINT order_credit_line_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_item order_item_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.order_line_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_item order_item_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_line_item_adjustment order_line_item_adjustment_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_line_item_adjustment
    ADD CONSTRAINT order_line_item_adjustment_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.order_line_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_line_item_tax_line order_line_item_tax_line_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_line_item_tax_line
    ADD CONSTRAINT order_line_item_tax_line_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.order_line_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_line_item order_line_item_totals_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_line_item
    ADD CONSTRAINT order_line_item_totals_id_foreign FOREIGN KEY (totals_id) REFERENCES public.order_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order order_shipping_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_shipping_address_id_foreign FOREIGN KEY (shipping_address_id) REFERENCES public.order_address(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_shipping_method_adjustment order_shipping_method_adjustment_shipping_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_shipping_method_adjustment
    ADD CONSTRAINT order_shipping_method_adjustment_shipping_method_id_foreign FOREIGN KEY (shipping_method_id) REFERENCES public.order_shipping_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_shipping_method_tax_line order_shipping_method_tax_line_shipping_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_shipping_method_tax_line
    ADD CONSTRAINT order_shipping_method_tax_line_shipping_method_id_foreign FOREIGN KEY (shipping_method_id) REFERENCES public.order_shipping_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_shipping order_shipping_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_shipping
    ADD CONSTRAINT order_shipping_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_summary order_summary_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_summary
    ADD CONSTRAINT order_summary_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_transaction order_transaction_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.order_transaction
    ADD CONSTRAINT order_transaction_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment_collection_payment_providers payment_collection_payment_providers_payment_col_aa276_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.payment_collection_payment_providers
    ADD CONSTRAINT payment_collection_payment_providers_payment_col_aa276_foreign FOREIGN KEY (payment_collection_id) REFERENCES public.payment_collection(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment_collection_payment_providers payment_collection_payment_providers_payment_pro_2d555_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.payment_collection_payment_providers
    ADD CONSTRAINT payment_collection_payment_providers_payment_pro_2d555_foreign FOREIGN KEY (payment_provider_id) REFERENCES public.payment_provider(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment payment_payment_collection_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_payment_collection_id_foreign FOREIGN KEY (payment_collection_id) REFERENCES public.payment_collection(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment_session payment_session_payment_collection_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.payment_session
    ADD CONSTRAINT payment_session_payment_collection_id_foreign FOREIGN KEY (payment_collection_id) REFERENCES public.payment_collection(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: price_list_rule price_list_rule_price_list_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.price_list_rule
    ADD CONSTRAINT price_list_rule_price_list_id_foreign FOREIGN KEY (price_list_id) REFERENCES public.price_list(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: price price_price_list_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.price
    ADD CONSTRAINT price_price_list_id_foreign FOREIGN KEY (price_list_id) REFERENCES public.price_list(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: price price_price_set_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.price
    ADD CONSTRAINT price_price_set_id_foreign FOREIGN KEY (price_set_id) REFERENCES public.price_set(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: price_rule price_rule_price_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.price_rule
    ADD CONSTRAINT price_rule_price_id_foreign FOREIGN KEY (price_id) REFERENCES public.price(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_category product_category_parent_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_category
    ADD CONSTRAINT product_category_parent_category_id_foreign FOREIGN KEY (parent_category_id) REFERENCES public.product_category(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_category_product product_category_product_product_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_category_product
    ADD CONSTRAINT product_category_product_product_category_id_foreign FOREIGN KEY (product_category_id) REFERENCES public.product_category(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_category_product product_category_product_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_category_product
    ADD CONSTRAINT product_category_product_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product product_collection_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_collection_id_foreign FOREIGN KEY (collection_id) REFERENCES public.product_collection(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_option_value product_option_value_option_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_option_value
    ADD CONSTRAINT product_option_value_option_id_foreign FOREIGN KEY (option_id) REFERENCES public.product_option(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_product_option product_product_option_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_product_option
    ADD CONSTRAINT product_product_option_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_product_option product_product_option_product_option_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_product_option
    ADD CONSTRAINT product_product_option_product_option_id_foreign FOREIGN KEY (product_option_id) REFERENCES public.product_option(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_product_option_value product_product_option_value_product_option_value_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_product_option_value
    ADD CONSTRAINT product_product_option_value_product_option_value_id_foreign FOREIGN KEY (product_option_value_id) REFERENCES public.product_option_value(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_product_option_value product_product_option_value_product_product_option_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_product_option_value
    ADD CONSTRAINT product_product_option_value_product_product_option_id_foreign FOREIGN KEY (product_product_option_id) REFERENCES public.product_product_option(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_tags product_tags_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT product_tags_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_tags product_tags_product_tag_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT product_tags_product_tag_id_foreign FOREIGN KEY (product_tag_id) REFERENCES public.product_tag(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product product_type_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_type_id_foreign FOREIGN KEY (type_id) REFERENCES public.product_type(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_variant_option product_variant_option_option_value_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_variant_option
    ADD CONSTRAINT product_variant_option_option_value_id_foreign FOREIGN KEY (option_value_id) REFERENCES public.product_option_value(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_variant_option product_variant_option_variant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_variant_option
    ADD CONSTRAINT product_variant_option_variant_id_foreign FOREIGN KEY (variant_id) REFERENCES public.product_variant(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_variant product_variant_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_variant
    ADD CONSTRAINT product_variant_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_variant_product_image product_variant_product_image_image_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.product_variant_product_image
    ADD CONSTRAINT product_variant_product_image_image_id_foreign FOREIGN KEY (image_id) REFERENCES public.image(id) ON DELETE CASCADE;


--
-- Name: promotion_application_method promotion_application_method_promotion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.promotion_application_method
    ADD CONSTRAINT promotion_application_method_promotion_id_foreign FOREIGN KEY (promotion_id) REFERENCES public.promotion(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promotion_campaign_budget promotion_campaign_budget_campaign_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.promotion_campaign_budget
    ADD CONSTRAINT promotion_campaign_budget_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES public.promotion_campaign(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promotion_campaign_budget_usage promotion_campaign_budget_usage_budget_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.promotion_campaign_budget_usage
    ADD CONSTRAINT promotion_campaign_budget_usage_budget_id_foreign FOREIGN KEY (budget_id) REFERENCES public.promotion_campaign_budget(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promotion promotion_campaign_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.promotion
    ADD CONSTRAINT promotion_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES public.promotion_campaign(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: promotion_promotion_rule promotion_promotion_rule_promotion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.promotion_promotion_rule
    ADD CONSTRAINT promotion_promotion_rule_promotion_id_foreign FOREIGN KEY (promotion_id) REFERENCES public.promotion(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promotion_promotion_rule promotion_promotion_rule_promotion_rule_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.promotion_promotion_rule
    ADD CONSTRAINT promotion_promotion_rule_promotion_rule_id_foreign FOREIGN KEY (promotion_rule_id) REFERENCES public.promotion_rule(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promotion_rule_value promotion_rule_value_promotion_rule_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.promotion_rule_value
    ADD CONSTRAINT promotion_rule_value_promotion_rule_id_foreign FOREIGN KEY (promotion_rule_id) REFERENCES public.promotion_rule(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: provider_identity provider_identity_auth_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.provider_identity
    ADD CONSTRAINT provider_identity_auth_identity_id_foreign FOREIGN KEY (auth_identity_id) REFERENCES public.auth_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refund refund_payment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.refund
    ADD CONSTRAINT refund_payment_id_foreign FOREIGN KEY (payment_id) REFERENCES public.payment(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: region_country region_country_region_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.region_country
    ADD CONSTRAINT region_country_region_id_foreign FOREIGN KEY (region_id) REFERENCES public.region(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reservation_item reservation_item_inventory_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.reservation_item
    ADD CONSTRAINT reservation_item_inventory_item_id_foreign FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: return_reason return_reason_parent_return_reason_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.return_reason
    ADD CONSTRAINT return_reason_parent_return_reason_id_foreign FOREIGN KEY (parent_return_reason_id) REFERENCES public.return_reason(id);


--
-- Name: search_index_sync search_index_sync_search_index_version_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.search_index_sync
    ADD CONSTRAINT search_index_sync_search_index_version_id_foreign FOREIGN KEY (search_index_version_id) REFERENCES public.search_index_version(id) ON UPDATE CASCADE;


--
-- Name: search_index_version search_index_version_search_index_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.search_index_version
    ADD CONSTRAINT search_index_version_search_index_id_foreign FOREIGN KEY (search_index_id) REFERENCES public.search_index(id) ON UPDATE CASCADE;


--
-- Name: service_zone service_zone_fulfillment_set_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.service_zone
    ADD CONSTRAINT service_zone_fulfillment_set_id_foreign FOREIGN KEY (fulfillment_set_id) REFERENCES public.fulfillment_set(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shipping_option shipping_option_provider_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.shipping_option
    ADD CONSTRAINT shipping_option_provider_id_foreign FOREIGN KEY (provider_id) REFERENCES public.fulfillment_provider(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: shipping_option_rule shipping_option_rule_shipping_option_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.shipping_option_rule
    ADD CONSTRAINT shipping_option_rule_shipping_option_id_foreign FOREIGN KEY (shipping_option_id) REFERENCES public.shipping_option(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shipping_option shipping_option_service_zone_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.shipping_option
    ADD CONSTRAINT shipping_option_service_zone_id_foreign FOREIGN KEY (service_zone_id) REFERENCES public.service_zone(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shipping_option shipping_option_shipping_option_type_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.shipping_option
    ADD CONSTRAINT shipping_option_shipping_option_type_id_foreign FOREIGN KEY (shipping_option_type_id) REFERENCES public.shipping_option_type(id) ON UPDATE CASCADE;


--
-- Name: shipping_option shipping_option_shipping_profile_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.shipping_option
    ADD CONSTRAINT shipping_option_shipping_profile_id_foreign FOREIGN KEY (shipping_profile_id) REFERENCES public.shipping_profile(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_location stock_location_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.stock_location
    ADD CONSTRAINT stock_location_address_id_foreign FOREIGN KEY (address_id) REFERENCES public.stock_location_address(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: store_currency store_currency_store_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.store_currency
    ADD CONSTRAINT store_currency_store_id_foreign FOREIGN KEY (store_id) REFERENCES public.store(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: store_locale store_locale_store_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: medusa
--

ALTER TABLE ONLY public.store_locale
    ADD CONSTRAINT store_locale_store_id_foreign FOREIGN KEY (store_id) REFERENCES public.store(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict fx2LpDZSRGwgs6isoeC5JzZBepXEPB3VyjjeqlH4VTC9i1pq63OYCiVT8ii3uVV

