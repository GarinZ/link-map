/**
 * Chrome Tab => Tree的操作，注意这一层放的是Chrome的实现
 * 用于处理tab-tree的各种操作，* 这一层需要完成ChromeTab到FancyTree的映射模型
 * 兴许以后还能用来抽象出interface做其他浏览器实现？好了，别做梦了...赶紧干活...
 */
import _ from 'lodash';
import type { Tabs, Windows } from 'webextension-polyfill';

import * as TabNodes from '../logic/tab-nodes';
import * as WindowNodes from '../logic/window-nodes';

/** 根据Tab创建Node */
export const addNodeFromTab = (tree: Fancytree.Fancytree, newTab: Tabs.Tab) => {
    const rootNode = tree.getRootNode();
    const newNode = TabNodes.create(newTab);
    if (newTab.windowId === undefined) throw new Error('Tab must have an id');
    if (newTab.openerTabId === undefined) {
        // 存在openerTabId
        const parentNode = tree.getNodeByKey(`${newTab.windowId}`);
        parentNode.addNode(newNode);
    } else {
        const parentNode = tree.getNodeByKey(`${newTab.openerTabId}`, rootNode);
        parentNode.addChildren(newNode);
        parentNode.setExpanded(true);
    }
};

/** 根据Tab在指定位置上创建Node */
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
/** 删除节点 */
export const removeNode = (tree: Fancytree.Fancytree, key: string, reserveChildren: boolean) => {
    // 1. 当删除当前节点时，保留子节点
    const rootNode = tree.getRootNode();
    const toRemoveNode = tree.getNodeByKey(key, rootNode);
    const children = toRemoveNode.children ? _.clone(toRemoveNode.children) : null;
    if (reserveChildren && !!children) {
        // reverse children保证元素顺序
        children.reverse().forEach((node) => node.moveTo(toRemoveNode, 'after'));
    }
    // 2. 检查当前节点是否为
    if (toRemoveNode) toRemoveNode.remove();
};
/** 更新节点: 更新内容但没有移动窗口 */
export const updateNode = (tree: Fancytree.Fancytree, updatedTab: Tabs.Tab) => {
    const toUpdateNode = tree.getNodeByKey(`${updatedTab.id!}`);
    if (toUpdateNode) WindowNodes.updateFancyTreeNode(toUpdateNode, updatedTab);
};
/** 移动节点 */
export const moveNode = (
    tree: Fancytree.Fancytree,
    windowId: number,
    fromIndex: number,
    toIndex: number,
    tabId: number,
) => {
    const windowNode = tree.getNodeByKey(String(windowId));
    const targetIndexNode = windowNode.findFirst((node) => node.data.index === toIndex);
    // const mode = toIndex < fromIndex ? 'before' : 'after';
    const tabNode = tree.getNodeByKey(`${tabId}`);
    if (!tabNode) {
        // Trick: 适配tab添加到window时attach->move事件链中，调用move时tabNode可能尚未创建完毕
        // 可能死循环？
        setTimeout(() => {
            moveNode(tree, windowId, fromIndex, toIndex, tabId);
        }, 1);
    }
    if (tabNode && targetIndexNode) {
        // tab attach事件会触发move，这时候tree里面没有对应node
        tabNode.moveTo(targetIndexNode, 'before');
    }
};
/** 激活节点 */
export const activatedNode = (tree: Fancytree.Fancytree, _windowId: number, tabId: number) => {
    const targetNode = tree.getNodeByKey(`${tabId}`);
    if (!targetNode) return;
    WindowNodes.updateFancyTreeNode(targetNode, { active: true });
};
/** 根据Window创建Node */
export const addNodeFromWindow = (tree: Fancytree.Fancytree, window: Windows.Window) => {
    const rootNode = tree.getRootNode();
    rootNode.addNode(WindowNodes.create(window));
};
