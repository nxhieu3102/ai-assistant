import { PayloadRequest, ResponseData } from 'src/models/translateModel'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'
dotenv.config()

const API_KEY = process.env.OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: API_KEY,
})

class TranslateService {
  public translate = async (payload: PayloadRequest): Promise<ResponseData> => {
    try {
      const content =
        `Let's translate these words into ${payload.language} with context related to ${payload.context}: "${payload.text}"` +
        (payload.needExplanation
          ? '. Please include your explanation.'
          : '. Just return the translation, not include any explanation.')
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Translate the text into the target language.',
          },
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
}

export default TranslateService
