/**
 * Chrome Tab => Tree的操作，注意这一层放的是Chrome的实现
 * 用于处理tab-tree的各种操作，* 这一层需要完成ChromeTab到FancyTree的映射模型
 * 兴许以后还能用来抽象出interface做其他浏览器实现？好了，别做梦了...赶紧干活...
 */
import type { Tabs, Windows } from 'webextension-polyfill';

import * as TabNodes from '../logic/tab-nodes';
import * as WindowNodes from '../logic/window-nodes';

/**
 * 根据Tab创建Node
 */
export const addNodeFromTab = (tree: Fancytree.Fancytree, newTab: Tabs.Tab) => {
    const rootNode = tree.getRootNode();
    if (newTab.windowId === undefined) throw new Error('Tab must have an id');
    const key = TabNodes.getKey(newTab.windowId, newTab.openerTabId);
    const parentNode = tree.getNodeByKey(key, rootNode);
    parentNode.addNode(TabNodes.create(newTab));
    parentNode.setExpanded(true);
};

/**
 * 根据Tab在指定位置上创建Node
 */
export const addNodeFromTabAtIndex = (
    tree: Fancytree.Fancytree,
    newTab: Tabs.Tab,
    newWindowId: number,
    toIndex: number,
) => {
    const rootNode = tree.getRootNode();
    const parentNode = tree.getNodeByKey(newWindowId.toString(), rootNode);
    if (parentNode) {
        const children = parentNode.getChildren();
        const tabNode = TabNodes.create(newTab);
        children ? children[toIndex].addNode(tabNode, 'before') : parentNode.addNode(tabNode);
    }
};

/**
 * 删除节点
 */
export const removeNode = (
    tree: Fancytree.Fancytree,
    windowId: number,
    tabId: number,
    reserveChildren: boolean,
) => {
    // 只删除当前节点，子节点不删除
    const rootNode = tree.getRootNode();
    const key = TabNodes.getKey(windowId, tabId);
    const toRemoveNode = tree.getNodeByKey(key, rootNode);
    const children = toRemoveNode.children;
    if (reserveChildren) children.forEach((node) => node.moveTo(toRemoveNode, 'after'));
    if (toRemoveNode) toRemoveNode.remove();
};

/**
 * 更新节点: 更新内容但没有移动窗口
 */
export const updateNode = (tree: Fancytree.Fancytree, updatedTabId: number) => {
    // const rootNode = tree.getRootNode();
    // if (updatedTab.windowId === undefined) throw new Error('Tab must have an id');
    // const toUpdateNode = tree.getNodeByKey(
    //     TabNodes.getKey(updatedTab.windowId, updatedTab.id),
    //     rootNode,
    // );
    // if (toUpdateNode) WindowNodes.updateFancyTreeNode(toUpdateNode, updatedTab);
};

/**
 * 移动节点
 */
export const moveNode = (
    tree: Fancytree.Fancytree,
    windowId: number,
    fromIndex: number,
    toIndex: number,
    tabId: number,
) => {
    const windowNode = tree.getNodeByKey(String(windowId));
    const children = windowNode.getChildren();
    const mode = toIndex < fromIndex ? 'before' : 'after';
    const tabNode = tree.getNodeByKey(TabNodes.getKey(windowId, tabId));
    if (!tabNode) {
        // Trick: 适配tab添加到window时attach->move事件链中，调用move时tabNode可能尚未创建完毕
        // 可能死循环？
        setTimeout(() => {
            moveNode(tree, windowId, fromIndex, toIndex, tabId);
        }, 1);
    }
    if (tabNode) {
        // tab attach事件会触发move，这时候tree里面没有对应node
        tabNode.moveTo(children[toIndex], mode);
    }
};

export const activatedNode = (tree: Fancytree.Fancytree, windowId: number, tabId: number) => {
    const targetNode = tree.getNodeByKey(TabNodes.getKey(windowId, tabId));
    if (!targetNode) return;
    WindowNodes.updateFancyTreeNode(targetNode, { active: true });
};

/**
 * 根据Window创建Node
 */
export const addNodeFromWindow = (tree: Fancytree.Fancytree, window: Windows.Window) => {
    const rootNode = tree.getRootNode();
    rootNode.addNode(WindowNodes.create(window));
};
