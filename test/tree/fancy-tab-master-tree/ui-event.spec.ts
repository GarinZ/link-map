/**
 * @jest-environment jsdom
 */

import browser from 'sinon-chrome';

import { FancyTabMasterTree } from '@/tree/fancy-tab-master-tree';
import { TabNodeOperations } from '@/tree/nodes/tab-node-operations';
import { WindowNodeOperations } from '@/tree/nodes/window-node-operations';

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

describe('db click', () => {
    beforeEach(() => {
        browser.flush();
    });

    it('db click on opened tab node, with opened window', async () => {
        const treeData = new MockTreeBuilder().addTabChildren(2).build();
        const tree = initTabMasterTree(treeData).tree;
        TabNodeOperations.updatePartial(tree.getNodeByKey(`${12}`), { active: true });
        await FancyTabMasterTree.onDbClick(tree.getNodeByKey(`${11}`));
        expect(browser.tabs.update.callCount).toBe(1);
        expect(browser.tabs.update.getCall(0).calledWith(11, { active: true })).toBeTruthy();
        expect(browser.windows.update.callCount).toBe(1);
        expect(browser.windows.update.getCall(0).calledWith(1, { focused: true })).toBeTruthy();
    });

    it('db click on closed tab node, with opened window', async () => {
        const treeData = new MockTreeBuilder().addTabChildren(2).build();
        const tree = initTabMasterTree(treeData).tree;
        const toClickNode = tree.getNodeByKey(`${11}`);
        TabNodeOperations.updatePartial(toClickNode, { closed: true });
        const { url, index, windowId } = toClickNode.data;
        browser.tabs.create.returns(Promise.resolve({ id: 13, url, index, windowId }));
        await FancyTabMasterTree.onDbClick(toClickNode);
        expect(browser.tabs.create.callCount).toBe(1);
        expect(browser.tabs.create.getCall(0).calledWith({ url, index, windowId })).toBeTruthy();
        expect(toClickNode.data.closed).toBe(false);
        expect(toClickNode.key).toBe('13');
        // eslint-disable-next-line unicorn/consistent-destructuring
        expect(toClickNode.data.id).toBe(13);
    });

    it('db click on closed tab node, with closed window', async () => {
        const treeData = new MockTreeBuilder().addTabChildren(2).build();
        const tree = initTabMasterTree(treeData).tree;
        const windowNode = tree.getNodeByKey(`${1}`);
        const modifiedWindowId = 2;
        const toClickNode = tree.getNodeByKey(`${11}`);
        WindowNodeOperations.updatePartial(windowNode, { closed: true });
        TabNodeOperations.updatePartial(toClickNode, { closed: true });
        TabNodeOperations.updatePartial(tree.getNodeByKey(`${12}`), { closed: true });
        const { url } = toClickNode.data;
        browser.windows.create.returns(
            Promise.resolve({
                id: modifiedWindowId,
                tabs: [{ id: 21, url, index: 0, windowId: modifiedWindowId }],
            }),
        );
        await FancyTabMasterTree.onDbClick(toClickNode);

        expect(browser.windows.create.callCount).toBe(1);
        const createWindowArg = browser.windows.create.getCall(0).args[0];
        Object.entries(createWindowArg).forEach(([key, value]) => {
            if (key === 'url') expect(value).toBe(url);
            else expect(value).toBe(windowNode.data[key]);
        });
        expect(windowNode.data.closed).toBe(false);
        expect(windowNode.key).toBe(`${modifiedWindowId}`);
        expect(windowNode.data.id).toBe(modifiedWindowId);
        expect(toClickNode.data.closed).toBe(false);
        expect(toClickNode.key).toBe('21');
        // eslint-disable-next-line unicorn/consistent-destructuring
        expect(toClickNode.data.id).toBe(21);
    });

    it('db click on opened window node', () => {
        const treeData = new MockTreeBuilder().addTabChildren(2).build();
        const tree = initTabMasterTree(treeData).tree;
        FancyTabMasterTree.onDbClick(tree.getNodeByKey(`${1}`));
        expect(browser.windows.update.callCount).toBe(1);
        expect(browser.windows.update.getCall(0).calledWith(1, { focused: true })).toBeTruthy();
    });

    it('db click on closed window node', async () => {
        const treeData = new MockTreeBuilder().addTabChildren(2).build();
        const tree = initTabMasterTree(treeData).tree;
        const windowNode = tree.getNodeByKey(`${1}`);
        const firstTabNode = tree.getNodeByKey(`${11}`);
        const secondTabNode = tree.getNodeByKey(`${12}`);
        WindowNodeOperations.updatePartial(windowNode, { closed: true });
        TabNodeOperations.updatePartial(firstTabNode, { closed: true });
        TabNodeOperations.updatePartial(secondTabNode, { closed: true });
        const modifiedWindowId = 2;
        browser.windows.create.returns(
            Promise.resolve({
                id: modifiedWindowId,
                tabs: [
                    { id: 21, url: firstTabNode.data.url, index: 0, windowId: modifiedWindowId },
                    { id: 22, url: secondTabNode.data.url, index: 1, windowId: modifiedWindowId },
                ],
            }),
        );
        await FancyTabMasterTree.onDbClick(tree.getNodeByKey(`${1}`));
        expect(browser.windows.create.callCount).toBe(1);
        const createWindowArg = browser.windows.create.getCall(0).args[0];
        Object.entries(createWindowArg).forEach(([key, value]) => {
            if (key === 'url')
                expect(value).toStrictEqual([firstTabNode.data.url, secondTabNode.data.url]);
            else expect(value).toBe(windowNode.data[key]);
        });
        expect(windowNode.data.closed).toBe(false);
        expect(windowNode.key).toBe(`${modifiedWindowId}`);
        expect(windowNode.data.id).toBe(modifiedWindowId);
        expect(firstTabNode.data.closed).toBe(false);
        expect(firstTabNode.key).toBe('21');
        expect(firstTabNode.data.id).toBe(21);
        expect(secondTabNode.data.closed).toBe(false);
        expect(secondTabNode.key).toBe('22');
        expect(secondTabNode.data.id).toBe(22);
    });

    afterEach(() => {
        browser.flush();
    });
});
