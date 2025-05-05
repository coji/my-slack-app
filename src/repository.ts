import type { Selectable } from 'kysely'
import { ResultAsync } from 'neverthrow'
import { db, type Database } from './db'
import dayjs from './utils/dayjs'

export type DatabaseError = {
  type: 'DatabaseError'
  message: string
  cause?: unknown
}

const createDbError = (message: string, cause?: unknown): DatabaseError => ({
  type: 'DatabaseError',
  message,
  cause,
})

export const slackRepository = {
  findUserById(
    userId: string,
  ): ResultAsync<
    Selectable<Database['slack_users']> | undefined,
    DatabaseError
  > {
    return ResultAsync.fromPromise(
      db
        .selectFrom('slack_users')
        .selectAll()
        .where('userId', '=', userId)
        .executeTakeFirst(),
      (error) => createDbError('select slack_users failed', error),
    )
  },

  upsertUser(userData: {
    userId: string
    name: string | null
    realName: string | null
    profileImage: string | null
  }): ResultAsync<Selectable<Database['slack_users']>, DatabaseError> {
    return ResultAsync.fromPromise(
      db
        .insertInto('slack_users')
        .values({
          ...userData,
          updatedAt: dayjs().utc().toISOString(),
        })
        .onConflict((oc) =>
          oc.doUpdateSet((eb) => ({
            name: eb.ref('excluded.name'),
            realName: eb.ref('excluded.realName'),
            profileImage: eb.ref('excluded.profileImage'),
            updatedAt: eb.ref('excluded.updatedAt'),
          })),
        )
        .returningAll()
        .executeTakeFirstOrThrow(),
      (error) => createDbError('upsert slack_users failed', error),
    )
  },

  saveMessage(messageData: {
    ts: string
    channel: string
    user: string
    text?: string
    thread_ts?: string
    subtype?: string
  }): ResultAsync<Selectable<Database['slack_messages']>, DatabaseError> {
    return ResultAsync.fromPromise(
      db
        .insertInto('slack_messages')
        .values({
          ts: messageData.ts,
          channel: messageData.channel,
          user: messageData.user,
          text: messageData.text ?? null,
          threadTs: messageData.thread_ts ?? null,
          subtype: messageData.subtype ?? null,
          deleted: false,
        })
        .returningAll()
        .executeTakeFirstOrThrow(),
      (error) => createDbError('insert slack_message failed', error),
    )
  },
}
