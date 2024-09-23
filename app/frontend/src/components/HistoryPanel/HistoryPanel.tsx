import { Panel, PanelType } from "@fluentui/react";
import { useEffect, useRef, useState } from "react";
import { IDBPDatabase, openDB } from "idb";
import { Answers } from "./Approaches/IApproach";

export const HistoryPanel = ({ isOpen, onClose, onChatSelected }: { isOpen: boolean; onClose: () => void; onChatSelected: (answers: Answers) => void }) => {
    const [historyDb, setHistoryDb] = useState<IDBPDatabase<unknown> | undefined>();
    const [history, setHistory] = useState<{ id: string; title: string; timestamp: number }[]>([]);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const cursorRef = useRef<IDBValidKey | undefined>("");

    const loadMoreHistory = async () => {
        if (historyDb) {
            const tx = historyDb.transaction("chat-history", "readonly");
            const store = tx.objectStore("chat-history");

            let cursor = cursorRef.current ? await store.openCursor(IDBKeyRange.upperBound(cursorRef.current), "prev") : await store.openCursor(null, "prev");
            if (!cursor) {
                setHasMoreHistory(false);
                return;
            }
            const loadedItems: any[] = [];
            for (let i = 0; i < 2 && cursor; i++) {
                loadedItems.push(cursor.value);
                cursor = await cursor.continue();
            }
            cursorRef.current = cursor?.key;

            setHistory(prevHistory => [...prevHistory, ...loadedItems]);
            if (cursorRef.current === undefined) {
                setHasMoreHistory(false);
            }
        }
    };

    useEffect(() => {
        const initDB = async () => {
            const database = await openDB("chat-database", 1, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains("chat-history")) {
                        db.createObjectStore("chat-history", { keyPath: "id" });
                    }
                }
            });
            setHistoryDb(database);
        };
        initDB();
    }, []);

    return (
        <Panel
            type={PanelType.customNear}
            style={{ marginTop: "62px" }}
            customWidth="300px"
            isBlocking={false}
            isOpen={isOpen}
            onOpen={() => {
                loadMoreHistory();
            }}
            onDismiss={() => onClose()}
            onDismissed={() => {
                setHistory([]);
                cursorRef.current = "";
                setHasMoreHistory(true);
            }}
        >
            {history && (
                <ul>
                    {history.map((h, i) => (
                        <li key={i}>
                            <button
                                onClick={async () => {
                                    if (!historyDb) return;
                                    const item = await historyDb.get("chat-history", h.id);
                                    onChatSelected(item.answers);
                                    //setAnswers(() => item.answers);
                                    //lastQuestionRef.current = item.answers.at(-1)[0];
                                }}
                            >
                                {h.title}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {hasMoreHistory && <button onClick={loadMoreHistory}>さらに読み込む</button>}
        </Panel>
    );
};
