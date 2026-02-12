const { createBrowser } = require('../core/browser');

class NaverScraper {
    constructor(restaurantId) {
        this.restaurantId = restaurantId;
        this.baseUrl = `https://pcmap.place.naver.com/restaurant/${restaurantId}/review/visitor`;
    }

    async run() {
        console.log(`[NAVER] Starting scrape for ${this.restaurantId}...`);
        const { browser, context, page } = await createBrowser();
        const reviews = [];

        try {
            await page.goto(this.baseUrl, { waitUntil: 'load', timeout: 30000 });

            // Wait for reviews to load
            const frame = page.frameLocator('iframe#entryIframe'); // Try common iframe selector or adjust

            // Actually, naver pcmap usually doesn't use iframe for the *whole* page, 
            // but the review list might be inside a specific container or simply on the main page depending on the exact URL.
            // Let's assume the URL provided is direct. If not, we handle iframe.

            // Use 'page' directly first as pcmap.place.naver.com usually renders directly. 
            // If it fails, check frames.

            // Wait for review list container
            await page.waitForSelector('li.yeusu', { timeout: 10000 }).catch(() => console.log("Direct selector timeout, checking iframes..."));

            // Naver Place often changes class names dynamicallly. 
            // Strategy: Look for specific text patterns or stable attributes if classes are obfuscated.
            // However, 'li.yeusu' or similar structure is common. Let's try to capture by text content if class fails.

            // Scroll down a few times to trigger lazy loading
            for (let i = 0; i < 3; i++) {
                await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                await page.waitForTimeout(1000 + Math.random() * 1000); // Random wait

                // Click '더보기' if exists
                const moreButton = await page.$('a.fvwqf'); // Example class, needs verifying. 
                if (moreButton) {
                    await moreButton.click();
                    await page.waitForTimeout(1000);
                }
            }

            // Extract data
            const reviewElements = await page.$$('li.yeusu'); // Adjust selector as needed based on inspection

            // If no elements found with class, try finding by structure
            // Use a more generic strategy if specific class names fail

            // Debugging: Save screenshot and HTML
            await page.screenshot({ path: `debug_naver_${this.restaurantId}.png` });
            const content = await page.content();
            await require('fs-extra').writeFile(`debug_naver_${this.restaurantId}.html`, content);
            console.log(`[NAVER] Frame count: ${page.frames().length}`);

            // Strategy Change: Intercept GraphQL API calls 
            // Naver Place uses GraphQL for fetching reviews. Let's listen for them.

            page.on('response', async (response) => {
                const url = response.url();
                if (url.includes('graphql') && response.status() === 200) {
                    try {
                        const json = await response.json();
                        // Check if this is a review query result
                        // Usually deep inside data.visitorReviews
                        if (json.data && json.data.visitorReviews && json.data.visitorReviews.items) {
                            console.log(`[NAVER] Intercepted GraphQL Reviews: ${json.data.visitorReviews.items.length}`);
                            json.data.visitorReviews.items.forEach(item => {
                                reviews.push({
                                    source: 'naver',
                                    id: item.id,
                                    rating: item.rating,
                                    content: item.body || item.highlightedContent,
                                    date: item.visitedDate || item.created,
                                    reviewer: item.author ? item.author.nickname : 'Anonymous',
                                    images: item.images ? item.images.map(img => img.url) : []
                                });
                            });
                        }
                    } catch (e) {
                        // Not JSON or irrelevant
                    }
                }
            });

            await page.goto(this.baseUrl, { waitUntil: 'networkidle' });

            // Trigger more reviews by clicking '더보기' (More) button if available
            // This will fire more GraphQL requests which we will intercept

            // Selector for 'More' button might vary. A generic approach:
            // Look for a button/link at the bottom of the list with text '더보기'

            try {
                // Initial wait for dynamic content
                await page.waitForTimeout(2000);

                let attempt = 0;
                while (attempt < 3) {
                    // Click generic 'More' button (needs specific selector or text match)
                    // Using text match is safer:
                    const moreBtn = await page.getByRole('button', { name: /더보기|접기/ }).first();

                    if (await moreBtn.isVisible()) {
                        await moreBtn.click();
                        await page.waitForTimeout(1000 + Math.random() * 1000);
                    } else {
                        // Scroll to bottom to trigger potential infinite scroll
                        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                        await page.waitForTimeout(1000);
                    }
                    attempt++;
                }
            } catch (e) {
                console.log(`[NAVER] Auto-scroll/Click finished: ${e.message}`);
            }

            console.log(`[NAVER] Extracted ${reviews.length} reviews via GraphQL Interception.`);

            console.log(`[NAVER] Extracted ${reviews.length} reviews.`);

        } catch (error) {
            console.error(`[NAVER] Error: ${error.message}`);
        } finally {
            await browser.close();
        }

        return reviews;
    }
}

module.exports = NaverScraper;
