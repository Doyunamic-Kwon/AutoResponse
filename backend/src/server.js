require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Paths
const dataDir = path.join(__dirname, '../../scraper/data');
console.log(`[BACKEND] Data directory: ${dataDir}`);

// Routes preview
app.get('/', (req, res) => {
    res.json({ message: "AutoResponse API is running" });
});

// Endpoint to get the latest reviews
app.get('/api/reviews', async (req, res) => {
    try {
        const files = await fs.readdir(dataDir);
        const jsonFiles = files.filter(f => f.endsWith('.json') && f.startsWith('reviews_'));

        if (jsonFiles.length === 0) {
            return res.json({ reviews: [], message: "No review files found." });
        }

        // Sort by name (which includes timestamp) to get the latest
        jsonFiles.sort().reverse();
        const latestFile = path.join(dataDir, jsonFiles[0]);

        const data = await fs.readJson(latestFile);
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to load reviews" });
    }
});

// AI Reply Generation Endpoint
app.post('/api/generate-reply', async (req, res) => {
    const { content, source, reviewer } = req.body;

    if (!content) {
        return res.status(400).json({ error: "Review content is required" });
    }

    try {
        const persona = "친절하고 세심한 카페 사장님. 따뜻한 말투를 사용하며, 손님의 리뷰 내용 중 구체적인 부분(맛, 서비스, 분위기 등)을 언급하며 감사 인사를 전함. 마지막에는 꼭 재방문을 바라는 멘트를 넣음.";

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `너는 ${persona}이야. 고객이 남긴 리뷰에 대해 정성스러운 답글을 작성해줘. 답변은 한국어로 하고, 너무 길지 않게 3~4문장 정도로 작성해줘.`
                },
                {
                    role: "user",
                    content: `플랫폼: ${source}\n작성자: ${reviewer || '고객님'}\n리뷰 내용: ${content}`
                }
            ],
            temperature: 0.7,
        });

        const reply = response.choices[0].message.content;
        res.json({ reply });
    } catch (error) {
        console.error("OpenAI Error:", error);
        res.status(500).json({ error: "AI 답글 생성에 실패했습니다. API 키를 확인해주세요." });
    }
});

app.listen(PORT, () => {
    console.log(`[BACKEND] Server is running on http://localhost:${PORT}`);
});
