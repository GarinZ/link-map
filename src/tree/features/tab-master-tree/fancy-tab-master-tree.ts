import { clone, merge } from 'lodash';
import log from 'loglevel';
import type { Tabs, Windows } from 'webextension-polyfill';
import browser from 'webextension-polyfill';

import { isNoTabIdError } from '../../../config/errors';
import { TabMasterDB } from '../../../storage/idb';
import { dataCheckAndSupply } from './nodes/data-check';
import type { TreeData, TreeNode } from './nodes/nodes';
import { NoteNodeOperations } from './nodes/note-node-operations';
import type { TabData } from './nodes/tab-node-operations';
import { TabNodeOperations } from './nodes/tab-node-operations';
import { NodeUtils } from './nodes/utils';
import type { WindowData } from './nodes/window-node-operations';
import { WindowNodeOperations } from './nodes/window-node-operations';
import { registerContextMenu } from './plugins/context-menu';
import { DND5_CONFIG } from './plugins/dnd';
import { EDIT_OPTIONS } from './plugins/edit';
import { clearHighLightFields, FILTER_OPTIONS } from './plugins/filter';
import TreeNodeTpl, { TPL_CONSTANTS } from './templates/tree-node-tpl';

import 'jquery.fancytree';
import 'jquery.fancytree/dist/modules/jquery.fancytree.dnd5';
import 'jquery.fancytree/dist/modules/jquery.fancytree.edit.js';
import 'jquery.fancytree/dist/modules/jquery.fancytree.filter.js';
import 'jquery.fancytree/dist/skin-xp/ui.fancytree.min.css';

const { TYPE_ATTR, NODE_CLOSE, NODE_REMOVE, NODE_EDIT } = TPL_CONSTANTS;

type FancytreeNode = Fancytree.FancytreeNode;
type OperationTarget = 'item' | 'all' | 'auto';

export interface FancyTabMasterTreeConfig {
    dndConfig?: Fancytree.Extensions.DragAndDrop5;
    enableEdit?: boolean;
    enableContextMenu?: boolean;
    enableOperateBrowser?: boolean;
    enablePersist?: boolean;
}

const DefaultConfig: FancyTabMasterTreeConfig = {
    dndConfig: DND5_CONFIG,
    enableEdit: true,
    enableContextMenu: true,
    enableOperateBrowser: true,
    enablePersist: true,
};

/**
 * Tab-Master Tree 基于fancytree的实现
 * 以后如果有其他实现可以抽象一个interface
 * 处理浏览器模型到fancytree模型的转换
 */
export class FancyTabMasterTree {
    tree: Fancytree.Fancytree;
    db?: TabMasterDB;
    enablePersist: boolean;
    static closeNodes: (targetNode: FancytreeNode, mode?: OperationTarget) => void;
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

    static removeNodes: (targetNode: FancytreeNode, mode?: OperationTarget) => void;
    static save: (node: Fancytree.FancytreeNode) => void;
    static insertTag: (
        node: Fancytree.FancytreeNode,
        mode: 'parent' | 'child' | 'firstChild' | 'after',
    ) => void;

    constructor($container: JQuery, config: FancyTabMasterTreeConfig = DefaultConfig) {
        config = merge({}, DefaultConfig, config);
        const extensions = ['dnd5', 'filter'];
        if (config.enableEdit) {
            extensions.push('edit');
        }
        $container.fancytree({
            active: true,
            extensions,
            source: [{ title: 'pending' }],
            enhanceTitle: (_eventData: JQueryEventObject, data: Fancytree.EventData) => {
                const html = renderTitle(_eventData, data, config.enableEdit);
                const $title = $(data.node.span).find('span.fancytree-title');
                $title.html(html);
            },
            // renderTitle,
            click: config.enableEdit ? FancyTabMasterTree.onClick : undefined,
            dblclick: config.enableOperateBrowser
                ? (event, data) => {
                      if ($(event.originalEvent!.target!).hasClass('fancytree-expander')) {
                          return false;
                      }
                      FancyTabMasterTree.onDbClick(data.node);
                      return false;
                  }
                : undefined,
            defaultKey: (node) => `${node.data.id}`,
            debugLevel: 0,
            dnd5: config.dndConfig,
            edit: EDIT_OPTIONS,
            filter: FILTER_OPTIONS,
        });
        if (config.enableContextMenu) {
            registerContextMenu();
        }
        this.tree = $.ui.fancytree.getTree('#tree');
        this.enablePersist = config.enablePersist!;
        if (this.enablePersist) {
            this.db = new TabMasterDB();
        }
    }

    public async persist() {
        const snapshot = this.tree.toDict() as TreeNode<TreeData>[];
        const isInvalidData =
            !snapshot ||
            snapshot.length === 0 ||
            (snapshot.length === 1 && snapshot[0].title === 'pending');

        if (!isInvalidData) {
            await this.db?.setSnapshot(snapshot);
        }
    }

    public async loadSnapshot(toMergeNodesData: TreeNode<WindowData>[]): Promise<Boolean> {
        const snapshot = await this.db?.getSnapshot();
        if (!snapshot) {
            return false;
        }
        // 存在snapshot，先将snapshot加载到tree中
        // TODO 这里可能需要数据检查
        dataCheckAndSupply(snapshot);
        log.debug(snapshot);
        await this.tree.reload(snapshot);
        const extPages: FancytreeNode[] = [];
        this.tree.visit((node) => {
            clearHighLightFields(node);
            if (node.data.nodeType === 'tab' || node.data.nodeType === 'window') {
                TabNodeOperations.updatePartial(node, { closed: true });
                if (!node.data.url) {
                    node.data.url = node.data.pendingUrl;
                }
            }
            if (
                node.data.nodeType === 'window' &&
                WindowNodeOperations.isExtensionPages(node as TreeNode<WindowData>)
            ) {
                extPages.push(node);
            }
            return true;
        });
        extPages.forEach((extPage) => {
            extPage.remove();
        });
        toMergeNodesData.forEach((nodeData) => {
            let windowNode = this.tree.getNodeByKey(nodeData.key!);
            if (windowNode) {
                // windowNode在snapshot中存在
                WindowNodeOperations.updatePartial(windowNode, {
                    ...nodeData.data,
                    closed: false,
                });
            } else {
                const windowData = clone(nodeData);
                windowData.children = [];
                windowNode = this.tree.rootNode.addNode(windowData, 'child');
            }
            const tabDataList = NodeUtils.flatTabData(nodeData);
            tabDataList.forEach((tabData) => {
                const tabNode = this.tree.getNodeByKey(`${tabData.key}`);
                if (!tabNode) {
                    TabNodeOperations.add(this.tree, tabData, tabData.data.active);
                    return;
                }
                if (tabNode.data.windowId !== tabData.data.windowId) {
                    NodeUtils.moveChildrenAsNextSiblings(tabNode);
                    tabNode.moveTo(windowNode, 'child');
                }
                TabNodeOperations.updatePartial(tabNode, {
                    ...tabData.data,
                    closed: false,
                });
            });
            WindowNodeOperations.updateWindowStatus(windowNode);
        });
        return true;
    }

    public async initTree(source?: TreeNode<TreeData>[]) {
        if (source) {
            this.tree.reload(source);
            return;
        }
        if (this.enablePersist) {
            const browserWindowPromise = await browser.windows.getAll({ populate: true });
            const unknown = browserWindowPromise as unknown;
            const windows = unknown as Windows.Window[];
            const nodes = windows.map((w) => WindowNodeOperations.createData(w));
            const hasSnapshot = await this.loadSnapshot(nodes);
            if (!hasSnapshot) {
                await this.tree.reload(nodes);
            }
            setInterval(this.persist.bind(this), 1000);
        }
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
        log.debug(`move tab ${tabId} from ${fromIndex} to ${toIndex}`);
        if (toIndex === fromIndex) return;
        const toMoveNode = this.tree.getNodeByKey(`${tabId}`);
        // attach时会竞态触发move事件，如果之前排序过就不要再排一次
        if (!toMoveNode || toMoveNode.data.index === toIndex) return;
        TabNodeOperations.move(toMoveNode, fromIndex, toIndex);
    }

    public async removeTab(tabId: number): Promise<void> {
        const toRemoveNode = this.tree.getNodeByKey(`${tabId}`);
        if (!toRemoveNode) return;
        const windowNode = TabNodeOperations.findWindowNode(toRemoveNode);
        const hasRemove = TabNodeOperations.removeItem(toRemoveNode);
        if (!hasRemove) {
            TabNodeOperations.updatePartial(toRemoveNode, { closed: true, active: false });
        }
        // tab remove不会触发tab active事件，需要手动更新
        if (windowNode) {
            await this.syncActiveTab(windowNode.data.windowId);
            WindowNodeOperations.updateWindowStatus(windowNode);
        }
    }

    public updateTab(tab: Tabs.Tab): void {
        const toUpdateNode = this.tree.getNodeByKey(`${tab.id!}`);
        if (!toUpdateNode) return;
        TabNodeOperations.updatePartial(toUpdateNode, tab);
    }

    public attachTab(newWindowId: number, tabId: number, newIndex: number): void {
        const toAttachNode = this.tree.getNodeByKey(`${tabId}`);
        const dndOperated = (toAttachNode.data as TabData).dndOperated;
        // attach/detach会触发active事件，不需要再次更新
        TabNodeOperations.move(toAttachNode, toAttachNode.data.index, newIndex, newWindowId);
        if (dndOperated) {
            browser.tabs.update(toAttachNode.data.id, { active: true }).then(() => {
                browser.windows.update(toAttachNode.data.windowId, { focused: true });
            });
        }
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
        // const windowNode = this.tree.getNodeByKey(`${windowId}`);
        // if (!windowNode.data.isBackgroundPage) {
        //     windowNode.scrollIntoView();
        // }
        await this.syncActiveTab(windowId);
    }

    public toJsonObj(includeRoot = false): TreeNode<TreeData>[] {
        return this.tree.toDict(includeRoot);
    }

    private async syncActiveTab(windowId: number): Promise<boolean> {
        const tabs = await browser.tabs.query({ windowId, active: true });
        if (tabs.length === 0) return false;
        const activeTab = tabs[0];
        this.activeTab(windowId, activeTab.id!);
        return true;
    }
}

function renderTitle(
    _eventData: JQueryEventObject,
    data: Fancytree.EventData,
    enableBtnGroup = true,
): string {
    const treeNode = new TreeNodeTpl(data.node, enableBtnGroup);
    return treeNode.html;
}

FancyTabMasterTree.onClick = (event: JQueryEventObject, data: Fancytree.EventData): boolean => {
    const target = $(event.originalEvent.target as Element);
    if (!target.attr(TYPE_ATTR)) return true;

    switch (target.attr(TYPE_ATTR)) {
        case NODE_CLOSE:
            log.debug('[tree]: close button clicked');
            FancyTabMasterTree.closeNodes(data.node);
            break;
        case NODE_REMOVE:
            log.debug('[tree]: remove button clicked');
            FancyTabMasterTree.removeNodes(data.node);
            // prevent default to prevent scroll up
            event.preventDefault();
            break;
        case NODE_EDIT:
            log.debug('[tree]: edit button clicked');
            data.node.editStart();
            break;
    }
    return true;
};

FancyTabMasterTree.onDbClick = async (targetNode: FancytreeNode): Promise<void> => {
    if (targetNode.data.nodeType === 'tab') {
        // 1. 如果TabNode是打开状态，直接激活
        if (!targetNode.data.closed) {
            try {
                await browser.tabs.update(targetNode.data.id, { active: true });
                await browser.windows.update(targetNode.data.windowId, { focused: true });
                return;
            } catch (error) {
                // fixme: temp fix not response correctly when double-clicking.
                if (isNoTabIdError(error as Error)) {
                    location.reload();
                    log.error(error);
                    return;
                }
            }
        }
        // 2. TabNode关闭
        const windowNode = TabNodeOperations.findWindowNode(targetNode);
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
                const openedSubTabNodes = WindowNodeOperations.findAllSubTabNodes(windowNode, true);
                index =
                    openedSubTabNodes.findIndex(
                        (node) => node.data.id === prevOpenedTabNode.data.id,
                    ) + 1;
            }
            const newTab = await browser.tabs.create({ url, windowId: windowNode.data.id, index });
            TabNodeOperations.updatePartial(targetNode, { ...newTab, closed: false });
            WindowNodeOperations.updateWindowStatus(windowNode);
        }
    } else if (targetNode.data.nodeType === 'window') {
        // 1. 如果WindowNode是打开状态，直接激活
        if (!targetNode.data.closed) {
            await browser.windows.update(targetNode.data.id, { focused: true });
            return;
        }
        // 2. WindowNode关闭
        const subTabNodes = WindowNodeOperations.findAllSubTabNodes(targetNode);
        await FancyTabMasterTree.reopenWindowNode(targetNode, subTabNodes);
    }
};

/**
 * 关闭节点
 */
FancyTabMasterTree.closeNodes = (targetNode: FancytreeNode, mode: OperationTarget = 'auto') => {
    // 1. 更新tabNodes的closed状态
    const operationMode = getOperationMode(targetNode, mode);
    const toClosedTabNodes = TabNodeOperations.getToCloseTabNodes(targetNode, operationMode);
    const windowIdSet = new Set<number>();
    const tabIdSet = new Set<number>();
    toClosedTabNodes.forEach((node) => {
        windowIdSet.add(node.data.windowId);
        tabIdSet.add(node.data.id);
        TabNodeOperations.updatePartial(node, { closed: true, active: false });
    });
    windowIdSet.forEach((windowId) => {
        const windowNode = targetNode.tree.getNodeByKey(`${windowId}`);
        if (!windowNode) return;
        WindowNodeOperations.updateWindowStatus(windowNode);
    });
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
    // 1. 打开window和tab
    const urlList = toOpenSubTabNodes.map((item) => item.data.url);
    const newWindow = await browser.windows.create(
        WindowNodeOperations.buildCreateWindowProps(urlList, windowNode),
    );
    // 2. 更新windowNode状态并更新其子节点
    WindowNodeOperations.updatePartial(windowNode, { ...newWindow, closed: false });
    if (needUpdateTabProps) {
        WindowNodeOperations.updateSubTabWindowId(windowNode);
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
    const { url } = tabNode.data;
    const { windowNode, window } = await FancyTabMasterTree.openWindow(tabNode, 'before', url);
    // 2. 将tabNode挂到windowNode下
    tabNode.moveTo(windowNode, 'firstChild');
    // 3. 更新TabNode属性和子tabNode的windowId
    TabNodeOperations.updatePartial(tabNode, { ...window.tabs![0], closed: false });
    WindowNodeOperations.updateSubTabWindowId(windowNode);
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

FancyTabMasterTree.removeNodes = (targetNode: FancytreeNode, mode: OperationTarget = 'auto') => {
    // 1, 计算需要关闭的tabNodes
    const operationMode = getOperationMode(targetNode, mode);
    const toCloseTabNodes = TabNodeOperations.getToCloseTabNodes(targetNode, operationMode);
    const windowIdSet = new Set<number>();
    const tabIdSet = new Set<number>();
    toCloseTabNodes.forEach((node) => {
        windowIdSet.add(node.data.windowId);
        tabIdSet.add(node.data.id);
    });
    // 2. 移除节点
    if (operationMode === 'item') {
        NodeUtils.moveChildrenAsNextSiblings(targetNode);
    }
    targetNode.remove();
    // 3. 更新windowNode的closed状态
    windowIdSet.forEach((windowId) => {
        const windowNode = targetNode.tree.getNodeByKey(windowId.toString());
        if (!windowNode) return;
        WindowNodeOperations.updateWindowStatus(windowNode);
    });
    tabIdSet.size > 0 && browser.tabs.remove([...tabIdSet]);
};

FancyTabMasterTree.save = (node: FancytreeNode) => {
    const newSaveStatus = !node.data.save;
    if (!node.isExpanded()) {
        node.visit((child) => {
            if (child.data.nodeType === 'note') return;
            TabNodeOperations.updatePartial(child, { save: newSaveStatus });
        }, true);
    }
    if (node.data.nodeType === 'window') {
        WindowNodeOperations.findAllSubTabNodes(node).forEach((tabNode) => {
            TabNodeOperations.updatePartial(tabNode, { save: newSaveStatus });
        });
        WindowNodeOperations.updatePartial(node, { save: newSaveStatus });
    }
    if (node.data.nodeType === 'tab') {
        TabNodeOperations.updatePartial(node, { save: newSaveStatus });
    }
};

FancyTabMasterTree.insertTag = (
    node: FancytreeNode,
    mode: 'parent' | 'child' | 'firstChild' | 'after',
) => {
    switch (mode) {
        case 'parent': {
            const newNode = node.addNode(NoteNodeOperations.createData(), 'before');
            node.moveTo(newNode, 'child');
            newNode.editStart();
            break;
        }
        case 'child': {
            const newNode = node.addNode(NoteNodeOperations.createData(), 'child');
            node.setExpanded(true);
            newNode.editStart();
            break;
        }
        case 'firstChild': {
            const newNode = node.addNode(NoteNodeOperations.createData(), 'firstChild');
            node.setExpanded(true);
            newNode.editStart();
            break;
        }
        default: {
            const newNode = node.addNode(NoteNodeOperations.createData(), 'after');
            newNode.editStart();
            break;
        }
    }
};

function getOperationMode(targetNode: FancytreeNode, mode: OperationTarget = 'auto') {
    let closeMode: 'item' | 'all';
    if (mode === 'item' || mode === 'all') {
        closeMode = mode;
    } else {
        closeMode = targetNode.expanded ? 'item' : 'all';
    }
    return closeMode;
}
