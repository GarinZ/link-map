import { isEmpty } from 'lodash';
import { storage } from 'webextension-polyfill';

const EXT_PAGE_INFO = 'extPageInfo';

export interface ExtPageInfo {
    windowId: number;
    tabId: number;
    ready: boolean;
}

export const getExtPageInfo = async (): Promise<ExtPageInfo | null> => {
    const extPageInfo = await storage.local.get(EXT_PAGE_INFO);
    // 如果key不存在，返回的localStorage为空对象
    return isEmpty(extPageInfo) ? null : JSON.parse(extPageInfo[EXT_PAGE_INFO]);
};

export const setExtPageInfo = async (extPageInfo: Partial<ExtPageInfo>): Promise<void> => {
    const oldData = (await getExtPageInfo()) ?? {};
    return await storage.local.set({
        [EXT_PAGE_INFO]: JSON.stringify({
            ...oldData,
            ...extPageInfo,
        }),
    });
};

export const removeExtPageInfo = () => {
    return storage.local.remove(EXT_PAGE_INFO);
};
