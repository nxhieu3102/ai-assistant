import { Request, Response } from 'express'
import { PayloadRequest } from 'src/models/translateModel'
import SmoothService from 'src/services/smoothService'

class SmoothController {
  public smooth = async (req: Request, res: Response) => {
    try {
      const payload: PayloadRequest = {
        language: req.query.language as string,
        text: req.query.text as string,
        needExplanation: req.query.needExplanation === 'true',
        context: req.query.context as string,
      }
      console.log('[smooth request]', payload);
      const service = new SmoothService()
      const result = await service.smooth(payload)
      console.log('[smooth response]', result);
      res.send(result)
    } catch (error) {
      console.error('Error calling Gemini Google API:', error)
      res.status(200).send({ status: 'error', error: 'Error when completing', content: '' })
    }
  }
}

export default SmoothController
