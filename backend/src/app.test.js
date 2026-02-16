const request = require('supertest');
const app = require('./server');
const fs = require('fs-extra');

jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: 'Test AI Reply' } }]
                })
            }
        }
    }));
});

jest.mock('fs-extra');

describe('API Endpoints', () => {

    describe('GET /api/reviews', () => {
        it('should return reviews from the latest file', async () => {
            fs.readdir.mockResolvedValue(['reviews_2024-01-01.json']);
            fs.readJson.mockResolvedValue({ naver: [{ content: 'Good' }], kakao: [] });

            const res = await request(app).get('/api/reviews');

            expect(res.statusCode).toEqual(200);
            expect(res.body.naver).toBeDefined();
            expect(res.body.naver[0].content).toEqual('Good');
        });

        it('should return 400 if no review content is provided', async () => {
            const res = await request(app)
                .post('/api/generate-reply')
                .send({ source: 'naver' });

            expect(res.statusCode).toEqual(400);
        });
    });

    describe('POST /api/generate-reply', () => {
        it('should generate a reply for a valid review', async () => {
            const res = await request(app)
                .post('/api/generate-reply')
                .send({
                    content: '커피가 맛있어요',
                    source: 'naver',
                    reviewer: '테스터'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.reply).toEqual('Test AI Reply');
        });
    });
});
