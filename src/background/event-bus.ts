import type { DataTypeKey, GetDataType } from '@garinz/webext-bridge';
import { sendMessage } from '@garinz/webext-bridge';
import type { JsonValue } from 'type-fest';
import browser from 'webextension-polyfill';

import { getExtPageInfo } from '../storage/ext-page-info';
import { TabMasterDB } from '../storage/idb';

const EXT_HOME_PAGE_PATH = 'tree.html';
const db = new TabMasterDB();
export async function sendMessageToExt<K extends DataTypeKey>(
    messageId: K,
    message: GetDataType<K, JsonValue>,
) {
    const extPageInfo = await getExtPageInfo();
    if (extPageInfo === null || !extPageInfo.ready) {
        // 没有窗口打开：存储事件到indexedDB
        await db.pushMsg(messageId, message);
        return;
    }
    return sendMessage(messageId, message, { context: 'content-script', tabId: extPageInfo.tabId });
}

export function isContentScriptPage(url?: string) {
    return url === browser.runtime.getURL(EXT_HOME_PAGE_PATH);
}
