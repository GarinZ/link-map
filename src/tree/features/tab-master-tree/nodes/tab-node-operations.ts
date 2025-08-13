import { escape } from 'lodash';
import log from 'loglevel';
import type { Tabs } from 'webextension-polyfill';

import { getNewTabUrl } from '../../../../config/browser-adapter-config';
import { getFaviconUrl } from '../../../../utils';
import type { TreeData, TreeNode } from './nodes';
import { NodeUtils } from './utils';
import { WindowNodeOperations } from './window-node-operations';

type FancytreeNode = Fancytree.FancytreeNode;
const NEW_TAB_URL = getNewTabUrl();

export interface TabData extends Tabs.Tab, TreeData {
    windowId: number;
    nodeType: 'tab';
    dndOperated?: boolean; // 用于拖拽后设置的flag，避免回调再次move一次
    dndMovedTime?: number;
    tabActive: boolean;
}

export const TabNodeOperations = {
    createSimple(url: string, title: string, alias = ''): TreeNode<TabData> {
        const defaultTab = {
            title,
            url,
            windowId: 0,
            id: 0,
            active: false,
            favIconUrl: '',
            index: 0,
            pinned: false,
            openerTabId: 0,
            closed: true,
            nodeType: 'tab',
            tabActive: false,
            alias,
        } as TabData;

        return {
            title: escape(title),
            key: `${defaultTab.id}`,
            icon: {
                html: `<img class="fancytree-icon" src="${getFaviconUrl(url)}" alt="">`,
            },
            expanded: true,
            data: defaultTab,
        };
    },
    createData(tab: Tabs.Tab): TreeNode<TabData> {
        const { title, windowId, favIconUrl, id, active } = tab;
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
                nodeType: 'tab',
                tabActive: active,
            },
        };
    },
    add(
        tree: Fancytree.Fancytree,
        newNode: TreeNode<TabData>,
        active: boolean,
        _createNewTabByLevel = false,
    ): FancytreeNode {
        const { windowId, index, openerTabId, pendingUrl, url } = newNode.data;
        const windowNode = tree.getNodeByKey(`${windowId}`);
        // 优先：如果存在openerTab，则总是作为其子节点插入；
        // 否则，空白新标签优先作为当前激活标签的子节点
        const openerNode = openerTabId ? tree.getNodeByKey(`${openerTabId}`) : null;
        const isBlankNewTab = pendingUrl === NEW_TAB_URL || url === NEW_TAB_URL;
        const activeNode = windowNode.findFirst(
            (node) => node.data.nodeType === 'tab' && node.data.tabActive && !node.data.closed,
        );
        // 1. 先根据index - 1找到前一个节点（用于回退策略）
        const prevNode = windowNode.findFirst(
            (node) => node.data.index === index - 1 && !node.data.closed,
        );
        // 2. 插入规则：opener > 其他启发式
        let createdNode = null;
        if (openerNode) {
            createdNode = openerNode.addNode(newNode, 'firstChild');
        } else if (isBlankNewTab && activeNode) {
            // 空白页：总是作为当前激活tab的子节点
            createdNode = activeNode.addNode(newNode, 'firstChild');
        } else if (prevNode === null) {
            // 第一个节点
            createdNode = windowNode.addNode(newNode, 'firstChild');
        } else if (prevNode.data.id === openerTabId) {
            // 作为打开者的子节点
            createdNode = prevNode.addNode(newNode, 'firstChild');
        } else if (!prevNode.data.openerTabId || prevNode.data.openerTabId === openerTabId) {
            // 作为前一个节点的兄弟节点
            createdNode = prevNode.addNode(newNode, 'after');
        } else {
            // 回退：作为窗口的子节点
            createdNode = windowNode.addChildren(newNode);
        }
        if (active) {
            this.updatePartial(createdNode, { active: true });
        }
        WindowNodeOperations.updateWindowStatus(windowNode);
        createdNode.makeVisible();
        return createdNode;
    },
    removeItem(toRemoveNode: FancytreeNode, force = false): boolean {
        // 1. 状态为closed的节点不做删除
        if (toRemoveNode && !force && !NodeUtils.canRemove(toRemoveNode)) return false;
        // 2. 保留子元素：提升children作为siblings
        NodeUtils.moveChildrenAsNextSiblings(toRemoveNode);
        // 3. 删除节点
        const windowNode = this.findWindowNode(toRemoveNode);
        toRemoveNode.remove();
        if (windowNode) {
            // 4. 更新windowNode的closed状态，并重置index
            WindowNodeOperations.updateWindowStatus(windowNode);
        }
        return true;
    },
    updatePartial(toUpdateNode: FancytreeNode, updateProps: Partial<TabData>) {
        const { title, favIconUrl, id, active, closed, save } = updateProps;
        toUpdateNode.data = { ...toUpdateNode.data, ...updateProps };
        if (id) toUpdateNode.key = `${id}`;
        if (title) toUpdateNode.setTitle(title);
        if (favIconUrl) toUpdateNode.icon = favIconUrl;
        if (closed !== undefined) {
            closed ? toUpdateNode.addClass('closed') : toUpdateNode.removeClass('closed');
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
        } else if (active === false) {
            toUpdateNode.data.tabActive = false;
            toUpdateNode.removeClass('tab-active');
        } else if (save !== undefined) {
            save ? toUpdateNode.addClass('saved') : toUpdateNode.removeClass('saved');
        }
    },
    getToCloseTabNodes(fromNode: FancytreeNode, mode: 'item' | 'all'): FancytreeNode[] {
        const toCloseTabNodes: FancytreeNode[] = [];
        const isCloseItem = mode === 'item';
        if (isCloseItem && fromNode.data.nodeType === 'tab' && !fromNode.data.closed) {
            toCloseTabNodes.push(fromNode);
        } else if (isCloseItem && fromNode.data.nodeType === 'window') {
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
        } else if (!isCloseItem) {
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
        if (targetNode.data.nodeType === 'window') return targetNode;
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
    move(
        toMoveNode: FancytreeNode,
        _fromIndex: number,
        toIndex: number,
        toWindowId?: number,
    ): void {
        const tree = toMoveNode.tree;
        toWindowId = toWindowId ?? toMoveNode.data.windowId;
        const targetWindowNode = tree.getNodeByKey(`${toWindowId}`);
        // 1. 按需移动节点
        if (
            !toMoveNode.data.dndOperated &&
            (!toMoveNode.data.dndMovedTime || Date.now() - toMoveNode.data.dndMovedTime > 1000)
        ) {
            log.debug('callback move executed');
            if (toIndex === 0) {
                toMoveNode.moveTo(targetWindowNode, 'firstChild');
            } else {
                let prevOpenedTabNode = targetWindowNode.findFirst(
                    (node) =>
                        node.data.nodeType === 'tab' &&
                        node.data.index === toIndex - 1 &&
                        !node.data.closed,
                );
                if (prevOpenedTabNode.key === toMoveNode.key) {
                    // swap position
                    prevOpenedTabNode = targetWindowNode.findFirst(
                        (node) =>
                            node.data.nodeType === 'tab' &&
                            node.data.index === toIndex &&
                            !node.data.closed,
                    );
                }
                const nextOpenedTabNodeChild = prevOpenedTabNode.findFirst(
                    (node) => node.data.nodeType === 'tab' && !node.data.closed,
                );
                nextOpenedTabNodeChild
                    ? toMoveNode.moveTo(nextOpenedTabNodeChild, 'before')
                    : toMoveNode.moveTo(prevOpenedTabNode, 'after');
            }
        }
        const oldWindowId = toMoveNode.data.windowId;
        this.updatePartial(toMoveNode, { windowId: toWindowId });
        WindowNodeOperations.updateWindowStatus(targetWindowNode);
        // 同步更新目标窗口下所有子tab的windowId，确保保持树的层级时，子节点也更新windowId
        WindowNodeOperations.updateSubTabWindowId(targetWindowNode);
        // 2. 更新index和属性
        if (toWindowId) {
            const oldWindowNode = tree.getNodeByKey(`${oldWindowId}`);
            // 需要先更新windowId，否则会导致index计算错误
            WindowNodeOperations.updateWindowStatus(oldWindowNode);
        }
        // 重置moved属性
        this.updatePartial(toMoveNode, { dndOperated: false });
    },
};
