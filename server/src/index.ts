import express, { Request, Response } from 'express'
import * as dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config()

const API_KEY = process.env.OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: API_KEY,
})

type PayloadRequest = {
  language: string
  text: string
  needExplanation: boolean
  context: string
}

type ResponseData = {
  status: string
  error: string
  content: string
}

const app = express()
const port = process.env.PORT || 3000

const getErrorResponse = (error: string) => {
  return {
    status: 'error',
    error,
    content: '',
  } as ResponseData
}

app.get('/translate', (req: Request, res: Response) => {
  try {
    const payload: PayloadRequest = {
      language: req.query.language as string,
      text: req.query.text as string,
      needExplanation: req.query.needExplanation === 'true',
      context: req.query.context as string,
    }
    return complete(payload).then((result) => {
      res.send(result)
    })
  } catch (error) {
    console.error('Error calling Gemini Google API:', error)
    res.status(200).send(getErrorResponse('Error when completing'))
  }
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`)
})

const complete = async (payload: PayloadRequest) => {
  try {
    const content =
      `Let's translate these words into ${payload.language} with context related to ${payload.context}: "${payload.text}"` +
      (payload.needExplanation
        ? '. Please include your explanation.'
        : '. Just return the translation, not include your explanation.')
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    })
    return {
      status: 'success',
      error: '',
      content: completion.choices[0].message.content,
    } as ResponseData
  } catch (error) {
    console.error('Error calling completion API:', error)
    throw error
  }
}
