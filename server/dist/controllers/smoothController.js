import SmoothService from 'src/services/smoothService';
class SmoothController {
    smooth = async (req, res) => {
        try {
            const payload = {
                language: req.query.language,
                text: req.query.text,
                needExplanation: req.query.needExplanation === 'true',
                context: req.query.context,
            };
            console.log('[smooth request]', payload);
            const service = new SmoothService();
            const result = await service.smooth(payload);
            console.log('[smooth response]', result);
            res.send(result);
        }
        catch (error) {
            console.error('Error calling Gemini Google API:', error);
            res.status(200).send({ status: 'error', error: 'Error when completing', content: '' });
        }
    };
}
export default SmoothController;
