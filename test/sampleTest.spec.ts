import type { Browser, Page } from 'puppeteer';

import bootstrap from './bootstrap';

describe('test text replacer extension with react app', () => {
    let extPage: Page, browser: Browser;

    beforeAll(async () => {
        const context = await bootstrap();
        extPage = context.extPage;
        browser = context.browser;
    });

    it('should render a button in the web application', async () => {
        const tree: Fancytree.NodeData = await extPage.evaluate(() =>
            $.ui.fancytree.getTree('#tree').toDict(),
        );
        console.log(tree);
    });

    afterAll(async () => {
        await browser.close();
    });
});
