import { MedusaService } from "@medusajs/framework/utils"
import DtfPricingRule from "./models/dtf-pricing-rule"
import DtfProductSpec from "./models/dtf-product-spec"
import DtfDesignAsset from "./models/dtf-design-asset"
import DtfProductionJob from "./models/dtf-production-job"
import DtfWebhookEvent from "./models/dtf-webhook-event"

class DtfCommerceModuleService extends MedusaService({
  DtfPricingRule,
  DtfProductSpec,
  DtfDesignAsset,
  DtfProductionJob,
  DtfWebhookEvent,
}) {}

export default DtfCommerceModuleService
