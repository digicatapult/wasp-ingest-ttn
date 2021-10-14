const Redis = require('ioredis')

const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_KEY_PREFIX,
  REDIS_AUTH_ENABLED,
  REDIS_AUTH_USERNAME,
  REDIS_AUTH_PASSWORD,
  REDIS_ENABLE_TLS,
} = require('../../../app/env')

const cleanRedis = async () => {
  const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    prefix: `${REDIS_KEY_PREFIX}_PAYLOAD_`,
    ...(REDIS_AUTH_ENABLED ? { username: REDIS_AUTH_USERNAME, password: REDIS_AUTH_PASSWORD } : {}),
    ...(REDIS_ENABLE_TLS ? { tls: {} } : {}),
  })

  await redis.flushall()
}

module.exports = {
  cleanRedis,
}
