/**
 * @jest-environment jsdom
 */

import browser from 'sinon-chrome';

import { tabMoveOnDrop2 } from '@/tree/dnd';

import { mockTabMove, mockTabRemove, mockWindowCreate } from '../../utils/browser-mock';
import { initTabMasterTree, MockTreeBuilder } from '../../utils/gen-utils';
import { toAsciiTree } from '../../utils/print-utils';

describe('drag and drop', () => {
    beforeEach(() => {
        browser.flush();
    });

    // 在打开的window中，同window内，移动打开的TabNode，没有子树 => 检查index更新
    it('drag single open tab inside same open window', async () => {
        const treeData = new MockTreeBuilder().addTabChildren(2).addNestedTabChildren(2).build();
        const tabMasterTree = initTabMasterTree(treeData);
        mockTabMove(tabMasterTree);
        mockTabRemove(tabMasterTree);
        const tree = tabMasterTree.tree;
        const sourceNode = tree.getNodeByKey(`11`);
        const targetNode = tree.getNodeByKey(`13`);
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        await tabMoveOnDrop2(sourceNode, targetNode, 'over');
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        const windowNode = tree.getNodeByKey('1');
        expect(windowNode.countChildren()).toBe(4);
        expect(windowNode.children![0].key).toBe('12');
        expect(windowNode.children![0].data.index).toBe(0);
        expect(windowNode.children![0].children[0].key).toBe('13');
        expect(windowNode.children![0].children[0].data.index).toBe(1);
        expect(windowNode.children![0].children[0].children[0].key).toBe('14');
        expect(windowNode.children![0].children[0].children[0].data.index).toBe(2);
        expect(windowNode.children![0].children[0].children[1].key).toBe('11');
        expect(windowNode.children![0].children[0].children[1].data.index).toBe(3);
    });

    // 在打开的window中，打开的TabNode（没有子树），移动到另一个打开的window
    it('drag single open tab from open window to another open window', async () => {
        const treeData = new MockTreeBuilder()
            .addTabChildren(2)
            .addWindowNode()
            .addTabChildren(2, 2)
            .build();
        const tabMasterTree = initTabMasterTree(treeData);
        mockTabMove(tabMasterTree);
        mockTabRemove(tabMasterTree);
        const tree = tabMasterTree.tree;
        const sourceNode = tree.getNodeByKey(`11`);
        const targetNode = tree.getNodeByKey(`21`);
        await tabMoveOnDrop2(sourceNode, targetNode, 'over');
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        const windowNode1 = tree.getNodeByKey('1');
        const windowNode2 = tree.getNodeByKey('2');
        expect(windowNode1.countChildren()).toBe(1);
        expect(windowNode1.children![0].key).toBe('12');
        expect(windowNode1.children![0].data.index).toBe(0);
        expect(windowNode2.countChildren()).toBe(3);
        expect(windowNode2.children![0].key).toBe('21');
        expect(windowNode2.children![0].data.index).toBe(0);
        expect(windowNode2.children![0].children[0].key).toBe('11');
        expect(windowNode2.children![0].children[0].data.index).toBe(1);
        expect(windowNode2.children![0].children[0].data.windowId).toBe(2);
        expect(windowNode2.children![1].key).toBe('22');
        expect(windowNode2.children![1].data.index).toBe(2);
    });

    // 在打开的window中，windowNode包含closed和openedNode，且openedNode全部在子树当中，移动全部openedTabNode，到另一个关闭的窗口中
    it('drag all open tab from open window to another open window', async () => {
        const treeData = new MockTreeBuilder()
            .addNestedTabChildren(3)
            .addWindowNode()
            .addTabChildren(2, 2)
            .build();
        const tabMasterTree = initTabMasterTree(treeData);
        mockTabMove(tabMasterTree);
        mockTabRemove(tabMasterTree);
        const tree = tabMasterTree.tree;
        tree.getNodeByKey('11').data.closed = true;
        const sourceNode = tree.getNodeByKey(`12`);
        const targetNode = tree.getNodeByKey(`21`);
        await tabMoveOnDrop2(sourceNode, targetNode, 'over');
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        const windowNode1 = tree.getNodeByKey('1');
        const windowNode2 = tree.getNodeByKey('2');
        expect(windowNode1.countChildren()).toBe(1);
        expect(windowNode1.data.closed).toBe(true);
        expect(windowNode1.children![0].key).toBe('11');
        expect(windowNode1.children![0].data.index).toBe(0);
        expect(windowNode2.countChildren()).toBe(4);
        expect(windowNode2.children![0].key).toBe('21');
        expect(windowNode2.children![0].data.index).toBe(0);
        expect(windowNode2.children![0].children[0].key).toBe('12');
        expect(windowNode2.children![0].children[0].data.index).toBe(1);
        expect(windowNode2.children![0].children[0].data.windowId).toBe(2);
        expect(windowNode2.children![0].children[0].children[0].key).toBe('13');
        expect(windowNode2.children![0].children[0].children[0].data.index).toBe(2);
        expect(windowNode2.children![0].children[0].children[0].data.windowId).toBe(2);
        expect(windowNode2.children![1].key).toBe('22');
        expect(windowNode2.children![1].data.index).toBe(3);
    });

    // 在打开的window中，windowNode包含closed和openedNode，且openedNode不都在子树当中，
    // 有一些开启的Tab在后面，移动全部openedTabNode，到另一个关闭的窗口中
    it('drag partial open tab from open window to another open window', async () => {
        const treeData = new MockTreeBuilder()
            .addNestedTabChildren(2)
            .addTabChildren(2, 1)
            .addWindowNode()
            .addTabChildren(2, 2)
            .build();
        const tabMasterTree = initTabMasterTree(treeData);
        mockTabMove(tabMasterTree);
        mockTabRemove(tabMasterTree);
        const tree = tabMasterTree.tree;
        tree.getNodeByKey('11').data.closed = true;
        const sourceNode = tree.getNodeByKey(`11`);
        const targetNode = tree.getNodeByKey(`21`);
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        await tabMoveOnDrop2(sourceNode, targetNode, 'after');
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        const windowNode1 = tree.getNodeByKey('1');
        const windowNode2 = tree.getNodeByKey('2');
        expect(windowNode1.countChildren()).toBe(2);
        expect(windowNode1.data.closed).toBe(false);
        expect(windowNode1.children![0].key).toBe('13');
        expect(windowNode1.children![0].data.index).toBe(0);
        expect(windowNode1.children![1].key).toBe('14');
        expect(windowNode1.children![1].data.index).toBe(1);
        expect(windowNode2.countChildren(true)).toBe(4);
        expect(windowNode2.children![0].key).toBe('21');
        expect(windowNode2.children![0].data.index).toBe(0);
        expect(windowNode2.children[1].key).toBe('11');
        expect(windowNode2.children[1].data.windowId).toBe(2);
        expect(windowNode2.children[1].children[0].key).toBe('12');
        expect(windowNode2.children[1].children[0].data.index).toBe(1);
        expect(windowNode2.children[1].children[0].data.windowId).toBe(2);
        expect(windowNode2.children[2].key).toBe('22');
        expect(windowNode2.children[2].data.index).toBe(2);
    });

    it('drag partial open tab from open window to no window node position', async () => {
        const treeData = new MockTreeBuilder().addNestedTabChildren(3).build();
        const tabMasterTree = initTabMasterTree(treeData);
        const tree = tabMasterTree.tree;
        mockTabMove(tabMasterTree);
        mockTabRemove(tabMasterTree);
        mockWindowCreate(tabMasterTree, 2);
        const sourceNode = tree.getNodeByKey('12');
        sourceNode.data.closed = true;
        tree.getNodeByKey('13').data.index = 1;
        const targetNode = tree.getNodeByKey('1');
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        await tabMoveOnDrop2(sourceNode, targetNode, 'after');
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        const windowNode1 = tree.getNodeByKey('1');
        const windowNode2 = tree.getNodeByKey('2');
        expect(browser.windows.create.calledOnce).toBe(true);
        expect(browser.tabs.remove.calledOnce).toBe(true);
        expect(browser.tabs.move.calledOnceWith([13], { windowId: 2, index: 0 })).toBe(true);
        expect(windowNode1.countChildren(true)).toBe(1);
        expect(windowNode1.children![0].key).toBe('11');
        expect(windowNode1.children![0].data.index).toBe(0);
        expect(windowNode2.countChildren(true)).toBe(2);
        expect(windowNode2.children![0].key).toBe('12');
        expect(windowNode2.children![0].data.index).toBe(1);
        expect(windowNode2.children![0].data.windowId).toBe(2);
        expect(windowNode2.children![0].children[0].key).toBe('13');
        expect(windowNode2.children![0].children[0].data.index).toBe(0);
        expect(windowNode2.children![0].children[0].data.windowId).toBe(2);
    });
});
