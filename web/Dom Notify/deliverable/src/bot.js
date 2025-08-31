const { launch } = require('puppeteer');

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const FLAG = process.env.FLAG || "flag{Fake_Flag}";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function visit(id) {
    console.log(`Visiting ${id}`);
    const browser = await launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--js-flags=--noexpose_wasm,--jitless"],
        timeout: 2_000,
    });

    const page = await browser.newPage();

    await page.goto(`${BASE_URL}/note/${id}`);
    await page.evaluate((flag) => {
        localStorage.setItem("flag", flag);
    }, FLAG);

    await sleep(5_000);
    await page.close();

    await browser.close();
};

module.exports = {
    visit
  };