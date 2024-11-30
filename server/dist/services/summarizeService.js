import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config();
const API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
    apiKey: API_KEY,
});
class SummarizeService {
    summarize = async (payload) => {
        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a personal summarizer. Try your best to summarize, don't return undefined or something like that. The text may have some special characters, let ignore it and focus on the meaning. Let's summarize these words with context related to ${payload.context}: ${payload.text}. Just return the summarization, not include any explanation.`,
                    },
                    {
                        role: 'user',
                        content: `Summarize : ${payload.text}`,
                    },
                ],
            });
            console.log(completion.choices);
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
export default SummarizeService;
