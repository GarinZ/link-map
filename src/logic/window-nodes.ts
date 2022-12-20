import { cloneDeep } from 'lodash';
import type { Tabs, Windows } from 'webextension-polyfill';

import type { TreeNode, WindowData } from './nodes';
import * as TabNodes from './tab-nodes';

export const BACKGROUND_PAGE_TITLE = 'Tab Master';
type TabKey = keyof Tabs.Tab;

export const create = (window: Windows.Window): TreeNode<WindowData> => {
    const { id, type, tabs } = window;
    const isBackgroundPage = !!tabs && type === 'popup' && tabs[0].title === BACKGROUND_PAGE_TITLE;
    const node: TreeNode<WindowData> = {
        title: `Window${type === 'normal' ? '' : `(${type})`}`,
        key: `${id}`,
        icon: '/icons/chrome_icon.svg',
        expanded: true,
        data: {
            ...window,
            windowId: id || 0,
            closed: false,
            parentId: 0,
            isBackgroundPage,
        },
    };
    // 删除data.tabs
    delete node.data.tabs;
    // PS: openerTabId是空的，所以无法通过openerTabId构建Tab树
    if (tabs) node.children = tabs.map((tab) => TabNodes.create(tab));

    return node;
};

/**
 * 合并WindowNode
 * @param targetWindowNode
 * @param sourceWindowNode
 */
export const merge = (
    _targetWindowNode: TreeNode<WindowData>,
    _sourceWindowNode: TreeNode<WindowData>,
): void => {
    // Object.keys(sourceWindowNode).forEach((prop) => {
    //   if (prop !== 'children') {
    //     // 非children的属性都用source的值覆盖
    //     // @ts-ignore
    //     targetWindowNode[prop] = sourceWindowNode[prop]
    //   }
    //   else if (prop === 'children') {
    //     // children走tabNode合并方法
    //     TabNodes.mergeArr(targetWindowNode.children, sourceWindowNode.children)
    //   }
    // })
    // console.log(targetWindowNode)
};

/**
 * 将两份treeData合并，按id字段决定是否相同
 * 核心方法：决定了Storage(包括远端)如何和当前浏览器tab做merge
 * 这里的处理有点像协同编辑
 * @param windowId2dbWindowNode
 * @param windowId2ChromeWindowNode
 * @returns 合并后的Data，会深拷贝一个新的，不会污染参数
 */
export const mergeArrPurely = (
    windowId2dbWindowNode: { [key: string]: TreeNode<WindowData> },
    windowId2ChromeWindowNode: { [key: string]: TreeNode<WindowData> },
): { [key: string]: TreeNode<WindowData> } => {
    const mergedData = cloneDeep(windowId2dbWindowNode);
    Object.values(windowId2ChromeWindowNode).forEach((windowNode) => {
        const key = windowNode.key;
        if (key in mergedData) {
            // DB v Chrome v -> check tabs
            merge(mergedData[key], windowNode);
            mergedData[key].data.closed = false;
        } else {
            mergedData[key] = windowNode;
        }
    });
    return mergedData;
};

/**
 * 更新FancyTreeNode
 *
 */
export const updateFancyTreeNode = (
    toUpdateNode: Fancytree.FancytreeNode,
    updateProps: Partial<Tabs.Tab>,
) => {
    const { title, favIconUrl, active } = updateProps;
    if (title) toUpdateNode.setTitle(title);

    if (favIconUrl) toUpdateNode.icon = favIconUrl;

    if (active) {
        toUpdateNode.data.tabActive = active;
        toUpdateNode.setActive(active);
    }

    const restValidKeys: TabKey[] = ['status', 'url', 'discarded'];
    restValidKeys.forEach((k) => {
        if (updateProps[k]) toUpdateNode.data[k] = updateProps[k];
    });
};

/**
 *
 * @param {WindowNode[]} nestedWindowNodeArr
 * @returns {Object.<key, WindowNode | TabNode>} flattenMap
 */
// export const flattenNestedWindowNodeArr = (nestedWindowNodeArr) => {
//   const flattenMap = {}
//   nestedWindowNodeArr.forEach((nestedNodeItem) => {
//     flattenInDepthFirst(nestedNodeItem, flattenMap)
//     flattenMap[nestedNodeItem.key] = nestedNodeItem
//   })
//   return flattenMap
// }

/**
 * 递归打平嵌套的节点，深度优先遍历
 * {@code
 *      from: [{title: "A", children: [{title: "B"}}]}]
 *      to: {key1: {title: "A", children: [key2]}, key2: {title: "B"}}
 * }
 * @param {WindowNode | TabNode} nestedNodeItem
 * @param flattenMap
 */
// const flattenInDepthFirst = (nestedNodeItem, flattenMap) => {
//   // 1. 递归结束条件：叶子节点
//   if (!nestedNodeItem.hasOwnProperty('children') || nestedNodeItem.children.length === 0) {
//     flattenMap[nestedNodeItem.key] = nestedNodeItem
//     return
//   }
//   // 2. 深度优先遍历
//   const childrenIndex = []
//   nestedNodeItem.children.forEach((nextNodeItem) => {
//     flattenInDepthFirst(nextNodeItem, flattenMap)
//     childrenIndex.push(nextNodeItem.key)
//   })
//   nestedNodeItem.children = childrenIndex
// }
