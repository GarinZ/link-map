import { clone } from 'lodash';
import type { Windows } from 'webextension-polyfill';

import { NodeUtils } from '../utils';
import type { TreeData, TreeNode } from './nodes';
import { TabNodeOperations } from './tab-node-operations';

type FancytreeNode = Fancytree.FancytreeNode;

export const BACKGROUND_PAGE_TITLE = 'Tab Master';

export interface WindowData extends Omit<Windows.Window, ''>, TreeData {
    windowId: number;
    isBackgroundPage: boolean;
    nodeType: 'window';
    // activeTabId: number; // active tab in curren window
}

export const WindowNodeOperations = {
    createData(window: Windows.Window, createTab = true): TreeNode<WindowData> {
        const { id, type, tabs } = window;
        const isBackgroundPage =
            !!tabs && type === 'popup' && tabs[0].title === BACKGROUND_PAGE_TITLE;
        const node: TreeNode<WindowData> = {
            title: `Window${type === 'normal' ? '' : `(${type})`}`,
            key: `${id}`,
            icon: {
                // 直接写URL,会使用img标签渲染,导致childrenCounter不识别
                html: `<img class="fancytree-icon" src="/icons/chrome_icon.svg" alt="">`,
            },
            expanded: true,
            data: {
                ...window,
                windowId: id || 0,
                closed: false,
                parentId: 0,
                isBackgroundPage,
                nodeType: 'window',
                // activeTabId: tabs?.find((tab) => tab.active)?.id || 0,
            },
        };
        // 删除data.tabs
        delete node.data.tabs;
        // PS: openerTabId是空的，所以无法通过openerTabId构建Tab树
        if (tabs && createTab) {
            node.children = tabs.map((tab) => {
                const tabNode = TabNodeOperations.createData(tab);
                if (tab.active) tabNode.extraClasses = 'tab-active';
                return tabNode;
            });
        }

        return node;
    },
    updatePartial(windowNode: FancytreeNode, updateProperties: Partial<WindowData>): void {
        const { id, closed } = updateProperties;
        windowNode.data = { ...windowNode.data, ...updateProperties };
        if (id) {
            windowNode.key = `${id}`;
            windowNode.data.windowId = id;
        }
        if (closed !== undefined) {
            windowNode.renderTitle();
        }
    },
    remove(targetNode: FancytreeNode, force = false): void {
        if (!targetNode) {
            return;
        }
        if (!force && (!NodeUtils.canRemove(targetNode) || targetNode.children?.length > 0)) {
            return;
        }
        const children = targetNode.children ? clone(targetNode.children?.reverse()) : [];
        children.forEach((child) => child.moveTo(targetNode, 'after'));
        targetNode.remove();
    },
    closeItem(targetNode: FancytreeNode): FancytreeNode | null {
        if (targetNode.data.closed) return null;
        targetNode.data.closed = true;
        targetNode.renderTitle();
        return targetNode;
    },
    updateCloseStatus(tree: Fancytree.Fancytree, windowIdSet: Set<number>): FancytreeNode[] {
        // window是否close需要通过子tabNode的closed状态计算
        // 1. 找到所有windowNode及其子tabNode
        const windowNode2TabNodes = new Map<FancytreeNode, FancytreeNode[]>();
        windowIdSet.forEach((windowId) => {
            const windowNode = tree.getNodeByKey(`${windowId}`);
            if (!windowNode) return;
            windowNode2TabNodes.set(windowNode, this.findAllSubTabNodes(windowNode));
        });
        // 2. 遍历并计算windowNode的closed状态
        const closedWindowNodes: FancytreeNode[] = [];
        windowNode2TabNodes.forEach((tabNodes, windowNode) => {
            const closed = tabNodes.every((tabNode) => tabNode.data.closed);
            if (closed && !windowNode.data.closed) closedWindowNodes.push(windowNode);
            this.updatePartial(windowNode, { closed });
        });
        return closedWindowNodes;
    },
    findAllSubTabNodes(windowNode: FancytreeNode, onlyOpened = false): FancytreeNode[] {
        return (
            windowNode.findAll(
                (node) =>
                    node.data.nodeType === 'tab' &&
                    node.data.windowId === windowNode.data.windowId &&
                    (onlyOpened ? !node.data.closed : true),
            ) ?? []
        );
    },
    buildCreateWindowProps(
        url: string | string[],
        windowNode?: FancytreeNode,
    ): Windows.CreateCreateDataType {
        let props: Windows.CreateCreateDataType = {
            url,
        };
        if (windowNode) {
            const { incognito, type, left, top, width, height } = windowNode.data;
            props = {
                ...props,
                incognito,
                type,
                left,
                top,
                width,
                height,
            };
        }
        return props;
    },
    updateSubTabWindowId(windowNode: FancytreeNode, oldWindowId: number): void {
        windowNode
            .findAll((node) => node.data.nodeType === 'tab' && node.data.windowId === oldWindowId)
            .forEach((tabNode) => {
                TabNodeOperations.updatePartial(tabNode, { windowId: windowNode.data.windowId });
            });
    },
    updateClosedStatus(windowNode: FancytreeNode): void {
        const closed = this.findAllSubTabNodes(windowNode).every((tabNode) => tabNode.data.closed);
        this.updatePartial(windowNode, { closed });
    },
    resetSubTabNodeIndex(windowNode: FancytreeNode | FancytreeNode[]) {
        const windowNodeList = Array.isArray(windowNode) ? windowNode : [windowNode];
        windowNodeList.forEach((windowNode) => {
            const openTabNodes = this.findAllSubTabNodes(windowNode, true);
            openTabNodes.forEach((tabNode, index) => {
                tabNode.data.index = index;
            });
        });
    },
};
