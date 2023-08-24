import { describe, before, it } from 'mocha'
import { expect } from 'chai'
import { setTimeout } from 'node:timers/promises'

import { setupServer } from './helpers/server.js'
import createPubSub from './helpers/pubsub.js'
import { cleanRedis } from './helpers/redis.js'

const defaultMessage = {
  app_id: 'testing',
  dev_id: '647fda000000591a',
  hardware_serial: '647FDA000000591A',
  port: 1,
  counter: 0,
  payload_raw:
    'W3siaG91cnNBZ28iOjEsIm1lYXN1cmVzIjp7InRlbXBlcmF0dXJlIjpbMjVdLCJodW1pZGl0eSI6WzMwXX19LHsiaG91cnNBZ28iOjAsIm1lYXN1cmVzIjp7InRlbXBlcmF0dXJlIjpbNTBdLCJodW1pZGl0eSI6WzYwXX19XQ==',
  metadata: {
    time: '2021-01-27T15:43:17.854Z',
    gateways: [
      {
        gtw_id: 'gtw_id',
        snr: 'snr',
        rssi: 'rssi',
        channel: 'channel',
        latitude: 'latitude',
        longitude: 'longitude',
        altitude: 'altitude',
      },
    ],
  },
}

describe('Message Processing', function () {
  let pubsub = null
  before(async function () {
    // Kafka consumer can take a while to come up as it needs to wait t be leader
    this.timeout(30000)
    pubsub = await createPubSub()
  })

  after(async function () {
    this.timeout(30000)
    await pubsub.disconnect()
  })

  describe('happy path', function () {
    const context = {}
    before(async function () {
      await setupServer(context)
      await cleanRedis()
      context.messages = await pubsub.publishAndWait({
        message: JSON.stringify(defaultMessage),
      })
    })

    it('should send the correct messages', function () {
      expect(context.messages.length).to.equal(1)
      const message = context.messages[0]

      expect(message.topic).to.equal('raw-payloads')
      expect(message.key).to.equal('647FDA000000591A')
      expect(message.message.ingest).to.equal('ttn_v2')
      expect(message.message.ingestId).to.equal('647FDA000000591A')
      expect(message.message.metadata.devEui).to.equal('647FDA000000591A')
      expect(message.message.payload).to.equal(
        'W3siaG91cnNBZ28iOjEsIm1lYXN1cmVzIjp7InRlbXBlcmF0dXJlIjpbMjVdLCJodW1pZGl0eSI6WzMwXX19LHsiaG91cnNBZ28iOjAsIm1lYXN1cmVzIjp7InRlbXBlcmF0dXJlIjpbNTBdLCJodW1pZGl0eSI6WzYwXX19XQ=='
      )
      expect(message.message.metadata.port).to.equal(1)
      const now = new Date().getTime()
      expect(new Date(message.message.timestamp).getTime()).to.be.within(now - 1000, now)
      expect(message.message.metadata.gateways).to.deep.equal([
        {
          id: 'gtw_id',
          snr: 'snr',
          rssi: 'rssi',
          channel: 'channel',
          coordinates: {
            latitude: 'latitude',
            longitude: 'longitude',
            altitude: 'altitude',
          },
        },
      ])
    })
  })

  describe('non-duplicate message should succeed', function () {
    const context = {}
    before(async function () {
      await setupServer(context)
      await cleanRedis()
      await pubsub.publishAndWait({
        message: JSON.stringify(defaultMessage),
      })
      context.messages = await pubsub.publishAndWait({
        message: JSON.stringify({
          ...defaultMessage,
          counter: 2,
        }),
      })
    })

    it('should send the correct messages', function () {
      expect(context.messages.length).to.equal(1)
      const message = context.messages[0]

      expect(message.topic).to.equal('raw-payloads')
      expect(message.key).to.equal('647FDA000000591A')
      expect(message.message.ingest).to.equal('ttn_v2')
      expect(message.message.ingestId).to.equal('647FDA000000591A')
      expect(message.message.metadata.devEui).to.equal('647FDA000000591A')
      expect(message.message.payload).to.equal(
        'W3siaG91cnNBZ28iOjEsIm1lYXN1cmVzIjp7InRlbXBlcmF0dXJlIjpbMjVdLCJodW1pZGl0eSI6WzMwXX19LHsiaG91cnNBZ28iOjAsIm1lYXN1cmVzIjp7InRlbXBlcmF0dXJlIjpbNTBdLCJodW1pZGl0eSI6WzYwXX19XQ=='
      )
      expect(message.message.metadata.port).to.equal(1)
      const now = new Date().getTime()
      expect(new Date(message.message.timestamp).getTime()).to.be.within(now - 1000, now)
      expect(message.message.metadata.gateways).to.deep.equal([
        {
          id: 'gtw_id',
          snr: 'snr',
          rssi: 'rssi',
          channel: 'channel',
          coordinates: {
            latitude: 'latitude',
            longitude: 'longitude',
            altitude: 'altitude',
          },
        },
      ])
    })
  })

  describe('duplicate message after 100ms should succeed', function () {
    const context = {}
    before(async function () {
      this.slow(200)
      await setupServer(context)
      await cleanRedis()
      await pubsub.publishAndWait({
        message: JSON.stringify(defaultMessage),
      })
      await setTimeout(100)
      context.messages = await pubsub.publishAndWait({
        message: JSON.stringify(defaultMessage),
      })
    })

    it('should send the correct messages', function () {
      expect(context.messages.length).to.equal(1)
      const message = context.messages[0]

      expect(message.topic).to.equal('raw-payloads')
      expect(message.key).to.equal('647FDA000000591A')
      expect(message.message.ingest).to.equal('ttn_v2')
      expect(message.message.ingestId).to.equal('647FDA000000591A')
      expect(message.message.metadata.devEui).to.equal('647FDA000000591A')
      expect(message.message.payload).to.equal(
        'W3siaG91cnNBZ28iOjEsIm1lYXN1cmVzIjp7InRlbXBlcmF0dXJlIjpbMjVdLCJodW1pZGl0eSI6WzMwXX19LHsiaG91cnNBZ28iOjAsIm1lYXN1cmVzIjp7InRlbXBlcmF0dXJlIjpbNTBdLCJodW1pZGl0eSI6WzYwXX19XQ=='
      )
      expect(message.message.metadata.port).to.equal(1)
      const now = new Date().getTime()
      expect(new Date(message.message.timestamp).getTime()).to.be.within(now - 1000, now)
      expect(message.message.metadata.gateways).to.deep.equal([
        {
          id: 'gtw_id',
          snr: 'snr',
          rssi: 'rssi',
          channel: 'channel',
          coordinates: {
            latitude: 'latitude',
            longitude: 'longitude',
            altitude: 'altitude',
          },
        },
      ])
    })
  })

  describe('duplicate message should not be published', function () {
    const context = {}
    before(async function () {
      await setupServer(context)
      await cleanRedis()
      await pubsub.publishAndWait({
        message: JSON.stringify(defaultMessage),
      })
      context.messages = await pubsub.publishAndWait({
        message: JSON.stringify(defaultMessage),
        expectedMessages: 0,
      })
    })

    it('should not see any messages on second publish', function () {
      expect(context.messages.length).to.equal(0)
    })
  })

  const badMessageTest = ({ testName, message }) => {
    describe(testName, function () {
      const context = {}
      before(async function () {
        await setupServer(context)
        await cleanRedis()
        context.messages = await pubsub.publishAndWait({
          message,
          expectedMessages: 0,
        })
      })

      it('should not see any messages on second publish', function () {
        expect(context.messages.length).to.equal(0)
      })
    })
  }

  badMessageTest({
    testName: 'invalid message should not be published (not json)',
    message: 'not json } ',
  })

  badMessageTest({
    testName: 'invalid message should not be published (missing hardware_serial)',
    message: JSON.stringify({ ...defaultMessage, hardware_serial: undefined }),
  })

  badMessageTest({
    testName: 'invalid message should not be published (missing counter)',
    message: JSON.stringify({ ...defaultMessage, counter: undefined }),
  })
})
