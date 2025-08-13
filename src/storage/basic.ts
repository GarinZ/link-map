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

// Persist Link Map window bounds
const EXT_WINDOW_BOUNDS = 'extWindowBounds';
export interface WindowBounds {
    left: number;
    top: number;
    width: number;
    height: number;
}

export const getExtWindowBounds = async (): Promise<WindowBounds | null> => {
    const data = await storage.local.get(EXT_WINDOW_BOUNDS);
    return isEmpty(data) ? null : (JSON.parse(data[EXT_WINDOW_BOUNDS]) as WindowBounds);
};

export const setExtWindowBounds = async (bounds: Partial<WindowBounds>): Promise<void> => {
    const oldData = (await getExtWindowBounds()) ?? {};
    return await storage.local.set({
        [EXT_WINDOW_BOUNDS]: JSON.stringify({
            ...oldData,
            ...bounds,
        }),
    });
};
