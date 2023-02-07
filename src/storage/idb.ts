import type { DataTypeKey, GetDataType } from '@garinz/webext-bridge';
import { Dexie } from 'dexie';
import type { JsonValue } from 'type-fest';

const DB_VERSION = 1;
export const DB_KEY = 'snapshot';

interface Snapshot {
    id: string;
    data: Fancytree.NodeData[];
    updateTime: number;
}

export interface Message {
    id?: number;
    ts: number;
    messageId: DataTypeKey;
    data: any;
}

export class TabMasterDB extends Dexie {
    // Declare implicit table properties.
    // (just to inform Typescript. Instanced by Dexie in stores() method)
    snapshot!: Dexie.Table<Snapshot, string>;
    mq!: Dexie.Table<Message, number>;

    // ...other tables goes here...

    constructor() {
        super('TabMasterDB');
        this.version(DB_VERSION).stores({
            snapshot: 'id',
            mq: '++id',
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

    async pushMsg<K extends DataTypeKey>(messageId: K, message: GetDataType<K, JsonValue>) {
        await this.mq.add({ messageId, data: message, ts: Date.now() });
    }

    async popMsg() {
        const message = await this.mq.orderBy('ts').first();
        if (message) {
            await this.mq.delete(message.id!);
        }
        return message;
    }

    async clearMsg() {
        await this.mq.clear();
    }

    async consumeAllMsg() {
        const messages = await this.mq.toArray();
        await this.mq.clear();
        return messages;
    }
}
