import { clone } from 'lodash';

import type { TreeData, TreeNode } from './nodes';
import type { TabData } from './tab-node-operations';
import type { WindowData } from './window-node-operations';

type FancytreeNode = Fancytree.FancytreeNode;

const VALID_CLASS_NAMES = new Set(['closed', 'saved', 'tab-active']);
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
        const { closed, alias, save } = node.data;
        return !closed && !alias && !save;
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
    addExtraClasses: (node: Fancytree.NodeData, newClasses: string[]): void => {
        const extraClasses = node.extraClasses ? node.extraClasses.split(' ') : [];
        const classSet = new Set([...extraClasses, ...newClasses]);
        node.extraClasses = [...classSet].filter((c) => VALID_CLASS_NAMES.has(c)).join(' ');
    },
    removeExtraClasses: (node: Fancytree.NodeData, removeClasses: string[]): void => {
        const extraClasses = node.extraClasses ? node.extraClasses.split(' ') : [];
        node.extraClasses = extraClasses.filter((item) => !removeClasses.includes(item)).join(' ');
    },
    convertToText(node: FancytreeNode, level = 0) {
        const indent = '    '.repeat(level);
        const { nodeType, url, pendingUrl } = node.data;
        let text = '';
        text +=
            nodeType === 'tab'
                ? `${indent}${node.title} (${url ?? pendingUrl})`
                : `${indent}${node.title}`;
        const childrenText: string = node.children
            ? node.children.map((child) => NodeUtils.convertToText(child, level + 1)).join('')
            : '';
        return `${text}\n${childrenText}`;
    },
    convertToMarkdown(node: FancytreeNode, level = 0) {
        const indent = '  '.repeat(level);
        const { nodeType, url, pendingUrl } = node.data;
        let text = '';
        text +=
            nodeType === 'tab'
                ? `${indent}- [${node.title}](${url ?? pendingUrl})`
                : `${indent}- ${node.title}`;
        const childrenText: string = node.children
            ? node.children.map((child) => NodeUtils.convertToMarkdown(child, level + 1)).join('')
            : '';
        return `${text}\n${childrenText}`;
    },
};
