/**
 * 扩展初始化测试用例
 * @jest-environment jsdom
 */

import type { Tabs } from 'webextension-polyfill';

import type { TabData } from '../../src/tree/nodes';
import { createTab, initFancytree } from '../utils/gen-utils';
import { toAsciiTree } from '../utils/print-utils';
import { SINGLE_TAB_WINDOW } from './mock-data';

type FancytreeNode = Fancytree.FancytreeNode;

const WID = SINGLE_TAB_WINDOW[0].data.id!;
const FIRST_TAB_DATA = SINGLE_TAB_WINDOW[0].children![0].data as TabData;
const FIRST_TID = FIRST_TAB_DATA.id!;
const FIRST_INDEX = FIRST_TAB_DATA.index;

describe('add tab', () => {
    let tree: TabMasterTree<FancytreeNode>;
    beforeEach(() => {
        tree = initFancytree(SINGLE_TAB_WINDOW);
    });

    it('add as sibling', async () => {
        const tab: Tabs.Tab = createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1);
        tree.createTab(tab);
        const children = tree.toJsonObj()[0].children;
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
        console.log(toAsciiTree(tree.toJsonObj()));
        const tab: Tabs.Tab = createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1, FIRST_TID);
        tree.createTab(tab);
        const children = tree.toJsonObj()[0].children;
        expect(children.length).toEqual(1);
        expect(children[0].data.id).toEqual(FIRST_TID);
        expect(children[0].children.length).toEqual(1);
        expect(children[0].children[0].data.id).toEqual(FIRST_TID + 1);
        console.log(toAsciiTree(tree.toJsonObj()));
    });

    /**
     * window
     * ├── a
     * │   └── b
     * └── c
     */
    it('add as last siblings', async () => {
        tree.createTab(createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1, FIRST_TID));
        tree.createTab(createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2));
        const children = tree.toJsonObj()[0].children;
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
        tree.createTab(createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1, FIRST_TID));
        tree.createTab(createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2));
        tree.createTab(createTab(FIRST_TID + 3, WID, FIRST_INDEX + 3, FIRST_TID));
        const children = tree.toJsonObj()[0].children;
        expect(children.length).toEqual(3);
        expect(children[2].data.id).toEqual(FIRST_TID + 3);
        console.log(toAsciiTree(tree.toJsonObj()));
    });

    /**
     *     ┬ .
     *     └─┬ window-1
     *       └─┬ 0-10
     *         ├── 1-11
     *         └── 2-12
     */
    it('add two sibling', async () => {
        tree.createTab(createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1, FIRST_TID));
        tree.createTab(createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2, FIRST_TID));
        const children = tree.toJsonObj()[0].children;
        expect(children.length).toEqual(1);
        expect(children[0].children[0].data.id).toEqual(FIRST_TID + 1);
        expect(children[0].children[1].data.id).toEqual(FIRST_TID + 2);
        console.log(toAsciiTree(tree.toJsonObj()));
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
        tree.createTab(createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1));
        tree.createTab(createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2));
        // 在首位插入元素
        tree.createTab(createTab(FIRST_TID + 3, WID, FIRST_INDEX));
        console.log(toAsciiTree(tree.toJsonObj()));
        const children = tree.toJsonObj()[0].children;
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
    let tree: TabMasterTree<FancytreeNode>;
    beforeEach(() => {
        tree = initFancytree(SINGLE_TAB_WINDOW);
    });

    it('remove first node', async () => {
        tree.createTab(createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1));
        tree.createTab(createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2));
        tree.removeTab(FIRST_TID);
        const children = tree.toJsonObj()[0].children;
        expect(children.length).toEqual(2);
        expect(children[0].data.id).toEqual(FIRST_TID + 1);
        expect(children[0].data.index).toEqual(FIRST_INDEX);
        expect(children[1].data.id).toEqual(FIRST_TID + 2);
        expect(children[1].data.index).toEqual(FIRST_INDEX + 1);
    });

    it('remove parent node and reserve children', async () => {
        tree.createTab(createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1, FIRST_TID));
        tree.createTab(createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2, FIRST_TID));
        console.log(toAsciiTree(tree.toJsonObj()));
        tree.removeTab(FIRST_TID);
        const children = tree.toJsonObj()[0].children;
        expect(children.length).toEqual(2);
        expect(children[0].data.id).toEqual(FIRST_TID + 1);
        expect(children[0].data.index).toEqual(FIRST_INDEX);
        expect(children[1].data.id).toEqual(FIRST_TID + 2);
        expect(children[1].data.index).toEqual(FIRST_INDEX + 1);
        console.log(toAsciiTree(tree.toJsonObj()));
    });

    it('remove closed tab', async () => {
        const newNode = tree.createTab(createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1));
        newNode.data.closed = true;
        tree.removeTab(FIRST_TID + 1);
        const children = tree.toJsonObj()[0].children;
        expect(children.length).toEqual(2);
        expect(children[1].data.id).toEqual(FIRST_TID + 1);
        expect(children[1].data.index).toEqual(FIRST_INDEX + 1);
    });
});

describe('move tab', () => {
    let tree: TabMasterTree<FancytreeNode>;
    beforeEach(() => {
        tree = initFancytree(SINGLE_TAB_WINDOW);
    });

    it('middle move to first', async () => {
        const secondNode = tree.createTab(createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1));
        const thirdNode = tree.createTab(createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2));
        tree.moveTab(WID, secondNode.data.id, secondNode.data.index, 0);
        console.log(toAsciiTree(tree.toJsonObj()));
        const children = tree.toJsonObj()[0].children;
        expect(children.length).toEqual(3);
        expect(children[0].data.id).toEqual(secondNode.data.id);
        expect(children[0].data.index).toBe(0);
        expect(children[1].data.id).toEqual(FIRST_TID);
        expect(children[1].data.index).toBe(1);
        expect(children[2].data.id).toEqual(thirdNode.data.id);
        expect(children[2].data.index).toEqual(2);
    });

    it('middle move to last', async () => {
        const secondNode = tree.createTab(createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1));
        const thirdNode = tree.createTab(createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2));
        tree.moveTab(WID, secondNode.data.id, secondNode.data.index, 2);
        const children = tree.toJsonObj()[0].children;
        expect(children.length).toEqual(3);
        expect(children[1].data.id).toEqual(thirdNode.data.id);
        expect(children[1].data.index).toBe(1);
        expect(children[2].data.id).toEqual(secondNode.data.id);
        expect(children[2].data.index).toEqual(2);
        console.log(toAsciiTree(tree.toJsonObj()));
    });

    /**
     *    ┬ .
     *    └─┬ window-1
     *      └─┬ 0-10
     *        └─┬ 1-11 [move to first]
     *          ├── 2-12
     *          └── 3-13
     */
    it('with children, move to first', async () => {
        const secondNode = tree.createTab(
            createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1, FIRST_TID),
        );
        const thirdNode = tree.createTab(
            createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2, secondNode.data.id),
        );
        const forthNode = tree.createTab(
            createTab(FIRST_TID + 3, WID, FIRST_INDEX + 3, secondNode.data.id),
        );
        tree.moveTab(WID, secondNode.data.id, secondNode.data.index, 0);
        const children = tree.toJsonObj()[0].children;
        expect(children.length).toEqual(2);
        expect(children[0].data.id).toEqual(secondNode.data.id);
        expect(children[0].data.index).toEqual(0);
        expect(secondNode.expanded).toEqual(true);
        expect(children[1].data.id).toEqual(FIRST_TID);
        expect(children[1].data.index).toEqual(1);
        expect(children[1].children[0].data.id).toEqual(thirdNode.data.id);
        expect(children[1].children[0].data.index).toEqual(2);
        expect(children[1].children[1].data.id).toEqual(forthNode.data.id);
        expect(children[1].children[1].data.index).toEqual(3);
    });

    it('first with children, forth move to second', async () => {
        const secondNode = tree.createTab(
            createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1, FIRST_TID),
        );
        const thirdNode = tree.createTab(createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2, FIRST_TID));
        const forthNode = tree.createTab(createTab(FIRST_TID + 3, WID, FIRST_INDEX + 3));
        tree.moveTab(WID, forthNode.data.id, forthNode.data.index, 1);
        console.log(toAsciiTree(tree.toJsonObj()));
        const children = tree.toJsonObj()[0].children;
        expect(children.length).toEqual(1);
        expect(children[0].data.id).toEqual(FIRST_TID);
        expect(children[0].data.index).toEqual(0);
        const firstNodeChildren = children[0].children;
        expect(firstNodeChildren[0].data.id).toEqual(forthNode.data.id);
        expect(firstNodeChildren[0].data.index).toEqual(1);
        expect(firstNodeChildren[1].data.id).toEqual(secondNode.data.id);
        expect(firstNodeChildren[1].data.index).toEqual(2);
        expect(firstNodeChildren[2].data.id).toEqual(thirdNode.data.id);
        expect(firstNodeChildren[2].data.index).toEqual(3);
    });

    it('1st to 2rd', async () => {
        const secondNode = tree.createTab(createTab(FIRST_TID + 1, WID, 1));
        tree.moveTab(WID, FIRST_TID, 0, 1);
        console.log(toAsciiTree(tree.toJsonObj()));
        const children = tree.toJsonObj()[0].children;
        expect(children.length).toEqual(2);
        expect(children[0].data.id).toEqual(secondNode.data.id);
        expect(children[0].data.index).toEqual(0);
        expect(children[1].data.id).toEqual(FIRST_TID);
        expect(children[1].data.index).toEqual(1);
    });
});
