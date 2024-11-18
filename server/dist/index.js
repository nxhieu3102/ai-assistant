import express from 'express';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
dotenv.config();
const API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
    apiKey: API_KEY,
});
const app = express();
const port = 3000;
app.get('/translate', (req, res) => {
    try {
        const payload = {
            language: req.query.language,
            text: req.query.text,
            needExplanation: req.query.needExplanation === 'true',
            context: req.query.context,
        };
        return complete(payload).then((result) => {
            res.send(result);
        });
    }
    catch (error) {
        console.error('Error calling Gemini Google API:', error);
        res.status(200).send('Error calling Gemini Google API');
    }
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
async function complete(payload) {
    try {
        const content = `Let's translate these words into ${payload.language} with context related to ${payload.context}: "${payload.text}"` + (payload.needExplanation ? '. Please include your explanation.' : '. Just return the translation, not include your explanation.');
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'user',
                    content,
                },
            ],
        });
        return completion.choices[0].message.content;
    }
    catch (error) {
        console.error('Error calling Gemini Google API:', error);
        throw error;
    }
}
