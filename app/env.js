const envalid = require('envalid')

const options = { strict: true }
if (process.env.NODE_ENV === 'test') {
  options.dotEnvPath = 'test/test.env'
}

const { REDIS_AUTH_ENABLED } = envalid.cleanEnv(
  process.env,
  {
    REDIS_AUTH_ENABLED: envalid.bool({ default: true, devDefault: false }),
  },
  options
)

const vars = envalid.cleanEnv(
  process.env,
  {
    PORT: envalid.port({ default: 3000 }),
    LOG_LEVEL: envalid.str({
      default: 'info',
      devDefault: 'debug',
      choices: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
    }),
    KAFKA_LOG_LEVEL: envalid.str({
      default: 'nothing',
      choices: ['debug', 'info', 'warn', 'error', 'nothing'],
    }),
    TTN_MQTT_ENDPOINT: envalid.str({
      default: 'mqtts://eu.thethings.network:8883',
      devDefault: 'mqtt://localhost:1883',
    }),
    TTN_APP_ID: envalid.str({ devDefault: 'development' }),
    TTN_APP_KEY: envalid.str({ devDefault: 'development_key' }),
    REDIS_HOST: envalid.host({ devDefault: 'localhost' }),
    REDIS_PORT: envalid.port({ devDefault: 6379 }),
    REDIS_KEY_PREFIX: envalid.str({ default: 'INGEST_TTN' }),
    ...(REDIS_AUTH_ENABLED
      ? {
          REDIS_AUTH_USERNAME: envalid.str(),
          REDIS_AUTH_PASSWORD: envalid.str(),
        }
      : {}),
    REDIS_ENABLE_TLS: envalid.bool({ default: false }),
    KAFKA_BROKERS: envalid.makeValidator((input) => {
      const kafkaSet = new Set(input === '' ? [] : input.split(','))
      if (kafkaSet.size === 0) throw new Error('At least one kafka broker must be configured')
      return [...kafkaSet]
    })({ default: 'localhost:9092' }),
    KAFKA_PAYLOAD_TOPIC: envalid.str({ default: 'raw-payloads' }),
    TTN_DUP_PAYLOAD_WINDOW_MS: envalid.num({ default: 60000 }),
    WASP_INGEST_NAME: envalid.str({ default: 'ttn_v2' }),
  },
  options
)

module.exports = {
  ...vars,
  REDIS_AUTH_ENABLED,
}
