import { Dexie } from 'dexie';

const DB_VERSION = 1;
export const DB_KEY = 'snapshot';

interface Snapshot {
    id: string;
    data: Fancytree.NodeData[];
    updateTime: number;
}

export class TabMasterDB extends Dexie {
    // Declare implicit table properties.
    // (just to inform Typescript. Instanced by Dexie in stores() method)
    snapshot!: Dexie.Table<Snapshot, string>;

    // ...other tables goes here...

    constructor() {
        super('TabMasterDB');
        this.version(DB_VERSION).stores({
            snapshot: 'id',
            // ...other tables goes here...
        });
    }

    async updateByTree(tree: Fancytree.Fancytree) {
        const snapshot = tree.toDict() as Fancytree.NodeData[];
        await this.snapshot.put({ data: snapshot, id: DB_KEY, updateTime: Date.now() });
    }
}
