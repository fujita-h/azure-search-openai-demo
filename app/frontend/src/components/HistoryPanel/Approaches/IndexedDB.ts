import { IDBPDatabase, openDB } from "idb";
import { IApproach, Answers } from "./IApproach";

export class IndexedDBApproach implements IApproach {
    private dbName: string;
    private storeName: string;
    private dbPromise: Promise<IDBPDatabase> | null = null;

    constructor(dbName: string, storeName: string) {
        this.dbName = dbName;
        this.storeName = storeName;
    }

    private async init() {
        const storeName = this.storeName;
        if (!this.dbPromise) {
            this.dbPromise = openDB(this.dbName, 1, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: "id" });
                    }
                }
            });
        }
        return this.dbPromise;
    }

    async addHistory(id: string, answers: Answers): Promise<void> {
        const timestamp = new Date().getTime();
        const db = await this.init(); // 自動的に初期化
        const tx = db.transaction(this.storeName, "readwrite");
        const current = await tx.objectStore(this.storeName).get(id);
        if (current) {
            await tx.objectStore(this.storeName).put({ ...current, id, timestamp, answers });
        } else {
            const title = answers[0][0].length > 50 ? answers[0][0].substring(0, 50) + "..." : answers[0][0];
            await tx.objectStore(this.storeName).add({ id, title, timestamp, answers });
        }
        await tx.done;
    }
}
