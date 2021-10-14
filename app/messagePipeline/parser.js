const uuid = require('uuid')
const { WASP_INGEST_NAME } = require('../env')

const setupParser = (next) => {
  return (payload) => {
    const hardwareSerial = payload.hardware_serial
    const payloadId = uuid.v4()
    const gateways = (payload.metadata && payload.metadata.gateways) || []

    next({
      ingestId: hardwareSerial,
      payload: JSON.stringify({
        payloadId,
        ingest: WASP_INGEST_NAME,
        ingestId: hardwareSerial,
        timestamp: new Date().toISOString(),
        payload: payload.payload_raw,
        metadata: {
          devEui: hardwareSerial,
          port: payload.port,
          gateways: gateways.map((gw) => ({
            id: gw.gtw_id,
            snr: gw.snr,
            rssi: gw.rssi,
            channel: gw.channel,
            coordinates: {
              latitude: gw.latitude === undefined ? null : gw.latitude,
              longitude: gw.longitude === undefined ? null : gw.longitude,
              altitude: gw.altitude === undefined ? null : gw.altitude,
            },
          })),
        },
      }),
    })
  }
}

module.exports = setupParser
