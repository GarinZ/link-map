import type { Tabs, Windows } from 'webextension-polyfill';

import type { TabData, TreeNode, WindowData } from './nodes';

export const BACKGROUND_PAGE_TITLE = 'Tab Master';

export const createTabNode = (tab: Tabs.Tab): TreeNode<TabData> => {
    const { title, windowId, active, favIconUrl, id, openerTabId } = tab;
    if (windowId === undefined) throw new Error('windowId is required');
    if (id === undefined) throw new Error('id is required');

    return {
        title: title || '',
        key: `${id}`,
        icon: {
            // 直接写URL,会使用img标签渲染,导致childrenCounter不识别
            html: `<img class="fancytree-icon" src="${favIconUrl || '/icons/chrome_icon.svg'}">`,
        },
        expanded: true,
        data: {
            ...tab,
            windowId,
            closed: false,
            parentId: openerTabId || windowId,
            tabActive: active,
            type: 'tab',
        },
    };
};
export const createWindowNode = (window: Windows.Window): TreeNode<WindowData> => {
    const { id, type, tabs } = window;
    const isBackgroundPage = !!tabs && type === 'popup' && tabs[0].title === BACKGROUND_PAGE_TITLE;
    const node: TreeNode<WindowData> = {
        title: `Window${type === 'normal' ? '' : `(${type})`}`,
        key: `${id}`,
        icon: {
            // 直接写URL,会使用img标签渲染,导致childrenCounter不识别
            html: `<img class="fancytree-icon" src="/icons/chrome_icon.svg">`,
        },
        expanded: true,
        data: {
            ...window,
            windowId: id || 0,
            closed: false,
            parentId: 0,
            isBackgroundPage,
            type: 'window',
        },
    };
    // 删除data.tabs
    delete node.data.tabs;
    // PS: openerTabId是空的，所以无法通过openerTabId构建Tab树
    if (tabs) node.children = tabs.map((tab) => createTabNode(tab));

    return node;
};
