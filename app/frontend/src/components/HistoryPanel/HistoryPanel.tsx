import { Panel, PanelType } from "@fluentui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { HistoryData, HistoryItem } from "../HistoryItem";
import { Answers, HistoryProviderOptions } from "../HistoryProviders/IProvider";
import { useHistoryManager, HistoryMetaData } from "../HistoryProviders";

const HISTORY_COUNT_PER_LOAD = 20;

export const HistoryPanel = ({
    provider,
    isOpen,
    onClose,
    onChatSelected
}: {
    provider: HistoryProviderOptions;
    isOpen: boolean;
    onClose: () => void;
    onChatSelected: (answers: Answers) => void;
}) => {
    const historyManager = useHistoryManager(provider);
    const [history, setHistory] = useState<HistoryMetaData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);

    const loadMoreHistory = async () => {
        setIsLoading(() => true);
        const items = await historyManager.getNextItems(HISTORY_COUNT_PER_LOAD);
        if (items.length === 0) {
            setHasMoreHistory(false);
        }
        setHistory(prevHistory => [...prevHistory, ...items]);
        setIsLoading(() => false);
    };

    const handleSelect = async (id: string) => {
        const item = await historyManager.getItem(id);
        if (item) {
            onChatSelected(item);
        }
    };

    const handleDelete = async (id: string) => {
        await historyManager.deleteItem(id);
        setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
    };

    const groupedHistory = useMemo(() => groupHistory(history), [history]);

    return (
        <Panel
            type={PanelType.customNear}
            style={{ overflowY: "scroll" }}
            headerText="チャット履歴"
            customWidth="300px"
            isBlocking={false}
            isOpen={isOpen}
            onOpen={() => {
                loadMoreHistory();
            }}
            onDismiss={() => onClose()}
            onDismissed={() => {
                setHistory([]);
                setHasMoreHistory(true);
                historyManager.resetContinuationToken();
            }}
        >
            {Object.entries(groupedHistory).map(([group, items]) => (
                <div key={group} className={""}>
                    <p className={""}>{group}</p>
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

function groupHistory(history: HistoryData[]) {
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
                threshold: 0
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

    return <button ref={buttonRef} onClick={func} />;
};
