const { createBrowser } = require('../core/browser');

class NaverScraper {
    constructor(restaurantId) {
        this.restaurantId = restaurantId;
        this.baseUrl = `https://pcmap.place.naver.com/restaurant/${restaurantId}/review/visitor`;
    }

    async run() {
        console.log(`[NAVER] Starting scrape for ${this.restaurantId} (Premium Mode)...`);
        const { browser, context, page } = await createBrowser();
        let reviews = [];

        try {
            await page.goto(this.baseUrl, { waitUntil: 'load', timeout: 30000 });
            console.log("[NAVER] Page loaded. Waiting for reviews...");

            // Wait for the review list
            try {
                await page.waitForSelector('ul.OTi6Q', { timeout: 10000 });
            } catch (e) {
                console.log("[NAVER] Review list selector not found. Retrying with backup...");
            }

            // Scroll and load more
            console.log("[NAVER] Loading more reviews...");
            for (let i = 0; i < 3; i++) {
                await page.keyboard.press('End');
                await page.waitForTimeout(1000);
                const moreBtn = await page.$('a.dP0sq'); // "더보기" button
                if (moreBtn && await moreBtn.isVisible()) {
                    await moreBtn.click();
                    await page.waitForTimeout(1500);
                }
            }

            // Extract using reliable page.evaluate
            reviews = await page.evaluate((source) => {
                const items = document.querySelectorAll('li.EjjAW, li.MHaAm');
                const results = [];

                items.forEach(item => {
                    const content = item.querySelector('.z_38Y')?.innerText || '';
                    const reviewer = item.querySelector('.TwuS_')?.innerText || 'Anonymous';
                    const date = item.querySelector('.CKU9p')?.innerText || new Date().toISOString();

                    // Extract rating from stars if possible (usually icons or text)
                    const ratingText = item.querySelector('.h693r')?.innerText || '';
                    const rating = ratingText.includes('별점') ? parseFloat(ratingText.match(/\d+(\.\d+)?/)?.[0] || '5') : 5;

                    // Context tags (waiting, purpose, etc.) are usually in spans inside specific containers
                    let waiting = '';
                    let purpose = '';
                    let visitTime = '';

                    const tags = item.querySelectorAll('.KM91A span');
                    tags.forEach(tag => {
                        const text = tag.innerText;
                        if (text.includes('대기')) waiting = text.replace('대기 시간', '').trim();
                        if (text.match(/^(연인|배우자|아이|부모님|친구|혼자|비즈니스)/)) purpose = text;
                        if (text.includes('방문')) visitTime = text;
                    });

                    if (content.length > 2 || purpose.length > 2) {
                        results.push({
                            source,
                            reviewer,
                            rating,
                            content: content.trim(),
                            date,
                            waiting,
                            purpose,
                            visitTime
                        });
                    }
                });

                return results;
            }, 'naver');

            console.log(`[NAVER] Successfully extracted ${reviews.length} premium reviews.`);

        } catch (error) {
            console.error(`[NAVER] Error: ${error.message}`);
        } finally {
            await browser.close();
        }

        return reviews;
    }
}

module.exports = NaverScraper;
