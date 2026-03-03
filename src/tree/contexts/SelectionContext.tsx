import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import browser from 'webextension-polyfill';

export interface SelectionContextValue {
    selectedKeys: Set<string>;
    indeterminateKeys: Set<string>;
    anchorKey: string | null;
    toggleSelection: (key: string, allKeys?: string[]) => void;
    selectRange: (endKey: string, allKeys: string[]) => void;
    selectAll: (allKeys: string[]) => void;
    clearSelection: () => void;
    isSelected: (key: string) => boolean;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

const emptySet = new Set<string>();

export function SelectionProvider({ children }: { children: React.ReactNode }) {
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
    const [indeterminateKeys, setIndeterminateKeys] = useState<Set<string>>(
        () => new Set(),
    );
    const [anchorKey, setAnchorKey] = useState<string | null>(null);

    const clearSelection = useCallback(() => {
        setSelectedKeys(new Set());
        setIndeterminateKeys(new Set());
        setAnchorKey(null);
    }, []);

    const isSelected = useCallback(
        (key: string) => selectedKeys.has(key),
        [selectedKeys],
    );

    const toggleSelection = useCallback((key: string, allKeys?: string[]) => {
        setSelectedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
        setIndeterminateKeys((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
        });
        setAnchorKey(key);
    }, []);

    const selectRange = useCallback(
        (endKey: string, allKeys: string[]) => {
            const anchor = anchorKey;
            if (anchor == null || allKeys.length === 0) {
                setSelectedKeys((prev) => new Set(prev).add(endKey));
                setAnchorKey(endKey);
                return;
            }
            const startIdx = allKeys.indexOf(anchor);
            const endIdx = allKeys.indexOf(endKey);
            if (startIdx === -1 || endIdx === -1) {
                setSelectedKeys((prev) => new Set(prev).add(endKey));
                setAnchorKey(endKey);
                return;
            }
            const low = Math.min(startIdx, endIdx);
            const high = Math.max(startIdx, endIdx);
            const rangeKeys = allKeys.slice(low, high + 1);
            setSelectedKeys(new Set(rangeKeys));
            setIndeterminateKeys(emptySet);
        },
        [anchorKey],
    );

    const selectAll = useCallback((allKeys: string[]) => {
        setSelectedKeys(new Set(allKeys));
        setIndeterminateKeys(emptySet);
        setAnchorKey(allKeys[0] ?? null);
    }, []);

    useEffect(() => {
        const listener = (tabId: number) => {
            const key = String(tabId);
            setSelectedKeys((prev) => {
                if (!prev.has(key)) return prev;
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
            setIndeterminateKeys((prev) => {
                if (!prev.has(key)) return prev;
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
            setAnchorKey((prev) => (prev === key ? null : prev));
        };
        browser.tabs.onRemoved.addListener(listener);
        return () => {
            browser.tabs.onRemoved.removeListener(listener);
        };
    }, []);

    const value = useMemo<SelectionContextValue>(
        () => ({
            selectedKeys,
            indeterminateKeys,
            anchorKey,
            toggleSelection,
            selectRange,
            selectAll,
            clearSelection,
            isSelected,
        }),
        [
            selectedKeys,
            indeterminateKeys,
            anchorKey,
            toggleSelection,
            selectRange,
            selectAll,
            clearSelection,
            isSelected,
        ],
    );

    return (
        <SelectionContext.Provider value={value}>
            {children}
        </SelectionContext.Provider>
    );
}

export function useSelection(): SelectionContextValue {
    const ctx = useContext(SelectionContext);
    if (ctx == null) {
        throw new Error('useSelection must be used within SelectionProvider');
    }
    return ctx;
}
