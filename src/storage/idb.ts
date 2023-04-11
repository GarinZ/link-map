import { Dexie } from 'dexie';

export const DB_KEY = 'snapshot';

interface Snapshot {
    id: string;
    data: Fancytree.NodeData[];
    updateTime: number;
}

export type ThemeType = 'light' | 'dark' | 'auto';

export interface Setting {
    id: number;
    theme: ThemeType;
    display: 'popup' | 'tab' | 'embedded-sidebar';
    autoScrollToActiveTab: boolean;
    createNewTabByLevel: boolean;
}

export const DEFAULT_SETTING: Setting = {
    id: 1,
    theme: 'dark',
    display: 'popup',
    autoScrollToActiveTab: false,
    createNewTabByLevel: false,
};

export class TabMasterDB extends Dexie {
    // Declare implicit table properties.
    // (just to inform Typescript. Instanced by Dexie in stores() method)
    snapshot!: Dexie.Table<Snapshot, string>;
    setting!: Dexie.Table<Setting, number>;

    // ...other tables goes here...

    constructor() {
        super('TabMasterDB');

        this.version(2).stores({
            snapshot: 'id',
            setting: 'id',
            // ...other tables goes here...
        });
    }

    async getSnapshot() {
        const snapshot = await this.snapshot.get(DB_KEY);
        return snapshot?.data;
    }

    async setSnapshot(snapshot: Fancytree.NodeData[]) {
        await this.snapshot.put({ data: snapshot, id: DB_KEY, updateTime: Date.now() });
    }

    async initSetting() {
        const currentSetting = await this.getSetting();
        if (!currentSetting) {
            await this.setting.put(DEFAULT_SETTING);
        }
    }

    async getSetting() {
        return this.setting.get(1);
    }

    async updateSettingPartial(setting: Partial<Setting>) {
        await this.setting.update(1, setting);
    }
}
