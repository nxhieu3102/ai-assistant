import SummarizeService from 'src/services/summarizeService';
class SummarizeController {
    summarize = async (req, res) => {
        try {
            const payload = {
                language: req.query.language,
                text: req.query.text,
                needExplanation: req.query.needExplanation === 'true',
                context: req.query.context,
            };
            console.log("payload:", payload);
            const service = new SummarizeService();
            const result = await service.summarize(payload);
            console.log("result:", result);
            res.send(result);
        }
        catch (error) {
            console.error('Error calling Gemini Google API:', error);
            res.status(200).send({ status: 'error', error: 'Error when completing', content: '' });
        }
    };
}
export default SummarizeController;
