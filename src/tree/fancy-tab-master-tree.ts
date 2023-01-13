import type { Tabs, Windows } from 'webextension-polyfill';
import browser from 'webextension-polyfill';

import TreeNodeTpl, { TPL_CONSTANTS } from '../templates/tree-node-tpl';
import { DND5_CONFIG } from './configs';
import * as TabNodes from './node-builders';
import { createWindowNode } from './node-builders';
import type { NodeType, TreeData, TreeNode } from './nodes';
import { ViewTabIndexUtils } from './tab-index-utils';
import { NodeUtils } from './utils';

type Tab = Tabs.Tab;

const { TYPE_ATTR, NODE_CLOSE } = TPL_CONSTANTS;

type FancytreeNode = Fancytree.FancytreeNode;

/**
 * Tab-Master Tree 基于fancytree的实现
 * 处理浏览器模型到fancytree模型的转换
 */
export class FancyTabMasterTree implements TabMasterTree<FancytreeNode> {
    tree: Fancytree.Fancytree;

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
            click: onClick,
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
        const nodes = windows.map((w) => createWindowNode(w));
        this.tree.reload(nodes);
    }

    public createTab(tab: Tabs.Tab): FancytreeNode {
        const newNode = TabNodes.createTabNode(tab);
        if (tab.windowId === undefined) throw new Error('Tab must have an id');
        const windowNode = this.tree.getNodeByKey(`${tab.windowId}`);
        // 1. 先根据index - 1找到前一个节点
        const prevNode = windowNode.findFirst((node) => node.data.index === tab.index - 1);
        ViewTabIndexUtils.increaseIndex(this.tree, windowNode.data.id, tab.index);
        // 2. 如果index - 1不存在，说明是第一个节点，直接添加为windowNode的子节点
        if (prevNode === null) {
            return windowNode.addNode(newNode, 'firstChild');
        }
        // 3. 判断该节点的id和openerTabId是否相等
        if (prevNode.data.id === tab.openerTabId) {
            // 3.1 如果相等，说明是openerTab的子节点，直接添加为openerTab的子节点
            return prevNode.addNode(newNode, 'child');
        } else if (!prevNode.data.openerTabId || prevNode.data.openerTabId === tab.openerTabId) {
            // 3.2 prevNode有openerTabId，但是不等于newTab的openerTabId，说明newTab是prevNode的兄弟节点
            return prevNode.addNode(newNode, 'after');
        } else {
            // 3.3 都不是则为新建
            return windowNode.addChildren(newNode);
        }
    }

    public createWindow(window: Windows.Window): FancytreeNode {
        const rootNode = this.tree.getRootNode();
        return rootNode.addNode(createWindowNode(window));
    }

    public activeTab(tabId: number): void {
        const targetNode = this.tree.getNodeByKey(`${tabId}`);
        if (!targetNode) return;
        this.updateTabNodePartial(targetNode, { active: true });
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
        const nextNode = prevNode.findFirst((node) => node.data.type === 'tab');
        nextNode ? toMoveNode.moveTo(nextNode, 'before') : toMoveNode.moveTo(prevNode, 'after');
    }

    public removeTab(tabId: number): void {
        // 1. 当删除当前节点时，保留子节点
        const toRemoveNode = this.tree.getNodeByKey(`${tabId}`);
        // 2. 状态为closed的节点不做删除
        if (toRemoveNode.data.closed === true) return;
        // 3. 若保留子元素则提升children作为siblings
        NodeUtils.moveChildrenAsNextSiblings(toRemoveNode);
        // 4. 删除节点
        const windowNode = this.tree.getNodeByKey(`${toRemoveNode.data.windowId}`);
        ViewTabIndexUtils.decreaseIndex(this.tree, windowNode.data.id, toRemoveNode.data.index);
        if (toRemoveNode) toRemoveNode.remove();
    }

    public updateTab(tab: Tabs.Tab): void {
        const toUpdateNode = this.tree.getNodeByKey(`${tab.id!}`);
        if (!toUpdateNode) return;
        this.updateTabNodePartial(toUpdateNode, tab);
    }

    public async attachTab(windowId: number, tabId: number, fromIndex: number): Promise<void> {
        const tab = await browser.tabs.get(tabId);
        this.createTab(tab);
        this.moveTab(windowId, tabId, fromIndex, tab.index);
        this.activeTab(tabId);
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
        const focusWindow = this.tree.getNodeByKey(`${windowId}`);
        focusWindow.findFirst((node) => node.data.active)?.setActive();
    }

    public toJsonObj(includeRoot = false): TreeNode<TreeData> {
        return this.tree.toDict(includeRoot);
    }

    private updateTabNodePartial(toUpdateNode: FancytreeNode, updateProps: Partial<Tabs.Tab>) {
        const { title, favIconUrl, active } = updateProps;
        if (title) toUpdateNode.setTitle(title);
        if (favIconUrl) toUpdateNode.icon = favIconUrl;
        if (active) {
            toUpdateNode.data.tabActive = active;
            toUpdateNode.setActive(active);
        }
        const restValidKeys: (keyof Tab)[] = ['status', 'url', 'discarded'];
        restValidKeys.forEach((k) => {
            if (updateProps[k]) toUpdateNode.data[k] = updateProps[k];
        });
    }
}

function renderTitle(_eventData: JQueryEventObject, data: Fancytree.EventData): string {
    const treeNode = new TreeNodeTpl(data.node);
    return treeNode.html;
}

function onClick(event: JQueryEventObject, data: Fancytree.EventData): boolean {
    const target = $(event.originalEvent.target as Element);
    if (!target.attr(TYPE_ATTR)) return true;

    switch (target.attr(TYPE_ATTR)) {
        case NODE_CLOSE:
            closeNodes(event, data);
            break;
    }
    return true;
}

/**
 * 关闭节点
 * TODO 现在的处理方式是，如果是window节点，那么就关闭其下面的所有的tab
 * 更好的方式是，如果是window节点，直接关闭window，不管其下面的tab
 * @param _event
 * @param data
 */
function closeNodes(_event: JQueryEventObject, data: Fancytree.EventData) {
    const targetNode = data.node;
    const nodeType: NodeType = targetNode.data.type;
    const operatedNodes = [];
    if (targetNode.expanded === undefined || targetNode.expanded === true) {
        // 1. node展开：只处理头节点
        if (nodeType === 'window') {
            targetNode.visit((node) => {
                if (node.data.windowId === targetNode.data.id) {
                    node.data.closed = true;
                    operatedNodes.push(node);
                }
            }, true);
            browser.windows.remove(targetNode.data.id);
        } else if (nodeType === 'tab') {
            targetNode.data.closed = true;
            browser.tabs.remove(targetNode.data.id);
            operatedNodes.push(targetNode);
        } else {
            throw new Error('invalid node type');
        }
    } else {
        // 2. node合起：处理尾节点
        const toRemovedTabIds: number[] = [];
        targetNode.visit((node) => {
            // 2.2 对每个node.data.close === true
            if ('closed' in node.data) {
                node.data.closed = true;
                operatedNodes.push(node);
            }
            if (node.data.type === 'tab' && closed === false) {
                toRemovedTabIds.push(node.data.id);
            }
        }, true);
        // 2.3 调用tabs.remove方法(批量)
        browser.tabs.remove(toRemovedTabIds);
    }
    operatedNodes.forEach((node) => node.renderTitle());
}
