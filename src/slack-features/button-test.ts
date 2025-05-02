import type { SlackApp, SlackEdgeAppEnv } from 'slack-cloudflare-workers'

export const registerButtonTestFeature = (app: SlackApp<SlackEdgeAppEnv>) => {
  app.command('/hey-cf-workers', async () => {
    return {
      response_type: 'ephemeral',
      text: 'このボタンをクリックしてみてください!',
      blocks: [
        {
          type: 'section',
          block_id: 'button',
          text: {
            type: 'mrkdwn',
            text: 'ボタンをクリックしてみてください!',
          },
          accessory: {
            type: 'button',
            action_id: 'button-action',
            text: {
              type: 'plain_text',
              text: 'ボタン',
            },
            value: 'hidden value',
          },
        },
      ],
    }
  })

  app.action(
    'button-action',
    async () => {}, // ack するだけ
    async ({ context, payload }) => {
      // if (context.respond) {
      //   await context.respond({ text: 'クリックしましたね！' })
      // } else {
      await context.client.views.open({
        trigger_id: payload.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'test-modal',
          title: { type: 'plain_text', text: 'ボタンクリック' },
          close: { type: 'plain_text', text: '閉じる' },
          blocks: [
            {
              type: 'section',
              text: { type: 'plain_text', text: 'クリックしましたね！' },
            },
          ],
        },
      })
      // 閉じるだけなので、何も返さない
    },
  )
}
