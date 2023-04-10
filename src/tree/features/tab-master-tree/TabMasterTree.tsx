import log from 'loglevel';
import React, { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';

import registerShortcuts from '../shortcuts/shortcuts';
import Store from '../store';
import type { FancyTabMasterTreeConfig } from './fancy-tab-master-tree';
import { FancyTabMasterTree } from './fancy-tab-master-tree';
import type { TreeData, TreeNode } from './nodes/nodes';
import { TabNodeOperations } from './nodes/tab-node-operations';

import './style.less';

const registerBrowserEventHandlers = (tmTree: FancyTabMasterTree) => {
    // #### 浏览器Fire的事件
    browser.tabs.onCreated.addListener(async (tab) => {
        tmTree.createTab(tab);
    });

    browser.tabs.onRemoved.addListener(async (tabId, _removeInfo) => {
        tmTree.removeTab(tabId);
    });

    browser.tabs.onUpdated.addListener(async (_tabId, _changeInfo, tab) => {
        tmTree.updateTab(tab);
    });

    /**
     * 只有同窗口tab前后顺序移动会影响触发这个方法
     */
    browser.tabs.onMoved.addListener((tabId, { windowId, fromIndex, toIndex }) => {
        tmTree.moveTab(windowId, tabId, fromIndex, toIndex);
    });

    browser.tabs.onActivated.addListener(({ tabId, windowId }) => {
        tmTree.activeTab(tabId, windowId);
    });
    /**
     * 如果没有window会先触发window的创建事件
     */
    browser.tabs.onAttached.addListener((tabId, { newPosition, newWindowId }) => {
        tmTree.attachTab(newWindowId, tabId, newPosition);
    });

    browser.tabs.onDetached.addListener((tabId) => {
        tmTree.detachTab(tabId);
    });

    browser.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
        const replacedTabNode = tmTree.tree.getNodeByKey(`${removedTabId}`);
        if (!replacedTabNode) {
            return;
        }
        browser.tabs.get(addedTabId).then((newTab) => {
            TabNodeOperations.updatePartial(replacedTabNode, newTab);
            log.debug('replacedTabNode', replacedTabNode);
        });
    });

    browser.windows.onCreated.addListener(async (window) => {
        tmTree.createWindow(window);
    });
    /**
     * 最后一个tab合并到另一个window时会发这个Event
     */
    browser.windows.onRemoved.addListener(async (windowId) => {
        tmTree.removeWindow(windowId);
    });

    browser.windows.onFocusChanged.addListener((windowId) => {
        tmTree.windowFocus(windowId);
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
    useEffect(() => {
        const $el = $(treeContainer!);
        const config: FancyTabMasterTreeConfig = { ...otherProps };
        const tmTree = new FancyTabMasterTree($el, config);
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
