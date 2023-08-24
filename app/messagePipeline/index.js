import setupListener from './ttn.js'
import setupDeduplicator from './deduplicator.js'
import setupParser from './parser.js'
import setupForwarder from './forwarder.js'

export default async () => {
  // This is the order in which the message should pass along the chain
  const setupChain = [setupListener, setupDeduplicator, setupParser, setupForwarder]
  // compose the promises together
  await setupChain.reverse().reduce(async (next, setup) => {
    return await setup(await next)
  }, Promise.resolve())
}
