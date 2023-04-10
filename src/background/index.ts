import { onMessage } from '@garinz/webext-bridge';
import log from 'loglevel';
import browser from 'webextension-polyfill';

import { setLogLevel } from '../config/errors';
import { getExtPageInfo, removeExtPageInfo, setExtPageInfo } from '../storage/ext-page-info';
import { TabMasterDB } from '../storage/idb';
import { setIsNewUser, setIsUpdate } from '../storage/user-journey';

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

    browser.tabs.onCreated.addListener(async () => {
        syncTabsCountInBadge();
    });

    browser.tabs.onRemoved.addListener(async () => {
        syncTabsCountInBadge();
    });
    /**
     * 最后一个tab合并到另一个window时会发这个Event
     */
    browser.windows.onRemoved.addListener(async (windowId) => {
        const extIdPair = await getExtPageInfo();
        if (extIdPair && extIdPair.windowId === windowId) await removeExtPageInfo();
    });

    browser.commands.onCommand.addListener(async (command) => {
        if (command === 'openLinkMap') {
            await focusOrCreateExtWindow();
        }
    });
} catch (error) {
    log.error(error);
}
