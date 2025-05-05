import { Hono } from 'hono'
import { createSlackApp } from './app'

const app = new Hono<{ Bindings: Env }>()

app.get('/', (c) => {
  return c.text('Hello Slack App on Cloudflare Workers!')
})

app.post('/', async (c) => {
  const slackApp = createSlackApp(c.env)
  return await slackApp.run(c.req.raw, c.executionCtx)
})

export default app
