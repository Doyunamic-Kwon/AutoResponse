const { createBrowser } = require('../core/browser');

class NaverScraper {
    constructor(restaurantId) {
        this.restaurantId = restaurantId;
        // Revert to PC Map URL as it's more stable for direct scraping
        this.baseUrl = `https://pcmap.place.naver.com/restaurant/${restaurantId}/review/visitor`;
    }

    async run() {
        console.log(`[NAVER] Starting scrape for ${this.restaurantId} (DOM Mode)...`);
        const { browser, context, page } = await createBrowser();
        const reviews = [];

        try {
            await page.goto(this.baseUrl, { waitUntil: 'load', timeout: 30000 });

            // Wait for list to appear
            // Try explicit wait for the review list container
            try {
                await page.waitForSelector('ul', { timeout: 10000 });
            } catch (e) {
                console.log("[NAVER] Timeout waiting for ul, might be empty or different structure.");
            }

            // aggressive scrolling to load more reviews
            console.log("[NAVER] Scrolling...");
            for (let i = 0; i < 5; i++) {
                await page.keyboard.press('End');
                await page.waitForTimeout(1000);

                // Click '더보기' (More) if found.
                // Class 'fvwqf' is common for "More" button on Naver PC
                const moreBtn = await page.$('a.fvwqf');
                if (moreBtn) {
                    await moreBtn.click();
                    await page.waitForTimeout(1000);
                }
            }

            // Advanced Parsing Strategy: Search all frames
            let targetFrame = page;
            const frames = page.frames();
            console.log(`[NAVER] Use Frame Search. Total frames: ${frames.length}`);

            // Try to find the frame that contains reviews
            for (const frame of frames) {
                const text = await frame.content();
                if (text.includes('방문자 리뷰') && text.includes('인증')) {
                    console.log(`[NAVER] Found target frame: ${frame.url()}`);
                    targetFrame = frame;
                    break;
                }
            }

            // aggressive scrolling on target frame
            console.log("[NAVER] Scrolling target frame...");
            for (let i = 0; i < 5; i++) {
                await targetFrame.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                await page.waitForTimeout(1000);
            }

            // Universal Text Mining Strategy V2: Span Mining
            // Naver uses random class names, so we grab ALL spans and filter by heuristic.
            const allSpans = await targetFrame.$$('span');
            console.log(`[NAVER] Mining ${allSpans.length} spans...`);

            let currentReview = {};

            for (const span of allSpans) {
                try {
                    const text = (await span.innerText()).trim();
                    if (!text) continue;

                    // 1. Detect Date -> Start of new review potential
                    // Matches "24.10.25.금" or "2024.10.25"
                    const dateMatch = text.match(/([0-9]{2,4}\.[0-9]{1,2}\.[0-9]{1,2})/);

                    if (dateMatch) {
                        // If we have a pending review with content, push it
                        if (currentReview.content && currentReview.content.length > 5) {
                            reviews.push(currentReview);
                        }
                        // Start new review
                        currentReview = {
                            source: 'naver',
                            date: dateMatch[0],
                            content: ''
                        };
                    } else if (currentReview.date) {
                        // We are inside a review block context
                        // Filter out unrelated short keywords like "방문", "인증", "공유"

                        const isKeyword = /^(방문|인증|공유|신고|반응|여행|리뷰|사진|첫)$/.test(text) || text.includes('개의 리뷰가 더 있습니다');
                        const isMenu = text.includes("원") && text.length < 15; // Price/Menu

                        if (text.includes('대기 시간')) {
                            currentReview.waiting = text.replace('대기 시간', '').trim();
                        } else if (text.match(/^(연인|배우자|아이|부모님|친구|혼자|비즈니스)/)) {
                            currentReview.purpose = text;
                        } else if (text.includes('방문')) {
                            // Extract visit time and booking info
                            if (text.match(/(아침|점심|저녁|오후|오전)에 방문/)) {
                                currentReview.visitTime = text.match(/(아침|점심|저녁|오후|오전)에 방문/)[0];
                            }
                            if (text.includes('예약')) {
                                currentReview.booking = text.includes('예약 없이') ? '예약 없이 이용' : '예약 후 이용';
                            }
                        } else if (text.includes('영수증') || text.includes('결제내역')) {
                            currentReview.reviewType = text.includes('영수증') ? '영수증 리뷰' : '결제내역 리뷰';
                        } else if (!isKeyword && !isMenu && text.length > 5) {
                            // This heavily implies it's the review content
                            // Append if multiple lines are split across spans
                            currentReview.content = (currentReview.content || '') + ' ' + text;
                        }
                    }
                } catch (e) {
                    // stale element
                }
            }

            // Push the last one
            if (currentReview.content && currentReview.content.length > 5) {
                reviews.push(currentReview);
            }

            console.log(`[NAVER] Extracted ${reviews.length} reviews via DOM Scraping.`);

        } catch (error) {
            console.error(`[NAVER] Error: ${error.message}`);
            try {
                await page.screenshot({ path: `error_naver_${this.restaurantId}.png` });
            } catch (err) {
                // ignore screenshot error
            }
        } finally {
            await browser.close();
        }

        return reviews;
    }
}

module.exports = NaverScraper;
