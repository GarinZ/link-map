import { Popover, Tooltip } from 'antd';
import React from 'react';
import browser from 'webextension-polyfill';

import { getPrevFocusWindowId } from '../../../storage/basic';
import store from '../store';
import type { WindowData } from '../tab-master-tree/nodes/window-node-operations';
import OptionPanel from './options-panel/OptionsPanel';

import './operation-bar.less';

const delay = 1;
const onExpandAllClick = () => {
    if (!store.tree) return;
    store.tree.expandAll();
};

const onCollapseAllClick = () => {
    if (!store.tree) return;
    store.tree.expandAll(false);
};

const handleLocate = async () => {
    const tree = store.tree;
    if (!tree) {
        return;
    }
    const tabs = await browser.tabs.query({ active: true });
    const prevFocusWindowId = await getPrevFocusWindowId();
    if (prevFocusWindowId) {
        const toActiveTabs = tabs.filter((tab) => tab.windowId === prevFocusWindowId);
        if (toActiveTabs.length > 0) {
            const activeNode = tree.getNodeByKey(toActiveTabs[0].id!.toString());
            activeNode.makeVisible();
            activeNode.setActive();
            return;
        }
    }
    tabs.forEach((tab) => {
        const activeNode = tree.getNodeByKey(tab.id!.toString());
        if (activeNode.parent && (activeNode.parent.data as WindowData).isBackgroundPage) {
            return;
        }
        activeNode.makeVisible();
        activeNode.setActive();
    });
};

const OperationBar: React.FC = () => {
    return (
        <div className={'operation-bar'}>
            <Tooltip
                title={browser.i18n.getMessage('locate')}
                showArrow={false}
                mouseEnterDelay={delay}
                placement={'bottomLeft'}
            >
                <div
                    className={'operation-bar-item locate'}
                    onClick={handleLocate}
                    aria-hidden="true"
                >
                    <i className={'iconfont icon-md-locate'} />
                </div>
            </Tooltip>
            <Tooltip
                title={browser.i18n.getMessage('collapseAll')}
                showArrow={false}
                mouseEnterDelay={delay}
                placement={'bottomLeft'}
            >
                <div
                    className={'operation-bar-item collapse-all'}
                    onClick={onCollapseAllClick}
                    aria-hidden="true"
                >
                    <i className={'iconfont icon-collapse_all'} />
                </div>
            </Tooltip>
            <Tooltip
                title={browser.i18n.getMessage('expandAll')}
                showArrow={false}
                mouseEnterDelay={delay}
                placement={'bottomLeft'}
            >
                <div
                    className={'operation-bar-item expand-all'}
                    onClick={onExpandAllClick}
                    aria-hidden="true"
                >
                    <i className={'iconfont icon-expand_all'} />
                </div>
            </Tooltip>
            <Tooltip
                title={browser.i18n.getMessage('options')}
                showArrow={false}
                mouseEnterDelay={delay}
                placement={'topLeft'}
            >
                <Popover
                    placement="bottomLeft"
                    content={<OptionPanel />}
                    trigger="click"
                    showArrow={false}
                    overlayClassName={'options-panel-overlay'}
                >
                    <div className={'operation-bar-item options'} aria-hidden="true">
                        <i className={'iconfont icon-more'} />
                    </div>
                </Popover>
            </Tooltip>
        </div>
    );
};

export default OperationBar;
