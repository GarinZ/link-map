import type { Tabs, Windows } from 'webextension-polyfill';
import browser from 'webextension-polyfill';

import { DND5_CONFIG } from './configs';
import type { TreeData, TreeNode } from './nodes/nodes';
import { TabNodeOperations } from './nodes/tab-node-operations';
import { WindowNodeOperations } from './nodes/window-node-operations';
import { ViewTabIndexUtils } from './tab-index-utils';
import TreeNodeTpl, { TPL_CONSTANTS } from './templates/tree-node-tpl';
import { NodeUtils } from './utils';

const { TYPE_ATTR, NODE_CLOSE, NODE_REMOVE } = TPL_CONSTANTS;

type FancytreeNode = Fancytree.FancytreeNode;

/**
 * Tab-Master Tree 基于fancytree的实现
 * 以后如果有其他实现可以抽象一个interface
 * 处理浏览器模型到fancytree模型的转换
 */
export class FancyTabMasterTree {
    tree: Fancytree.Fancytree;
    static closeNodes: (targetNode: FancytreeNode, updateClosed?: boolean) => void;
    static onClick: (event: JQueryEventObject, data: Fancytree.EventData) => boolean;
    static onDbClick: (targetNode: FancytreeNode) => Promise<void>;
    static reopenWindow: (windowNode: FancytreeNode) => void;
    static createWindowNodeAsParent: (childNode: FancytreeNode) => void;

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
            dblclick: (_event, data) => {
                FancyTabMasterTree.onDbClick(data.node);
                return false;
            },
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
        // TabNode存在则不再创建：UI Event会触发onCreate回调，需要流程是可重入的
        const targetNode = this.tree.getNodeByKey(`${tab.id}`);
        if (targetNode) return targetNode;
        const newNodeData = TabNodeOperations.createData(tab);
        return TabNodeOperations.add(this.tree, newNodeData, tab.active);
    }

    public createWindow(window: Windows.Window): FancytreeNode {
        // WindowNode存在则不再创建：UI Event会触发onCreate回调，需要流程是可重入的
        const targetNode = this.tree.getNodeByKey(`${window.id}`);
        if (targetNode) return targetNode;
        return this.tree.getRootNode().addNode(WindowNodeOperations.createData(window));
    }

    public activeTab(windowId: number, tabId: number): void {
        // devtools的windowId为-1，不做处理
        const tabNode = this.tree.getNodeByKey(`${tabId}`);
        if (windowId < 0 || !tabNode) return;
        TabNodeOperations.updatePartial(this.tree.getNodeByKey(`${tabId}`), { active: true });
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
        const prevOpenedTabNode = windowNode.findFirst(
            (node) => node.data.index === toIndex - 1 && !node.data.closed,
        );
        const nextOpenedTabNodeChild = prevOpenedTabNode.findFirst(
            (node) => node.data.nodeType === 'tab' && !node.data.closed,
        );
        nextOpenedTabNodeChild
            ? toMoveNode.moveTo(nextOpenedTabNodeChild, 'before')
            : toMoveNode.moveTo(prevOpenedTabNode, 'after');
    }

    public async removeTab(tabId: number): Promise<void> {
        const toRemoveNode = this.tree.getNodeByKey(`${tabId}`);
        if (!toRemoveNode) return;
        const windowId = toRemoveNode.data.windowId;
        TabNodeOperations.remove(this.tree, toRemoveNode);
        await this.syncActiveTab(windowId);
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
    }

    public detachTab(tabId: number): void {
        this.removeTab(tabId);
    }

    public replaceTab(addedTabId: number, removedTabId: number): void {
        throw new Error(`replaceTab Method not implemented. ${addedTabId} ${removedTabId}`);
    }

    public removeWindow(windowId: number): void {
        const toRemoveNode = this.tree.getNodeByKey(`${windowId}`);
        WindowNodeOperations.remove(toRemoveNode);
    }

    public async windowFocus(windowId: number): Promise<void> {
        // devtools的windowId为-1，不做处理
        if (windowId < 0) return;
        const windowNode = this.tree.getNodeByKey(`${windowId}`);
        windowNode.scrollIntoView();
    }

    public toJsonObj(includeRoot = false): TreeNode<TreeData>[] {
        return this.tree.toDict(includeRoot);
    }

    private async syncActiveTab(windowId: number): Promise<void> {
        const tabs = await browser.tabs.query({ windowId, active: true });
        if (tabs.length === 0) return;
        const activeTab = tabs[0];
        this.activeTab(windowId, activeTab.id!);
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
            console.log('[tree]: close button clicked');
            FancyTabMasterTree.closeNodes(data.node);
            break;
        case NODE_REMOVE:
            console.log('[tree]: remove button clicked');
            FancyTabMasterTree.closeNodes(data.node, false);
            break;
    }
    return true;
};

FancyTabMasterTree.onDbClick = async (targetNode: FancytreeNode): Promise<void> => {
    const tree = targetNode.tree;
    if (targetNode.data.nodeType === 'tab') {
        // 1. 如果TabNode是打开状态，直接激活
        if (!targetNode.data.closed) {
            await browser.tabs.update(targetNode.data.id, { active: true });
            await browser.windows.update(targetNode.data.windowId, { focused: true });
            return;
        }
        // 2. TabNode关闭
        const windowNode = tree.getNodeByKey(`${targetNode.data.windowId}`);
        const { url } = targetNode.data;
        if (!windowNode) {
            // 2.1 如果没有WindowNode，创建一个
            const newWindow = await browser.windows.create(
                WindowNodeOperations.buildCreateWindowProps(url),
            );
            const newWindowNode = targetNode.addNode(
                WindowNodeOperations.createData(newWindow, false),
                'before',
            );
            targetNode.moveTo(newWindowNode, 'firstChild');
            TabNodeOperations.updatePartial(targetNode, { ...newWindow.tabs![0], closed: false });
            // TODO 这里还需要修改所有subTabNode的windowId
            newWindowNode.setExpanded(true);
        } else if (windowNode.data.closed) {
            // 2.2 WindowNode存在 && 关闭  => 打开WindowNode
            const newWindow = await browser.windows.create(
                WindowNodeOperations.buildCreateWindowProps(url, windowNode),
            );
            // 这里还需要修改所有subTabNode的windowId
            WindowNodeOperations.findAllSubTabNodes(windowNode).forEach((tabNode) => {
                tabNode.data.windowId = newWindow.id!;
            });
            WindowNodeOperations.updatePartial(windowNode, newWindow);
            TabNodeOperations.updatePartial(targetNode, newWindow.tabs![0]);
            targetNode.data.closed = false;
            targetNode.renderTitle();
            windowNode.data.closed = false;
            windowNode.renderTitle();
        } else {
            // 2.3 WindowNode存在 && 打开 => 创建TabNode
            const prevOpenedTabNode = NodeUtils.getPrevOpenedTabNode(targetNode);
            const index = prevOpenedTabNode ? prevOpenedTabNode.data.index + 1 : 0;
            ViewTabIndexUtils.increaseIndex(tree, windowNode.data.id, index);
            const newTab = await browser.tabs.create({ url, windowId: windowNode.data.id, index });
            // TODO 修改前后的index值
            TabNodeOperations.updatePartial(targetNode, newTab);
            targetNode.data.closed = false;
            targetNode.renderTitle();
        }
    } else if (targetNode.data.nodeType === 'window') {
        // 1. 如果WindowNode是打开状态，直接激活
        if (!targetNode.data.closed) {
            await browser.windows.update(targetNode.data.id, { focused: true });
            return;
        }
        // 2. WindowNode关闭
        const { windowId } = targetNode.data;
        const subTabNodes = targetNode.findAll(
            (node) => node.data.nodeType === 'tab' && node.data.windowId === windowId,
        );
        const urlList = subTabNodes.map((item) => item.data.url);
        const newWindow = await browser.windows.create(
            WindowNodeOperations.buildCreateWindowProps(urlList, targetNode),
        );
        WindowNodeOperations.updatePartial(targetNode, newWindow);
        newWindow.tabs!.forEach((tab, index) => {
            TabNodeOperations.updatePartial(subTabNodes[index], tab);
            subTabNodes[index].data.closed = false;
            subTabNodes[index].renderTitle();
        });
        targetNode.data.closed = false;
        targetNode.renderTitle();
    }
};

/**
 * 关闭节点
 */
FancyTabMasterTree.closeNodes = (targetNode: FancytreeNode, updateClosed = true) => {
    // 1. 更新tabNodes的closed状态
    const closedTabNodes = TabNodeOperations.close(targetNode, updateClosed);
    // 2. 更新windowNodes的closed状态
    const windowIdSet = new Set<number>();
    const tabIdSet = new Set<number>();
    closedTabNodes.forEach((node) => {
        windowIdSet.add(node.data.windowId);
        tabIdSet.add(node.data.id);
    });
    if (updateClosed) {
        WindowNodeOperations.close(targetNode.tree, windowIdSet);
    }
    tabIdSet.size > 0 && browser.tabs.remove([...tabIdSet]);
    // close状态修改的TabNode对应的WindowNode需要更新其closed值
};

FancyTabMasterTree.reopenWindowNode = (windowNode: FancytreeNode): void => {};

FancyTabMasterTree.createWindowNodeAsParent = async (tabNode: FancytreeNode): Promise<void> => {
    const { url, windowId: prevWindowId } = tabNode.data;
    const newWindow = await browser.windows.create(
        WindowNodeOperations.buildCreateWindowProps(url),
    );
    const newWindowNode = tabNode.addNode(
        WindowNodeOperations.createData(newWindow, false),
        'before',
    );
    tabNode.moveTo(newWindowNode, 'firstChild');
    TabNodeOperations.updatePartial(tabNode, { ...newWindow.tabs![0], closed: false });
};
