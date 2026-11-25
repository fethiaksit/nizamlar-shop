import { Module } from "@medusajs/framework/utils"
import DtfCommerceModuleService from "./service"

export const DTF_COMMERCE_MODULE = "dtf_commerce"

export default Module(DTF_COMMERCE_MODULE, {
  service: DtfCommerceModuleService,
})
