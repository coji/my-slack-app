import { SlackApp, type SlackEdgeAppEnv } from 'slack-cloudflare-workers'

export default {
  async fetch(
    request: Request,
    env: SlackEdgeAppEnv,
    ctx: ExecutionContext,
  ): Promise<Response> {
    console.log('url:', request.url)
    const app = new SlackApp({ env })

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
      },
      // },
    )

    // グローバルショートカットを実行したらモーダルが開いてデータ送信まで
    app.shortcut(
      'hey-cf-workers',
      async () => {}, // // ack するだけで何もしない
      async ({ context, body }) => {
        await context.client.views.open({
          trigger_id: body.trigger_id,
          view: {
            type: 'modal',
            callback_id: 'test-modal', // app.view リスナーがマッチする文字列
            title: { type: 'plain_text', text: 'テストモーダル' },
            submit: { type: 'plain_text', text: '送信' },
            close: { type: 'plain_text', text: 'キャンセル' },
            blocks: [
              {
                type: 'input',
                block_id: 'memo',
                label: { type: 'plain_text', text: 'メモ' },
                element: {
                  type: 'plain_text_input',
                  multiline: true,
                  action_id: 'input',
                },
              },
              {
                type: 'input',
                block_id: 'category',
                label: { type: 'plain_text', text: 'カテゴリ' },
                element: {
                  type: 'external_select',
                  action_id: 'category-search', // app.options がマッチする文字列
                  min_query_length: 1,
                },
              },
            ],
          },
        })
      },
    )
    // external_select のキーワード検索への応答
    // この処理は 3 秒以内に同期的に検索結果を返す必要があるので lazy 関数は渡せない
    app.options('category-search', async ({ payload }) => {
      console.log(`Query: ${payload.value}`)
      // 本当はここの応答内容は payload.value の文字列にマッチするようにフィルターする
      return {
        options: [
          {
            text: { type: 'plain_text', text: '仕事' },
            value: 'work',
          },
          {
            text: { type: 'plain_text', text: '家族' },
            value: 'family',
          },
          {
            text: { type: 'plain_text', text: 'ランニング' },
            value: 'running',
          },
          {
            text: { type: 'plain_text', text: '雑感' },
            value: 'random-thought',
          },
        ],
      }
    })
    // モーダルからデータ送信されたとき
    app.view(
      'test-modal',
      async ({ payload }) => {
        // モーダルの操作、エラーの表示などはここで 3 秒以内にやる
        const stateValues = payload.view.state.values
        console.log(JSON.stringify(stateValues, null, 2))
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        const memo = payload.view.state.values.memo.input.value!
        if (memo.length < 10) {
          // 入力エラー表示
          return {
            response_action: 'errors',
            errors: { memo: 'メモは 10 文字以上で記述してください' },
          }
        }
        // 完了画面にモーダルを書き換える
        return {
          response_action: 'update',
          view: {
            type: 'modal',
            callback_id: 'test-modal',
            title: { type: 'plain_text', text: 'テストモーダル' },
            close: { type: 'plain_text', text: '閉じる' },
            blocks: [
              {
                type: 'section',
                text: { type: 'plain_text', text: '受け付けました！' },
              },
            ],
          },
        }
        // 単にこのモーダルを閉じたい場合は何も返さない
      },
      async (req) => {
        // 非同期処理を追加でやりたければここに記述する
      },
    )

    app.event('app_mention', async ({ context }) => {
      await context.say({
        text: `<@${context.userId}> さん、何かご用ですか？`,
      })
    })

    return await app.run(request, ctx)
  },
}
