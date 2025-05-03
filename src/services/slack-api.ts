import { env } from 'cloudflare:workers'

export const fetchSlackUserInfo = async (userId: string) => {
  const response = await fetch(
    `https://slack.com/api/users.info?user=${userId}`,
    {
      headers: {
        Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    },
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.statusText}`)
  }
  const data = await response.json()
  console.log('user info', data)
  return data
}
