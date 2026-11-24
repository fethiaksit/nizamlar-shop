# Deployment Guide — do not deploy this partial migration

Phase 00 is incomplete. Keep the existing production release. No deployment or main-branch merge is authorized by the draft review.

## Current local verification

Use npm 11.19.1 (root packageManager field) and a Node version satisfying >=22.23.4. PostgreSQL/Redis are already available locally. Run storefront/backend commands only in their respective apps or via root scripts. Do not copy or print `.env` values.

Run the independent typechecks, root lint/build, backend unit and integration scripts and the visual commands documented in VISUAL-REGRESSION-REPORT.md. The current reports list existing failures; build success alone is insufficient for release. Avoid simultaneous Next dev/build processes writing the same output directory.

## Future release gate

Before deployment: complete all six implementation phases, review additive generated migrations and database backups, verify Shopify development-store checkout and webhook idempotency, verify private artwork authorization, validate the printer/RIP output and confirm payment/shipping configuration. Collect complete visual comparisons at all five widths including authenticated admin. Then obtain review approval before merge or deployment.

## Rollback

No database migrations or production data changes were made by Phase 00. Revert only the Phase 00 commit to remove added tests/docs. Preserve the user's pre-existing working-tree changes. Future phases must document the specific feature-flag rollback and additive-migration recovery procedure before release.
