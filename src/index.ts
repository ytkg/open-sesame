import { Hono } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'
import Switchbot from './lib/switchbot'
import { getDistance } from 'geolib'

type Bindings = {
  BEARER_TOKEN: string
  SWITCHBOT_API_TOKEN: string
  SWITCHBOT_API_SECRET: string
  SWITCHBOT_LOCK_DEVICE_ID: string
  HOME_LATITUDE: string
  HOME_LONGITUDE: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.notFound((c) => {
  return c.text('Not Found', 404)
})

app.get('/', (c) => {
  return c.text('Hello, Open sesame!')
})

app.use('*', async (c, next) => {
  const token = c.env.BEARER_TOKEN
  const auth = bearerAuth({ token })

  await auth(c, next)
})

app.post(
  '/unlock',
  async (c, next) => {
    const { latitude, longitude } = await c.req.json()
    const currentLocation = { latitude, longitude }
    const homeLocation = { latitude: c.env.HOME_LATITUDE, longitude: c.env.HOME_LONGITUDE }
    const distance = getDistance(currentLocation, homeLocation)

    if (distance > 30) {
      return c.text('Unauthorized', 401)
    }

    await next()
  },
  async (c) => {
    const switchbot = new Switchbot(c.env.SWITCHBOT_API_TOKEN, c.env.SWITCHBOT_API_SECRET)
    const message = await switchbot.execCommand(c.env.SWITCHBOT_LOCK_DEVICE_ID, 'unlock')

    return c.text(message)
  }
)

app.post('/lock', async (c) => {
  const switchbot = new Switchbot(c.env.SWITCHBOT_API_TOKEN, c.env.SWITCHBOT_API_SECRET)
  const message = await switchbot.execCommand(c.env.SWITCHBOT_LOCK_DEVICE_ID, 'lock')

  return c.text(message)
})

app.get('/status', async (c) => {
  const switchbot = new Switchbot(c.env.SWITCHBOT_API_TOKEN, c.env.SWITCHBOT_API_SECRET)
  const state = await switchbot.fetchState(c.env.SWITCHBOT_LOCK_DEVICE_ID)

  return c.text(state)
})

export default app
