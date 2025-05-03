import type { SlackApp, SlackEdgeAppEnv } from 'slack-cloudflare-workers'
import { db } from '../db'

export const registerMessageFeature = (app: SlackApp<SlackEdgeAppEnv>) => {
  app.event('message', async ({ body, context, payload }) => {
    console.log('message', payload)

    if (payload.subtype === 'bot_message') {
      console.log('ignore bot message', payload)
      return
    }

    if (payload.subtype === undefined) {
      const user = await db
        .selectFrom('slack_users')
        .selectAll()
        .where('userId', '=', payload.user)
        .executeTakeFirst()

      if (!user) {
        console.log('user not found', payload.user)
        const userInfoResult = await app.client.users.info({
          user: payload.user,
        })
        if (userInfoResult.ok) {
          const insertedUser = await db
            .insertInto('slack_users')
            .values({
              userId: payload.user,
              name: userInfoResult.user?.name ?? null,
              realName: userInfoResult.user?.real_name ?? null,
              profileImage: userInfoResult.user?.profile?.image_192 ?? null,
              updatedAt: new Date().toISOString(),
            })
            .returningAll()
            .executeTakeFirst()
          console.log('user inserted', insertedUser)
        } else {
          console.log('user info error', userInfoResult.error)
        }
      }

      const ret = await db
        .insertInto('slack_messages')
        .values([
          {
            ts: payload.ts,
            channel: payload.channel,
            user: payload.user,
            text: payload.text,
            threadTs: payload.thread_ts,
            subtype: payload.subtype,
            deleted: false,
          },
        ])
        .execute()
      console.log(ret)

      await context.say({
        text: `<@${payload.user}> さん、メッセージありがとうございます！`,
      })
      return
    }
  })
}
