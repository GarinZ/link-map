/**
 * 扩展初始化测试用例
 * @jest-environment jsdom
 */

import browser from 'sinon-chrome';
import type { Tabs } from 'webextension-polyfill';

import type { FancyTabMasterTree } from '@/tree/features/tab-master-tree/fancy-tab-master-tree';
import type { TreeNode } from '@/tree/features/tab-master-tree/nodes/nodes';
import type { TabData } from '@/tree/features/tab-master-tree/nodes/tab-node-operations';
import type { WindowData } from '@/tree/features/tab-master-tree/nodes/window-node-operations';

import { createTab, initTabMasterTree, MockTreeBuilder } from '../../utils/gen-utils';
import { toAsciiTree } from '../../utils/print-utils';
import { SINGLE_TAB_WINDOW } from './mock-data';

const WID = SINGLE_TAB_WINDOW[0].data.id!;
const FIRST_TAB_DATA = SINGLE_TAB_WINDOW[0].children![0].data as TabData;
const FIRST_TID = FIRST_TAB_DATA.id!;
const FIRST_INDEX = FIRST_TAB_DATA.index;

describe('add tab', () => {
    let tree: FancyTabMasterTree;
    beforeEach(() => {
        tree = initTabMasterTree(SINGLE_TAB_WINDOW);
    });

    it('add as sibling', async () => {
        const tab: Tabs.Tab = createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1);
        tree.createTab(tab);
        const children = tree.toJsonObj()[0].children! as TreeNode<TabData>[];
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
        const children = tree.toJsonObj()[0].children! as TreeNode<TabData>[];
        expect(children.length).toEqual(1);
        expect(children[0].data.id).toEqual(FIRST_TID);
        expect(children[0].children!.length).toEqual(1);
        expect(children[0].children![0].data.id).toEqual(FIRST_TID + 1);
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
        const children = tree.toJsonObj()[0].children! as TreeNode<TabData>[];
        expect(children.length).toEqual(2);
        expect(children[0].data.id).toEqual(FIRST_TID);
        expect(children[0].children!.length).toEqual(1);
        expect(children[0].children![0].data.id).toEqual(FIRST_TID + 1);
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
        const children = tree.toJsonObj()[0].children! as TreeNode<TabData>[];
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
        const children = tree.toJsonObj()[0].children! as TreeNode<TabData>[];
        expect(children.length).toEqual(1);
        expect(children[0].children![0].data.id).toEqual(FIRST_TID + 1);
        expect(children[0].children![1].data.id).toEqual(FIRST_TID + 2);
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
        const children = tree.toJsonObj()[0].children as TreeNode<TabData>[];
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
/**
 *  ┬ .
 *     └─┬ window-1
 *       ├── 0-11
 *       ├── 1-12
 *       └── 2-13
 *
 *       ┬ .
 *     └─┬ window-1
 *       ├── 0-12
 *       └── 1-13
 */
describe('remove tab', () => {
    let tree: FancyTabMasterTree;
    beforeEach(() => {
        browser.flush();
        tree = initTabMasterTree(SINGLE_TAB_WINDOW);
    });

    it('remove first node', async () => {
        const treeData = new MockTreeBuilder().addTabChildren(3).build();
        const tabMasterTree = initTabMasterTree(treeData);
        const tree = tabMasterTree.tree;
        browser.tabs.query.resolves([createTab(12, 1, 0)]);
        console.log(toAsciiTree(tabMasterTree.toJsonObj()));
        await tabMasterTree.removeTab(11);
        console.log(toAsciiTree(tabMasterTree.toJsonObj()));
        const children = tree.getNodeByKey(`1`).children;
        expect(children.length).toEqual(2);
        expect(children[0].data.id).toEqual(12);
        expect(children[0].data.index).toEqual(0);
        expect(children[1].data.id).toEqual(13);
        expect(children[1].data.index).toEqual(1);
    });

    it('remove parent node and reserve children', async () => {
        tree.createTab(createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1, FIRST_TID));
        tree.createTab(createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2, FIRST_TID));
        browser.tabs.query.resolves([createTab(FIRST_TID + 1, WID, 0)]);
        console.log(toAsciiTree(tree.toJsonObj()));
        await tree.removeTab(FIRST_TID);
        console.log(toAsciiTree(tree.toJsonObj()));
        const windowNode = tree.toJsonObj()[0] as TreeNode<WindowData>;
        const children = windowNode.children! as TreeNode<TabData>[];
        expect(children.length).toEqual(2);
        expect(children[0].data.id).toEqual(FIRST_TID + 1);
        expect(children[0].data.index).toEqual(FIRST_INDEX);
        expect(children[1].data.id).toEqual(FIRST_TID + 2);
        expect(children[1].data.index).toEqual(FIRST_INDEX + 1);
    });

    it('remove closed tab', async () => {
        const newNode = tree.createTab(createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1));
        newNode.data.closed = true;
        browser.tabs.query.resolves([createTab(FIRST_TID, WID, 0)]);
        await tree.removeTab(FIRST_TID + 1);
        const children = tree.toJsonObj()[0].children! as TreeNode<TabData>[];
        expect(children.length).toEqual(2);
        expect(children[1].data.id).toEqual(FIRST_TID + 1);
        expect(children[1].data.index).toEqual(FIRST_INDEX + 1);
    });

    it('remove tab with alias', async () => {
        const treeData = new MockTreeBuilder().addTabChildren(2, 1, { alias: 'test' }).build();
        const tabMasterTree = initTabMasterTree(treeData);
        browser.tabs.query.resolves([{ id: 12, active: true }]);
        const tree = tabMasterTree.tree;
        const sourceNode = tree.getNodeByKey(`11`);
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        await tabMasterTree.removeTab(sourceNode.data.id);
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        const windowNode = tree.getNodeByKey('1');
        const secondNode = tree.getNodeByKey(`12`);
        expect(windowNode.children.length).toEqual(2);
        expect(windowNode.data.closed).toEqual(false);
        expect(sourceNode.data.closed).toEqual(true);
        expect(sourceNode.data.active).toEqual(false);
        expect(secondNode.data.closed).toEqual(false);
        expect(secondNode.data.active).toEqual(true);
        browser.tabs.query.resolves([]);
        await tabMasterTree.removeTab(secondNode.data.id);
        expect(windowNode.children.length).toEqual(2);
        expect(windowNode.data.closed).toEqual(true);
        expect(sourceNode.data.closed).toEqual(true);
        expect(sourceNode.data.active).toEqual(false);
        expect(sourceNode.data.active).toEqual(false);
        expect(secondNode.data.closed).toEqual(true);
        expect(secondNode.data.active).toEqual(false);
    });
});

describe('move tab', () => {
    let tree: FancyTabMasterTree;
    beforeEach(() => {
        tree = initTabMasterTree(SINGLE_TAB_WINDOW);
        browser.flush();
    });

    it('middle move to first', async () => {
        const secondNode = tree.createTab(createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1));
        const thirdNode = tree.createTab(createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2));
        tree.moveTab(WID, secondNode.data.id, secondNode.data.index, 0);
        console.log(toAsciiTree(tree.toJsonObj()));
        const children = tree.toJsonObj()[0].children! as TreeNode<TabData>[];
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
        console.log(toAsciiTree(tree.toJsonObj()));
        tree.moveTab(WID, secondNode.data.id, secondNode.data.index, 2);
        console.log(toAsciiTree(tree.toJsonObj()));
        const children = tree.toJsonObj()[0].children! as TreeNode<TabData>[];
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
        const children = tree.toJsonObj()[0].children! as TreeNode<TabData>[];
        expect(children.length).toEqual(2);
        expect(children[0].data.id).toEqual(secondNode.data.id);
        expect(children[0].data.index).toEqual(0);
        expect(secondNode.expanded).toEqual(true);
        expect(children[1].data.id).toEqual(FIRST_TID);
        expect(children[1].data.index).toEqual(1);
        const subChildren = children[1].children as TreeNode<TabData>[];
        expect(subChildren[0].data.id).toEqual(thirdNode.data.id);
        expect(subChildren[0].data.index).toEqual(2);
        expect(subChildren[1].data.id).toEqual(forthNode.data.id);
        expect(subChildren[1].data.index).toEqual(3);
    });

    it('first with children, forth move to second', async () => {
        const secondNode = tree.createTab(
            createTab(FIRST_TID + 1, WID, FIRST_INDEX + 1, FIRST_TID),
        );
        const thirdNode = tree.createTab(createTab(FIRST_TID + 2, WID, FIRST_INDEX + 2, FIRST_TID));
        const forthNode = tree.createTab(createTab(FIRST_TID + 3, WID, FIRST_INDEX + 3));
        tree.moveTab(WID, forthNode.data.id, forthNode.data.index, 1);
        console.log(toAsciiTree(tree.toJsonObj()));
        const children = tree.toJsonObj()[0].children! as TreeNode<TabData>[];
        expect(children.length).toEqual(1);
        expect(children[0].data.id).toEqual(FIRST_TID);
        expect(children[0].data.index).toEqual(0);
        const firstNodeChildren = children[0].children as TreeNode<TabData>[];
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
        const children = tree.toJsonObj()[0].children! as TreeNode<TabData>[];
        expect(children.length).toEqual(2);
        expect(children[0].data.id).toEqual(secondNode.data.id);
        expect(children[0].data.index).toEqual(0);
        expect(children[1].data.id).toEqual(FIRST_TID);
        expect(children[1].data.index).toEqual(1);
    });
});

describe('attach tab', () => {
    beforeEach(() => {
        browser.flush();
    });

    it('attach to first', () => {
        const treeData = new MockTreeBuilder()
            .addTabChildren(2)
            .addWindowNode()
            .addTabChildren(2, 2)
            .build();
        const tree = initTabMasterTree(treeData);
        const attachedTab = createTab(11, 1, 1);
        browser.tabs.get.resolves(attachedTab);
        browser.tabs.query.resolves([attachedTab]);
        console.log(toAsciiTree(tree.toJsonObj(), ['expanded'], ['closed', 'windowId']));
        tree.attachTab(2, 11, 1);
        console.log(toAsciiTree(tree.toJsonObj(), ['expanded'], ['closed', 'windowId']));
        const windowNode = tree.toJsonObj()[0] as TreeNode<WindowData>;
        const children = windowNode.children! as TreeNode<TabData>[];
        expect(children.length).toEqual(1);
        expect(children[0].data.id).toEqual(12);
        expect(children[0].data.index).toEqual(0);
        const secondWindowNode = tree.toJsonObj()[1] as TreeNode<WindowData>;
        const secondWindowChildren = secondWindowNode.children! as TreeNode<TabData>[];
        expect(secondWindowChildren.length).toEqual(3);
        expect(secondWindowChildren[0].data.id).toEqual(21);
        expect(secondWindowChildren[0].data.index).toEqual(0);
        expect(secondWindowChildren[1].data.id).toEqual(11);
        expect(secondWindowChildren[1].data.index).toEqual(1);
        expect(secondWindowChildren[2].data.id).toEqual(22);
    });

    // it('', () => {});

    afterEach(() => {
        browser.flush();
    });
});
