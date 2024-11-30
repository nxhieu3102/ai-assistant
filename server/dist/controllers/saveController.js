import SaveService from "src/services/saveService";
class SaveController {
    save = async (req, res) => {
        try {
            const payload = {
                initialText: req.body.initialText,
                translation: req.body.translation,
            };
            const service = new SaveService();
            const result = await service.save(payload);
            res.send(result);
        }
        catch (error) {
            console.error("Error calling Gemini Google API:", error);
            res
                .status(200)
                .send({ status: "error", error: "Error when completing", content: "" });
        }
    };
}
export default SaveController;
