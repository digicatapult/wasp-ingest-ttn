const Redis = require('ioredis')

const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_KEY_PREFIX,
  REDIS_AUTH_ENABLED,
  REDIS_AUTH_USERNAME,
  REDIS_AUTH_PASSWORD,
  REDIS_ENABLE_TLS,
  TTN_DUP_PAYLOAD_WINDOW_MS,
} = require('../env')
const logger = require('../logger')

const setupDeduplicator = (next) => {
  const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    keyPrefix: `${REDIS_KEY_PREFIX}_PAYLOAD_`,
    ...(REDIS_AUTH_ENABLED ? { username: REDIS_AUTH_USERNAME, password: REDIS_AUTH_PASSWORD } : {}),
    ...(REDIS_ENABLE_TLS ? { tls: {} } : {}),
  })

  return async (payload) => {
    const hardwareSerial = payload.hardware_serial
    const frameCounterUp = payload.counter
    const key = `${hardwareSerial}-${frameCounterUp}`
    const wasSet = await redis.setnx(key, 1)
    if (wasSet) {
      await redis.pexpire(key, TTN_DUP_PAYLOAD_WINDOW_MS)
      next(payload)
    } else {
      logger.debug(`Duplicate payload detected for ${hardwareSerial} frame ${frameCounterUp}`)
    }
  }
}

module.exports = setupDeduplicator
