import { onMessage } from '@garinz/webext-bridge';
import log from 'loglevel';
import React, { useEffect, useState } from 'react';

import Store from '../store';
import { FancyTabMasterTree } from './fancy-tab-master-tree';
import type { TreeData, TreeNode } from './nodes/nodes';

import './style.less';

interface TabMasterTreeProps {
    source?: TreeNode<TreeData>[];
    isDummy?: boolean;
}
export const TabMasterTree: React.FC<TabMasterTreeProps> = ({ source, isDummy = false }) => {
    let treeContainer: HTMLElement | null = null;
    const [tabMasterTree, setTabMasterTree] = useState<FancyTabMasterTree>();
    useEffect(() => {
        const $el = $(treeContainer!);
        const tmTree = new FancyTabMasterTree($el);
        setTabMasterTree(tmTree);
        Store.tree = tmTree.tree;
        const loadedPromise = tmTree.initTree(source, isDummy);
        if (!source || isDummy) {
            loadedPromise.then(() => {
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
            });
        }
    }, []);

    useEffect(() => {
        log.debug('source', source);
        log.debug('tabMasterTree', tabMasterTree);
        if (source && tabMasterTree) {
            tabMasterTree.initTree(source);
        }
    }, [source, tabMasterTree]);

    return (
        <div className="tree-container">
            <div id="tree" ref={(el) => (treeContainer = el)} />
        </div>
    );
};
