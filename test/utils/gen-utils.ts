/**
 * @jest-environment jsdom
 */

import _ from 'lodash';
import type { Tabs } from 'webextension-polyfill';

import { FancyTabMasterTree } from '@/tree/fancy-tab-master-tree';
import type { TreeData, TreeNode } from '@/tree/nodes/nodes';
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

export function createWindowNode(props: Partial<TreeNode<WindowData>>) {
    return _.merge(_.cloneDeep(DEFAULT_WINDOW_NODE), props);
}
export function createTabNode({
    id,
    windowId,
    index,
    openerTabId,
}: Partial<TabData>): TreeNode<TabData> {
    const newNode = _.cloneDeep(DEFAULT_TAB_NODE);
    newNode.key = `${id}`;
    newNode.title = `Tab ${id}`;
    newNode.data = _.merge(_.cloneDeep(DEFAULT_TAB_NODE.data), {
        id,
        windowId,
        index,
        openerTabId,
    });
    return newNode;
}

export class MockTreeBuilder {
    static DEFAULT_ID = DEFAULT_WINDOW_NODE.data.windowId * 10 + 1;
    static DEFAULT_INDEX = 0;
    static DEFAULT_WINDOW_ID = DEFAULT_WINDOW_NODE.data.windowId;

    private readonly treeData: TreeNode<TreeData>[];

    constructor(source?: TreeNode<TreeData>[]) {
        this.treeData = source || [_.cloneDeep(DEFAULT_WINDOW_NODE)];
    }

    addTabChildren(count: number, windowIndex?: number, openerTabId?: number): MockTreeBuilder {
        const targetWindow = this.treeData[windowIndex || 0] as TreeNode<WindowData>;
        const baseNode: TreeNode<TabData> | undefined = targetWindow.children![
            targetWindow.children!.length - 1
        ] as TreeNode<TabData>;
        for (let i = 0; i < count; i++) {
            targetWindow.children!.push(
                createTabNode({
                    id:
                        baseNode === null
                            ? MockTreeBuilder.DEFAULT_ID + i
                            : baseNode.data.id! + i + 1,
                    windowId: targetWindow.data.windowId ?? MockTreeBuilder.DEFAULT_WINDOW_ID,
                    index: baseNode
                        ? baseNode.data.index + i + 1
                        : MockTreeBuilder.DEFAULT_INDEX + i,
                    openerTabId,
                }),
            );
        }
        return this;
    }

    addNestedTabChildren(
        count: number,
        windowIndex?: number,
        openerTabId?: number,
    ): MockTreeBuilder {
        const targetWindow = this.treeData[windowIndex || 0] as TreeNode<WindowData>;
        const baseNode: TreeNode<TabData> | undefined = targetWindow.children![
            targetWindow.children!.length - 1
        ] as TreeNode<TabData>;
        let prevNode: TreeNode<TabData> | null = null;
        for (let i = 0; i < count; i++) {
            if (prevNode) {
                const tabNodeData = createTabNode({
                    id: baseNode ? baseNode.data.id! + i + 1 : MockTreeBuilder.DEFAULT_ID + i,
                    windowId: targetWindow.data.windowId ?? MockTreeBuilder.DEFAULT_WINDOW_ID,
                    index: baseNode
                        ? baseNode.data.index + i + 1
                        : MockTreeBuilder.DEFAULT_INDEX + i,
                    openerTabId,
                });
                prevNode.children!.push(tabNodeData);
                prevNode = tabNodeData;
            } else {
                const tabNodeData = createTabNode({
                    id: baseNode ? baseNode.data.id! + i + 1 : MockTreeBuilder.DEFAULT_ID + i,
                    windowId: targetWindow.data.windowId ?? MockTreeBuilder.DEFAULT_WINDOW_ID,
                    index: baseNode
                        ? baseNode.data.index + i + 1
                        : MockTreeBuilder.DEFAULT_INDEX + i,
                    openerTabId,
                });
                targetWindow.children!.push(tabNodeData);
                prevNode = tabNodeData;
            }
        }
        return this;
    }

    addWindowNode(props: Partial<TreeNode<WindowData>>): MockTreeBuilder {
        this.treeData.push(createWindowNode(props));
        return this;
    }

    build(): TreeNode<TreeData>[] {
        return this.treeData;
    }
}
