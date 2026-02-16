const NaverScraper = require('./scrapers/naver');
const KakaoScraper = require('./scrapers/kakao');
const fs = require('fs-extra');
const path = require('path');

async function main() {
    // Default IDs for testing (Gangnam Alver Cafe)
    // You can pass IDs via command line: node src/main.js <naverId> <kakaoId>
    const naverId = process.argv[2] || '34016603'; // Example ID: Gangnam Alver Cafe
    const kakaoId = process.argv[3] || '26338954'; // Example ID: Gangnam Alver Cafe

    console.log(`[MAIN] Starting scraping for Naver ID: ${naverId}, Kakao ID: ${kakaoId}`);

    const results = {
        naver: [],
        kakao: [],
        timestamp: new Date().toISOString()
    };

    // Run parallel
    try {
        const [naverReviews, kakaoReviews] = await Promise.all([
            new NaverScraper(naverId).run(),
            new KakaoScraper(kakaoId).run()
        ]);

        results.naver = naverReviews;
        results.kakao = kakaoReviews;

        // Save to file
        const dataDir = path.join(__dirname, '../data');
        await fs.ensureDir(dataDir);

        const filename = `reviews_${new Date().toISOString().replace(/:/g, '-')}.json`;
        const filePath = path.join(dataDir, filename);

        await fs.writeJson(filePath, results, { spaces: 2 });
        console.log(`[MAIN] Saved ${results.naver.length + results.kakao.length} reviews to ${filePath}`);

    } catch (error) {
        console.error(`[MAIN] Critical Error: ${error}`);
    }
}

main();
