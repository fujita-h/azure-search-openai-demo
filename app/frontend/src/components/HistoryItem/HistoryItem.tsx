import { useState, useCallback } from "react";
import styles from "./HistoryItem.module.css";

export interface HistoryData {
    id: string;
    title: string;
    timestamp: number;
}

interface HistoryItemProps {
    item: HistoryData;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
}

export function HistoryItem({ item, onSelect, onDelete }: HistoryItemProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDelete = useCallback(() => {
        setIsModalOpen(false);
        onDelete(item.id);
    }, [item.id, onDelete]);

    return (
        <div className={styles.historyItem}>
            <button onClick={() => onSelect(item.id)} className={styles.historyItemButton}>
                <div className={styles.historyItemTitle}>{item.title}</div>
            </button>
            <button onClick={() => setIsModalOpen(true)} className={styles.deleteButton} aria-label="チャットを削除">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleDelete}
                title="本当に削除しますか？"
                description="この操作は取り消せません。チャット履歴が完全に削除されます。"
            />
        </div>
    );
}

function Modal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
}) {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2 className={styles.modalTitle}>{title}</h2>
                <p className={styles.modalDescription}>{description}</p>
                <div className={styles.modalActions}>
                    <button onClick={onClose} className={styles.modalCancelButton}>
                        キャンセル
                    </button>
                    <button onClick={onConfirm} className={styles.modalConfirmButton}>
                        削除
                    </button>
                </div>
            </div>
        </div>
    );
}
