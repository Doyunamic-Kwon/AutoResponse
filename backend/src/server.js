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
// AI Reply Generation Endpoint
app.post('/api/generate-reply', async (req, res) => {
    const { content, source, reviewer, waiting, purpose, visitTime, booking, reviewType, style = 'warm' } = req.body;

    if (!content && !purpose) {
        return res.status(400).json({ error: "Review content or context is required" });
    }

    try {
        const personas = {
            warm: "햇살처럼 따뜻하고 친절한 카페 사장님. '온기'와 '정성'을 중요하게 생각하며, 손님의 리뷰를 하나하나 깊이 공감하고 배려하는 말투(예: ~하셨군요, ~덕분에 저희도 행복했습니다)를 사용함.",
            professional: "신뢰감을 주는 냉철하면서도 예의 바른 매니저. 군더더기 없이 깔끔하고 전문적인 문체(예: ~입니다, ~하겠습니다)를 사용하여 브랜드의 신뢰도를 높임.",
            energetic: "에너지가 넘치고 위트 있는 사장님. 느낌표(!)와 이모지를 적절히 사용하여 손님에게 활기를 전달하고 친근하게 소통함(예: 우와! 정말 감사합니다!)"
        };

        const selectedPersona = personas[style] || personas.warm;

        const contextInfo = [];
        if (visitTime) contextInfo.push(`방문 시간: ${visitTime}`);
        if (booking) contextInfo.push(`예약 정보: ${booking}`);
        if (waiting) contextInfo.push(`대기 상황: ${waiting}`);
        if (purpose) contextInfo.push(`방문 목적: ${purpose}`);
        if (reviewType) contextInfo.push(`인증 유형: ${reviewType}`);

        const systemMessage = `너는 ${selectedPersona}이야.
고객이 남긴 리뷰에 대해 '사람이 직접 쓴 것 같은' 따뜻하고 자연스러운 답글을 작성해줘.
특히 다음 '상황 정보'를 최대한 자연스럽게 문장 속에 녹여내서, 단순히 템플릿을 쓰는 게 아니라는 점을 보여줘.
(예: "오후에 방문해 주셨는데 대기 없이 바로 입장하셨다니 정말 다행이네요!")

[규칙]
1. 답변은 한국어로 하고, 3~4문장 정도로 정중하게 작성할 것.
2. AI인 티가 나지 않도록 로봇 같은 표현이나 지나치게 반복적인 표현은 피할 것.
3. 리뷰 내용이 없더라도 '상황 정보'를 바탕으로 "방문해 주셔서 감사합니다" 식의 정성스러운 인사를 건넬 것.`;

        const userMessage = `[정보]
플랫폼: ${source}
작성자: ${reviewer || '고객님'}
상황 정보: ${contextInfo.join(', ') || '정보 없음'}
리뷰 내용: ${content || '내용 없음 (키워드/별점 리뷰)'}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: userMessage }
            ],
            temperature: 0.8,
        });

        const reply = response.choices[0].message.content;
        res.json({ reply });
    } catch (error) {
        console.error("OpenAI Error:", error);
        res.status(500).json({ error: "AI 답글 생성에 실패했습니다. API 키를 확인해주세요." });
    }
});

// AI Insights Endpoint
app.get('/api/insights', async (req, res) => {
    try {
        const files = await fs.readdir(dataDir);
        const jsonFiles = files.filter(f => f.endsWith('.json') && f.startsWith('reviews_'));

        if (jsonFiles.length === 0) {
            return res.json({ summary: "데이터가 없습니다.", keywords: [] });
        }

        jsonFiles.sort().reverse();
        const latestFile = path.join(dataDir, jsonFiles[0]);
        const data = await fs.readJson(latestFile);

        const allReviews = [...(data.naver || []), ...(data.kakao || [])];
        const textToAnalyze = allReviews
            .filter(r => r.content && r.content.length > 5)
            .map(r => `[평점: ${r.rating}] ${r.content}`)
            .slice(0, 20) // Limit to latest 20 for token saving
            .join('\n');

        if (!textToAnalyze) {
            return res.json({
                summary: "분석할 텍스트 리뷰가 아직 충분하지 않습니다.",
                keywords: ["데이터 부족"]
            });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "너는 식당 평판 분석 전문가야. 제공된 리뷰들을 분석해서 '매장의 현재 상태 한줄 요약'과 '핵심 키워드 5개'를 추출해줘. 키워드는 긍정/부정 섞어서 가장 두드러지는 것으로 뽑아줘. JSON 형식으로 응답해: { \"summary\": \"string\", \"keywords\": [\"string\"] }"
                },
                { role: "user", content: `리뷰 데이터:\n${textToAnalyze}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const insights = JSON.parse(response.choices[0].message.content);
        res.json(insights);
    } catch (error) {
        console.error("Insight Generation Error:", error);
        res.status(500).json({ error: "인사이트 생성 실패" });
    }
});

// SSE Clients collection
let clients = [];

// Broadcast to all connected clients
const broadcast = (data) => {
    clients.forEach(client => client.res.write(`data: ${JSON.stringify(data)}\n\n`));
};

// SSE Streaming Endpoint
app.get('/api/sync-stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);

    console.log(`[SSE] Client connected: ${clientId}`);

    req.on('close', () => {
        console.log(`[SSE] Client disconnected: ${clientId}`);
        clients = clients.filter(c => c.id !== clientId);
    });
});

// Real-time Sync Endpoint (Trigger Scraper)
app.post('/api/sync', async (req, res) => {
    const { naver, kakao, naverId, kakaoId } = req.body;

    const nId = naver || naverId;
    const kId = kakao || kakaoId;

    if (!nId || !kId) {
        return res.status(400).json({ error: "Both Naver and Kakao IDs are required" });
    }

    const { spawn } = require('child_process');
    const scraperPath = path.join(__dirname, '../../scraper/src/main.js');

    console.log(`[BACKEND] Triggering live sync for Naver: ${nId}, Kakao: ${kId}`);
    broadcast({ type: 'status', message: '🚀 Scraper initialized...' });

    const scraper = spawn('node', [scraperPath, nId, kId]);

    scraper.stdout.on('data', (data) => {
        const message = data.toString().trim();
        if (message) {
            console.log(`[SCRAPER] ${message}`);
            broadcast({ type: 'log', message });
        }
    });

    scraper.stderr.on('data', (data) => {
        const message = data.toString().trim();
        console.error(`[SCRAPER ERR] ${message}`);
        broadcast({ type: 'error', message });
    });

    scraper.on('close', (code) => {
        console.log(`[SCRAPER] Process exited with code ${code}`);
        broadcast({
            type: 'done',
            message: code === 0 ? '✅ Sync completed successfully!' : `❌ Scraper exited with code ${code}`,
            success: code === 0
        });
    });

    res.json({ message: "Scraper process started." });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`[BACKEND] Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;
