import _ from 'lodash/index';
import { windows } from 'webextension-polyfill';

import type { TreeData, TreeNode } from './nodes/nodes';

const lazyLogCache: any = {};
/* Log if value changed, nor more than interval/sec. */
export const logLazy = (name: string, value: any, interval: number, msg: string) => {
    const now = Date.now();
    if (!lazyLogCache[name]) lazyLogCache[name] = { stamp: now };

    const entry = lazyLogCache[name];

    if (value && value === entry.value) return;

    entry.value = value;

    if (interval > 0 && now - entry.stamp <= interval) return;

    entry.stamp = now;
    lazyLogCache[name] = entry;
    console.log(msg);
};

/**
 * Array转Object
 * @param arr 待转换数组
 * @param keyGetter 从item中获取key的方法
 * @return  转换后Object
 */
export const array2Object = <T>(
    arr: Array<T>,
    keyGetter: (item: any) => string,
): { [key: string]: T } => {
    const result: any = {};
    arr.forEach((item) => {
        const key = keyGetter(item);
        result[key] = item;
    });
    return result;
};

export const pushIfAbsentInit = (
    map: { [prop: string | number]: any },
    k: string | number,
    v: any,
) => {
    if (k in map) {
        map[k].push(v);
    } else {
        const arr = [];
        arr.push(v);
        map[k] = arr;
    }
};

export const FancyTreeUtils = {
    /** 重置TabNode的Index */
    resetNodeIndex(
        tree: Fancytree.Fancytree,
        windowId: number,
        browserTabIndexMap: { [tabId: number]: number },
    ) {
        const parentNode = tree.getNodeByKey(`${windowId}`);
        parentNode.visit((node) => {
            // 1. 非tab节点，则略过
            if (node.data.nodeType !== 'tab') {
                return true;
            }
            if (!(node.data.id in browserTabIndexMap)) {
                // ignore: closed tab node 不会存在于browserTabIndexMap中
                // throw new Error('Tab not in browserTabIndexMap');
            }
            node.data.index = browserTabIndexMap[node.data.id];
            return true;
        });
    },
    /** 查找当前元素的windowNode */
    findWindowNode(node: Fancytree.FancytreeNode) {
        let windowNode = node;
        while (windowNode.data.nodeType !== 'window') {
            windowNode = windowNode.parent;
        }
        return windowNode;
    },
};

export const BrowserExtensionUtils = {
    async getTabId2Index(windowId: number): Promise<{ [tabId: number]: number }> {
        const window = await windows.get(windowId, { populate: true });
        const tabId2Index: { [tabId: number]: number } = {};
        window.tabs!.forEach((tab) => (tabId2Index[tab.id!] = tab.index));
        return tabId2Index;
    },
};

export const NodeUtils = {
    moveChildrenAsNextSiblings(node: Fancytree.FancytreeNode) {
        if (node.children && node.children.length > 0) {
            const children = _.clone(node.children.reverse());
            children.forEach((child) => child.moveTo(node, 'after'));
            node.expanded = true;
        }
    },
    traverse(
        nodeDataArr: TreeNode<TreeData>[],
        callback: (node: TreeNode<TreeData>) => void,
    ): void {
        nodeDataArr.forEach((nodeData) => {
            callback(nodeData);
            if (nodeData.children) {
                NodeUtils.traverse(nodeData.children, callback);
            }
        });
    },
    canRemove(node: Fancytree.FancytreeNode) {
        const { closed, alias } = node.data;
        return !closed && !alias;
    },
};
