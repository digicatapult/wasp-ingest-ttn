# wasp-ingest-ttn

## Deprecation Notice
`WASP` was deprecated on March 14th 2024, there will be no further dependency or security updates to this platform.
---

WASP Ingest for TTN v2

Connects to a [TTN](https://www.thethingsnetwork.org/) supplied MQTT broker. Parses and reformats messages from LoRaWAN devices on the TTN network, then forwards them to be used throughout the rest of WASP.

## Getting started

`wasp-ingest-ttn` can be run in a similar way to most nodejs applications. First install required dependencies using `npm`:

```sh
npm install
```

### Testing

For integration testing, `wasp-ingest-ttn` depends on Mosquitto, Kafka and Zookeeper. These can be brought locally up using docker:

```sh
docker-compose up -d
```

You can then run tests with:

```sh
npm test
```

## Environment Variables

`wasp-ingest-ttn` is configured primarily using environment variables. The service supports loading of environment variables from a .env file which is the recommended method for development.

### General Configuration

| variable                  | required |               default               | description                                                                                                           |
| :------------------------ | :------: | :---------------------------------: | :-------------------------------------------------------------------------------------------------------------------- |
| PORT                      |    N     |               `3000`                | Port on which the service will listen                                                                                 |
| LOG_LEVEL                 |    N     |               `info`                | Logging level. Valid values are [`trace`, `debug`, `info`, `warn`, `error`, `fatal`]. When testing, default = `debug` |
| KAFKA_LOG_LEVEL           |    N     |              `nothing`              | Logging level for Kafka. Valid values are [`debug`, `info`, `warn`, `error`, `nothing`]                               |
| TTN_MQTT_ENDPOINT         |    N     | `mqtts://eu.thethings.network:8883` | Endpoint for TTN MQTT broker                                                                                          |
| TTN_APP_ID                |    Y     |                  -                  | Client ID for TTN MQTT broker                                                                                         |
| TTN_APP_KEY               |    Y     |                  -                  | Client key for TTN MQTT broker                                                                                        |
| REDIS_HOST                |    Y     |                  -                  | Redis host name                                                                                                       |
| REDIS_PORT                |    Y     |                  -                  | Redis port                                                                                                            |
| REDIS_KEY_PREFIX          |    N     |            `INGEST_TTN`             | Redis key prefix                                                                                                      |
| REDIS_ENABLE_TLS          |    N     |               `false`               | Flag to enable TLS in Redis                                                                                           |
| KAFKA_BROKERS             |    N     |        `['localhost:9092']`         | List of addresses for the Kafka brokers                                                                               |
| KAFKA_PAYLOAD_TOPIC       |    N     |           `raw-payloads`            | Topic to publish payloads to                                                                                          |
| TTN_DUP_PAYLOAD_WINDOW_MS |    N     |                60000                | Set the window for catching duplicate payloads (milliseconds)                                                         |
| WASP_INGEST_NAME          |    N     |              `ttn_v2`               | Name of this ingest type                                                                                              |
