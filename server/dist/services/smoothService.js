import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config();
const API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
    apiKey: API_KEY,
});
class SmoothService {
    smooth = async (payload) => {
        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You will smooth text. Just return the result, not include any explanation.`,
                    },
                    {
                        role: 'user',
                        content: `Text : ${payload.text}`,
                    },
                ],
            });
            return {
                status: 'success',
                error: '',
                content: completion.choices[0].message.content,
            };
        }
        catch (error) {
            console.error('Error calling completion API:', error);
            throw error;
        }
    };
}
export default SmoothService;
