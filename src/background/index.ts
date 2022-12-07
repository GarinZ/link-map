import { onMessage, sendMessage } from 'webext-bridge';
import browser from 'webextension-polyfill';

import type { ExtIdPair } from '../logic/storage';
import { setExtIdPair } from '../logic/storage';
import {
    getOrRefreshExtIdPair,
    getTabById,
    getTabTreeFromChrome,
    isContentScriptPage,
    isExtPageExistByBrowserAPI,
} from './chrome-service';

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
    if (await isExtPageExistByBrowserAPI()) {
        // 单例
        // TODO: 再次点击则focus
        return;
    }
    const extWindow = await browser.windows.create({
        url: 'tree.html',
        type: 'popup',
        width: 358,
        height: 896,
        focused: true,
    });
    if (extWindow.tabs === undefined || extWindow.tabs.length < 0)
        throw new Error('window tabs must has at least one tab');
    const extTab = extWindow!.tabs[0];
    const extIdPair: ExtIdPair = {
        windowId: extTab.windowId!,
        tabId: extTab.id!,
    };
    console.log(`windowId: ${extIdPair.windowId}, tabId: ${extIdPair.tabId}`);
    // 这里始终更新extIdPair
    setExtIdPair(extIdPair);
});

// #### Ext Page Fire的事件
// content-script获取浏览器window
onMessage('get-tree', async () => {
    const windows = await getTabTreeFromChrome();
    // 具体的Window interface不能转换成通用的JsonValue类型
    return windows as any;
});
// tree-view的node focus状态改变
onMessage('focus-node', (msg) => {
    // TODO 如果有网页重新加载，会导致active状态被完成load的网页抢走
    const { tabId } = msg.data;
    browser.tabs.update(tabId, { active: true });
});
// tree-view 删除node
onMessage('remove-node', (msg) => {
    // TODO 如果有网页重新加载，会导致active状态被完成load的网页抢走
    const { tabId } = msg.data;
    browser.tabs.remove(tabId);
});

// #### 浏览器Fire的事件
const sendMessageToExt = async (messageId: string, message: any) => {
    const extIdPair = await getOrRefreshExtIdPair();
    if (extIdPair === null) return;
    return sendMessage(messageId, message, { context: 'content-script', tabId: extIdPair.tabId });
};

browser.tabs.onCreated.addListener(async (tab) => {
    // 1. 如果创建的是contentScript则忽略
    console.log('[bg]: tab created!');
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
    sendMessageToExt('update-tab', tab);
});

browser.tabs.onMoved.addListener((tabId, { windowId, fromIndex, toIndex }) => {
    sendMessageToExt('move-tab', {
        windowId,
        fromIndex,
        toIndex,
        tabId,
    });
});

browser.tabs.onActivated.addListener(({ tabId, windowId }) => {
    sendMessageToExt('activated-tab', { windowId, tabId });
});
/**
 * tab从window拉出来的时候也会发这个事件
 * attach和WindowCreate是不是冲突了？
 */
browser.tabs.onAttached.addListener(async (tabId, { newPosition, newWindowId }) => {
    console.log('attached');
    const tab = await getTabById(tabId);
    sendMessageToExt('add-tab-with-index', { newTab: tab, newWindowId, toIndex: newPosition });
});

browser.tabs.onDetached.addListener((tabId, { oldWindowId }) => {
    console.log('detached');
    sendMessageToExt('remove-tab', { windowId: oldWindowId, tabId });
});
/**
 * detach tab的时候会触发这个事件
 */
browser.windows.onCreated.addListener(async (window) => {
    console.log('window create!');
    // Tab detach的时候也会发这个Event
    sendMessageToExt('add-window', window);
});
/**
 * 最后一个tab合并到另一个window时会发这个Event
 */
browser.windows.onRemoved.addListener((windowId) => {
    console.log('window remove!');
    sendMessageToExt('remove-window', { windowId });
});

browser.windows.onFocusChanged.addListener(() => {});
