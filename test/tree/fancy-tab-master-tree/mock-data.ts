import type { TreeData, TreeNode } from '@/tree/nodes/nodes';
import type { TabData } from '@/tree/nodes/tab-node-operations';
import type { WindowData } from '@/tree/nodes/window-node-operations';

export const SINGLE_TAB_WINDOW = [
    {
        title: 'Window',
        key: '1',
        icon: {
            html: '<img class="fancytree-icon" src="/icons/chrome_icon.svg">',
        },
        expanded: true,
        data: {
            alwaysOnTop: false,
            focused: false,
            height: 1050,
            id: 1,
            incognito: false,
            left: 0,
            state: 'maximized',
            top: 25,
            nodeType: 'window',
            width: 1792,
            windowId: 1,
            closed: false,
            parentId: 0,
            isBackgroundPage: false,
            activeTabId: 10,
        } as WindowData,
        children: [
            {
                title: '扩展程序',
                key: '10',
                icon: {
                    html: '<img class="fancytree-icon" src="/icons/chrome_icon.svg">',
                },
                expanded: true,
                data: {
                    // active: false,
                    audible: false,
                    autoDiscardable: true,
                    discarded: false,
                    favIconUrl: '',
                    // groupId: -1,
                    height: 939,
                    highlighted: false,
                    id: 10,
                    incognito: false,
                    index: 0,
                    mutedInfo: {
                        muted: false,
                    },
                    pinned: false,
                    // selected: false,
                    status: 'complete',
                    title: '扩展程序',
                    url: 'chrome://extensions/',
                    width: 1792,
                    windowId: 1,
                    tabId: 10,
                    closed: false,
                    parentId: 1,
                    nodeType: 'tab',
                } as TabData,
            },
        ],
    },
] as TreeNode<TreeData>[];
