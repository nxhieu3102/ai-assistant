export type PayloadRequest = {
  language: string
  text: string
  needExplanation: boolean
  context: string
}

export type ResponseData = {
  status: string
  error: string
  content: string
}
