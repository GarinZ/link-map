/**
 * @jest-environment jsdom
 */

import browser from 'sinon-chrome';

import { FancyTabMasterTree } from '@/tree/fancy-tab-master-tree';
import { TabNodeOperations } from '@/tree/nodes/tab-node-operations';
import { WindowNodeOperations } from '@/tree/nodes/window-node-operations';

import { mockTabCreate, mockTabRemove, mockWindowCreate } from '../../utils/browser-mock';
import { initTabMasterTree, MockTreeBuilder } from '../../utils/gen-utils';
import { toAsciiTree } from '../../utils/print-utils';
import { DEFAULT_TAB_NODE } from './mock-data';

describe('close node', () => {
    beforeEach(() => {
        browser.flush();
    });

    it('close expanded opened tab node with children', () => {
        const treeData = new MockTreeBuilder().addNestedTabChildren(5).build();
        const tree = initTabMasterTree(treeData).tree;
        const targetNode = tree.getNodeByKey(`11`);
        FancyTabMasterTree.closeNodes(tree.getNodeByKey(targetNode.key));
        expect(browser.tabs.remove.callCount).toBe(1);
        expect(browser.tabs.remove.getCall(0).calledWith([11])).toBeTruthy();
        const windowNode = tree.getRootNode().children[0];
        expect(windowNode.children).toHaveLength(1);
        expect(windowNode.children[0].key).toBe('11');
        expect(windowNode.children[0].data.closed).toBe(true);
        let index = 0;
        targetNode.visit((node) => {
            expect(node.data.index).toBe(index++);
        });

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
});

describe('remove node', () => {
    beforeEach(async () => {
        browser.flush();
    });

    it('remove expand closed tab node', () => {
        const treeData = new MockTreeBuilder().addNestedTabChildren(3).build();
        const tree = initTabMasterTree(treeData).tree;
        const windowNode = tree.getNodeByKey(`1`);
        const targetNode = tree.getNodeByKey(`12`);
        targetNode.data.closed = true;
        FancyTabMasterTree.removeNodes(targetNode);
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        expect(browser.tabs.remove.called).toBe(false);
        expect(windowNode.countChildren(true)).toBe(2);
        expect(windowNode.children[0].key).toBe('11');
        expect(windowNode.children[0].children[0].key).toBe('13');
    });

    it('remove expand open tab node, window node need to close', () => {
        const treeData = new MockTreeBuilder().addNestedTabChildren(2).build();
        const tree = initTabMasterTree(treeData).tree;
        const windowNode = tree.getNodeByKey(`1`);
        tree.getNodeByKey(`12`).data.closed = true;
        const targetNode = tree.getNodeByKey(`11`);
        FancyTabMasterTree.removeNodes(targetNode);
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        expect(browser.tabs.remove.getCall(0).calledWith([11])).toBe(true);
        expect(windowNode.countChildren(true)).toBe(1);
        expect(windowNode.children[0].key).toBe('12');
        expect(windowNode.data.closed).toBe(true);
    });

    it('remove expand open tab node', () => {
        const treeData = new MockTreeBuilder().addNestedTabChildren(3).build();
        const tree = initTabMasterTree(treeData).tree;
        const windowNode = tree.getNodeByKey(`1`);
        const targetNode = tree.getNodeByKey(`12`);
        FancyTabMasterTree.removeNodes(targetNode);
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        expect(browser.tabs.remove.calledOnce).toBe(true);
        expect(browser.tabs.remove.getCall(0).calledWith([12])).toBe(true);
        expect(windowNode.countChildren(true)).toBe(2);
        expect(windowNode.children[0].key).toBe('11');
        expect(windowNode.children[0].children[0].key).toBe('13');
        expect(windowNode.children[0].children[0].data.index).toBe(1);
    });

    it('remove un-expand open tab node', () => {
        const treeData = new MockTreeBuilder().addNestedTabChildren(3).addTabChildren(1, 1).build();
        const tree = initTabMasterTree(treeData).tree;
        const windowNode = tree.getNodeByKey(`1`);
        const targetNode = tree.getNodeByKey(`12`);
        targetNode.setExpanded(false);
        FancyTabMasterTree.removeNodes(targetNode);
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        expect(browser.tabs.remove.calledOnce).toBe(true);
        expect(browser.tabs.remove.getCall(0).calledWith([12, 13])).toBe(true);
        expect(windowNode.countChildren(true)).toBe(2);
        expect(windowNode.children[0].key).toBe('11');
        expect(windowNode.children[0].data.index).toBe(0);
        expect(windowNode.children[1].key).toBe('14');
        expect(windowNode.children[1].data.index).toBe(1);
    });

    it('remove expand open window node', async () => {
        const treeData = new MockTreeBuilder()
            .addNestedTabChildren(4)
            .addWindowNode(true)
            .addTabChildren(2, 2)
            .build();
        const tabMasterTree = initTabMasterTree(treeData);
        const tree = tabMasterTree.tree;
        const windowNode = tree.getNodeByKey(`1`);
        const firstTabNode = tree.getNodeByKey(`11`);
        firstTabNode.data.closed = true;
        const forthTabNode = tree.getNodeByKey(`14`);
        forthTabNode.data.closed = true;

        // mock browser callback
        mockTabRemove(tabMasterTree);
        browser.tabs.query.returns(Promise.resolve([]));
        FancyTabMasterTree.removeNodes(windowNode);
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        expect(browser.tabs.remove.calledOnce).toBe(true);
        expect(browser.tabs.remove.getCall(0).calledWith([12, 13])).toBe(true);
        expect(tree.rootNode.countChildren(true)).toBe(5);
        expect(tree.rootNode.children[0].key).toBe('11');
        expect(tree.rootNode.children[0].children[0].key).toBe('14');
    });

    it('remove un-expand open window node', async () => {
        const treeData = new MockTreeBuilder().addNestedTabChildren(4).build();
        const tabMasterTree = initTabMasterTree(treeData);
        const tree = tabMasterTree.tree;
        const windowNode = tree.getNodeByKey(`1`);
        windowNode.expanded = false;
        const firstTabNode = tree.getNodeByKey(`11`);
        firstTabNode.data.closed = true;
        const forthTabNode = tree.getNodeByKey(`14`);
        forthTabNode.data.closed = true;

        // mock browser callback
        mockTabRemove(tabMasterTree);
        browser.tabs.query.returns(Promise.resolve([]));
        FancyTabMasterTree.removeNodes(windowNode);
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        expect(browser.tabs.remove.calledOnce).toBe(true);
        expect(browser.tabs.remove.getCall(0).calledWith([12, 13])).toBe(true);
        expect(tree.rootNode.countChildren(true)).toBe(0);
    });
});

describe('db click', () => {
    beforeEach(() => {
        browser.flush();
    });

    it('db click on opened tab node, with opened window node', async () => {
        const treeData = new MockTreeBuilder().addTabChildren(2).build();
        const tree = initTabMasterTree(treeData).tree;
        TabNodeOperations.updatePartial(tree.getNodeByKey(`${12}`), { active: true });
        await FancyTabMasterTree.onDbClick(tree.getNodeByKey(`${11}`));
        expect(browser.tabs.update.callCount).toBe(1);
        expect(browser.tabs.update.getCall(0).calledWith(11, { active: true })).toBeTruthy();
        expect(browser.windows.update.callCount).toBe(1);
        expect(browser.windows.update.getCall(0).calledWith(1, { focused: true })).toBeTruthy();
    });

    it('db click on closed tab node, with opened window node', async () => {
        const treeData = new MockTreeBuilder().addTabChildren(2).build();
        const tabMasterTree = initTabMasterTree(treeData);
        const tree = tabMasterTree.tree;
        const firstNode = tree.getNodeByKey(`${11}`);
        const secondNode = tree.getNodeByKey(`${12}`);
        TabNodeOperations.updatePartial(firstNode, { closed: true, index: 0 });
        TabNodeOperations.updatePartial(secondNode, { closed: false, index: 0 });
        const { url, index, windowId } = firstNode.data;
        mockTabCreate(tabMasterTree, 13);
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        await FancyTabMasterTree.onDbClick(firstNode);
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        expect(browser.tabs.create.calledOnceWith({ url, index, windowId })).toBeTruthy();
        expect(firstNode.data.closed).toBe(false);
        expect(firstNode.key).toBe('13');
        // eslint-disable-next-line unicorn/consistent-destructuring
        expect(firstNode.data.id).toBe(13);
        expect(secondNode.data.index).toBe(1);
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
        browser.windows.create.returns(
            Promise.resolve({
                id: modifiedWindowId,
                tabs: [{ id: 21, url: toClickNode.data.url, index: 0, windowId: modifiedWindowId }],
            }),
        );
        await FancyTabMasterTree.onDbClick(toClickNode);
        const { url, id, windowId, index } = toClickNode.data;
        expect(browser.windows.create.callCount).toBe(1);
        const createWindowArg = browser.windows.create.getCall(0).args[0];
        Object.entries(createWindowArg).forEach(([key, value]) => {
            if (key === 'url') expect(value).toStrictEqual([url]);
            else expect(value).toBe(windowNode.data[key]);
        });
        expect(windowNode.data.closed).toBe(false);
        expect(windowNode.key).toBe(`${modifiedWindowId}`);
        expect(windowNode.data.id).toBe(modifiedWindowId);
        expect(toClickNode.data.closed).toBe(false);
        expect(toClickNode.key).toBe('21');
        expect(id).toBe(21);
        expect(windowId).toBe(modifiedWindowId);
        expect(index).toBe(0);
    });

    it('db click on closed tab without window node', async () => {
        const tree = initTabMasterTree([DEFAULT_TAB_NODE]).tree;
        const toClickNode = tree.getNodeByKey(DEFAULT_TAB_NODE.key!);
        const modifiedWindowId = 2;
        TabNodeOperations.updatePartial(toClickNode, { closed: true });
        browser.windows.create.returns(
            Promise.resolve({
                id: modifiedWindowId,
                tabs: [{ id: 21, url: toClickNode.data.url, index: 0, windowId: modifiedWindowId }],
            }),
        );
        await FancyTabMasterTree.onDbClick(toClickNode);
        const { url, id, windowId, index } = toClickNode.data;
        expect(browser.windows.create.callCount).toBe(1);
        expect(browser.windows.create.getCall(0).calledWith({ url })).toBeTruthy();
        expect(toClickNode.data.closed).toBe(false);
        expect(toClickNode.key).toBe('21');
        expect(id).toBe(21);
        expect(toClickNode.getParent().data.windowId).toBe(modifiedWindowId);
        expect(windowId).toBe(modifiedWindowId);
        expect(index).toBe(0);
    });

    it('db click on opened window node', async () => {
        const treeData = new MockTreeBuilder().addTabChildren(2).build();
        const tree = initTabMasterTree(treeData).tree;
        await FancyTabMasterTree.onDbClick(tree.getNodeByKey(`${1}`));
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
        expect(firstTabNode.data.windowId).toBe(modifiedWindowId);
        expect(secondTabNode.data.closed).toBe(false);
        expect(secondTabNode.key).toBe('22');
        expect(secondTabNode.data.id).toBe(22);
        expect(secondTabNode.data.windowId).toBe(modifiedWindowId);
    });

    it('db click on closed tab with no window node', async () => {
        const treeData = new MockTreeBuilder().addTabChildren(1).build();
        const tabMasterTree = initTabMasterTree(treeData);
        const tree = tabMasterTree.tree;
        const tabNode = tree.getNodeByKey(`${11}`);
        const windowNode = tree.getNodeByKey(`${1}`);
        tabNode.moveTo(windowNode, 'after');
        windowNode.remove();
        tabNode.data.closed = true;
        tabNode.data.index = 2;

        mockWindowCreate(tabMasterTree, 2, 21);
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));
        await FancyTabMasterTree.onDbClick(tree.getNodeByKey(`${11}`));
        console.log(toAsciiTree(tree.toDict(), ['expanded'], ['closed', 'windowId']));

        expect(browser.windows.create.calledOnceWith({ url: tabNode.data.url })).toBeTruthy();
        expect(tabNode.data.closed).toBe(false);
        expect(tabNode.key).toBe('21');
        expect(tabNode.data.index).toBe(0);
        expect(tabNode.data.windowId).toBe(2);
        expect(tabNode.parent.key).toBe('2');
    });
});
