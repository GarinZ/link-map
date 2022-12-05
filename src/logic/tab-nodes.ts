import { merge } from 'lodash';
import type { Tabs } from 'webextension-polyfill';

import type { WindowTabIdPair } from '../typings';
import type { TabData, TreeNode } from './nodes';
import { array2Object, pushIfAbsentInit } from './utils';

export const create = (tab: Tabs.Tab): TreeNode<TabData> => {
    const { title, windowId, active, favIconUrl, id, openerTabId } = tab;
    if (windowId === undefined) throw new Error('windowId is required');
    if (id === undefined) throw new Error('id is required');

    return {
        title: title || '',
        key: `${windowId}-${id}`,
        icon: favIconUrl || '/assets/chrome_icon.svg',
        data: {
            ...tab,
            windowId,
            tabId: id,
            closed: false,
            parentId: openerTabId || windowId,
            tabActive: active,
        },
    };
};

export const getOpenerTabId2TabKeyArr = (tabs: Tabs.Tab[]): { [openerTabId: string]: number[] } => {
    const openerId2tab = {};
    tabs.forEach((tab) => pushIfAbsentInit(openerId2tab, tab.openerTabId || '0', tab));
    return openerId2tab;
};

export const getKey = (windowId: number, tabId?: number): string =>
    tabId ? `${windowId}-${tabId}` : `${windowId}`;

export const getKeyFromChromeTab = (chromeTab: Tabs.Tab): string =>
    getKey(chromeTab.windowId || 0, chromeTab.id || 0);

/**
 * 根据FancyTree的key反解出windowId和TabId
 * @param key fancyTreeNode.data.key
 * @return
 */
export const getWindowAndTabIdFromKey = (key: string): WindowTabIdPair => {
    const arr = key.split('-');
    return { windowId: +arr[0], tabId: +arr[1] };
};

/**
 * 将两份treeData合并，并覆盖到dbTabData上面，按key决定是否相同
 */
export const mergeArr = (
    targetTabDataArr: TreeNode<TabData>[],
    sourceTabDataArr: TreeNode<TabData>[],
) => {
    const key2TargetTab = array2Object(targetTabDataArr, (item) => item.key);
    sourceTabDataArr.forEach((sourceTabItem) => {
        const key = sourceTabItem.key;
        if (key in key2TargetTab) {
            // 1. DB v chrome v -> open tab
            const targetTabItem = key2TargetTab[key];
            merge(targetTabItem, sourceTabItem);
            targetTabItem.data.closed = false;
        } else {
            // 2. DB x chrome v -> new tab
            targetTabDataArr.push(sourceTabItem);
        }
    });
};
