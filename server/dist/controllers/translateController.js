import TranslateService from 'src/services/translateService';
class TranslateController {
    translate = async (req, res) => {
        try {
            const payload = {
                language: req.query.language,
                text: req.query.text,
                needExplanation: req.query.needExplanation === 'true',
                context: req.query.context,
            };
            console.log(payload);
            const translateService = new TranslateService();
            const result = await translateService.translate(payload);
            console.log("result:", result);
            res.send(result);
        }
        catch (error) {
            console.error('Error calling Gemini Google API:', error);
            res.status(200).send({ status: 'error', error: 'Error when completing', content: '' });
        }
    };
}
export default TranslateController;
