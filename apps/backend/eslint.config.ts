import { defineConfig } from "eslint/config"
import medusa from "@medusajs/eslint-plugin"

export default defineConfig([{ ignores: ["**/._*", "**/.next/**", "**/.medusa/**"] }, ...medusa.configs.recommended])
