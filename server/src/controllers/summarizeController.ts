import { Request, Response } from 'express'
import { PayloadRequest } from 'src/models/translateModel'
import SummarizeService from 'src/services/summarizeService'

class SummarizeController {
  public summarize = async (req: Request, res: Response) => {
    try {
      const payload: PayloadRequest = {
        language: req.query.language as string,
        text: req.query.text as string,
        needExplanation: req.query.needExplanation === 'true',
        context: req.query.context as string,
      }
      console.log("payload:", payload);
      const service = new SummarizeService()
      const result = await service.summarize(payload)
      console.log("result:", result);
      res.send(result)
    } catch (error) {
      console.error('Error calling Gemini Google API:', error)
      res.status(200).send({ status: 'error', error: 'Error when completing', content: '' })
    }
  }
}

export default SummarizeController
