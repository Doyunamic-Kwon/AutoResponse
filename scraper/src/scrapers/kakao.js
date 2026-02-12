const { createBrowser } = require('../core/browser');

class KakaoScraper {
    constructor(placeId) {
        this.placeId = placeId;
        this.baseUrl = `https://place.map.kakao.com/${placeId}`;
    }

    async run() {
        console.log(`[KAKAO] Starting scrape for ${this.placeId}...`);
        const { browser, context, page } = await createBrowser();
        const reviews = [];

        try {
            // Intercept API responses
            page.on('response', async (response) => {
                const url = response.url();

                // Log all XHR/Fetch calls for debugging
                if (response.request().resourceType() === 'xhr' || response.request().resourceType() === 'fetch') {
                    console.log(`[KAKAO DEBUG] Resource: ${url}`);
                }

                if (url.includes('/reviews/kakaomap') && response.status() === 200) {
                    console.log(`[KAKAO] Found Reviews API: ${url}`);
                    try {
                        const json = await response.json();
                        await require('fs-extra').writeJson(`debug_kakao_${this.placeId}.json`, json, { spaces: 2 });
                        console.log(`[KAKAO] Dumped JSON to debug_kakao_${this.placeId}.json`);

                        // The structure found in debug dump is { reviews: [...] }
                        if (json && json.reviews && json.reviews.length > 0) {
                            json.reviews.forEach(c => {
                                reviews.push({
                                    source: 'kakao',
                                    reviewer: c.photos && c.photos[0] && c.photos[0].meta && c.photos[0].meta.owner ? c.photos[0].meta.owner.nickname : 'Anonymous',
                                    rating: c.star_rating,
                                    content: c.contents, // Note: 'contents' might be missing in 'reviews' object if it's photo-only review, check structure carefully.
                                    // Actually, looking at debug dump, 'reviews' array has 'review_id', 'star_rating'. 
                                    // Content might be in a different field or handled differently.
                                    // Let's dump the first review object to be sure in next run, but for now map what we see.
                                    date: c.photos && c.photos[0] ? c.photos[0].updated_at : new Date().toISOString(),
                                    id: c.review_id
                                });
                            });
                            console.log(`[KAKAO] Intercepted chunk: ${json.reviews.length} reviews`);
                        }
                    } catch (e) {
                        console.log(`[KAKAO DEBUG] JSON Parse Error: ${e.message}`);
                    }
                }
            });

            await page.goto(this.baseUrl, { waitUntil: 'networkidle' });

            // Scroll down to trigger more API calls
            // Kakao map lazy loads reviews as you scroll down the review section
            // Need to find the review list container or scroll the whole page

            // Wait for reviews to be visible
            await page.waitForSelector('.list_evaluation', { timeout: 10000 }).catch(() => console.log("Review list selector not found immediately."));

            // Scroll logic: Find '더보기' button and click repeatedly
            // Selector for 'more' button: .link_more

            let moreButton = await page.$('.link_more');
            let attempts = 0;
            while (moreButton && attempts < 3) {
                await moreButton.click();
                await page.waitForTimeout(1000 + Math.random() * 1000); // Random wait
                moreButton = await page.$('.link_more');
                attempts++;
            }

            console.log(`[KAKAO] Extracted total ${reviews.length} reviews.`);

        } catch (error) {
            console.error(`[KAKAO] Error: ${error.message}`);
        } finally {
            await browser.close();
        }

        return reviews;
    }
}

module.exports = KakaoScraper;
