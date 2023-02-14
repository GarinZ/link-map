import { clone } from 'lodash';

import type { TreeData, TreeNode } from './nodes';
import type { TabData } from './tab-node-operations';
import type { WindowData } from './window-node-operations';

type FancytreeNode = Fancytree.FancytreeNode;
export const NodeUtils = {
    moveChildrenAsNextSiblings(node: FancytreeNode) {
        if (node.children && node.children.length > 0) {
            const children = clone(node.children.reverse());
            children.forEach((child) => child.moveTo(node, 'after'));
            node.expanded = true;
        }
    },
    traverse<T extends TreeNode<TreeData> | Fancytree.NodeData>(
        nodeDataArr: T[],
        callback: (node: T) => void,
    ): void {
        nodeDataArr.forEach((nodeData) => {
            callback(nodeData);
            if (nodeData.children) {
                NodeUtils.traverse(nodeData.children as T[], callback);
            }
        });
    },
    canRemove(node: FancytreeNode) {
        const { closed, alias } = node.data;
        return !closed && !alias;
    },
    flatTabNodes(windowNode: FancytreeNode): FancytreeNode[] {
        const tabNodes: FancytreeNode[] = [];
        windowNode.visit((node) => {
            if (node.data.nodeType === 'tab' && !node.data.closed) {
                tabNodes.push(node);
            }
            return true;
        });
        return tabNodes;
    },
    flatTabData(windowData: TreeNode<WindowData>): TreeNode<TabData>[] {
        const tabNodes: TreeNode<TabData>[] = [];
        NodeUtils.traverse(windowData.children!, (node) => {
            const { nodeType, closed } = node.data as TabData;
            if (nodeType === 'tab' && !closed) {
                tabNodes.push(node as TreeNode<TabData>);
            }
        });
        return tabNodes;
    },
};
