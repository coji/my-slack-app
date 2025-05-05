export type DatabaseError = {
  type: 'DatabaseError'
  message: string
  cause?: unknown
}

export type SlackApiError = {
  type: 'SlackApiError'
  message: string
  cause?: unknown
}

export type AppError = DatabaseError | SlackApiError
