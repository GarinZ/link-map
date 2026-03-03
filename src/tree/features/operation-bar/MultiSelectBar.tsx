import { Button, message, Space, Tooltip } from 'antd';
import React, { useCallback } from 'react';
import browser from 'webextension-polyfill';

import { useSelection } from '../../contexts/SelectionContext';

import './multi-select-bar.less';

const delay = 1;

const MultiSelectBar: React.FC = () => {
    const { selectedKeys, clearSelection } = useSelection();

    const tabIds = React.useMemo(
        () => Array.from(selectedKeys).map((k) => parseInt(k, 10)).filter((id) => !Number.isNaN(id)),
        [selectedKeys],
    );

    const handleCloseSelected = useCallback(async () => {
        if (tabIds.length === 0) return;
        try {
            await browser.tabs.remove(tabIds);
            clearSelection();
            message.success(`Closed ${tabIds.length} tab(s)`);
        } catch (err) {
            message.error('Failed to close tabs');
            console.error(err);
        }
    }, [tabIds, clearSelection]);

    const handleMoveToNewWindow = useCallback(async () => {
        if (tabIds.length === 0) return;
        try {
            const firstId = tabIds[0];
            const restIds = tabIds.slice(1);
            const newWindow = await browser.windows.create({ tabId: firstId });
            const windowId = newWindow.id;
            if (windowId != null && restIds.length > 0) {
                await browser.tabs.move(restIds, { windowId, index: -1 });
            }
            clearSelection();
            message.success(`Moved ${tabIds.length} tab(s) to new window`);
        } catch (err) {
            message.error('Failed to move tabs to new window');
            console.error(err);
        }
    }, [tabIds, clearSelection]);

    const handleAddToGroup = useCallback(async () => {
        if (tabIds.length === 0) return;
        try {
            const tabsApi = browser.tabs as typeof browser.tabs & { group?: (options: { tabIds: number[] }) => Promise<number> };
            if (typeof tabsApi.group === 'function') {
                await tabsApi.group({ tabIds });
                clearSelection();
                message.success(`Added ${tabIds.length} tab(s) to group`);
            } else {
                message.info('Tab groups are not supported in this browser');
            }
        } catch (err) {
            message.error('Failed to add tabs to group');
            console.error(err);
        }
    }, [tabIds, clearSelection]);

    const handleCopyLinks = useCallback(async () => {
        if (tabIds.length === 0) return;
        try {
            const tabs = await Promise.all(tabIds.map((id) => browser.tabs.get(id)));
            const lines = tabs
                .filter((tab) => tab.url && !tab.url.startsWith('chrome://'))
                .map((tab) => tab.url ?? '');
            const text = lines.join('\n');
            if (text) {
                await navigator.clipboard.writeText(text);
                message.success(`Copied ${lines.length} link(s) to clipboard`);
            } else {
                message.info('No copyable links in selection');
            }
        } catch (err) {
            message.error('Failed to copy links');
            console.error(err);
        }
    }, [tabIds]);

    if (selectedKeys.size === 0) {
        return null;
    }

    return (
        <div className="multi-select-bar">
            <span className="multi-select-bar-label">{selectedKeys.size} tabs selected</span>
            <Space size="small" className="multi-select-bar-actions">
                <Tooltip title="Close selected tabs" mouseEnterDelay={delay} placement="bottomLeft">
                    <Button type="text" size="small" onClick={handleCloseSelected} className="multi-select-bar-btn">
                        Close Selected
                    </Button>
                </Tooltip>
                <Tooltip title="Move selected tabs to a new window" mouseEnterDelay={delay} placement="bottomLeft">
                    <Button type="text" size="small" onClick={handleMoveToNewWindow} className="multi-select-bar-btn">
                        Move to New Window
                    </Button>
                </Tooltip>
                <Tooltip title="Add selected tabs to a new group" mouseEnterDelay={delay} placement="bottomLeft">
                    <Button type="text" size="small" onClick={handleAddToGroup} className="multi-select-bar-btn">
                        Add to Group
                    </Button>
                </Tooltip>
                <Tooltip title="Copy URLs of selected tabs" mouseEnterDelay={delay} placement="bottomLeft">
                    <Button type="text" size="small" onClick={handleCopyLinks} className="multi-select-bar-btn">
                        Copy Links
                    </Button>
                </Tooltip>
            </Space>
        </div>
    );
};

export default MultiSelectBar;
