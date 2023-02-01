/**
 * @jest-environment jsdom
 */

import browser from 'sinon-chrome';

import { tabMoveOnDrop } from '@/tree/dnd';

import { mockTabMove, mockTabRemove } from '../../utils/browser-mock';
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
        await tabMoveOnDrop(sourceNode, targetNode, 'over');
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
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
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
        await tabMoveOnDrop(sourceNode, targetNode, 'over');
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
        await tabMoveOnDrop(sourceNode, targetNode, 'over');
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
});
