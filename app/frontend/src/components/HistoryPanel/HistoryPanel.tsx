import { Panel, PanelType } from "@fluentui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { IDBPDatabase, openDB } from "idb";
import { Answers, ApproachType } from "./Approaches/IApproach";
import { HistoryItem, HistoryData } from "../HistoryItem";

const HISTORY_COUNT = 20;

export const HistoryPanel = ({
    type,
    isOpen,
    onClose,
    onChatSelected
}: {
    type: ApproachType;
    isOpen: boolean;
    onClose: () => void;
    onChatSelected: (answers: Answers) => void;
}) => {
    const [historyDb, setHistoryDb] = useState<IDBPDatabase<unknown> | undefined>();
    const [history, setHistory] = useState<{ id: string; title: string; timestamp: number }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const cursorRef = useRef<IDBValidKey | undefined>("");

    const loadMoreHistory = async () => {
        if (type === "IndexedDB") {
            if (historyDb) {
                setIsLoading(true);
                const tx = historyDb.transaction("chat-history", "readonly");
                const store = tx.objectStore("chat-history");

                let cursor = cursorRef.current
                    ? await store.openCursor(IDBKeyRange.upperBound(cursorRef.current), "prev")
                    : await store.openCursor(null, "prev");
                if (!cursor) {
                    setHasMoreHistory(false);
                    return;
                }
                const loadedItems: any[] = [];
                for (let i = 0; i < HISTORY_COUNT && cursor; i++) {
                    loadedItems.push(cursor.value);
                    cursor = await cursor.continue();
                }
                cursorRef.current = cursor?.key;

                setHistory(prevHistory => [...prevHistory, ...loadedItems]);
                if (cursorRef.current === undefined) {
                    setHasMoreHistory(false);
                }
                setIsLoading(false);
            }
        }
    };

    const handleSelect = async (id: string) => {
        if (type === "IndexedDB") {
            if (!historyDb) return;
            const item = await historyDb.get("chat-history", id);
            onChatSelected(item.answers);
        }
    };

    const handleDelete = async (id: string) => {
        if (type === "IndexedDB") {
            if (!historyDb) return;
            historyDb.delete("chat-history", id);
            setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
        }
    };

    useEffect(() => {
        if (type === "IndexedDB") {
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
        }
    }, []);

    const groupedHistory = useMemo(() => groupChatHistory(history), [history]);

    return (
        <Panel
            type={PanelType.customNear}
            style={{ overflowY: "scroll" }}
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
            {Object.entries(groupedHistory).map(([group, items]) => (
                <div key={group} className={""}>
                    <h3 className={""}>{group}</h3>
                    {items.map(item => (
                        <HistoryItem key={item.id} item={item} onSelect={handleSelect} onDelete={handleDelete} />
                    ))}
                </div>
            ))}
            {history.length === 0 && <p>チャット履歴がありません。</p>}
            {hasMoreHistory && !isLoading && <InfiniteLoadingButton func={loadMoreHistory} />}
        </Panel>
    );
};

function groupChatHistory(history: HistoryData[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setDate(lastMonth.getDate() - 30);

    return history.reduce(
        (groups, item) => {
            const itemDate = new Date(item.timestamp);
            let group;

            if (itemDate >= today) {
                group = "今日";
            } else if (itemDate >= yesterday) {
                group = "昨日";
            } else if (itemDate >= lastWeek) {
                group = "過去7日間";
            } else if (itemDate >= lastMonth) {
                group = "過去30日間";
            } else {
                group = itemDate.toLocaleDateString(undefined, { year: "numeric", month: "long" });
            }

            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(item);
            return groups;
        },
        {} as Record<string, HistoryData[]>
    );
}

const InfiniteLoadingButton = ({ func }: { func: () => void }) => {
    const buttonRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (buttonRef.current) {
                            func();
                        }
                    }
                });
            },
            {
                root: null,
                threshold: 0.1 // 10% of the button must be visible
            }
        );

        if (buttonRef.current) {
            observer.observe(buttonRef.current);
        }

        return () => {
            if (buttonRef.current) {
                observer.unobserve(buttonRef.current);
            }
        };
    }, []);

    return (
        <button ref={buttonRef} onClick={func}>
            さらに読み込む
        </button>
    );
};
