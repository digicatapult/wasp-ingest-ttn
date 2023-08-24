import mqtt from 'mqtt'

import globalLogger from '../logger.js'
import env from '../env.js'

const { TTN_MQTT_ENDPOINT, TTN_APP_ID, TTN_APP_KEY } = env

const setupTTNListener = async (next) => {
  const logger = globalLogger.child({ module: 'ttn' })

  let hasResolved = false

  return new Promise((resolve, reject) => {
    const client = mqtt.connect(TTN_MQTT_ENDPOINT, {
      username: TTN_APP_ID,
      password: TTN_APP_KEY,
    })

    client.on('connect', function () {
      logger.info('Connection to MQTT server established')

      const topic = `${TTN_APP_ID}/devices/+/up`
      client.subscribe(topic, (err) => {
        if (err) {
          logger.error(`Error subscribing to TTN MQTT (${topic})`)
          if (!hasResolved) {
            hasResolved = true
            reject(new Error(`Error subscribing to TTN MQTT (${topic})`))
          }
        } else {
          logger.debug(`Successfully subscribed to TTN MQTT (${topic})`)
          if (!hasResolved) {
            hasResolved = true
            resolve()
          }
        }
      })
    })
    client.on('close', function () {
      logger.info('Disconnected from MQTT server')
    })
    client.on('reconnect', function () {
      logger.info('Reconnecting to MQTT server')
    })
    client.on('error', function (err) {
      logger.warn(`Error from MQTT client. Error was ${err}`)
      if (!hasResolved) {
        hasResolved = true
        reject(new Error(`Error from MQTT client. Error was ${err}`))
      }
    })
    client.on('message', async (topic, rawPayload) => {
      let payload = null
      try {
        payload = JSON.parse(Buffer.from(rawPayload).toString('utf8'))
        if (!payload || !payload.hardware_serial || !Number.isSafeInteger(payload.counter)) {
          throw new Error('TTN payload is invalid, does not contain one of [hardware_serial, counter]')
        }
      } catch (err) {
        logger.warn(`Error parsing payload error was ${err.message || err}`)
        return
      }

      logger.trace(`Payload: ${JSON.stringify(payload)}`)

      next(payload)
    })
  })
}

export default setupTTNListener
