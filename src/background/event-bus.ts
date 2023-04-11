import type { DataTypeKey, GetDataType } from '@garinz/webext-bridge';
import { sendMessage } from '@garinz/webext-bridge';
import type { JsonValue } from 'type-fest';
import browser from 'webextension-polyfill';

import { getExtPageInfo } from '../storage/basic';

const EXT_HOME_PAGE_PATH = 'tree.html';

export async function sendMessageToExt<K extends DataTypeKey>(
    messageId: K,
    message: GetDataType<K, JsonValue>,
) {
    const extPageInfo = await getExtPageInfo();
    if (extPageInfo === null) {
        // 没有窗口打开：存储事件到indexedDB
        return;
    }
    return sendMessage(messageId, message, {
        context: 'content-script',
        tabId: extPageInfo.tabId,
    }).catch(() => {
        // ignore: 不处理窗口未打开的情况
    });
}

export function isContentScriptPage(url?: string) {
    return url === browser.runtime.getURL(EXT_HOME_PAGE_PATH);
}
