/* eslint-env serviceworker */

import { Router } from 'itty-router'

import { envAll } from './env.js'
import { errorHandler } from './error-handler.js'
import { addCorsHeaders, withCorsHeaders } from './cors.js'
import { versionGet } from './version.js'
import { carPut } from './car/put.js'
import { carGet } from './car/get.js'
import { blockPut } from './block/put.js'
import { blockGet } from './block/get.js'

const router = Router()

router
  .all('*', envAll)
  .get('/version', withCorsHeaders(versionGet))
  // TODO: add auth to routes
  .put('/car', withCorsHeaders(carPut))
  .get('/car/:cid', withCorsHeaders(carGet))
  .put('/', withCorsHeaders(blockPut))
  .get('/:multihash', withCorsHeaders(blockGet))

/**
 * @param {Error} error
 * @param {Request} request
 * @param {import('./env').Env} env
 */
function serverError (error, request, env) {
  return addCorsHeaders(request, errorHandler(error, env))
}

// https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent
/** @typedef {{ waitUntil(p: Promise): void }} Ctx */

export default {
  async fetch (request, env, ctx) {
    try {
      const res = await router.handle(request, env, ctx)
      env.log.timeEnd('request')
      return env.log.end(res)
    } catch (error) {
      if (env.log) {
        env.log.timeEnd('request')
        return env.log.end(serverError(error, request, env))
      }
      return serverError(error, request, env)
    }
  }
}
