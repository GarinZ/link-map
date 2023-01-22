/**
 * @jest-environment jsdom
 */

import _ from 'lodash';
import type { Tabs } from 'webextension-polyfill';

import { FancyTabMasterTree } from '@/tree/fancy-tab-master-tree';
import type { NodeData, TreeData, TreeNode } from '@/tree/nodes/nodes';
import type { TabData } from '@/tree/nodes/tab-node-operations';
import type { WindowData } from '@/tree/nodes/window-node-operations';

import {
    DEFAULT_TAB,
    DEFAULT_TAB_NODE,
    DEFAULT_WINDOW_NODE,
} from '../tree/fancy-tab-master-tree/mock-data';

import 'jquery.fancytree';
import 'jquery.fancytree/dist/modules/jquery.fancytree.dnd5';
import 'jquery.fancytree/dist/modules/jquery.fancytree.childcounter';

export function initTabMasterTree(source: TreeNode<TreeData>[]): FancyTabMasterTree {
    document.body.innerHTML = '<div id="tree">';
    const tree = new FancyTabMasterTree('#tree');
    tree.initTree(source);
    return tree;
}

export function createTab(
    id: number,
    windowId: number,
    index: number,
    openerTabId?: number,
): Tabs.Tab {
    const tab = _.cloneDeep(DEFAULT_TAB);
    return _.merge(tab, { id, windowId, index, openerTabId });
}

export function createWindowNode({ windowId }: Partial<WindowData>) {
    const node = _.cloneDeep(DEFAULT_WINDOW_NODE);
    node.title = `Window ${windowId}`;
    node.key = `${windowId}`;
    node.data = _.merge(node.data, { id: windowId, windowId });
    return node;
}
export function createTabNode({
    id,
    windowId,
    index,
    openerTabId,
    ...props
}: Partial<TabData>): TreeNode<TabData> {
    const newNode = _.cloneDeep(DEFAULT_TAB_NODE);
    newNode.key = `${id}`;
    newNode.title = `Tab ${id}`;
    newNode.data = _.merge(_.cloneDeep(DEFAULT_TAB_NODE.data), {
        id,
        windowId,
        index,
        openerTabId,
        ...props,
    });
    return newNode;
}

export class MockTreeBuilder {
    static DEFAULT_ID = DEFAULT_WINDOW_NODE.data.windowId * 10 + 1;
    static DEFAULT_INDEX = 0;
    static DEFAULT_WINDOW_ID = DEFAULT_WINDOW_NODE.data.windowId;

    private readonly treeData: TreeNode<TreeData>[];
    private windowIdToTabNodeData: { [windowId: number]: TreeNode<TabData>[] } = {};
    private windowIdToWindowNodeData: { [windowId: number]: TreeNode<WindowData> } = {};

    constructor() {
        const windowNodeData = _.cloneDeep(DEFAULT_WINDOW_NODE);
        this.treeData = [windowNodeData];
        this.windowIdToTabNodeData[MockTreeBuilder.DEFAULT_WINDOW_ID] = [];
        this.windowIdToWindowNodeData[MockTreeBuilder.DEFAULT_WINDOW_ID] = windowNodeData;
    }

    addTabChildren(
        count: number,
        windowId: number = MockTreeBuilder.DEFAULT_WINDOW_ID,
        props?: Partial<TabData>,
    ): MockTreeBuilder {
        const targetWindow = this.windowIdToWindowNodeData[windowId];
        if (!targetWindow) {
            throw new Error(`Window with id ${windowId} not found`);
        }
        const siblingsTabNodeData = this.windowIdToTabNodeData[windowId];
        const prevTabNodeData: TreeNode<TabData> | undefined = siblingsTabNodeData.at(-1);
        let index = prevTabNodeData
            ? prevTabNodeData.data.index + 1
            : MockTreeBuilder.DEFAULT_INDEX;
        let id = prevTabNodeData ? prevTabNodeData.data.id! + 1 : windowId * 10 + 1;
        for (let i = 0; i < count; i++) {
            const newTabNodeData = createTabNode({
                id: id++,
                windowId,
                index: index++,
                ...props,
            });
            targetWindow.children!.push(newTabNodeData);
            siblingsTabNodeData.push(newTabNodeData);
        }
        return this;
    }

    addNestedTabChildren(
        count: number,
        windowId: number = MockTreeBuilder.DEFAULT_WINDOW_ID,
        props?: Partial<TabData>,
    ): MockTreeBuilder {
        const targetWindow = this.windowIdToWindowNodeData[windowId];
        if (!targetWindow) {
            throw new Error(`Window with id ${windowId} not found`);
        }
        const siblingsTabNodeData = this.windowIdToTabNodeData[windowId];
        const prevTabNodeData: TreeNode<TabData> | undefined = siblingsTabNodeData.at(-1);
        let index = prevTabNodeData
            ? prevTabNodeData.data.index + 1
            : MockTreeBuilder.DEFAULT_INDEX;
        let id = prevTabNodeData ? prevTabNodeData.data.id! + 1 : windowId * 10 + 1;
        let prevNode: TreeNode<NodeData> = prevTabNodeData ?? targetWindow;
        for (let i = 0; i < count; i++) {
            const newTabNodeData = createTabNode({
                id: id++,
                windowId,
                index: index++,
                ...props,
            });
            prevNode.children!.push(newTabNodeData);
            prevNode = newTabNodeData;
            siblingsTabNodeData.push(newTabNodeData);
        }
        return this;
    }

    addWindowNode(addToPrevWindow = false): MockTreeBuilder {
        const windowId = Object.keys(this.windowIdToWindowNodeData).length + 1;
        let lastWindowIdStr: string | undefined;
        if (addToPrevWindow) {
            lastWindowIdStr = Object.keys(this.windowIdToWindowNodeData).at(-1);
            if (!lastWindowIdStr) {
                throw new Error('No window to add to');
            } else if (this.windowIdToTabNodeData[+lastWindowIdStr].length === 0) {
                throw new Error('No tab to add to');
            }
        }
        const newWindowNodeData = createWindowNode({ windowId });
        const toAddArr: TreeNode<TreeData>[] = lastWindowIdStr
            ? this.windowIdToTabNodeData[+lastWindowIdStr].at(-1)!.children!
            : this.treeData;
        this.windowIdToTabNodeData[windowId] = [];
        this.windowIdToWindowNodeData[windowId] = newWindowNodeData;
        toAddArr.push(newWindowNodeData);
        return this;
    }

    build(): TreeNode<TreeData>[] {
        return this.treeData;
    }
}
