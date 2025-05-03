import {
  SlackApp,
  type SlackAppLogLevel,
  type SlackEdgeAppEnv,
} from 'slack-cloudflare-workers'
import { registerAppMentionTest } from './slack-features/app-mention-test'
import { registerButtonTestFeature } from './slack-features/button-test'
import { registerMemoFeature } from './slack-features/memo'
import { registerMessageFeature } from './slack-features/message'
import { registerReactionTestFeature } from './slack-features/reaction-test'

export function createSlackApp(env: Env) {
  const app = new SlackApp<SlackEdgeAppEnv>({
    env: {
      ...env,
      SLACK_LOGGING_LEVEL: env.SLACK_LOGGING_LEVEL as SlackAppLogLevel,
    },
  })

  registerHandlers(app)
  return app
}

function registerHandlers(app: SlackApp<SlackEdgeAppEnv>) {
  registerMessageFeature(app)
  registerMemoFeature(app)
  registerButtonTestFeature(app)
  registerReactionTestFeature(app)
  registerAppMentionTest(app)
}
