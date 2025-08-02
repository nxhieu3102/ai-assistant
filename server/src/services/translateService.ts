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
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a personal translator. Try your best to translate, don't return undefined or something like that. The text may have some special characters, let ignore it and focus on the meaning. Let's translate these words into ${payload.language} with context related to ${payload.context}: ${payload.text}. Just return the translation, not include any explanation.`, 
          },
          {
            role: 'user',
            content: `Translate from English to ${payload.language}: ${payload.text}`,
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
