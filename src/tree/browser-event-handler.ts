/**
 * Chrome Tab => Tree的操作，注意这一层放的是Chrome的实现
 * 用于处理tab-tree的各种操作，* 这一层需要完成ChromeTab到FancyTree的映射模型
 * 兴许以后还能用来抽象出interface做其他浏览器实现？好了，别做梦了...赶紧干活...
 */
import _ from 'lodash';
import type { Tabs, Windows } from 'webextension-polyfill';

import * as TabNodes from '../logic/tab-nodes';
import { BrowserExtensionUtils, FancyTreeUtils, NodeUtils } from '../logic/utils';
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
    // TODO 若包含note的节点在浏览器关闭时也不做删除处理
    // 2. 状态为closed的节点不做删除
    if (toRemoveNode.data.closed === true) {
        return;
    }
    // 3. 若保留子元素则提升children作为siblings
    reserveChildren && NodeUtils.moveChildrenAsNextSiblings(toRemoveNode);
    const children = toRemoveNode.children ? _.clone(toRemoveNode.children) : null;
    if (reserveChildren && !!children) {
        // reverse children保证元素顺序
        children.reverse().forEach((node) => node.moveTo(toRemoveNode, 'after'));
    }
    // 4. 删除节点
    if (toRemoveNode) toRemoveNode.remove();
};
/** 更新节点: 更新内容但没有移动窗口 */
export const updateNode = (tree: Fancytree.Fancytree, updatedTab: Tabs.Tab) => {
    const toUpdateNode = tree.getNodeByKey(`${updatedTab.id!}`);
    if (toUpdateNode) WindowNodes.updateFancyTreeNode(toUpdateNode, updatedTab);
};
/** 移动节点 */
export const moveNode = async (
    tree: Fancytree.Fancytree,
    windowId: number,
    fromIndex: number,
    toIndex: number,
    tabId: number,
) => {
    // 1. 重置当前windowId下元素元素的index属性
    const tabId2Index = await BrowserExtensionUtils.getTabId2Index(windowId);
    FancyTreeUtils.resetNodeIndex(tree, windowId, tabId2Index);
    const windowNode = tree.getNodeByKey(String(windowId));
    const tabNode = tree.getNodeByKey(`${tabId}`);
    if (!tabNode) {
        // Trick: 适配tab添加到window时attach->move事件链中，调用move时tabNode可能尚未创建完毕
        // 可能死循环？
        setTimeout(() => {
            moveNode(tree, windowId, fromIndex, toIndex, tabId);
        }, 1);
    }
    // TODO [text-node-ignore] 暂时没考虑其他node类型的情况
    // 2. 被移动元素有children，将children移动为toMoveNode的siblings
    NodeUtils.moveChildrenAsNextSiblings(tabNode);
    // 3. 如果toMove元素没有兄弟节点，则将其提升为parent的sibling
    if (tabNode.isFirstSibling() && tabNode.isLastSibling()) {
        tabNode.moveTo(tabNode.parent, 'after');
    }
    // 4. 对windowId下所有元素做重排序
    windowNode.sortChildren((next, prev) => {
        return next.data.index > prev.data.index ? 1 : -1;
    }, true);
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
