import { isEmpty } from 'lodash';
import { storage } from 'webextension-polyfill';

const EXT_PAGE_INFO = 'extPageInfo';

export interface Basic {
    windowId: number;
    tabId: number;
    ready: boolean;
}

export const getExtPageInfo = async (): Promise<Basic | null> => {
    const extPageInfo = await storage.local.get(EXT_PAGE_INFO);
    // 如果key不存在，返回的localStorage为空对象
    return isEmpty(extPageInfo) ? null : JSON.parse(extPageInfo[EXT_PAGE_INFO]);
};

export const setExtPageInfo = async (extPageInfo: Partial<Basic>): Promise<void> => {
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

const PREV_FOCUS_WINDOW_ID = 'prevFocusWindowId';
export const getPrevFocusWindowId = async (): Promise<number | null> => {
    const prevFocusWindowId = await storage.local.get(PREV_FOCUS_WINDOW_ID);
    return isEmpty(prevFocusWindowId) ? null : prevFocusWindowId[PREV_FOCUS_WINDOW_ID];
};

export const setPrevFocusWindowId = async (prevFocusWindowId: number): Promise<void> => {
    return await storage.local.set({
        [PREV_FOCUS_WINDOW_ID]: prevFocusWindowId,
    });
};

export const removePrevFocusWindowId = () => {
    return storage.local.remove(PREV_FOCUS_WINDOW_ID);
};
