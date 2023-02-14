import _ from 'lodash';
import type { Tabs } from 'webextension-polyfill';

import type { TreeData, TreeNode } from '@/tree/features/tab-master-tree/nodes/nodes';
import type { TabData } from '@/tree/features/tab-master-tree/nodes/tab-node-operations';
import type { WindowData } from '@/tree/features/tab-master-tree/nodes/window-node-operations';

export const DEFAULT_WINDOW_NODE = {
    title: 'Window',
    key: '1',
    icon: {
        html: '<img class="fancytree-icon" src="/icons/chrome_icon.svg" alt="">',
    },
    expanded: true,
    children: [],
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
    },
} as TreeNode<WindowData>;

export const DEFAULT_TAB_NODE = {
    title: '扩展程序',
    key: '10',
    icon: {
        html: '<img class="fancytree-icon" src="/icons/chrome_icon.svg" alt="">',
    },
    expanded: true,
    children: [],
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
        active: true,
    },
} as TreeNode<TabData>;

export const SINGLE_TAB_WINDOW = [
    {
        ...DEFAULT_WINDOW_NODE,
        children: [_.cloneDeep(DEFAULT_TAB_NODE)],
    },
] as TreeNode<TreeData>[];

export const DEFAULT_TAB = {
    active: true,
    audible: false,
    autoDiscardable: true,
    discarded: false,
    favIconUrl: '',
    height: 939,
    highlighted: false,
    id: 10,
    incognito: false,
    index: 0,
    mutedInfo: {
        muted: false,
    },
    pinned: false,
    status: 'complete',
    title: `test-title`,
    url: 'https://baidu.com',
    width: 1792,
    windowId: 1,
    openerTabId: 0,
} as Tabs.Tab;
