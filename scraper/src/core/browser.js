const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth');

// Enable stealth plugin
chromium.use(stealth());

/**
 * Creates and configures a browser instance with stealth capabilities.
 * @returns {Promise<{browser: import('playwright').Browser, context: import('playwright').BrowserContext, page: import('playwright').Page}>}
 */
async function createBrowser() {
    const browser = await chromium.launch({
        headless: process.env.HEADLESS !== 'false', // Default to true for production (server environments)
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul'
    });

    const page = await context.newPage();

    // Randomize mouse movements slightly to appear more human-like (will be implemented in scrapers)

    return { browser, context, page };
}

module.exports = { createBrowser };
