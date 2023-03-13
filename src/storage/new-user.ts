import { isEmpty } from 'lodash';
import { storage } from 'webextension-polyfill';

const IS_NEW_USER = 'isNewUser';

export const getIsNewUser = async (): Promise<boolean> => {
    const isNewUser = await storage.local.get(IS_NEW_USER);
    // 如果key不存在，返回的localStorage为空对象
    return isEmpty(isNewUser) ? true : JSON.parse(isNewUser[IS_NEW_USER]);
};

export const setIsNewUser = async (isNewUser: boolean): Promise<void> => {
    return await storage.local.set({
        [IS_NEW_USER]: JSON.stringify(isNewUser),
    });
};

export const removeIsNewUser = () => {
    return storage.local.remove(IS_NEW_USER);
};
