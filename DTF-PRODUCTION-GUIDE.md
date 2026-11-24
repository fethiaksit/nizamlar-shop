# DTF Production Guide — pending implementation

No new production workflow or print-file exporter has been implemented in this branch.

Planned states: Payment Confirmed → Design Review → Ready for Printing → Printing → Quality Control → Packed → Shipped → Delivered. Cancellation and refund states must be separate. Only an authenticated, verified paid Shopify order may enter production; duplicated or reordered webhooks must not create duplicate work.

Every job must have a unique production reference and trusted references to artwork, transparent production output and separate garment mockup. Print dimensions, quantities, product type and film size must be available to authorized production staff. Garment color is preview-only and garment size is not a transfer purchase requirement.

Before exporting production files, verify printer and RIP requirements, output format, supported width/length, margins, color/profile handling, 300-DPI target and memory/pixel limits. Never substitute a garment screenshot for production artwork.

Product-specific temperature, duration, pressure, peel and washing instructions require production approval. Home-iron compatibility must be explicitly verified per product. This guide publishes no untested numerical application settings.
