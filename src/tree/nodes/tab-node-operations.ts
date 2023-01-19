import type { Tabs } from 'webextension-polyfill';

import { ViewTabIndexUtils } from '../tab-index-utils';
import { NodeUtils } from '../utils';
import type { TreeData, TreeNode } from './nodes';

type FancytreeNode = Fancytree.FancytreeNode;

export interface TabData extends Omit<Tabs.Tab, 'active'>, TreeData {
    windowId: number;
    nodeType: 'tab';
}

export const TabNodeOperations = {
    createData(tab: Tabs.Tab): TreeNode<TabData> {
        const { title, windowId, favIconUrl, id, openerTabId } = tab;
        if (windowId === undefined) throw new Error('windowId is required');
        if (id === undefined) throw new Error('id is required');

        return {
            title: title || '',
            key: `${id}`,
            icon: {
                // 直接写URL,会使用img标签渲染,导致childrenCounter不识别
                html: `<img class="fancytree-icon" src="${
                    favIconUrl || '/icons/chrome_icon.svg'
                }" alt="">`,
            },
            expanded: true,
            data: {
                ...tab,
                windowId,
                closed: false,
                parentId: openerTabId || windowId,
                nodeType: 'tab',
            },
        };
    },
    add(tree: Fancytree.Fancytree, newNode: TreeNode<TabData>, active: boolean): FancytreeNode {
        const { windowId, index, openerTabId } = newNode.data;
        const windowNode = tree.getNodeByKey(`${windowId}`);
        // 1. 先根据index - 1找到前一个节点
        const prevNode = windowNode.findFirst((node) => node.data.index === index - 1);
        ViewTabIndexUtils.increaseIndex(tree, windowNode.data.id, index);
        // 2. 如果index - 1不存在，说明是第一个节点，直接添加为windowNode的子节点
        let createdNode = null;
        if (prevNode === null) {
            createdNode = windowNode.addNode(newNode, 'firstChild');
        } else if (prevNode.data.id === openerTabId) {
            // 3.1 如果相等，说明是openerTab的子节点，直接添加为openerTab的子节点
            createdNode = prevNode.addNode(newNode, 'child');
        } else if (!prevNode.data.openerTabId || prevNode.data.openerTabId === openerTabId) {
            // 3.2 prevNode有openerTabId，但是不等于newTab的openerTabId，说明newTab是prevNode的兄弟节点
            createdNode = prevNode.addNode(newNode, 'after');
        } else {
            // 3.3 都不是则为新建
            createdNode = windowNode.addChildren(newNode);
        }
        if (active) {
            // WindowNodeOperations.updatePartial(tree, windowId, { activeTabId: id });
            createdNode.setActive(true);
        }
        return createdNode;
    },
    active(tree: Fancytree.Fancytree, id: number, windowNode?: FancytreeNode): void {
        try {
            const toActiveNode = tree.getNodeByKey(`${id}`, windowNode);
            if (!toActiveNode) return;
            toActiveNode.setActive();
        } catch (error) {
            console.log(error);
        }
        // WindowNodeOperations.updatePartial(tree, toActiveNode.data.windowId, {
        //     activeTabId: id,
        // });
    },
    remove(tree: Fancytree.Fancytree, toRemoveNode: FancytreeNode): void {
        // 1. 保留子元素：提升children作为siblings
        NodeUtils.moveChildrenAsNextSiblings(toRemoveNode);
        // 2. 删除节点
        const windowNode = tree.getNodeByKey(`${toRemoveNode.data.windowId}`);
        ViewTabIndexUtils.decreaseIndex(tree, windowNode.data.id, toRemoveNode.data.index);
        if (toRemoveNode) toRemoveNode.remove();
    },
    updatePartial(toUpdateNode: FancytreeNode, updateProps: Partial<TabData>) {
        const { title, favIconUrl } = updateProps;
        if (title) toUpdateNode.setTitle(title);
        if (favIconUrl) toUpdateNode.icon = favIconUrl;
        const restValidKeys: (keyof TabData)[] = ['status', 'url', 'discarded'];
        restValidKeys.forEach((k) => {
            if (updateProps[k]) toUpdateNode.data[k] = updateProps[k];
        });
    },
    closeItem(node: FancytreeNode): FancytreeNode | null {
        if (node.data.closed) return null;
        node.data.closed = true;
        node.renderTitle();
        return node;
    },
    /** 更新Tab的closed状态 */
    close(fromNode: FancytreeNode): FancytreeNode[] {
        // 只管更新targetNode自身及其子节点的closed状态
        const toCloseNodes: FancytreeNode[] = [];
        const expanded = fromNode.expanded === undefined || fromNode.expanded;
        if (expanded && fromNode.data.nodeType === 'tab') {
            // 只关闭当前tab节点
            const toCloseNode = TabNodeOperations.closeItem(fromNode);
            toCloseNode && toCloseNodes.push(toCloseNode);
        } else if (expanded && fromNode.data.nodeType === 'window') {
            fromNode.visit((node) => {
                const { nodeType, windowId } = node.data;
                // 2.1 同window下的tab需要手动关闭，非同window下的tab通过onWindowRemoved回调关闭
                if (nodeType === 'tab' && windowId === fromNode.data.windowId) {
                    const result = TabNodeOperations.closeItem(node);
                    result && toCloseNodes.push(result);
                }
                return true;
            }, true);
        } else {
            // 2. node合起：关闭下面所有tab节点
            fromNode.visit((node) => {
                const { nodeType } = node.data;
                // 2.1 同window下的tab需要手动关闭，非同window下的tab通过onWindowRemoved回调关闭
                if (nodeType === 'tab') {
                    const result = TabNodeOperations.closeItem(node);
                    result && toCloseNodes.push(result);
                }
                return true;
            }, true);
        }
        return toCloseNodes;
    },
};
