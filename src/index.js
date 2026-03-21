import { bootstrapPlugin } from './plugin.js'

try {
  bootstrapPlugin(window)
} catch (error) {
  console.error('[IMS:bootstrap] Failed to initialize', error)
}
