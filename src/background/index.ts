import { onMessage } from '@garinz/webext-bridge';
import log from 'loglevel';
import browser from 'webextension-polyfill';

import { setLogLevel } from '../config/log-config';
import type { LocalStorageImportData } from '../import/App';
import {
    getExtPageInfo,
    removeExtPageInfo,
    setExtPageInfo,
    setPrevFocusWindowId,
} from '../storage/basic';
import { TabMasterDB } from '../storage/idb';
import { setIsNewUser, setIsUpdate } from '../storage/user-journey';
import type { ExportJsonData } from '../tree/features/settings/Settings';
import { isContentScriptPage, sendMessageToExt } from './event-bus';

try {
    setLogLevel();

    async function getPrimaryTabForWindow(windowId?: number) {
        if (windowId == null) {
            return null;
        }
        const tabs = await browser.tabs.query({ windowId });
        return tabs[0] ?? null;
    }

    async function storeExtPageInfo(window: browser.Windows.Window) {
        const extTab = window.tabs?.[0] ?? (await getPrimaryTabForWindow(window.id));
        if (!extTab?.id || !extTab.windowId) {
            throw new Error('Failed to resolve Link Map tab for created window.');
        }
        await setExtPageInfo({
            windowId: extTab.windowId,
            tabId: extTab.id,
        });
    }

    async function enableSidePanelByDefault() {
        if (!chrome.sidePanel?.setPanelBehavior) return;
        await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    }

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
            details.previousVersion !== '1.0.10' &&
            browser.runtime.getManifest().version === '1.0.10'
        ) {
            // chrome.runtime.getManifest().version
            await setIsUpdate(true);
        }
        const db = new TabMasterDB();
        await db.initSetting();
        await enableSidePanelByDefault();
        await syncTabsCountInBadge();
        await removeExtPageInfo();
    });

    browser.runtime.onStartup.addListener(async () => {
        await enableSidePanelByDefault();
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
        await storeExtPageInfo(extWindow);
    }

    async function openFloatingModalWindow() {
        const displayInfos = await chrome.system.display.getInfo();
        const primaryDisplayInfo = displayInfos.find((item) => item.isPrimary);
        const workAreaWidth = primaryDisplayInfo?.workArea.width ?? 1440;
        const workAreaHeight = primaryDisplayInfo?.workArea.height ?? 960;
        const workAreaLeft = primaryDisplayInfo?.workArea.left ?? 0;
        const workAreaTop = primaryDisplayInfo?.workArea.top ?? 0;
        const width = Math.min(1120, Math.floor(workAreaWidth * 0.7));
        const height = Math.min(820, Math.floor(workAreaHeight * 0.82));
        const left = workAreaLeft + Math.max(0, Math.floor((workAreaWidth - width) / 2));
        const top = workAreaTop + Math.max(0, Math.floor((workAreaHeight - height) / 2));
        const extWindow = await browser.windows.create({
            url: 'tree.html?display=floating-modal',
            type: 'popup',
            width,
            height,
            top,
            left,
            focused: true,
        });
        await storeExtPageInfo(extWindow);
    }

    onMessage('tree-ready', async (msg) => {
        const { windowId, tabId } = msg.data;
        await setExtPageInfo({ windowId, tabId });
    });

    const focusOrCreateExtWindow = async (
        createExtWindow = openNewExtWindow,
        shouldReuseWindow: (url?: string) => boolean = (url) =>
            url === browser.runtime.getURL('tree.html'),
    ) => {
        const extIdPair = await getExtPageInfo();
        if (extIdPair == null) {
            await createExtWindow();
        } else {
            try {
                const extTab = await browser.tabs.get(extIdPair.tabId);
                if (!shouldReuseWindow(extTab.url)) {
                    await createExtWindow();
                    return;
                }
                // 页面已打开，则窗口focused
                await browser.windows.update(extIdPair.windowId, { focused: true });
            } catch {
                // 防止localStorage数据未清除，但是页面已经关闭的情况
                await createExtWindow();
            }
        }
    };

    const closeFloatingModalIfOpen = async () => {
        const extIdPair = await getExtPageInfo();
        if (extIdPair == null) {
            return false;
        }
        try {
            const extTab = await browser.tabs.get(extIdPair.tabId);
            const isFloatingModal =
                extTab.url === browser.runtime.getURL('tree.html?display=floating-modal');
            if (!isFloatingModal) {
                return false;
            }
            await browser.windows.remove(extIdPair.windowId);
            await removeExtPageInfo();
            return true;
        } catch {
            await removeExtPageInfo();
            return false;
        }
    };

    const closeFloatingModalOnBlur = async (focusedWindowId: number) => {
        const extIdPair = await getExtPageInfo();
        if (!extIdPair || focusedWindowId === extIdPair.windowId) {
            return;
        }
        await closeFloatingModalIfOpen();
    };

    const openLinkMap = async (windowId?: number, shouldToggleFloatingModal = false) => {
        const setting = await new TabMasterDB().getSetting();
        const shouldUseSidePanel = setting?.display === 'embedded-sidebar';
        const shouldUseFloatingModal = setting?.display === 'floating-modal';
        if (shouldUseSidePanel && chrome.sidePanel?.open) {
            try {
                if (windowId) {
                    await chrome.sidePanel.open({ windowId });
                } else {
                    const lastFocusedWindow = await browser.windows.getLastFocused();
                    if (lastFocusedWindow.id) {
                        await chrome.sidePanel.open({ windowId: lastFocusedWindow.id });
                        return;
                    }
                }
                return;
            } catch (error) {
                log.warn('Failed to open side panel, falling back to popup window.', error);
            }
        }
        if (shouldUseFloatingModal) {
            if (shouldToggleFloatingModal && (await closeFloatingModalIfOpen())) {
                return;
            }
            await focusOrCreateExtWindow(
                openFloatingModalWindow,
                (url) => url === browser.runtime.getURL('tree.html?display=floating-modal'),
            );
            return;
        }
        await focusOrCreateExtWindow();
    };

    /**
     * 点击插件按钮：打开一个TreeView页面
     * 将extIdPair更新到localStorage中
     * This Method Wouldn't Fire if popup has benn set
     */
    browser.action.onClicked.addListener((tab) => {
        setPrevFocusWindowId(tab.windowId!);
        openLinkMap(tab.windowId);
    });

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
        setPrevFocusWindowId(windowId);
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

    browser.windows.onFocusChanged.addListener(async (windowId) => {
        log.debug('[bg]: window focus changed!');
        await closeFloatingModalOnBlur(windowId);
        if (windowId !== browser.windows.WINDOW_ID_NONE) {
            const [activeTab] = await browser.tabs.query({ active: true, windowId });
            if (
                !activeTab ||
                isContentScriptPage(activeTab.url) ||
                isContentScriptPage(activeTab.pendingUrl)
            ) {
                return;
            }
            await setPrevFocusWindowId(windowId);
        }
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
            await openLinkMap(undefined, true);
        }
    });

    enableSidePanelByDefault().catch((error) => {
        log.warn('Failed to enable side panel action behavior.', error);
    });
} catch (error) {
    log.error(error);
}
