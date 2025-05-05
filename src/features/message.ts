import type { Selectable } from 'kysely'
import { okAsync, ResultAsync } from 'neverthrow'
import type { SlackApp, SlackEdgeAppEnv } from 'slack-cloudflare-workers'
import type { Database } from '~/services/db'
import { fetchUserInfoFromSlack } from '~/services/slack-api'
import dayjs from '~/utils/dayjs'
import type { AppError } from '../errors'
import { slackRepository } from '../repository'

/**
 * ユーザーが存在し、最近更新されているか確認し、
 * そうでない場合は Slack API から情報を取得して DB を更新する。
 * @returns ResultAsync<User, DatabaseError | Error>
 */
function ensureUserExists(
  app: SlackApp<SlackEdgeAppEnv>,
  userId: string,
): ResultAsync<Selectable<Database['slack_users']>, AppError> {
  return slackRepository.findUserById(userId).andThen((dbUser) => {
    if (dbUser && dayjs(dbUser.updatedAt).isAfter(dayjs().subtract(1, 'day'))) {
      return okAsync(dbUser)
    }

    return fetchUserInfoFromSlack(app.client, userId).andThen((slackUser) => {
      return slackRepository.upsertUser({
        userId,
        name: slackUser.name ?? null,
        realName: slackUser.real_name ?? null,
        profileImage: slackUser.profile?.image_192 ?? null,
      })
    })
  })
}

export const registerMessageFeature = (app: SlackApp<SlackEdgeAppEnv>) => {
  // イベントハンドラ自体は async
  app.anyMessage(async ({ context, payload }) => {
    if (payload.subtype !== undefined) return

    await ensureUserExists(app, payload.user)
      .andThen(() =>
        slackRepository.saveMessage({
          ts: payload.ts,
          channel: payload.channel,
          user: payload.user,
          text: payload.text,
          thread_ts: payload.thread_ts,
          subtype: payload.subtype,
        }),
      )
      .andThen(() =>
        ResultAsync.fromSafePromise(
          context.say({
            text: `<@${payload.user}> さん、メッセージありがとうございます！`,
          }),
        ),
      )
  })
}
