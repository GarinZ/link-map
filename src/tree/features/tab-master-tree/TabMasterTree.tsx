import { onMessage } from '@garinz/webext-bridge';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import browser from 'webextension-polyfill';

import { SettingContext } from '../../context';
import { SelectionProvider, useSelection } from '../../contexts/SelectionContext';
import MultiSelectBar from '../operation-bar/MultiSelectBar';
import registerShortcuts from '../shortcuts/shortcuts';
import Store from '../store';
import type { FancyTabMasterTreeConfig } from './fancy-tab-master-tree';
import { FancyTabMasterTree } from './fancy-tab-master-tree';
import type { TreeData, TreeNode } from './nodes/nodes';

import './style.less';

type FancytreeNode = Fancytree.FancytreeNode;

function getVisibleNodeKeys(tree: Fancytree.Fancytree): string[] {
    const keys: string[] = [];
    tree.visitRows((node) => {
        keys.push(node.key);
        return true;
    });
    return keys;
}

function getPrevRowNode(node: FancytreeNode): FancytreeNode | null {
    let prev: FancytreeNode | null = null;
    node.tree.visitRows(
        (n) => {
            prev = n;
            return false;
        },
        { start: node, includeSelf: false, reverse: true },
    );
    return prev;
}

function getNextRowNode(node: FancytreeNode): FancytreeNode | null {
    let next: FancytreeNode | null = null;
    node.tree.visitRows(
        (n) => {
            next = n;
            return false;
        },
        { start: node, includeSelf: false, reverse: false },
    );
    return next;
}

const registerBrowserEventHandlers = (tmTree: FancyTabMasterTree) => {
    onMessage('add-tab', (msg) => {
        tmTree.createTab(msg.data);
    });
    onMessage('remove-tab', (msg) => {
        const { tabId } = msg.data;
        tmTree.removeTab(tabId);
    });
    onMessage('remove-window', (msg) => {
        tmTree.removeWindow(msg.data.windowId);
    });
    onMessage('move-tab', async (msg) => {
        const { windowId, fromIndex, toIndex, tabId } = msg.data;
        // 2. 移动元素
        tmTree.moveTab(windowId, tabId, fromIndex, toIndex);
    });
    onMessage('update-tab', (msg) => {
        tmTree.updateTab(msg.data);
    });
    onMessage('activated-tab', (msg) => {
        const { windowId, tabId } = msg.data;
        tmTree.activeTab(windowId, tabId);
    });
    onMessage('attach-tab', (msg) => {
        const { tabId, windowId, newIndex } = msg.data;
        tmTree.attachTab(windowId, tabId, newIndex);
    });
    onMessage('detach-tab', (msg) => {
        const { tabId } = msg.data;
        tmTree.detachTab(tabId);
    });
    onMessage('window-focus', (msg) => {
        const { windowId } = msg.data;
        tmTree.windowFocus(windowId);
    });
    onMessage('add-window', (msg) => {
        tmTree.createWindow(msg.data);
    });
    onMessage('replace-tab', (msg) => {
        const { addedTabId, removedTabId } = msg.data;
        tmTree.replaceTab(addedTabId, removedTabId);
    });
    registerShortcuts(tmTree);
};

export interface TabMasterTreeProps extends FancyTabMasterTreeConfig {
    source?: TreeNode<TreeData>[];
    enableBrowserEventHandler?: boolean;
    onInit?: (tmTree: FancyTabMasterTree) => void;
}

/** Ref to avoid syncing selection from context back into tree while we're applying it (prevents circular updates). */
type SelectionApiRef = React.MutableRefObject<{
    isSelected: (key: string) => boolean;
    toggleSelection: (key: string, allKeys?: string[]) => void;
    selectRange: (endKey: string, allKeys: string[]) => void;
    clearSelection: () => void;
} | null>;

const TabMasterTreeInner: React.FC<Omit<TabMasterTreeProps, 'source'> & { source?: TreeNode<TreeData>[] }> = ({
    source,
    onInit,
    ...otherProps
}) => {
    const treeContainerRef = useRef<HTMLDivElement | null>(null);
    const [tabMasterTree, setTabMasterTree] = useState<FancyTabMasterTree | null>(null);
    const { setting } = useContext(SettingContext);
    const selection = useSelection();
    const selectionApiRef = useRef<SelectionApiRef['current']>(null);
    const syncingFromContextRef = useRef(false);

    selectionApiRef.current = {
        isSelected: selection.isSelected,
        toggleSelection: selection.toggleSelection,
        selectRange: selection.selectRange,
        clearSelection: selection.clearSelection,
    };

    useEffect(() => {
        const el = treeContainerRef.current;
        if (!el) return;
        const $el = $(el);
        const config: FancyTabMasterTreeConfig = {
            ...otherProps,
            selectionApiRef,
            syncingFromContextRef,
        };
        const tmTree = new FancyTabMasterTree($el, config, setting);
        setTabMasterTree(tmTree);
        Store.tree = tmTree.tree;
        const loadedPromise = tmTree.initTree(source).then(() => {
            if (onInit) {
                onInit(tmTree);
            }
        });
        if (otherProps.enableBrowserEventHandler) {
            loadedPromise.then(() => {
                registerBrowserEventHandlers(tmTree);
            });
        }
    }, []);
    useEffect(() => {
        if (tabMasterTree) {
            tabMasterTree.settings = setting;
        }
    }, [setting.autoScrollToActiveTab, setting.createNewTabByLevel, tabMasterTree]);

    useEffect(() => {
        if (source && tabMasterTree) {
            tabMasterTree.initTree(source);
        }
    }, [source, tabMasterTree]);

    // Sync SelectionContext → tree UI (re-render node titles so checkboxes update). Use ref to prevent circular updates.
    useEffect(() => {
        if (!tabMasterTree) return;
        syncingFromContextRef.current = true;
        tabMasterTree.tree.visit((node) => {
            node.render();
            return true;
        });
        syncingFromContextRef.current = false;
    }, [tabMasterTree, selection.selectedKeys, selection.indeterminateKeys]);

    // Keyboard: Space=toggle, Enter=close, Escape=clear, Cmd+A=selectAll
    const handleCloseSelected = useCallback(async () => {
        const tabIds = Array.from(selection.selectedKeys)
            .map((k) => parseInt(k, 10))
            .filter((id) => !Number.isNaN(id));
        if (tabIds.length === 0) return;
        try {
            await browser.tabs.remove(tabIds);
            selection.clearSelection();
        } catch (err) {
            console.error(err);
        }
    }, [selection]);

    useEffect(() => {
        const el = treeContainerRef.current;
        if (!el) return;
        const container = el.closest('.tree-container') ?? el;
        const onKeyDown = (e: KeyboardEvent) => {
            if (!container.contains(document.activeElement)) return;
            const tree = tabMasterTree?.tree;
            if (e.key === ' ') {
                // Space: toggle selection of focused node
                if (tree) {
                    const activeNode = tree.getActiveNode();
                    if (activeNode) {
                        e.preventDefault();
                        const allKeys = getVisibleNodeKeys(tree);
                        selection.toggleSelection(activeNode.key, allKeys);
                    }
                }
                return;
            }
            if (e.key === 'Enter') {
                // Enter: close selected tabs
                handleCloseSelected();
                return;
            }
            if (e.key === 'Escape') {
                // Escape: clear selection
                selection.clearSelection();
                return;
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
                // Cmd+A / Ctrl+A: select all visible nodes
                if (tree) {
                    e.preventDefault();
                    const allKeys = getVisibleNodeKeys(tree);
                    selection.selectAll(allKeys);
                }
                return;
            }
        };
        container.addEventListener('keydown', onKeyDown);
        return () => container.removeEventListener('keydown', onKeyDown);
    }, [tabMasterTree, selection, handleCloseSelected]);

    return (
        <>
            <MultiSelectBar />
            <div className="tree-container">
                <div id="tree" ref={treeContainerRef} />
            </div>
        </>
    );
};

export const TabMasterTree: React.FC<TabMasterTreeProps> = (props) => (
    <SelectionProvider>
        <TabMasterTreeInner {...props} />
    </SelectionProvider>
);

TabMasterTree.defaultProps = {
    enableBrowserEventHandler: true,
};
