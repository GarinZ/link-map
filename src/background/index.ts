import { onMessage } from '@garinz/webext-bridge';
import log from 'loglevel';
import browser from 'webextension-polyfill';

import { setLogLevel } from '../config/log-config';
import type { LocalStorageImportData } from '../import/App';
import { getExtPageInfo, removeExtPageInfo, setExtPageInfo } from '../storage/ext-page-info';
import { TabMasterDB } from '../storage/idb';
import { setIsNewUser, setIsUpdate } from '../storage/user-journey';
import type { ExportJsonData } from '../tree/features/settings/Settings';
import { isContentScriptPage, sendMessageToExt } from './event-bus';

try {
    setLogLevel();

    async function syncTabsCountInBadge() {
        const allTabs = await browser.tabs.query({});
        await browser.action.setBadgeBackgroundColor({ color: '#2b2d31' });
        await browser.action.setBadgeText({ text: allTabs.length.toString() });
    }

    // ext安装后的状态
    browser.runtime.onInstalled.addListener(async (details) => {
        log.debug('Extension installed', details.reason);
        log.debug(__ENV__);
        log.debug(__TARGET__);
        // 清除localStorage中的extPageInfo
        if (details.reason === 'install') {
            await setIsNewUser(true);
        }
        if (
            details.reason === 'update' &&
            details.previousVersion !== '1.0.7' &&
            browser.runtime.getManifest().version === '1.0.7'
        ) {
            // chrome.runtime.getManifest().version
            await setIsUpdate(true);
        }
        const db = new TabMasterDB();
        await db.initSetting();
        await syncTabsCountInBadge();
        await removeExtPageInfo();
    });

    async function openNewExtWindow() {
        const displayInfos = await chrome.system.display.getInfo();
        const primaryDisplayInfo = displayInfos.find((item) => item.isPrimary);
        const width = primaryDisplayInfo ? Math.floor(primaryDisplayInfo.workArea.width / 5) : 895;
        const height = primaryDisplayInfo ? primaryDisplayInfo.workArea.height : 1050;
        const left = primaryDisplayInfo ? primaryDisplayInfo.workArea.width - width : 0;
        const extWindow = await browser.windows.create({
            url: 'tree.html',
            type: 'popup',
            width,
            height,
            top: 0,
            left,
            focused: true,
        });
        const extTab = extWindow.tabs![0];
        await setExtPageInfo({
            windowId: extTab.windowId!,
            tabId: extTab.id!,
        });
    }

    onMessage('tree-ready', async (msg) => {
        const { windowId, tabId } = msg.data;
        await setExtPageInfo({ windowId, tabId });
    });

    const focusOrCreateExtWindow = async () => {
        const extIdPair = await getExtPageInfo();
        if (extIdPair == null) {
            await openNewExtWindow();
        } else {
            // 页面已打开，则窗口focused
            try {
                await browser.windows.update(extIdPair.windowId, { focused: true });
            } catch {
                // 防止localStorage数据未清除，但是页面已经关闭的情况
                await openNewExtWindow();
            }
        }
    };

    /**
     * 点击插件按钮：打开一个TreeView页面
     * 将extIdPair更新到localStorage中
     * This Method Wouldn't Fire if popup has benn set
     */
    browser.action.onClicked.addListener(focusOrCreateExtWindow);

    // #### 浏览器Fire的事件
    browser.tabs.onCreated.addListener(async (tab) => {
        syncTabsCountInBadge();
        // 1. 如果创建的是contentScript则忽略
        log.debug('[bg]: tab created!', tab);
        if (isContentScriptPage(tab.url) || isContentScriptPage(tab.pendingUrl)) return;

        // 2. 其他TAB，发给contentScript做tree更新
        sendMessageToExt('add-tab', tab);
    });

    browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
        syncTabsCountInBadge();
        // optimize 1. 如果删除的是自己怎么办？
        log.debug('[bg]: tab removed!');
        // 如果删除的是extPage，记录window的width/height/left/top到localStorage
        sendMessageToExt('remove-tab', { windowId: removeInfo.windowId, tabId });
    });

    browser.tabs.onUpdated.addListener(async (_tabId, _changeInfo, tab) => {
        log.debug('[bg]: tab updated!', tab);
        sendMessageToExt('update-tab', tab);
    });

    /**
     * 只有同窗口tab前后顺序移动会影响触发这个方法
     */
    browser.tabs.onMoved.addListener((tabId, { windowId, fromIndex, toIndex }) => {
        log.debug('[bg]: tab moved!');
        sendMessageToExt('move-tab', {
            windowId,
            fromIndex,
            toIndex,
            tabId,
        });
    });

    browser.tabs.onActivated.addListener(({ tabId, windowId }) => {
        log.debug('[bg]: tab activated!');
        sendMessageToExt('activated-tab', { windowId, tabId });
    });
    /**
     * 如果没有window会先触发window的创建事件
     *
     */
    browser.tabs.onAttached.addListener((tabId, { newPosition, newWindowId }) => {
        log.debug('[bg]: attached, tabId:', tabId);
        sendMessageToExt('attach-tab', {
            windowId: newWindowId,
            tabId,
            newIndex: newPosition,
        });
    });

    browser.tabs.onDetached.addListener((tabId) => {
        log.debug('[bg]: detached, tabId:', tabId);
        sendMessageToExt('detach-tab', { tabId });
    });

    browser.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
        log.debug('[bg]: replaced, tabId:', addedTabId);
        sendMessageToExt('replace-tab', { addedTabId, removedTabId });
    });
    /**
     * detach tab的时候会触发这个事件
     */
    browser.windows.onCreated.addListener(async (window) => {
        log.debug('[bg]: window create!');
        // Tab detach的时候也会发这个Event
        sendMessageToExt('add-window', window);
    });
    /**
     * 最后一个tab合并到另一个window时会发这个Event
     */
    browser.windows.onRemoved.addListener(async (windowId) => {
        log.debug('[bg]: window remove!');
        const extIdPair = await getExtPageInfo();
        if (extIdPair && extIdPair.windowId === windowId) await removeExtPageInfo();
        sendMessageToExt('remove-window', { windowId });
    });

    browser.windows.onFocusChanged.addListener((windowId) => {
        log.debug('[bg]: window focus changed!');
        sendMessageToExt('window-focus', { windowId });
    });

    const createImportPage = async (importData: LocalStorageImportData) => {
        const displayInfos = await chrome.system.display.getInfo();
        const primaryDisplayInfo = displayInfos.find((item) => item.isPrimary);
        const width = primaryDisplayInfo ? Math.floor(primaryDisplayInfo.workArea.width / 5) : 895;
        const height = primaryDisplayInfo ? primaryDisplayInfo.workArea.height : 1050;
        await browser.windows.create({
            url: 'import.html',
            type: 'popup',
            width,
            height,
            left: 0,
            top: 0,
            focused: true,
        });
        await browser.storage.local.set({ importData });
    };

    onMessage('import-data', async (data) => {
        createImportPage({ data: data.data as ExportJsonData, type: 'linkMap' });
    });

    onMessage('import-tabOutliner-data', async (data) => {
        createImportPage({ data: data.data, type: 'tabOutliner' });
    });

    browser.commands.onCommand.addListener(async (command) => {
        if (command === 'openLinkMap') {
            await focusOrCreateExtWindow();
        }
    });
} catch (error) {
    log.error(error);
}
