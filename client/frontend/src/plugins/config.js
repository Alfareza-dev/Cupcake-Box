import { reactive } from 'vue'

export const DEFAULT_BRAND_NAME = 'Cupcake Box'

export function normalizeBrandName(name) {
  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (!trimmed || trimmed === 'PufferPanel' || trimmed === 'Puffer Panel') {
    return DEFAULT_BRAND_NAME
  }
  return trimmed
}

export default (rawConfig) => {
  if (!rawConfig.branding) rawConfig.branding = {}
  rawConfig.branding.name = normalizeBrandName(rawConfig.branding.name)
  const config = reactive(rawConfig)

  return {
    install: (app) => {
      app.config.globalProperties.$config = config
      app.provide('config', config)

      document.title = config.branding.name
    }
  }
}
