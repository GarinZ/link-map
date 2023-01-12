/**
 * 扩展初始化测试用例
 * @jest-environment jsdom
 */

import type { Tabs } from 'webextension-polyfill';

import { addNodeFromTab } from '../../src/tree/browser-event-handler';
import { initFancytree } from '../utils';
import { SINGLE_TAB_WINDOW } from './mock-data';

describe('add new tab to tree', () => {
    let fancytree: Fancytree.Fancytree;
    beforeEach(() => {
        fancytree = initFancytree(SINGLE_TAB_WINDOW);
    });

    it('add as sibling', async () => {
        const tab: Tabs.Tab = {
            active: true,
            audible: false,
            autoDiscardable: true,
            discarded: false,
            favIconUrl: '',
            height: 939,
            highlighted: false,
            id: 11,
            incognito: false,
            index: 1,
            mutedInfo: {
                muted: false,
            },
            pinned: false,
            status: 'complete',
            title: 'test-title',
            url: 'https://www.baidu.com',
            width: 1792,
            windowId: 1,
        };
        await addNodeFromTab(fancytree, tab);
        const children = fancytree.toDict()[0].children;
        expect(children.length).toEqual(2);
        expect(children[0].data.id).toEqual(10);
        expect(children[1].data.id).toEqual(11);
    });
});
