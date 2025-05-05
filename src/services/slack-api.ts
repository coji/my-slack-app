import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import type { SlackApp, SlackEdgeAppEnv } from 'slack-cloudflare-workers'
import type { SlackApiError } from '~/errors'

type WebClient = SlackApp<SlackEdgeAppEnv>['client']

export function fetchUserInfoFromSlack(client: WebClient, userId: string) {
  return ResultAsync.fromPromise(
    client.users.info({ user: userId }),
    (err) =>
      ({
        type: 'SlackApiError',
        message: 'users.info failed',
        cause: err,
      }) satisfies SlackApiError,
  ).andThen((userInfoResult) => {
    if (userInfoResult.ok && userInfoResult.user) {
      return okAsync(userInfoResult.user)
    }
    return errAsync({
      type: 'SlackApiError',
      message: userInfoResult.error ?? 'unknown error',
    } satisfies SlackApiError)
  })
}
