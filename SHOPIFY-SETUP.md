# Shopify Setup — pending implementation

The Shopify integration is not implemented or enabled in this branch. This is a readiness checklist, not a claim of a working connection.

Before Phase 04 implementation, verify current supported Storefront/Admin GraphQL API versions in official Shopify documentation. Use a development store and keep the current Next.js design. Shopify must own US catalog, variants, USD prices, inventory, carts, checkout, payments, orders, discounts and shipping; Medusa must not independently price or fulfill the same US commercial order.

Required configuration will include store domain, server-only Storefront/Admin access tokens, webhook signing secret, US market/price context, product/variant mappings and an integration feature flag defaulting off. Exact environment variable names and least-privilege scopes must follow the implemented clients; no unused credential variables have been added at this stage. Never send credentials in chat or commit them.

Custom transfer prices require a supported Shopify mechanism and pre-checkout backend verification. Cart attributes are design metadata, not authority to charge a custom price. Implementation must fail closed if a quote cannot be represented faithfully at checkout.

The operator must verify USD collection and US-card payment support, shipping from Turkey to the US, taxes/duties, returns and tracking in a development environment before live mode. Do not accept real payments during setup validation.
