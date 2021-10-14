const { Kafka, logLevel: kafkaLogLevels } = require('kafkajs')
const mqtt = require('mqtt')
const delay = require('delay')

const env = require('../../../app/env')

const createPubSub = async () => {
  const mqttClient = mqtt.connect(env.TTN_MQTT_ENDPOINT, {
    username: env.TTN_APP_ID,
    password: env.TTN_APP_KEY,
  })
  const kafka = new Kafka({
    clientId: 'ingest-ttn-testing',
    brokers: env.KAFKA_BROKERS,
    logLevel: kafkaLogLevels.ERROR,
  })
  const consumer = kafka.consumer({ groupId: 'test' })
  await consumer.connect()
  await consumer.subscribe({ topic: env.KAFKA_PAYLOAD_TOPIC, fromBeginning: true })

  const messages = []
  await consumer.run({
    eachMessage: async ({ topic, partition, message: { key, value } }) => {
      messages.push({
        topic,
        partition,
        key: key.toString('utf8'),
        message: JSON.parse(value.toString('utf8')),
      })
    },
  })
  const publishAndWait = async ({ message, expectedMessages = 1, waitForExcessMessagesMS = 50 }) => {
    messages.splice(0, messages.length)
    mqttClient.publish(`${env.TTN_APP_ID}/devices/1111111111111111/up`, message)

    while (messages.length < expectedMessages) {
      await delay(10)
    }
    await delay(waitForExcessMessagesMS)

    return [...messages]
  }

  return new Promise((resolve) => {
    while (!mqttClient.connected) {
      delay(50)
    }

    resolve({
      publishAndWait,
      disconnect: async () => {
        await consumer.stop()
        await consumer.disconnect()
      },
    })
  })
}

module.exports = createPubSub
