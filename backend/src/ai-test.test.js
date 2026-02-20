const request = require('supertest');
const express = require('express');
const OpenAI = require('openai');

// Mock OpenAI
jest.mock('openai');

const app = express();
app.use(express.json());

// Mocking the simplified version of the endpoint logic
app.post('/api/generate-reply', async (req, res) => {
    const { content, style = 'warm' } = req.body;

    // Simulate the prompt logic
    const systemMessage = `너는 ${style}한 사장님이야.`;
    const userMessage = `리뷰: ${content}`;

    try {
        const openai = new OpenAI();
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: userMessage }
            ],
        });
        res.json({ reply: response.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

describe('AI Reply Generation TDD', () => {
    it('should return a generated reply from the AI', async () => {
        // Setup mock response
        const mockReply = "방문해 주셔서 정말 감사합니다! 다음에 또 봬요.";
        OpenAI.prototype.chat = {
            completions: {
                create: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: mockReply } }]
                })
            }
        };

        const res = await request(app)
            .post('/api/generate-reply')
            .send({
                content: "커피가 맛있어요!",
                style: "warm"
            });

        expect(res.status).toBe(200);
        expect(res.body.reply).toBe(mockReply);
        console.log('✅ AI Reply TDD: Passed (Mocked response received)');
    });

    it('should handle errors gracefully', async () => {
        OpenAI.prototype.chat = {
            completions: {
                create: jest.fn().mockRejectedValue(new Error('API Error'))
            }
        };

        const res = await request(app)
            .post('/api/generate-reply')
            .send({ content: "test" });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('API Error');
        console.log('✅ AI Error Handling TDD: Passed');
    });
});
