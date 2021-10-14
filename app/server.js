// server to handle health check request

const express = require('express')
const pinoHttp = require('pino-http')

const startMessagePipeline = require('./messagePipeline')
const { PORT } = require('./env')
const logger = require('./logger')

async function createHttpServer() {
  const app = express()

  const requestLogger = pinoHttp({ logger })

  // I'm leaving this in even though it's not used initially
  // just in case we add other routes. It's good boilerplate
  app.use((req, res, next) => {
    if (req.path !== '/health') requestLogger(req, res)
    next()
  })

  app.get('/health', async (req, res) => {
    res.status(200).send({ status: 'ok' })
  })

  // Sorry - app.use checks arity
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    logger.error('Fallback Error %j', err.stack)
    res.status(500).send('Fatal error!')
  })

  await startMessagePipeline()

  return app
}

async function startServer() {
  const app = await createHttpServer()

  app.listen(PORT, (err) => {
    if (err) throw new Error('Binding failed: ', err)
    logger.info(`Listening on port ${PORT} `)
  })
}

module.exports = { startServer, createHttpServer }
