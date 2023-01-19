/**
 * @jest-environment jsdom
 */

import browser from 'sinon-chrome';

import { FancyTabMasterTree } from '@/tree/fancy-tab-master-tree';

import { initTabMasterTree, MockTreeBuilder } from '../../utils/gen-utils';
import { toAsciiTree } from '../../utils/print-utils';

describe('close node', () => {
    beforeEach(() => {
        browser.flush();
    });

    it('close expanded opened tab node with children', () => {
        const treeData = new MockTreeBuilder().addNestedTabChildren(2).build();
        const targetNodeKey = treeData[0].children![0].key;
        const tree = initTabMasterTree(treeData).tree;
        FancyTabMasterTree.closeNodes(tree.getNodeByKey(targetNodeKey));
        expect(browser.tabs.remove.callCount).toBe(1);
        expect(browser.tabs.remove.getCall(0).calledWith([11])).toBeTruthy();
        const windowNode = tree.getRootNode().children[0];
        expect(windowNode.children).toHaveLength(1);
        expect(windowNode.children[0].key).toBe('11');
        expect(windowNode.children[0].data.closed).toBe(true);
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
    });

    it('close expanded opened window node, with two window in tree', () => {
        const treeData = new MockTreeBuilder()
            .addTabChildren(1)
            .addWindowNode(true)
            .addTabChildren(2, 2)
            .build();
        const tree = initTabMasterTree(treeData).tree;
        const targetNode = tree.getNodeByKey(`${1}`);
        FancyTabMasterTree.closeNodes(targetNode);
        expect(browser.tabs.remove.callCount).toBe(1);
        expect(browser.tabs.remove.calledWith([11])).toBeTruthy();
        expect(targetNode.data.closed).toBe(true);
        expect(targetNode.children).toHaveLength(1);
        expect(targetNode.children[0].data.closed).toBe(true);
        const anotherWindowNode = tree.getNodeByKey(`${2}`);
        anotherWindowNode.visit((node) => {
            expect(node.data.closed).toBe(false);
        }, true);

        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
    });

    it('close un-expanded opened tab node', () => {
        const treeData = new MockTreeBuilder()
            .addNestedTabChildren(4)
            .addWindowNode(true)
            .addTabChildren(2, 2)
            .build();
        const tree = initTabMasterTree(treeData).tree;
        const targetNode = tree.getNodeByKey(`${11}`);
        targetNode.setExpanded(false);
        targetNode.children[0].data.closed = true;
        FancyTabMasterTree.closeNodes(targetNode);
        // expect(browser.tabs.remove.callCount).toBe(1);
        expect(browser.tabs.remove.calledOnce).toBe(true);
        expect(browser.tabs.remove.getCall(0).calledWith([11, 13, 14, 21, 22])).toBe(true);
        targetNode.visit((node) => {
            expect(node.data.closed).toBe(true);
        }, true);

        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
    });

    it('close un-expanded opened window node, with window node as children', () => {
        const treeData = new MockTreeBuilder()
            .addNestedTabChildren(4)
            .addWindowNode(true)
            .addTabChildren(2, 2)
            .build();
        const tree = initTabMasterTree(treeData).tree;
        const targetNode = tree.getNodeByKey(`${1}`);
        targetNode.setExpanded(false);
        FancyTabMasterTree.closeNodes(targetNode);
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        expect(browser.tabs.remove.calledOnce).toBe(true);
        expect(browser.tabs.remove.getCall(0).calledWith([11, 12, 13, 14, 21, 22])).toBe(true);
        targetNode.visit((node) => {
            expect(node.data.closed).toBe(true);
        });
    });

    it('close every tab in window', () => {
        const treeData = new MockTreeBuilder().addTabChildren(2).build();
        const tree = initTabMasterTree(treeData).tree;
        const targetNode = tree.getNodeByKey(`${1}`);
        targetNode.setExpanded(true);
        FancyTabMasterTree.closeNodes(tree.getNodeByKey(`${11}`));
        FancyTabMasterTree.closeNodes(tree.getNodeByKey(`${12}`));
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        expect(browser.tabs.remove.calledTwice).toBe(true);
        expect(browser.tabs.remove.getCall(0).calledWith([11])).toBe(true);
        expect(browser.tabs.remove.getCall(1).calledWith([12])).toBe(true);
        targetNode.visit((node) => {
            expect(node.data.closed).toBe(true);
        }, true);
    });

    afterEach(() => {
        browser.flush();
    });
});
