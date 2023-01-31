import type { Tabs } from 'webextension-polyfill';

import { ViewTabIndexUtils } from '../tab-index-utils';
import { NodeUtils } from '../utils';
import type { TreeData, TreeNode } from './nodes';
import { WindowNodeOperations } from './window-node-operations';

type FancytreeNode = Fancytree.FancytreeNode;

export interface TabData extends Tabs.Tab, TreeData {
    windowId: number;
    nodeType: 'tab';
    moved?: boolean; // 用于拖拽后设置的flag，避免回调再次move一次
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
        const prevNode = windowNode.findFirst(
            (node) => node.data.index === index - 1 && !node.data.closed,
        );
        ViewTabIndexUtils.increaseIndex(tree, windowNode.data.id, index);
        // 2. 如果index - 1不存在，说明是第一个节点，直接添加为windowNode的子节点
        let createdNode = null;
        if (prevNode === null) {
            createdNode = windowNode.addNode(newNode, 'firstChild');
        } else if (prevNode.data.id === openerTabId) {
            // 3.1 如果相等，说明是openerTab的子节点，直接添加为openerTab的子节点
            createdNode = prevNode.addNode(newNode, 'firstChild');
        } else if (!prevNode.data.openerTabId || prevNode.data.openerTabId === openerTabId) {
            // 3.2 prevNode有openerTabId，但是不等于newTab的openerTabId，说明newTab是prevNode的兄弟节点
            createdNode = prevNode.addNode(newNode, 'after');
        } else {
            // 3.3 都不是则为新建
            createdNode = windowNode.addChildren(newNode);
        }
        if (active) {
            this.updatePartial(createdNode, { active: true });
        }
        return createdNode;
    },
    removeItem(toRemoveNode: FancytreeNode, force = false): number | null {
        // 1. 状态为closed的节点不做删除
        if (toRemoveNode && !force && !NodeUtils.canRemove(toRemoveNode)) return null;
        // 2. 保留子元素：提升children作为siblings
        NodeUtils.moveChildrenAsNextSiblings(toRemoveNode);
        // 3. 删除节点
        const windowNode = this.findWindowNode(toRemoveNode);
        if (windowNode) {
            ViewTabIndexUtils.decreaseIndex(
                windowNode.tree,
                windowNode.data.id,
                toRemoveNode.data.index,
            );
        }
        const removedOpenedTabId = toRemoveNode.data.closed ? null : toRemoveNode.data.id;
        toRemoveNode.remove();
        // 4. 更新windowNode的closed状态
        if (windowNode) WindowNodeOperations.updateClosedStatus(windowNode);
        return removedOpenedTabId;
    },
    updatePartial(toUpdateNode: FancytreeNode, updateProps: Partial<TabData>) {
        const { title, favIconUrl, id, active, closed } = updateProps;
        toUpdateNode.data = { ...toUpdateNode.data, ...updateProps };
        if (id) toUpdateNode.key = `${id}`;
        if (title) toUpdateNode.setTitle(title);
        if (favIconUrl) toUpdateNode.icon = favIconUrl;
        if (closed !== undefined) {
            toUpdateNode.renderTitle();
        }
        if (active) {
            // 设置tab的tab-active，并关闭其他tab的tab-active
            toUpdateNode.data.tabActive = true;
            toUpdateNode.addClass('tab-active');
            toUpdateNode.tree.getNodeByKey(`${toUpdateNode.data.windowId}`).visit((node) => {
                if (node.key !== toUpdateNode.key) {
                    node.data.tabActive = false;
                    node.removeClass('tab-active');
                }
            });
        }
    },
    getToCloseTabNodes(fromNode: FancytreeNode): FancytreeNode[] {
        const toCloseTabNodes: FancytreeNode[] = [];
        const expanded = fromNode.expanded === undefined || fromNode.expanded;
        if (expanded && fromNode.data.nodeType === 'tab' && !fromNode.data.closed) {
            toCloseTabNodes.push(fromNode);
        } else if (expanded && fromNode.data.nodeType === 'window') {
            fromNode.visit((node) => {
                const { nodeType, windowId } = node.data;
                // 2.1 同window下的tab需要手动关闭，非同window下的tab通过onWindowRemoved回调关闭
                if (
                    nodeType === 'tab' &&
                    windowId === fromNode.data.windowId &&
                    !node.data.closed
                ) {
                    toCloseTabNodes.push(node);
                }
                return true;
            });
        } else {
            // 2. node合起：关闭下面所有tab节点
            fromNode.visit((node) => {
                const { nodeType } = node.data;
                // 2.1 同window下的tab需要手动关闭，非同window下的tab通过onWindowRemoved回调关闭
                if (nodeType === 'tab' && !node.data.closed) {
                    toCloseTabNodes.push(node);
                }
                return true;
            }, true);
        }
        return toCloseTabNodes;
    },
    findWindowNode(targetNode: FancytreeNode): FancytreeNode | null {
        if (targetNode.data.nodeType === 'window') throw new Error('targetNode is window node');
        let windowNode = null;
        targetNode.visitParents((parent) => {
            if (parent.data.nodeType === 'window') {
                windowNode = parent;
                return false;
            }
            return true;
        });
        return windowNode;
    },
    findPrevOpenedTabNode(
        tabNode: Fancytree.FancytreeNode,
        windowId?: number,
    ): Fancytree.FancytreeNode | null {
        if (tabNode.data.nodeType === 'window') throw new Error('targetNode is window node');
        const windowNode = tabNode.tree.getNodeByKey(`${windowId ?? tabNode.data.windowId}`);
        if (!windowNode) return null;
        let prevNode = null;
        windowNode.visit((n) => {
            if (n === tabNode) return false;
            if (n.data.nodeType === 'tab' && !n.data.closed) prevNode = n;
            return true;
        });
        return prevNode;
    },
    /** 兼容同窗口/跨窗口移动 */
    move(toMoveNode: FancytreeNode, fromIndex: number, toIndex: number, toWindowId?: number): void {
        // 1. 更新index和属性
        let targetWindowNode = toMoveNode.tree.getNodeByKey(`${toMoveNode.data.windowId}`);
        if (toWindowId) {
            const oldWindowId = toMoveNode.data.windowId;
            targetWindowNode = toMoveNode.tree.getNodeByKey(`${toWindowId}`);
            ViewTabIndexUtils.increaseIndex(toMoveNode.tree, toWindowId, toIndex);
            ViewTabIndexUtils.decreaseIndex(toMoveNode.tree, oldWindowId, fromIndex);
            this.updatePartial(toMoveNode, { windowId: toWindowId, index: toIndex });
        } else {
            toMoveNode.data.index = fromIndex;
            ViewTabIndexUtils.changeIndex(
                toMoveNode.tree,
                targetWindowNode.data.id,
                fromIndex,
                toIndex,
            );
        }
        // 这里兼容拖拽，不再做节点移动
        if (toMoveNode.data.moved) {
            this.updatePartial(toMoveNode, { moved: false });
            return;
        }
        // 2. 移动节点
        NodeUtils.moveChildrenAsNextSiblings(toMoveNode);
        if (toIndex === 0) {
            toMoveNode.moveTo(targetWindowNode, 'firstChild');
            return;
        }
        const prevOpenedTabNode = targetWindowNode.findFirst(
            (node) =>
                node.data.nodeType === 'tab' &&
                node.data.index === toIndex - 1 &&
                !node.data.closed,
        );
        const nextOpenedTabNodeChild = prevOpenedTabNode.findFirst(
            (node) => node.data.nodeType === 'tab' && !node.data.closed,
        );
        nextOpenedTabNodeChild
            ? toMoveNode.moveTo(nextOpenedTabNodeChild, 'before')
            : toMoveNode.moveTo(prevOpenedTabNode, 'after');
    },
    remove(targetNode: FancytreeNode): number[] {
        if (targetNode.data.nodeType !== 'tab') throw new Error('targetNode is not tab node');
        // 1. 节点展开，就删除单个tabNode
        if (targetNode.expanded) {
            const removedOpenedTabId = this.removeItem(targetNode, true);
            return removedOpenedTabId ? [removedOpenedTabId] : [];
        }
        // 2. 节点合起
        // 2.1. 记录所有open状态的tabNode
        const windowNode = TabNodeOperations.findWindowNode(targetNode);
        const removedOpenedTabIds: number[] = [];
        targetNode.visit((node) => {
            const { nodeType, closed, id, index } = node.data;
            if (nodeType === 'tab' && !closed) {
                removedOpenedTabIds.push(id);
                if (windowNode && id === targetNode.data.id) {
                    // TODO 这里由windowNode重新计算比较好
                    ViewTabIndexUtils.decreaseIndex(windowNode.tree, windowNode.data.id, index);
                }
            }
        }, true);
        // 2.2. 更新windowNode状态
        targetNode.remove();
        if (windowNode) WindowNodeOperations.updateClosedStatus(windowNode);
        return removedOpenedTabIds;
    },
};
