import { onMessage, sendMessage } from '@garinz/webext-bridge';
import type { Tabs } from 'webextension-polyfill';
import browser from 'webextension-polyfill';

import type { ExtIdPair } from '../logic';
import { getExtIdPair, setExtIdPair } from '../logic';

// ext安装后的状态
browser.runtime.onInstalled.addListener((): void => {
    console.log('Extension installed');
});

/**
 * 点击插件按钮：打开一个TreeView页面
 * 将extIdPair更新到localStorage中
 * This Method Wouldn't Fire if tab-tree.html has benn set
 */
browser.action.onClicked.addListener(async () => {
    let extIdPair = await getExtIdPairAPIByBrowserAPI();
    if (extIdPair != null) {
        // 页面已打开，则窗口focused
        browser.windows.update(extIdPair.windowId, { focused: true });
        return;
    }
    const extWindow = await browser.windows.create({
        url: 'tree.html',
        type: 'popup',
        width: 895,
        height: 496,
        left: 0,
        top: 0,
        focused: true,
    });
    if (extWindow.tabs === undefined || extWindow.tabs.length < 0)
        throw new Error('window tabs must has at least one tab');
    const extTab = extWindow!.tabs[0];
    extIdPair = {
        windowId: extTab.windowId!,
        tabId: extTab.id!,
    };
    console.log(`windowId: ${extIdPair.windowId}, tabId: ${extIdPair.tabId}`);
    // 这里始终更新extIdPair
    setExtIdPair(extIdPair);
});

// #### 浏览器Fire的事件
browser.tabs.onCreated.addListener(async (tab) => {
    // 1. 如果创建的是contentScript则忽略
    console.log('[bg]: tab created!', tab);
    if (isContentScriptPage(tab.url) || isContentScriptPage(tab.pendingUrl)) return;

    // 2. 其他TAB，发给contentScript做tree更新
    sendMessageToExt('add-tab', tab);
});

browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
    // optimize 1. 如果删除的是自己怎么办？
    console.log('[bg]: tab removed!');
    // 如果删除的是extPage，记录window的width/height/left/top到localStorage
    sendMessageToExt('remove-tab', { windowId: removeInfo.windowId, tabId });
});

browser.tabs.onUpdated.addListener(async (_tabId, _changeInfo, tab) => {
    console.log('[bg]: tab updated!', tab);
    sendMessageToExt('update-tab', tab);
});

/**
 * 只有同窗口tab前后顺序移动会影响触发这个方法
 */
browser.tabs.onMoved.addListener((tabId, { windowId, fromIndex, toIndex }) => {
    console.log('[bg]: tab moved!');
    sendMessageToExt('move-tab', {
        windowId,
        fromIndex,
        toIndex,
        tabId,
    });
});

browser.tabs.onActivated.addListener(({ tabId, windowId }) => {
    console.log('[bg]: tab activated!');
    sendMessageToExt('activated-tab', { windowId, tabId });
});
/**
 * 如果没有window会先触发window的创建事件
 *
 */
browser.tabs.onAttached.addListener(async (tabId, { newPosition, newWindowId }) => {
    console.log('[bg]: attached, tabId:', tabId);
    await sendMessageToExt('attach-tab', {
        windowId: newWindowId,
        tabId,
        newIndex: newPosition,
    });
});

browser.tabs.onDetached.addListener(async (tabId) => {
    console.log('[bg]: detached, tabId:', tabId);
    await sendMessageToExt('detach-tab', { tabId });
});

browser.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
    console.log(`Tab replaced, added tabId: ${addedTabId}`, `removed tabId: ${removedTabId}`);
});
/**
 * detach tab的时候会触发这个事件
 */
browser.windows.onCreated.addListener(async (window) => {
    console.log('[bg]: window create!');
    // Tab detach的时候也会发这个Event
    sendMessageToExt('add-window', window);
});
/**
 * 最后一个tab合并到另一个window时会发这个Event
 */
browser.windows.onRemoved.addListener((windowId) => {
    console.log('[bg]: window remove!');
    sendMessageToExt('remove-window', { windowId });
});

browser.windows.onFocusChanged.addListener(async (windowId) => {
    console.log('[bg]: window focus changed!');
    await sendMessageToExt('window-focus', { windowId });
});

// Ext Page Fire的事件 ----------------------------------------------------------------
// tree-view的node focus状态改变
onMessage('focus-node', (msg) => {
    // TODO 如果有网页重新加载，会导致active状态被完成load的网页抢走
    const tabId = msg.data;
    browser.tabs.update(tabId, { active: true });
});
// tree-view 删除node
onMessage('remove-node', (msg) => {
    // TODO 如果有网页重新加载，会导致active状态被完成load的网页抢走
    const { tabId } = msg.data;
    browser.tabs.remove(tabId);
});

// util methods--------------------------------

async function sendMessageToExt(messageId: string, message: any) {
    const extIdPair = await getOrRefreshExtIdPair();
    if (extIdPair === null) return;
    return sendMessage(messageId, message, { context: 'content-script', tabId: extIdPair.tabId });
}

/**
 * 判断一个URL是否为ConentScriptPage
 */
function isContentScriptPage(url?: string) {
    return url === browser.runtime.getURL('tree.html');
}

/**
 * 仅通过browserAPI获取ExtIdPair
 */
async function getExtIdPairAPIByBrowserAPI(): Promise<ExtIdPair | null> {
    // TODO 优化判断逻辑
    // 1. localStorage为空： 页面为未打开状态
    // 2. browser.windows.getAll(...)，遍历并比对windowId和tabId，相同则返回true
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
}

/**
 * 获取ContentScriptWindow
 * 先从localStorage查，没有则通过browserAPI查询
 */
async function getOrRefreshExtIdPair(): Promise<ExtIdPair | null> {
    // 1. 先从localStorage中获取，存在则直接返回
    const localStorageValue = getExtIdPair();
    if (localStorageValue !== null) return localStorageValue;

    // 2. localStorage中没有，通过浏览器API获取
    return await getExtIdPairAPIByBrowserAPI();
}

/**
 * 判断ContentScript是否存在
 */
// async function isExtPageExistByBrowserAPI(): Promise<Boolean> {
//     return !!(await getExtIdPairAPIByBrowserAPI());
// }
