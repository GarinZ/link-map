import type { Dispatch, SetStateAction } from 'react';
import { createContext } from 'react';

import type { Setting } from '../storage/idb';
import { DEFAULT_SETTING } from '../storage/idb';

interface ISettingContext {
    setting: Setting;
    setSetting: Dispatch<SetStateAction<Setting>>;
}
export const SettingContext = createContext({
    setting: DEFAULT_SETTING,
    setSetting: () => {},
} as ISettingContext);
