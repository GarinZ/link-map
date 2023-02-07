import browser from 'webextension-polyfill';

import { getExtPageInfo, removeExtPageInfo, setExtPageInfo } from '../storage/ext-page-info';
import { isContentScriptPage, sendMessageToExt } from './event-bus';

// ext安装后的状态
browser.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed');
    // 清除localStorage中的extPageInfo
    await removeExtPageInfo();
});

/**
 * 点击插件按钮：打开一个TreeView页面
 * 将extIdPair更新到localStorage中
 * This Method Wouldn't Fire if popup has benn set
 */
browser.action.onClicked.addListener(async () => {
    const extIdPair = await getExtPageInfo();
    if (extIdPair != null) {
        // 页面已打开，则窗口focused
        await browser.windows.update(extIdPair.windowId, { focused: true });
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
    const extTab = extWindow.tabs![0];
    // 这里始终更新extIdPair
    await setExtPageInfo({
        windowId: extTab.windowId!,
        tabId: extTab.id!,
    });
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
browser.tabs.onAttached.addListener((tabId, { newPosition, newWindowId }) => {
    console.log('[bg]: attached, tabId:', tabId);
    sendMessageToExt('attach-tab', {
        windowId: newWindowId,
        tabId,
        newIndex: newPosition,
    });
});

browser.tabs.onDetached.addListener((tabId) => {
    console.log('[bg]: detached, tabId:', tabId);
    sendMessageToExt('detach-tab', { tabId });
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
browser.windows.onRemoved.addListener(async (windowId) => {
    console.log('[bg]: window remove!');
    const extIdPair = await getExtPageInfo();
    if (extIdPair && extIdPair.windowId === windowId) await removeExtPageInfo();
    sendMessageToExt('remove-window', { windowId });
});

browser.windows.onFocusChanged.addListener((windowId) => {
    console.log('[bg]: window focus changed!');
    sendMessageToExt('window-focus', { windowId });
});
