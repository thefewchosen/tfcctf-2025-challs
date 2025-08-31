const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const PAGE_MAX_WAIT_MS = 90_000;   // hard cap

async function crawlOnce(url) {
  const options = new chrome.Options()
    .addArguments("--headless=new", "--disable-dev-shm-usage", "--no-sandbox");

  const service = new chrome.ServiceBuilder('/usr/bin/chromedriver')
    .setPort('9515')

  const driver = await new Builder().forBrowser("chrome")
    .setChromeOptions(options)
    .setChromeService(service)
    .build();

  try {
    await driver.get(url);
    // Extra safety: explicitly wait for readyState === 'complete'
    await driver.wait(
        async () => await driver.executeScript('return document.readyState === "complete"'),
        PAGE_MAX_WAIT_MS
      );

    await driver.sleep(5_000);

    const contentType = await driver.executeScript(`
        const m1 = document.querySelector('meta[http-equiv="content-type" i]')?.content || null;
        return m1 || document.contentType;`
    );
    const html = await driver.getPageSource();
    
    return { html, contentType };
  } finally {
    await driver.quit();
  }
}

/**
 * Queue a crawl in the background and update DB when finished.
 * Returns the UUID immediately.
 */
async function enqueueCrawl(db, url) {
  const { v4: uuidv4 } = require("uuid");
  const uuid = uuidv4();
  await db.createCrawl(uuid, url);

  // Fire-and-forget (log errors; status stays 'queued' if crash)
  (async () => {
    try {
      await db.updateCrawlStatus(uuid, "running");
      const { html, contentType } = await crawlOnce(url);
      await db.finishCrawl(uuid, html, contentType);
    } catch (err) {
      console.error("crawl failed:", err);
      await db.updateCrawlStatus(uuid, "error");
    }
  })();

  return uuid;
}

module.exports = { enqueueCrawl };
