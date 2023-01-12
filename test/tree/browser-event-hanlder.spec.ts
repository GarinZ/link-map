/**
 * 扩展初始化测试用例
 * @jest-environment jsdom
 */

import type { Tabs } from 'webextension-polyfill';

import type { TabData } from '../../src/logic/nodes';
import { addNodeFromTab } from '../../src/tree/browser-event-handler';
import { createTab, initFancytree } from '../utils/gen-utils';
import { toAsciiTree } from '../utils/print-utils';
import { SINGLE_TAB_WINDOW } from './mock-data';

const WINDOW_ID = SINGLE_TAB_WINDOW[0].data.id!;
const FIRST_TAB_DATA = SINGLE_TAB_WINDOW[0].children![0].data as TabData;
const FIRST_TAB_ID = FIRST_TAB_DATA.id!;
const FIRST_INDEX_ID = FIRST_TAB_DATA.index;

describe('add new tab to tree', () => {
    let fancytree: Fancytree.Fancytree;
    beforeEach(() => {
        fancytree = initFancytree(SINGLE_TAB_WINDOW);
    });

    it('add as sibling', async () => {
        const tab: Tabs.Tab = createTab(FIRST_TAB_ID + 1, WINDOW_ID, FIRST_TAB_ID + 1);
        await addNodeFromTab(fancytree, tab);
        const children = fancytree.toDict()[0].children;
        expect(children.length).toEqual(2);
        expect(children[0].data.id).toEqual(FIRST_TAB_ID);
        expect(children[1].data.id).toEqual(FIRST_TAB_ID + 1);
    });

    /**
     * window
     * ├── a
     * └── b
     */
    it('add as child', async () => {
        const tab: Tabs.Tab = createTab(
            FIRST_TAB_ID + 1,
            WINDOW_ID,
            FIRST_TAB_ID + 1,
            FIRST_TAB_ID,
        );
        await addNodeFromTab(fancytree, tab);
        const children = fancytree.toDict()[0].children;
        expect(children.length).toEqual(1);
        expect(children[0].data.id).toEqual(FIRST_TAB_ID);
        expect(children[0].children.length).toEqual(1);
        expect(children[0].children[0].data.id).toEqual(FIRST_TAB_ID + 1);
    });

    /**
     * window
     * ├── a
     * │   └── b
     * └── c
     */
    it('add as last siblings', async () => {
        await addNodeFromTab(
            fancytree,
            createTab(FIRST_TAB_ID + 1, WINDOW_ID, FIRST_INDEX_ID + 1, FIRST_TAB_ID),
        );
        await addNodeFromTab(fancytree, createTab(FIRST_TAB_ID + 2, WINDOW_ID, FIRST_INDEX_ID + 2));
        const children = fancytree.toDict()[0].children;
        expect(children.length).toEqual(2);
        expect(children[0].data.id).toEqual(FIRST_TAB_ID);
        expect(children[0].children.length).toEqual(1);
        expect(children[0].children[0].data.id).toEqual(FIRST_TAB_ID + 1);
        expect(children[1].data.id).toEqual(FIRST_TAB_ID + 2);
        console.log(toAsciiTree(fancytree.toDict()));
    });
});
