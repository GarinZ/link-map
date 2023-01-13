/**
 * Chrome Tab => Tree的操作，注意这一层放的是Chrome的实现
 * 用于处理tab-tree的各种操作，* 这一层需要完成ChromeTab到FancyTree的映射模型
 * 兴许以后还能用来抽象出interface做其他浏览器实现？好了，别做梦了...赶紧干活...
 */
import _ from 'lodash';
import type { Tabs, Windows } from 'webextension-polyfill';

import { ViewTabIndexUtils } from '../logic/tab-index-utils';
import * as TabNodes from '../logic/tab-nodes';
import { NodeUtils } from '../logic/utils';
import * as WindowNodes from '../logic/window-nodes';

/** 根据Tab创建Node */
export const addNodeFromTab = (
    tree: Fancytree.Fancytree,
    newTab: Tabs.Tab,
): Fancytree.FancytreeNode => {
    const newNode = TabNodes.create(newTab);
    if (newTab.windowId === undefined) throw new Error('Tab must have an id');
    const windowNode = tree.getNodeByKey(`${newTab.windowId}`);
    // 1. 先根据index - 1找到前一个节点
    const prevNode = windowNode.findFirst((node) => node.data.index === newTab.index - 1);
    ViewTabIndexUtils.increaseIndex(tree, windowNode.data.id, newTab.index);
    // 2. 如果index - 1不存在，说明是第一个节点，直接添加为windowNode的子节点
    if (prevNode === null) {
        return windowNode.addNode(newNode, 'firstChild');
    }
    // 3. 判断该节点的id和openerTabId是否相等
    if (prevNode.data.id === newTab.openerTabId) {
        // 3.1 如果相等，说明是openerTab的子节点，直接添加为openerTab的子节点
        return prevNode.addNode(newNode, 'child');
    } else if (!prevNode.data.openerTabId || prevNode.data.openerTabId === newTab.openerTabId) {
        // 3.2 prevNode有openerTabId，但是不等于newTab的openerTabId，说明newTab是prevNode的兄弟节点
        return prevNode.addNode(newNode, 'after');
    } else {
        // 3.3 都不是则为新建
        return windowNode.addChildren(newNode);
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
    const toRemoveNode = tree.getNodeByKey(key);
    // TODO 若包含note的节点在浏览器关闭时也不做删除处理
    // 2. 状态为closed的节点不做删除
    if (toRemoveNode.data.closed === true) {
        return;
    }
    // 3. 若保留子元素则提升children作为siblings
    reserveChildren && NodeUtils.moveChildrenAsNextSiblings(toRemoveNode);
    // 4. 删除节点
    const windowNode = tree.getNodeByKey(`${toRemoveNode.data.windowId}`);
    ViewTabIndexUtils.decreaseIndex(tree, windowNode.data.id, toRemoveNode.data.index);
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
    tabId: number,
    toIndex: number,
    fromIndex: number,
) => {
    if (toIndex === fromIndex) return;
    const windowNode = tree.getNodeByKey(String(windowId));
    const toMoveNode = tree.getNodeByKey(`${tabId}`);
    toMoveNode.data.index = fromIndex;
    // 2. 被移动元素有children，将children移动为toMoveNode的siblings
    NodeUtils.moveChildrenAsNextSiblings(toMoveNode);
    // 3. 重置所有节点的index
    // const currentNode = windowNode.findFirst((node) => node.data.index === toIndex);
    ViewTabIndexUtils.changeIndex(tree, windowNode.data.id, fromIndex, toIndex);
    // 4. 移动节点
    if (toIndex === 0) {
        toMoveNode.moveTo(windowNode, 'firstChild');
        return;
    }
    const prevNode = windowNode.findFirst((node) => node.data.index === toIndex - 1);
    const nextNode = prevNode.findFirst((node) => node.data.type === 'tab');
    nextNode ? toMoveNode.moveTo(nextNode, 'before') : toMoveNode.moveTo(prevNode, 'after');
};
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
