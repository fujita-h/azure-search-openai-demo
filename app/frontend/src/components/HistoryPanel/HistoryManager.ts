import { IApproach, ApproachType } from "./Approaches/IApproach";
import { NoOperationApproach } from "./Approaches/NoOperation";
import { IndexedDBApproach } from "./Approaches/IndexedDB";

export const useHistoryManager = (type?: ApproachType): IApproach => {
    switch (type) {
        case undefined:
        case null:
            return new NoOperationApproach();
        case "IndexedDB":
            return new IndexedDBApproach("chat-database", "chat-history");
        default:
            throw new Error(`Unknown approach type: ${type}`);
    }
};
