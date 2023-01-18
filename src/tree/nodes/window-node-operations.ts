import type { Windows } from 'webextension-polyfill';

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
    createData(window: Windows.Window): TreeNode<WindowData> {
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
        if (tabs) node.children = tabs.map((tab) => TabNodeOperations.createData(tab));

        return node;
    },
    updatePartial(
        tree: Fancytree.Fancytree,
        windowId: number,
        updateProperties: Partial<WindowData>,
    ): void {
        const windowNode = tree.getNodeByKey(`${windowId}`);
        if (windowNode) {
            windowNode.data = { ...windowNode.data, ...updateProperties };
        }
    },
    closeItem(targetNode: FancytreeNode): FancytreeNode | null {
        if (targetNode.data.closed) return null;
        targetNode.data.closed = true;
        targetNode.renderTitle();
        return targetNode;
    },
};
