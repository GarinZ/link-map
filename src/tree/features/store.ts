import { TabMasterDB } from '../../storage/idb';

interface Store {
    tree: Fancytree.Fancytree | null;
    db: TabMasterDB;
}

export default {
    tree: null,
    db: new TabMasterDB(),
} as Store;
