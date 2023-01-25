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
    static createWindowNodeAsParent: (
        tabNode: FancytreeNode,
        needCreateTab?: boolean,
        needUpdateTabProps?: boolean,
    ) => Promise<{ windowNode: FancytreeNode; window: Windows.Window }>;

    static reopenWindowNode: (
        windowNode: FancytreeNode,
        toOpenSubTabNodes: FancytreeNode[],
    ) => Promise<Windows.Window>;

    static openWindow: (
        toAddNode: FancytreeNode,
        mode: string,
        url: string | string[],
    ) => Promise<{ windowNode: FancytreeNode; window: Windows.Window }>;

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

    public moveTab(_windowId: number, tabId: number, fromIndex: number, toIndex: number): void {
        if (toIndex === fromIndex) return;
        const toMoveNode = this.tree.getNodeByKey(`${tabId}`);
        // attach时会竞态触发move事件，如果之前排序过就不要再排一次
        if (!toMoveNode || toMoveNode.data.index === toIndex) return;
        TabNodeOperations.move(toMoveNode, fromIndex, toIndex);
    }

    public async removeTab(tabId: number): Promise<void> {
        const toRemoveNode = this.tree.getNodeByKey(`${tabId}`);
        if (!toRemoveNode) return;
        const windowId = toRemoveNode.data.windowId;
        TabNodeOperations.remove(this.tree, toRemoveNode);
        // tab remove不会触发tab active事件，需要手动更新
        await this.syncActiveTab(windowId);
    }

    public updateTab(tab: Tabs.Tab): void {
        const toUpdateNode = this.tree.getNodeByKey(`${tab.id!}`);
        if (!toUpdateNode) return;
        TabNodeOperations.updatePartial(toUpdateNode, tab);
    }

    public attachTab(newWindowId: number, tabId: number, newIndex: number): void {
        const toAttachNode = this.tree.getNodeByKey(`${tabId}`);
        // attach/detach会触发active事件，不需要再次更新
        TabNodeOperations.move(toAttachNode, toAttachNode.data.index, newIndex, newWindowId);
    }

    public detachTab(_tabId: number): void {
        // this.removeTab(tabId);
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
            await FancyTabMasterTree.createWindowNodeAsParent(targetNode);
        } else if (windowNode.data.closed) {
            // 2.2 WindowNode存在 && 关闭  => 打开WindowNode和targetNode
            await FancyTabMasterTree.reopenWindowNode(windowNode, [targetNode]);
        } else {
            // 2.3 WindowNode存在 && 打开 => 创建TabNode
            const prevOpenedTabNode = TabNodeOperations.findPrevOpenedTabNode(targetNode);
            let index = 0;
            if (prevOpenedTabNode) {
                const flatTabNodes = NodeUtils.flatTabNodes(windowNode);
                index =
                    flatTabNodes.findIndex((node) => node.data.id === prevOpenedTabNode.data.id) +
                    1;
            }
            ViewTabIndexUtils.increaseIndex(tree, windowNode.data.id, index);
            const newTab = await browser.tabs.create({ url, windowId: windowNode.data.id, index });
            TabNodeOperations.updatePartial(targetNode, { ...newTab, closed: false });
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
        await FancyTabMasterTree.reopenWindowNode(targetNode, subTabNodes);
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

/** 打开windowNode和指定的subTabNodes */
FancyTabMasterTree.reopenWindowNode = async (
    windowNode: FancytreeNode,
    toOpenSubTabNodes: FancytreeNode[] = [],
    needUpdateTabProps = true,
): Promise<Windows.Window> => {
    if (!windowNode.data.closed) throw new Error('windowNode is not closed');
    const oldWindowId = windowNode.data.id;
    // 1. 打开window和tab
    const urlList = toOpenSubTabNodes.map((item) => item.data.url);
    const newWindow = await browser.windows.create(
        WindowNodeOperations.buildCreateWindowProps(urlList, windowNode),
    );
    // 2. 更新windowNode状态并更新其子节点
    WindowNodeOperations.updatePartial(windowNode, { ...newWindow, closed: false });
    if (needUpdateTabProps) {
        WindowNodeOperations.updateSubTabWindowId(windowNode, oldWindowId);
        toOpenSubTabNodes.forEach((tabNode, index) => {
            TabNodeOperations.updatePartial(tabNode, { ...newWindow.tabs![index], closed: false });
        });
    }
    return newWindow;
};

/** 创建新的window和windowNode，并将tabNode挂到其下面，更新子tab属性 */
FancyTabMasterTree.createWindowNodeAsParent = async (
    tabNode: FancytreeNode,
): Promise<{ windowNode: FancytreeNode; window: Windows.Window }> => {
    // 1. 创建window和windowNode
    const { url, windowId: oldWindowId } = tabNode.data;
    const { windowNode, window } = await FancyTabMasterTree.openWindow(tabNode, 'before', url);
    // 2. 将tabNode挂到windowNode下
    tabNode.moveTo(windowNode, 'firstChild');
    // 3. 更新TabNode属性和子tabNode的windowId
    TabNodeOperations.updatePartial(tabNode, { ...window.tabs![0], closed: false });
    WindowNodeOperations.updateSubTabWindowId(windowNode, oldWindowId);
    return { windowNode, window };
};

FancyTabMasterTree.openWindow = async (
    toAddNode: FancytreeNode,
    mode: string,
    url: string | string[],
): Promise<{ windowNode: FancytreeNode; window: Windows.Window }> => {
    const newWindow = await browser.windows.create(
        WindowNodeOperations.buildCreateWindowProps(url),
    );
    const newWindowNode = toAddNode.addNode(
        WindowNodeOperations.createData(newWindow, false),
        mode,
    );
    newWindowNode.setExpanded(true);
    return { windowNode: newWindowNode, window: newWindow };
};
