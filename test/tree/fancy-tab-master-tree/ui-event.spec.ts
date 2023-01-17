/**
 * @jest-environment jsdom
 */

import browser from 'sinon-chrome';

import { FancyTabMasterTree } from '@/tree/fancy-tab-master-tree';

import { initTabMasterTree, MockTreeBuilder } from '../../utils/gen-utils';

describe('close node', () => {
    beforeEach(() => {
        browser.flush();
    });

    it('close expanded opened tab node with children', () => {
        const builder = new MockTreeBuilder();
        const treeData = builder.addNestedTabChildren(2).build();
        const targetNodeKey = treeData[0].children![0].key;
        const tree = initTabMasterTree(treeData).tree;
        FancyTabMasterTree.closeNodes(tree.getNodeByKey(targetNodeKey));
        expect(browser.tabs.remove.callCount).toBe(1);
        expect(browser.tabs.remove.getCall(0).args[0]).toBe(11);
        const windowNode = tree.getRootNode().children[0];
        expect(windowNode.children).toHaveLength(1);
        expect(windowNode.children[0].key).toBe('11');
        expect(windowNode.children[0].data.closed).toBe(true);
    });

    it('close expanded opened window node with children', () => {
        const builder = new MockTreeBuilder();
        const treeData = builder.addTabChildren(2).build();
        const targetNodeKey = treeData[0].key;
        const tree = initTabMasterTree(treeData).tree;
        FancyTabMasterTree.closeNodes(tree.getNodeByKey(targetNodeKey));
        expect(browser.windows.remove.callCount).toBe(1);
        expect(browser.windows.remove.getCall(0).args[0]).toBe(1);
        expect(tree.getRootNode().children).toHaveLength(1);
        expect(tree.getRootNode().children[0].key).toBe('1');
        expect(tree.getRootNode().children[0].data.closed).toBe(true);
    });

    afterEach(() => {
        browser.flush();
    });
});
