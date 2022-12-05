/**
 * Chrome Service
 * @author Garin
 * @date 2022-04-09
 */

import type { Tabs, Windows } from 'webextension-polyfill';
import browser from 'webextension-polyfill';

import type { ExtIdPair } from '../logic/storage';
import { getExtIdPair, setExtIdPair } from '../logic/storage';

/**
 * 从Chrome获取当前的tab树
 * 内部负责转换ChromeTab -> TabNode
 */
export const getTabTreeFromChrome = async (): Promise<Windows.Window[]> =>
    await browser.windows.getAll({ populate: true });

/**
 * 判断一个URL是否为ConentScriptPage
 */
export const isContentScriptPage = (url?: string): boolean =>
    url === browser.runtime.getURL('/dist/popup/index.html');

/**
 * 仅通过browserAPI获取ExtIdPair
 */
export const getExtIdPairAPIByBrowserAPI = async (): Promise<ExtIdPair | null> => {
    // TODO: 优化判断逻辑
    // 1. localStorage为空： 页面为未打开状态
    // 2. browser.windows.getll(...)，遍历并比对windowId和tabId，相同则返回true
    // PS: 现在基于URL的判断限制性有点强
    let extIdPair: ExtIdPair | null = null;
    const windows = await browser.windows.getAll({ populate: true, windowTypes: ['popup'] });
    for (const window of windows) {
        if (!window.tabs || window.tabs?.length === 0) continue;
        const targetTab = window.tabs[0];
        // 2.1 Ext Window存在
        if (isContentScriptPage(targetTab.url) && targetTab.status !== 'loading') {
            const extTab: Tabs.Tab = window!.tabs[0];
            extIdPair = { windowId: extTab.windowId!, tabId: extTab.id! };
            // 更新localStorage
            setExtIdPair({ windowId: extTab.windowId!, tabId: extTab.id! });
        }
    }
    return extIdPair;
};

/**
 * 获取ContentScriptWindow
 * 先从localStorage查，没有则通过browserAPI查询
 */
export const getOrRefreshExtIdPair = async (): Promise<ExtIdPair | null> => {
    // 1. 先从localStorage中获取，存在则直接返回
    const localStorageValue = getExtIdPair();
    if (localStorageValue !== null) return localStorageValue;

    // 2. localStorage中没有，通过浏览器API获取
    return await getExtIdPairAPIByBrowserAPI();
};

/**
 * 判断ContentScript是否存在
 */
export const isExtPageExistByBrowserAPI = async (): Promise<Boolean> => {
    return !!(await getExtIdPairAPIByBrowserAPI());
};

export const getWindowById = async (windowId: number): Promise<Windows.Window> =>
    browser.windows.get(windowId, { populate: true });
/**
 * @param {number} tabId
 * @returns {Promise<Tabs.Tab>}
 */
export const getTabById = async (tabId: number): Promise<Tabs.Tab> => browser.tabs.get(tabId);
