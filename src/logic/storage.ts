import { isEmpty } from 'lodash';
import { storage } from 'webextension-polyfill';

export interface ExtIdPair {
    windowId: number;
    tabId: number;
}

export const setExtIdPair = (extIdPair: ExtIdPair): Promise<void> => {
    return storage.local.set(extIdPair);
};

export const getExtIdPair = async (): Promise<ExtIdPair | null> => {
    console.log(storage);
    const [windowIdObj, tabIdObj] = await Promise.all([
        storage.local.get('windowId'),
        storage.local.get('tabId'),
    ]);
    // 如果key不存在，返回的localStorage为空对象
    return isEmpty(windowIdObj) || isEmpty(tabIdObj)
        ? null
        : {
              windowId: windowIdObj.windowId,
              tabId: tabIdObj.tabId,
          };
};
