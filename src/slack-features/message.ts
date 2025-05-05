import type { Selectable } from 'kysely'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import type { SlackApp, SlackEdgeAppEnv } from 'slack-cloudflare-workers'
import type { Database } from '~/db'
import dayjs from '~/utils/dayjs'
import { slackRepository, type DatabaseError } from '../repository'

/**
 * ユーザーが存在し、最近更新されているか確認し、
 * そうでない場合は Slack API から情報を取得して DB を更新する。
 * @returns ResultAsync<User, DatabaseError | Error>
 */
function ensureUserExists(
  app: SlackApp<SlackEdgeAppEnv>,
  userId: string,
): ResultAsync<Selectable<Database['slack_users']>, DatabaseError | Error> {
  return slackRepository.findUserById(userId).andThen((user) => {
    const isRecent =
      user && dayjs(user.updatedAt).isAfter(dayjs().subtract(24, 'hour'))
    if (isRecent) {
      return okAsync(user)
    }

    return ResultAsync.fromPromise(
      app.client.users.info({ user: userId }),
      (e) =>
        new Error(
          `Slack API users.info failed: ${e instanceof Error ? e.message : String(e)}`,
        ),
    ).andThen((userInfoResult) => {
      if (!(userInfoResult.ok && userInfoResult.user)) {
        return errAsync(
          new Error(
            `Failed to fetch user info from Slack API: ${userInfoResult.error}`,
          ),
        )
      }
      const fetchedUser = userInfoResult.user

      // 3. 取得した情報でDBを更新 (repository は ResultAsync を返す)
      return slackRepository.upsertUser({
        userId,
        name: fetchedUser.name ?? null,
        realName: fetchedUser.real_name ?? null,
        profileImage: fetchedUser.profile?.image_192 ?? null,
      })
    })
  })
}

export const registerMessageFeature = (app: SlackApp<SlackEdgeAppEnv>) => {
  // イベントハンドラ自体は async
  app.event('message', async ({ context, payload }) => {
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
      .andThen((ret) =>
        ret.ok ? okAsync() : errAsync(new Error('Failed to send response')),
      )
      .match(
        () => {
          console.log(
            `[${new Date().toLocaleTimeString()}] ✅ ROP Pipeline finished successfully for message ts: ${payload.ts}`,
          )
        },
        (e) => {
          console.error(
            `[${new Date().toLocaleTimeString()}] ❌ ROP Pipeline failed for message ts: ${payload.ts}`,
            e.message,
          )
        },
      )
  })
}
