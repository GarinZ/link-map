import type { Tabs, Windows } from 'webextension-polyfill';
import browser from 'webextension-polyfill';

import { DND5_CONFIG } from './configs';
import type { NodeType, TreeData, TreeNode } from './nodes/nodes';
import { TabNodeOperations } from './nodes/tab-node-operations';
import { WindowNodeOperations } from './nodes/window-node-operations';
import { ViewTabIndexUtils } from './tab-index-utils';
import TreeNodeTpl, { TPL_CONSTANTS } from './templates/tree-node-tpl';
import { NodeUtils } from './utils';

const { TYPE_ATTR, NODE_CLOSE } = TPL_CONSTANTS;

type FancytreeNode = Fancytree.FancytreeNode;

/**
 * Tab-Master Tree 基于fancytree的实现
 * 以后如果有其他实现可以抽象一个interface
 * 处理浏览器模型到fancytree模型的转换
 */
export class FancyTabMasterTree {
    tree: Fancytree.Fancytree;
    static closeNodes: (targetNode: FancytreeNode) => void;
    static onClick: (event: JQueryEventObject, data: Fancytree.EventData) => boolean;
    static onDbClick: (event: JQueryEventObject, data: Fancytree.EventData) => boolean;

    constructor(selector: JQuery.Selector = '#tree') {
        $(selector).fancytree({
            active: true,
            extensions: ['dnd5', 'childcounter'],
            source: [{ title: 'pending' }],
            childcounter: {
                deep: true,
                hideZeros: true,
                hideExpanded: true,
            },
            // activate: onActivated,
            renderNode(_event, data) {
                data.node.renderTitle();
            },
            renderTitle,
            click: FancyTabMasterTree.onClick,
            dblclick: FancyTabMasterTree.onDbClick,
            defaultKey: (node) => `${node.data.id}`,
            dnd5: DND5_CONFIG,
        });
        this.tree = $.ui.fancytree.getTree('#tree');
    }

    public async initTree(source?: TreeNode<TreeData>[]) {
        if (source) {
            this.tree.reload(source);
            return;
        }
        const browserWindowPromise = await browser.windows.getAll({ populate: true });
        const unknown = browserWindowPromise as unknown;
        const windows = unknown as Windows.Window[];
        const nodes = windows.map((w) => WindowNodeOperations.createData(w));
        this.tree.reload(nodes);
    }

    public createTab(tab: Tabs.Tab): FancytreeNode {
        const newNode = TabNodeOperations.createData(tab);
        return TabNodeOperations.add(this.tree, newNode, tab.active);
    }

    public createWindow(window: Windows.Window): FancytreeNode {
        return this.tree.getRootNode().addNode(WindowNodeOperations.createData(window));
    }

    public activeTab(windowId: number, tabId: number): void {
        // devtools的windowId为-1，不做处理
        if (windowId < 0) return;
        TabNodeOperations.active(this.tree, tabId);
        WindowNodeOperations.updatePartial(this.tree, windowId, { activeTabId: tabId });
    }

    public moveTab(windowId: number, tabId: number, fromIndex: number, toIndex: number): void {
        if (toIndex === fromIndex) return;
        const windowNode = this.tree.getNodeByKey(String(windowId));
        const toMoveNode = this.tree.getNodeByKey(`${tabId}`);
        // attach时会竞态触发move事件，如果之前排序过就不要再排一次
        if (!toMoveNode || toMoveNode.data.index === toIndex) return;
        toMoveNode.data.index = fromIndex;
        // 2. 被移动元素有children，将children移动为toMoveNode的siblings
        NodeUtils.moveChildrenAsNextSiblings(toMoveNode);
        // 3. 重置所有节点的index
        ViewTabIndexUtils.changeIndex(this.tree, windowNode.data.id, fromIndex, toIndex);
        // 4. 移动节点
        if (toIndex === 0) {
            toMoveNode.moveTo(windowNode, 'firstChild');
            return;
        }
        const prevNode = windowNode.findFirst((node) => node.data.index === toIndex - 1);
        const nextNode = prevNode.findFirst((node) => node.data.nodeType === 'tab');
        nextNode ? toMoveNode.moveTo(nextNode, 'before') : toMoveNode.moveTo(prevNode, 'after');
    }

    public removeTab(tabId: number): void {
        const toRemoveNode = this.tree.getNodeByKey(`${tabId}`);
        // 1. 状态为closed的节点不做删除
        if (toRemoveNode.data.closed === true) return;
        TabNodeOperations.remove(this.tree, toRemoveNode);
    }

    public updateTab(tab: Tabs.Tab): void {
        const toUpdateNode = this.tree.getNodeByKey(`${tab.id!}`);
        if (!toUpdateNode) return;
        TabNodeOperations.updatePartial(toUpdateNode, tab);
    }

    public async attachTab(windowId: number, tabId: number, fromIndex: number): Promise<void> {
        const tab = await browser.tabs.get(tabId);
        this.createTab(tab);
        this.moveTab(windowId, tabId, fromIndex, tab.index);
        this.activeTab(windowId, tabId);
    }

    public detachTab(tabId: number): void {
        this.removeTab(tabId);
    }

    public replaceTab(addedTabId: number, removedTabId: number): void {
        throw new Error(`replaceTab Method not implemented. ${addedTabId} ${removedTabId}`);
    }

    public removeWindow(windowId: number): void {
        const toRemoveNode = this.tree.getNodeByKey(`${windowId}`);
        if (toRemoveNode) toRemoveNode.remove();
    }

    public windowFocus(windowId: number): void {
        // devtools的windowId为-1，不做处理
        if (windowId < 0) return;
        const focusWindow = this.tree.getNodeByKey(`${windowId}`);
        TabNodeOperations.active(this.tree, focusWindow.data.activeTabId, focusWindow);
    }

    public toJsonObj(includeRoot = false): TreeNode<TreeData>[] {
        return this.tree.toDict(includeRoot);
    }
}

function renderTitle(_eventData: JQueryEventObject, data: Fancytree.EventData): string {
    const treeNode = new TreeNodeTpl(data.node);
    return treeNode.html;
}

FancyTabMasterTree.onClick = (event: JQueryEventObject, data: Fancytree.EventData): boolean => {
    const target = $(event.originalEvent.target as Element);
    if (!target.attr(TYPE_ATTR)) return true;

    switch (target.attr(TYPE_ATTR)) {
        case NODE_CLOSE:
            FancyTabMasterTree.closeNodes(data.node);
            break;
    }
    return true;
};

FancyTabMasterTree.onDbClick = (_event: JQueryEventObject, _data: Fancytree.EventData): boolean => {
    // const targetNode = data.node;
    // 1. windowNode

    // 2. tabNode
    return true;
};

/**
 * 关闭节点
 * 更好的方式是，如果是window节点，直接关闭window，不管其下面的tab
 */
FancyTabMasterTree.closeNodes = (targetNode: FancytreeNode) => {
    const nodeType: NodeType = targetNode.data.nodeType;
    if (targetNode.expanded === undefined || targetNode.expanded) {
        // 1. node展开：只处理头节点
        if (nodeType === 'window') {
            WindowNodeOperations.closeItem(targetNode);
            targetNode.visit((node) => {
                if (node.data.nodeType === 'tab' && node.data.windowId === targetNode.data.windowId)
                    TabNodeOperations.closeItem(node);
            });
            browser.windows.remove(targetNode.data.id);
        } else if (nodeType === 'tab') {
            TabNodeOperations.closeItem(targetNode);
            browser.tabs.remove(targetNode.data.id);
        } else {
            throw new Error('invalid node type');
        }
    } else {
        // 2. node合起：处理子节点
        const toRemovedTabIds: number[] = [];
        const toRemoveWindowIds: number[] = [];

        targetNode.visit((node) => {
            const { nodeType, id, windowId } = node.data;
            // 2.1 同window下的tab需要手动关闭，非同window下的tab通过onWindowRemoved回调关闭
            if (nodeType === 'tab') {
                const result = TabNodeOperations.closeItem(node);
                if (result && windowId === targetNode.data.windowId) {
                    toRemovedTabIds.push(id);
                }
            } else if (nodeType === 'window') {
                WindowNodeOperations.closeItem(node) && toRemoveWindowIds.push(id);
            }
            return true;
        }, true);
        // 3. 调用window/tabs.remove方法(批量)
        browser.tabs.remove(toRemovedTabIds);
        toRemoveWindowIds.forEach((windowId) => browser.windows.remove(windowId));
    }
};
