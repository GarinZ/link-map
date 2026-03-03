import { onMessage } from '@garinz/webext-bridge';
import React, { useContext, useEffect, useState } from 'react';

import { SettingContext } from '../../context';
import registerShortcuts from '../shortcuts/shortcuts';
import Store from '../store';
import type { FancyTabMasterTreeConfig } from './fancy-tab-master-tree';
import { FancyTabMasterTree } from './fancy-tab-master-tree';
import type { TreeData, TreeNode } from './nodes/nodes';

import './style.less';

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

export const TabMasterTree: React.FC<TabMasterTreeProps> = ({ source, onInit, ...otherProps }) => {
    let treeContainer: HTMLElement | null = null;
    const [tabMasterTree, setTabMasterTree] = useState<FancyTabMasterTree | null>(null);
    const { setting } = useContext(SettingContext);
    useEffect(() => {
        const $el = $(treeContainer!);
        const config: FancyTabMasterTreeConfig = { ...otherProps };
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

    return (
        <div className="tree-container">
            <div id="tree" ref={(el) => (treeContainer = el)} />
        </div>
    );
};

TabMasterTree.defaultProps = {
    enableBrowserEventHandler: true,
};
