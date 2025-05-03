import { env } from 'cloudflare:workers'
import { CamelCasePlugin, Kysely, type Generated } from 'kysely'
import { D1Dialect } from 'kysely-d1'

interface Database {
  slack_messages: {
    id: Generated<number>
    ts: string
    channel: string
    user: string | null
    text: string | null
    threadTs: string | null
    subtype: string | null
    editedTs: string | null
    deleted: boolean
    createdAt: Generated<string>
  }

  slack_users: {
    userId: string
    name: string | null
    realName: string | null
    profileImage: string | null
    updatedAt: Generated<string>
  }

  slack_channels: {
    channelId: string
    name: string | null
    isPrivate: boolean | null
    updatedAt: Generated<string>
  }

  slack_reactions: {
    id: Generated<number>
    messageTs: string
    channel: string
    user: string
    reaction: string
    createdAt: Generated<string>
  }

  slack_threads: {
    thread_ts: string
    channel: string
    user: string | null
    text: string | null
    messageCount: number
    lastMessageTs: string | null
    createdAt: Generated<string>
    updatedAt: Generated<string>
  }

  slack_files: {
    id: Generated<number>
    messageTs: string
    channel: string
    name: string | null
    url: string | null
    mimetype: string | null
    size: number | null
    createdAt: Generated<string>
  }
}

export const db = new Kysely<Database>({
  dialect: new D1Dialect({ database: env.DB }),
  plugins: [new CamelCasePlugin()],
})
