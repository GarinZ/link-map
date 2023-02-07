import { isEmpty } from 'lodash';
import { storage } from 'webextension-polyfill';

const EXT_PAGE_INFO = 'extPageInfo';

export interface ExtIdPair {
    windowId: number;
    tabId: number;
}

export const setExtIdPair = async (extIdPair: ExtIdPair): Promise<void> => {
    return await storage.local.set({ [EXT_PAGE_INFO]: JSON.stringify(extIdPair) });
};

export const getExtIdPair = async (): Promise<ExtIdPair | null> => {
    const extPageInfo = await storage.local.get(EXT_PAGE_INFO);
    // 如果key不存在，返回的localStorage为空对象
    return isEmpty(extPageInfo) ? null : JSON.parse(extPageInfo[EXT_PAGE_INFO]);
};

export const removeExtIdPair = () => {
    return storage.local.remove(EXT_PAGE_INFO);
};

export const clearExtIdPair = () => {
    return storage.local.clear();
};
