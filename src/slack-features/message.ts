import type { SlackApp, SlackEdgeAppEnv } from 'slack-cloudflare-workers'
import { slackRepository } from '../repository'

// ユーザー処理を分離
async function ensureUserExists(
  app: SlackApp<SlackEdgeAppEnv>,
  userId: string,
) {
  try {
    const user = await slackRepository.findUserById(userId)
    if (user) return user

    // ユーザーが存在しない場合は取得して保存
    const userInfoResult = await app.client.users.info({ user: userId })
    if (!(userInfoResult.ok && userInfoResult.user)) {
      console.error('Failed to fetch user info', {
        error: userInfoResult.error,
        userId,
      })
      return null
    }

    const userData = {
      userId,
      name: userInfoResult.user.name ?? null,
      realName: userInfoResult.user.real_name ?? null,
      profileImage: userInfoResult.user.profile?.image_192 ?? null,
    }

    const savedUser = await slackRepository.createUser(userData)
    console.log('User created successfully', { userId })
    return savedUser
  } catch (error) {
    console.error('Error in ensureUserExists', { error, userId })
    return null
  }
}

export const registerMessageFeature = (app: SlackApp<SlackEdgeAppEnv>) => {
  app.event('message', async ({ context, payload }) => {
    try {
      // ボットメッセージは無視
      if (payload.subtype === 'bot_message') {
        return
      }

      // 通常メッセージの処理
      if (payload.subtype === undefined && payload.user) {
        // ユーザー情報を確認・保存
        await ensureUserExists(app, payload.user)

        // メッセージを保存
        await slackRepository.saveMessage({
          ts: payload.ts,
          channel: payload.channel,
          user: payload.user,
          text: payload.text,
          thread_ts: payload.thread_ts,
          subtype: payload.subtype,
        })

        // レスポンス送信
        await context.say({
          text: `<@${payload.user}> さん、メッセージありがとうございます！`,
        })
      }
    } catch (error) {
      console.error('Error processing message event', { error, payload })
    }
  })
}
