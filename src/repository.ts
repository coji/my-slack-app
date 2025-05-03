import { db } from './db'

export const slackRepository = {
  async findUserById(userId: string) {
    return db
      .selectFrom('slack_users')
      .selectAll()
      .where('userId', '=', userId)
      .executeTakeFirst()
  },

  async createUser(userData: {
    userId: string
    name: string | null
    realName: string | null
    profileImage: string | null
  }) {
    return db
      .insertInto('slack_users')
      .values({
        ...userData,
        updatedAt: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirst()
  },

  async saveMessage(messageData: {
    ts: string
    channel: string
    user: string
    text?: string
    thread_ts?: string
    subtype?: string
  }) {
    return db
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
      .execute()
  },
}
