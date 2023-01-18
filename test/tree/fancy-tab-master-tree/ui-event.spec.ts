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
        expect(browser.tabs.remove.getCall(0).args[0]).toBe(11);
        const windowNode = tree.getRootNode().children[0];
        expect(windowNode.children).toHaveLength(1);
        expect(windowNode.children[0].key).toBe('11');
        expect(windowNode.children[0].data.closed).toBe(true);
        console.log(toAsciiTree(tree.toDict()));
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
        expect(browser.windows.remove.callCount).toBe(1);
        expect(browser.windows.remove.getCall(0).args[0]).toBe(targetNode.data.id);
        expect(targetNode.data.closed).toBe(true);
        expect(targetNode.children).toHaveLength(1);
        expect(targetNode.children[0].data.closed).toBe(true);
        const anotherWindowNode = tree.getNodeByKey(`${2}`);
        expect(anotherWindowNode.data.closed).toBe(false);
        expect(anotherWindowNode.children).toHaveLength(2);
        expect(anotherWindowNode.children[0].data.closed).toBe(false);
        expect(anotherWindowNode.children[1].data.closed).toBe(false);

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
        expect(browser.tabs.remove.getCall(0).calledWith([11, 13, 14])).toBe(true);
        expect(browser.windows.remove.calledOnce).toBe(true);
        expect(browser.windows.remove.getCall(0).calledWith(2)).toBe(true);
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
        expect(browser.tabs.remove.callCount).toBe(0);
        expect(browser.windows.remove.callCount).toBe(2);
        expect(browser.windows.remove.getCall(0).args[0]).toBe(1);
        expect(browser.windows.remove.getCall(1).args[0]).toBe(2);
        targetNode.visit((node) => {
            expect(node.data.closed).toBe(true);
        });
    });

    afterEach(() => {
        browser.flush();
    });
});
