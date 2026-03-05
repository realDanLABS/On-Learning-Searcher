import { runtimeConfig, type FeatureKey } from '../config/runtime'

export function isFeatureEnabled(feature: FeatureKey) {
  return !runtimeConfig.disabledFeatures.includes(feature)
}

