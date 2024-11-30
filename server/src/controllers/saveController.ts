import { Request, Response } from "express";
import { PayloadSaveRequest } from "src/models/translateModel";
import SaveService from "src/services/saveService";

class SaveController {
  public save = async (req: Request, res: Response) => {
    try {
      const payload: PayloadSaveRequest = {
        initialText: req.body.initialText,
        translation: req.body.translation,
      };
      const service = new SaveService();
      const result = await service.save(payload);
      res.send(result);
    } catch (error) {
      console.error("Error calling Gemini Google API:", error);
      res
        .status(200)
        .send({ status: "error", error: "Error when completing", content: "" });
    }
  };
}

export default SaveController;
