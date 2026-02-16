const { createBrowser } = require('../core/browser');

class NaverScraper {
    constructor(restaurantId) {
        this.restaurantId = restaurantId;
        // Revert to PC Map URL as it's more stable for direct scraping
        this.baseUrl = `https://pcmap.place.naver.com/restaurant/${restaurantId}/review/visitor`;
    }

    processSpans(spansText) {
        const reviews = [];
        let currentReview = {};

        for (const text of spansText) {
            if (!text) continue;

            const dateMatch = text.match(/([0-9]{2,4}\.[0-9]{1,2}\.[0-9]{1,2})/);

            if (dateMatch) {
                if (currentReview.content && currentReview.content.length > 5) {
                    reviews.push(currentReview);
                }
                currentReview = {
                    source: 'naver',
                    date: dateMatch[0],
                    content: ''
                };
            } else if (currentReview.date) {
                const isKeyword = /^(방문|인증|공유|신고|반응|여행|리뷰|사진|첫)$/.test(text) || text.includes('개의 리뷰가 더 있습니다');
                const isMenu = text.includes("원") && text.length < 15;

                if (text.includes('대기 시간')) {
                    currentReview.waiting = text.replace('대기 시간', '').trim();
                } else if (text.match(/^(연인|배우자|아이|부모님|친구|혼자|비즈니스)/)) {
                    currentReview.purpose = text;
                } else if (text.match(/(아침|점심|저녁|오후|오전)에 방문/)) {
                    currentReview.visitTime = text.match(/(아침|점심|저녁|오후|오전)에 방문/)[0];
                } else if (text.includes('예약')) {
                    currentReview.booking = text.includes('예약 없이') ? '예약 없이 이용' : '예약 후 이용';
                } else if (text.includes('영수증') || text.includes('결제내역')) {
                    currentReview.reviewType = text.includes('영수증') ? '영수증 리뷰' : '결제내역 리뷰';
                } else if (!isKeyword && !isMenu && text.length > 5) {
                    currentReview.content = (currentReview.content || '') + ' ' + text;
                }
            }
        }

        if (currentReview.content && currentReview.content.length > 5) {
            reviews.push(currentReview);
        }

        return reviews;
    }

    async run() {
        console.log(`[NAVER] Starting scrape for ${this.restaurantId} (DOM Mode)...`);
        const { browser, context, page } = await createBrowser();
        let reviews = [];

        try {
            await page.goto(this.baseUrl, { waitUntil: 'load', timeout: 30000 });

            try {
                await page.waitForSelector('ul', { timeout: 10000 });
            } catch (e) {
                console.log("[NAVER] Timeout waiting for ul, might be empty or different structure.");
            }

            console.log("[NAVER] Scrolling...");
            for (let i = 0; i < 5; i++) {
                await page.keyboard.press('End');
                await page.waitForTimeout(1000);
                const moreBtn = await page.$('a.fvwqf');
                if (moreBtn) {
                    await moreBtn.click();
                    await page.waitForTimeout(1000);
                }
            }

            let targetFrame = page;
            const frames = page.frames();
            for (const frame of frames) {
                const text = await frame.content();
                if (text.includes('방문자 리뷰') && text.includes('인증')) {
                    targetFrame = frame;
                    break;
                }
            }

            const allSpans = await targetFrame.$$('span');
            const spansText = [];
            for (const span of allSpans) {
                try {
                    spansText.push((await span.innerText()).trim());
                } catch (e) { }
            }

            reviews = this.processSpans(spansText);
            console.log(`[NAVER] Extracted ${reviews.length} reviews via DOM Scraping.`);

        } catch (error) {
            console.error(`[NAVER] Error: ${error.message}`);
        } finally {
            await browser.close();
        }

        return reviews;
    }
}

module.exports = NaverScraper;
