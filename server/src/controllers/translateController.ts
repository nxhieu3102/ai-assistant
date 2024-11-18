import { Request, Response } from 'express'
import { PayloadRequest } from 'src/models/translateModel'
import TranslateService from 'src/services/translateService'

class TranslateController {
  public translate = async (req: Request, res: Response) => {
    try {
      const payload: PayloadRequest = {
        language: req.query.language as string,
        text: req.query.text as string,
        needExplanation: req.query.needExplanation === 'true',
        context: req.query.context as string,
      }
      const translateService = new TranslateService()
      const result = await translateService.translate(payload)
      res.send(result)
    } catch (error) {
      console.error('Error calling Gemini Google API:', error)
      res.status(200).send({ status: 'error', error: 'Error when completing', content: '' })
    }
  }
}

export default TranslateController
