import { clone } from 'lodash';
import type { Windows } from 'webextension-polyfill';
import browser from 'webextension-polyfill';

import type { TreeData, TreeNode } from './nodes';
import type { TabData } from './tab-node-operations';
import { TabNodeOperations } from './tab-node-operations';

type FancytreeNode = Fancytree.FancytreeNode;

export const BACKGROUND_PAGE_TITLE = 'Link Map';

export interface WindowData extends Omit<Windows.Window, ''>, TreeData {
    windowId: number;
    isBackgroundPage: boolean;
    nodeType: 'window';
}

export function isExtensionPages(window: Windows.Window) {
    if (window.type !== 'popup' || !window.tabs || window.tabs.length !== 1) {
        return false;
    }
    const tab = window.tabs[0];
    const url = new URL(tab.url ?? tab.pendingUrl!);
    return url.origin === new URL(browser.runtime.getURL('')).origin;
}

export async function isCurrentWindow(windowId: number) {
    const currentWindow = await browser.windows.getCurrent();
    return currentWindow.id === windowId;
}

export const generateWindowTitle = (windowType = 'normal') => {
    return `Window${windowType === 'normal' ? '' : `(${windowType})`}`;
};

export const WindowNodeOperations = {
    createData(window: Windows.Window, createTab = true): TreeNode<WindowData> {
        const { id, type, tabs } = window;
        const isBackgroundPage = isExtensionPages(window);
        const windowTitle = generateWindowTitle(type);
        const node: TreeNode<WindowData> = {
            title: windowTitle,
            key: `${id}`,
            icon: {
                // 直接写URL,会使用img标签渲染,导致childrenCounter不识别
                html: `<img class="fancytree-icon" src="/icons/chrome_icon.svg" alt="">`,
            },
            expanded: true,
            data: {
                ...window,
                title: windowTitle,
                windowId: id || 0,
                closed: false,
                isBackgroundPage,
                nodeType: 'window',
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
        const { id, closed, save } = updateProperties;
        windowNode.data = { ...windowNode.data, ...updateProperties };
        if (id) {
            windowNode.key = `${id}`;
            windowNode.data.windowId = id;
        }
        if (closed !== undefined) {
            closed ? windowNode.addClass('closed') : windowNode.removeClass('closed');
            windowNode.renderTitle();
        }
        if (save !== undefined) {
            save ? windowNode.addClass('saved') : windowNode.removeClass('saved');
        }
    },
    remove(targetNode: FancytreeNode, force = false): void {
        if (!targetNode) return;
        if (force || (targetNode.children && targetNode.children.length > 0)) {
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
    /** 通过树的结构计算windowNode的子tab列表 */
    findAllSubTabNodes(windowNode: FancytreeNode, onlyOpened = false): FancytreeNode[] {
        const subWindowNodeIdSet = new Set<number>();
        const subTabNodes: FancytreeNode[] = [];
        windowNode.visit((node) => {
            if (node.data.nodeType === 'window') {
                subWindowNodeIdSet.add(node.data.windowId);
            } else if (
                node.data.nodeType === 'tab' &&
                !subWindowNodeIdSet.has(node.data.windowId)
            ) {
                subTabNodes.push(node);
            }
        });
        return subTabNodes.filter((node) => !onlyOpened || !node.data.closed);
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
    // updateSubTabWindowId(windowNode: FancytreeNode, oldWindowId: number): void {
    //     windowNode
    //         .findAll((node) => node.data.nodeType === 'tab' && node.data.windowId === oldWindowId)
    //         .forEach((tabNode) => {
    //             TabNodeOperations.updatePartial(tabNode, { windowId: windowNode.data.windowId });
    //         });
    // },
    /** 通过结构计算并更新windowTabNode */
    updateSubTabWindowId(windowNode: FancytreeNode): void {
        this.findAllSubTabNodes(windowNode).forEach((tabNode) => {
            TabNodeOperations.updatePartial(tabNode, { windowId: windowNode.data.windowId });
        });
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
    updateCloseStatus(windowNode: FancytreeNode): void {
        // window是否close需要通过子tabNode的closed状态计算
        if (!windowNode || windowNode.data.nodeType !== 'window')
            throw new Error('Invalid windowNode');
        const openedTabNodes = this.findAllSubTabNodes(windowNode, true);
        this.updatePartial(windowNode, { closed: !openedTabNodes || openedTabNodes.length === 0 });
    },
    /**
     * 更新subTabIndex和windowNode的closed状态
     * @param windowNode
     */
    updateWindowStatus(windowNode: FancytreeNode | FancytreeNode[]): void {
        const windowNodeList = Array.isArray(windowNode) ? windowNode : [windowNode];
        windowNodeList.forEach((windowNode) => {
            const openedTabNodes = this.findAllSubTabNodes(windowNode, true);
            openedTabNodes.forEach((tabNode, index) => {
                tabNode.data.index = index;
            });
            this.updatePartial(windowNode, {
                closed: !openedTabNodes || openedTabNodes.length === 0,
            });
        });
    },
    isExtensionPages(windowNode: TreeNode<WindowData>) {
        if (
            windowNode.data.type !== 'popup' ||
            !windowNode.children ||
            windowNode.children.length !== 1
        ) {
            return false;
        }
        const tab = windowNode.children[0] as TreeNode<TabData>;
        const url = new URL(tab.data.url ?? tab.data.pendingUrl!);
        return url.origin === new URL(browser.runtime.getURL('')).origin;
    },
};
