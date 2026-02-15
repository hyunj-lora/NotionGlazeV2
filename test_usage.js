const { chromium } = require('playwright');
(async () => {
    try {
        const browser = await chromium.launch();
        const page = await browser.newPage();
        console.log('Navigating to news.ycombinator.com...');
        await page.goto('https://news.ycombinator.com/');

        const titles = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.titleline > a')).slice(0, 5);
            return items.map(a => a.innerText);
        });

        console.log('--- Top 5 Hacker News Titles ---');
        titles.forEach((title, i) => console.log(`${i + 1}. ${title}`));

        await page.screenshot({ path: '/tmp/hn_screenshot.png' });
        console.log('Screenshot saved to /tmp/hn_screenshot.png');

        await browser.close();
        console.log('Test COMPLETE');
    } catch (err) {
        console.error('Test FAILED:', err);
        process.exit(1);
    }
})();
