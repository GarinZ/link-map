/**
 * Chrome Tab => Tree的操作，注意这一层放的是Chrome的实现
 * 用于处理tab-tree的各种操作，* 这一层需要完成ChromeTab到FancyTree的映射模型
 * 兴许以后还能用来抽象出interface做其他浏览器实现？好了，别做梦了...赶紧干活...
 */
import _ from 'lodash';
import type { Tabs, Windows } from 'webextension-polyfill';

import { ViewTabIndexUtils } from '../logic/tab-index-utils';
import * as TabNodes from '../logic/tab-nodes';
import { BrowserExtensionUtils, FancyTreeUtils, NodeUtils } from '../logic/utils';
import * as WindowNodes from '../logic/window-nodes';

/** 根据Tab创建Node */
export const addNodeFromTab = async (tree: Fancytree.Fancytree, newTab: Tabs.Tab) => {
    const newNode = TabNodes.create(newTab);
    if (newTab.windowId === undefined) throw new Error('Tab must have an id');
    const windowNode = tree.getNodeByKey(`${newTab.windowId}`);
    // 1. 先根据index - 1找到前一个节点
    const prevNode = windowNode.findFirst((node) => node.data.index === newTab.index - 1);
    // 2. 如果index - 1不存在，说明是第一个节点，直接添加为windowNode的子节点
    if (prevNode === null) {
        windowNode.addNode(newNode, 'child');
        return;
    }
    ViewTabIndexUtils.increaseIndex(tree, windowNode.data.id, newTab.index);
    // 3. 判断该节点的id和openerTabId是否相等
    if (prevNode.data.id === newTab.openerTabId) {
        // 3.1 如果相等，说明是openerTab的子节点，直接添加为openerTab的子节点
        prevNode.addNode(newNode, 'child');
    } else if (!prevNode.data.openerTabId || prevNode.data.openerTabId === newTab.openerTabId) {
        // 3.2 prevNode有opernerTabId，但是不等于newTab的openerTabId，说明newTab是prevNode的兄弟节点
        prevNode.addNode(newNode, 'after');
    } else {
        // 3.3 都不是则为新建
        windowNode.addChildren(newNode);
    }

    windowNode.visit((item) => console.log(`${item.data.index}-${item.title}`));
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
