export function createLogger(scope, debug = false) {
  const prefix = `[IMS:${scope}]`

  return {
    debug(...args) {
      if (debug) console.debug(prefix, ...args)
    },
    info(...args) {
      console.info(prefix, ...args)
    },
    warn(...args) {
      console.warn(prefix, ...args)
    },
    error(...args) {
      console.error(prefix, ...args)
    }
  }
}
