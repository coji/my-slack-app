-- Migration number: 0001 	 2025-05-02T05:30:31.863Z
CREATE TABLE slack_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL UNIQUE, -- SlackメッセージID (timestamp)
  channel TEXT NOT NULL, -- チャンネルID
  user TEXT, -- ユーザーID (BotやシステムメッセージはNULLのこともある)
  text TEXT, -- メッセージ本文
  thread_ts TEXT, -- 親メッセージTS（スレッド外ならNULL）
  subtype TEXT, -- サブタイプ (bot_messageなど)
  edited_ts TEXT, -- 編集日時（あれば）
  deleted BOOLEAN DEFAULT 0, -- 削除済み
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 保存日時
);

CREATE TABLE slack_users (
  user_id TEXT PRIMARY KEY,
  name TEXT,
  real_name TEXT,
  profile_image TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE slack_channels (
  channel_id TEXT PRIMARY KEY,
  name TEXT,
  is_private BOOLEAN,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE slack_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_ts TEXT NOT NULL, -- 対象メッセージTS
  channel TEXT NOT NULL, -- チャンネルID
  user TEXT NOT NULL, -- リアクション付けたユーザーID
  reaction TEXT NOT NULL, -- リアクション名 (:thumbsup: など)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE slack_threads (
  thread_ts TEXT PRIMARY KEY, -- スレッド親TS
  channel TEXT NOT NULL,
  user TEXT, -- 親メッセージのユーザーID
  text TEXT, -- 親メッセージ本文
  message_count INTEGER DEFAULT 1, -- スレッド内メッセージ数
  last_message_ts TEXT, -- 最後のメッセージTS
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE slack_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_ts TEXT NOT NULL,
  channel TEXT NOT NULL,
  name TEXT,
  url TEXT,
  mimetype TEXT,
  size INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
