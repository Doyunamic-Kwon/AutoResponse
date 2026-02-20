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
                            console.log(`[KAKAO] Intercepted chunk: ${json.reviews.length} reviews`);

                            json.reviews.forEach(c => {
                                // Extract reviewer info safely
                                let reviewer = 'Anonymous';
                                let date = new Date().toISOString();

                                // Try to find reviewer in photo metadata first (as seen in debug dump)
                                if (c.photos && c.photos.length > 0 && c.photos[0].meta && c.photos[0].meta.owner) {
                                    reviewer = c.photos[0].meta.owner.nickname;
                                    date = c.photos[0].updated_at || c.photos[0].created_at || date;
                                } else if (c.comment && c.comment.username) {
                                    // Fallback for text-only reviews if structure differs
                                    reviewer = c.comment.username;
                                    date = c.comment.date || date;
                                }

                                reviews.push({
                                    source: 'kakao',
                                    reviewer: reviewer,
                                    rating: c.star_rating,
                                    content: c.contents || '', // Contents might be empty for photo-only reviews
                                    date: date,
                                    id: c.review_id
                                });
                            });
                        }
                    } catch (e) {
                        console.log(`[KAKAO DEBUG] JSON Parse Error: ${e.message}`);
                    }
                }
            });

            await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded' });
            console.log(`[KAKAO] Page loaded, navigating to review tab...`);

            // Ensure we are on the review tab
            try {
                const reviewsTab = await page.$('a[data-id="review"], .link_evaluation');
                if (reviewsTab) {
                    await reviewsTab.click();
                    await page.waitForTimeout(2000);
                }
            } catch (e) {
                console.log("[KAKAO] Failed to click review tab, but continuing...");
            }

            // Scroll down to trigger more API calls
            await page.evaluate(() => window.scrollTo(0, 1000));
            await page.waitForTimeout(1000);
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(1000);

            // Try to find and click '더보기' (More) button
            let attempts = 0;
            while (attempts < 5) {
                const moreButton = await page.$('.link_more');
                if (moreButton && await moreButton.isVisible()) {
                    console.log(`[KAKAO] Clicking 'More' button (Attempt ${attempts + 1})...`);
                    await moreButton.click();
                    await page.waitForTimeout(1500 + Math.random() * 1000);
                    attempts++;
                } else {
                    // Try to scroll more if button not found or visible
                    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                    await page.waitForTimeout(1000);

                    // Check again
                    const stillVisible = await page.$('.link_more');
                    if (!stillVisible) break;
                    attempts++;
                }
            }

            // Final wait for any pending requests
            await page.waitForTimeout(2000);

            // Fallback: If no reviews intercepted, try extracting from DOM directly
            if (reviews.length === 0) {
                console.log("[KAKAO] No reviews intercepted via API. Trying DOM fallback...");
                const domReviews = await page.evaluate(() => {
                    const items = document.querySelectorAll('ul.list_evaluation li');
                    return Array.from(items).map(item => ({
                        source: 'kakao',
                        reviewer: item.querySelector('.txt_username')?.innerText || 'Anonymous',
                        rating: parseInt(item.querySelector('.ico_star.inner_star')?.style.width || '100%') / 20 || 5,
                        content: item.querySelector('.txt_comment span')?.innerText || '',
                        date: item.querySelector('.time_write')?.innerText || new Date().toISOString(),
                    })).filter(r => r.content.length > 0);
                });
                reviews.push(...domReviews);
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
