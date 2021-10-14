const { Kafka, logLevel: kafkaLogLevels } = require('kafkajs')

const globalLogger = require('../logger')
const { KAFKA_BROKERS, KAFKA_PAYLOAD_TOPIC, KAFKA_LOG_LEVEL } = require('../env')

const setupForwardToKafka = async () => {
  const logger = globalLogger.child({ module: 'Kafka' })
  const logCreator = () => ({ label, log }) => {
    const { message } = log
    logger[label.toLowerCase()]({
      message,
    })
  }

  const kafka = new Kafka({
    clientId: 'ingest-ttn',
    brokers: KAFKA_BROKERS,
    logLevel: kafkaLogLevels[KAFKA_LOG_LEVEL.toUpperCase()],
    logCreator,
  })
  const producer = kafka.producer()
  await producer.connect()

  return async ({ ingestId, payload }) => {
    const message = { key: ingestId, value: payload }
    logger.debug(`Publishing payload to ${KAFKA_PAYLOAD_TOPIC}`)
    logger.trace(`Message is %j`, message)

    await producer.send({
      topic: KAFKA_PAYLOAD_TOPIC,
      messages: [message],
    })
  }
}

module.exports = setupForwardToKafka
