import path from 'node:path';
import puppeteer from 'puppeteer';

export default async function bootstrap() {
    const pathToExtension = path.join(process.cwd(), 'extension');
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`,
        ],
    });

    // 创建TreeView
    const extensionTarget = await browser.waitForTarget(
        (target) => target.type() === 'service_worker',
        { timeout: 3000 },
    );
    const partialExtensionUrl = extensionTarget.url() || '';
    const extensionId = partialExtensionUrl.split('/')[2];
    const extPage = await browser.newPage();
    const extensionUrl = `chrome-extension://${extensionId}/tree.html`;
    await extPage.goto(extensionUrl, { waitUntil: 'load' });

    // Test the background page as you would any other page.
    return {
        browser,
        extPage,
        extensionUrl,
    };
}
