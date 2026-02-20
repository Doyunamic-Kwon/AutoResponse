const NaverScraper = require('./src/scrapers/naver');
const KakaoScraper = require('./src/scrapers/kakao');

async function testScrapers() {
    const naverId = '1653634036';
    const kakaoId = '1693490856';

    console.log('--- NAVER TEST START ---');
    const naver = new NaverScraper(naverId);
    const naverReviews = await naver.run();
    console.log(`Naver Reviews Found: ${naverReviews.length}`);
    if (naverReviews.length > 0) {
        console.log('First Naver Review Sample:', JSON.stringify(naverReviews[0], null, 2));
        const hasTruncation = naverReviews.some(r => r.content.includes('더보기'));
        console.log(`Contains "더보기" text: ${hasTruncation ? "FAILED" : "PASSED"}`);
    }

    console.log('\n--- KAKAO TEST START ---');
    const kakao = new KakaoScraper(kakaoId);
    const kakaoReviews = await kakao.run();
    console.log(`Kakao Reviews Found: ${kakaoReviews.length}`);
    if (kakaoReviews.length > 0) {
        console.log('First Kakao Review Sample:', JSON.stringify(kakaoReviews[0], null, 2));
    }

    process.exit(0);
}

testScrapers().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
});
