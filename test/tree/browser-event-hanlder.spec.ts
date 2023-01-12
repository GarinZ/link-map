/**
 * 扩展初始化测试用例
 * @jest-environment jsdom
 */

import type { Tabs } from 'webextension-polyfill';

import type { TabData } from '../../src/logic/nodes';
import { addNodeFromTab, removeNode } from '../../src/tree/browser-event-handler';
import { createTab, initFancytree } from '../utils/gen-utils';
import { toAsciiTree } from '../utils/print-utils';
import { SINGLE_TAB_WINDOW } from './mock-data';

const WID = SINGLE_TAB_WINDOW[0].data.id!;
const FIRST_TAB_DATA = SINGLE_TAB_WINDOW[0].children![0].data as TabData;
const FIRST_TID = FIRST_TAB_DATA.id!;
const FIRST_INDEX = FIRST_TAB_DATA.index;

describe('add tab', () => {
    let fancytree: Fancytree.Fancytree;
    beforeEach(() => {
        fancytree = initFancytree(SINGLE_TAB_WINDOW);
    });

    it('add as sibling', async () => {
        const tab: Tabs.Tab = createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1);
        await addNodeFromTab(fancytree, tab);
        const children = fancytree.toDict()[0].children;
        expect(children.length).toEqual(2);
        expect(children[0].data.id).toEqual(FIRST_TID);
        expect(children[1].data.id).toEqual(FIRST_TID + 1);
    });

    /**
     *     ┬ .
     *     └─┬ window-1
     *       └─┬ 0-10
     *         └── 1-11
     */
    it('add as child', async () => {
        const tab: Tabs.Tab = createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1, FIRST_TID);
        await addNodeFromTab(fancytree, tab);
        const children = fancytree.toDict()[0].children;
        expect(children.length).toEqual(1);
        expect(children[0].data.id).toEqual(FIRST_TID);
        expect(children[0].children.length).toEqual(1);
        expect(children[0].children[0].data.id).toEqual(FIRST_TID + 1);
        console.log(toAsciiTree(fancytree.toDict()));
    });

    /**
     * window
     * ├── a
     * │   └── b
     * └── c
     */
    it('add as last siblings', async () => {
        await addNodeFromTab(fancytree, createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1, FIRST_TID));
        await addNodeFromTab(fancytree, createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2));
        const children = fancytree.toDict()[0].children;
        expect(children.length).toEqual(2);
        expect(children[0].data.id).toEqual(FIRST_TID);
        expect(children[0].children.length).toEqual(1);
        expect(children[0].children[0].data.id).toEqual(FIRST_TID + 1);
        expect(children[1].data.id).toEqual(FIRST_TID + 2);
    });

    /**
     *┬ .
     *└─┬ window-1
     *  ├─┬ 0-10
     *  │ └── 1-11
     *  ├── 2-12
     *  └── 3-13
     */
    it('same openerTabId but has gap index', async () => {
        await addNodeFromTab(fancytree, createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1, FIRST_TID));
        await addNodeFromTab(fancytree, createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2));
        await addNodeFromTab(fancytree, createTab(FIRST_TID + 3, WID, FIRST_INDEX + 3, FIRST_TID));
        const children = fancytree.toDict()[0].children;
        expect(children.length).toEqual(3);
        expect(children[2].data.id).toEqual(FIRST_TID + 3);
        console.log(toAsciiTree(fancytree.toDict()));
    });

    /**
     *     ┬ .
     *     └─┬ window-1
     *       └─┬ 0-10
     *         ├── 1-11
     *         └── 2-12
     */
    it('add two sibling', async () => {
        await addNodeFromTab(fancytree, createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1, FIRST_TID));
        await addNodeFromTab(fancytree, createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2, FIRST_TID));
        const children = fancytree.toDict()[0].children;
        expect(children.length).toEqual(1);
        expect(children[0].children[0].data.id).toEqual(FIRST_TID + 1);
        expect(children[0].children[1].data.id).toEqual(FIRST_TID + 2);
        console.log(toAsciiTree(fancytree.toDict()));
    });

    /**
     *     ┬ .
     *     └─┬ window-1
     *       ├── 0-13
     *       ├── 1-10
     *       ├── 2-11
     *       └── 3-12
     */
    it('add node in the middle', async () => {
        await addNodeFromTab(fancytree, createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1));
        await addNodeFromTab(fancytree, createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2));
        // 在首位插入元素
        await addNodeFromTab(fancytree, createTab(FIRST_TID + 3, WID, FIRST_INDEX));
        console.log(toAsciiTree(fancytree.toDict()));
        const children = fancytree.toDict()[0].children;
        expect(children.length).toEqual(4);
        expect(children[0].data.id).toEqual(FIRST_TID + 3);
        expect(children[1].data.id).toEqual(FIRST_TID);
        expect(children[1].data.index).toEqual(FIRST_INDEX + 1);
        expect(children[2].data.id).toEqual(FIRST_TID + 1);
        expect(children[2].data.index).toEqual(FIRST_INDEX + 2);
        expect(children[3].data.id).toEqual(FIRST_TID + 2);
        expect(children[3].data.index).toEqual(FIRST_INDEX + 3);
    });
});

describe('remove tab', () => {
    let fancytree: Fancytree.Fancytree;
    beforeEach(() => {
        fancytree = initFancytree(SINGLE_TAB_WINDOW);
    });

    it('remove first node', async () => {
        addNodeFromTab(fancytree, createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1));
        addNodeFromTab(fancytree, createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2));
        removeNode(fancytree, `${FIRST_TID}`, true);
        const children = fancytree.toDict()[0].children;
        expect(children.length).toEqual(2);
        expect(children[0].data.id).toEqual(FIRST_TID + 1);
        expect(children[0].data.index).toEqual(FIRST_INDEX);
        expect(children[1].data.id).toEqual(FIRST_TID + 2);
        expect(children[1].data.index).toEqual(FIRST_INDEX + 1);
    });

    it('remove parent node and reserve children', async () => {
        addNodeFromTab(fancytree, createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1, FIRST_TID));
        addNodeFromTab(fancytree, createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2, FIRST_TID));
        removeNode(fancytree, `${FIRST_TID}`, true);
        const children = fancytree.toDict()[0].children;
        expect(children.length).toEqual(2);
        expect(children[0].data.id).toEqual(FIRST_TID + 1);
        expect(children[0].data.index).toEqual(FIRST_INDEX);
        expect(children[1].data.id).toEqual(FIRST_TID + 2);
        expect(children[1].data.index).toEqual(FIRST_INDEX + 1);
    });

    it('remove parent node and remove children', async () => {
        addNodeFromTab(fancytree, createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1, FIRST_TID));
        addNodeFromTab(fancytree, createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2, FIRST_TID));
        removeNode(fancytree, `${FIRST_TID}`, false);
        const children = fancytree.toDict()[0].children;
        expect(children).toBe(undefined);
    });

    it('remove closed tab', async () => {
        const newNode = addNodeFromTab(fancytree, createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1));
        newNode.data.closed = true;
        removeNode(fancytree, `${FIRST_TID + 1}`, true);
        const children = fancytree.toDict()[0].children;
        expect(children.length).toEqual(2);
        expect(children[1].data.id).toEqual(FIRST_TID + 1);
        expect(children[1].data.index).toEqual(FIRST_INDEX + 1);
    });
});
