import type { SlackApp, SlackEdgeAppEnv } from 'slack-cloudflare-workers'

export const registerReactionTestFeature = (app: SlackApp<SlackEdgeAppEnv>) => {
  app.event('reaction_added', async ({ body, context, payload }) => {
    console.log('reaction_added', payload)

    await context.say({
      text: `<@${body.user}> さん、${payload.reaction} のリアクションありがとうございます！`,
    })
  })
}
