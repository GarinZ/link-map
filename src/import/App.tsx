import { Spin } from 'antd';
import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';

import type { ExportJsonData } from '../tree/features/settings/Settings';
import type { TabData } from '../tree/features/tab-master-tree/nodes/tab-node-operations';
import { NodeUtils } from '../tree/features/tab-master-tree/nodes/utils';
import type { TabMasterTreeProps } from '../tree/features/tab-master-tree/TabMasterTree';
import { TabMasterTree } from '../tree/features/tab-master-tree/TabMasterTree';
import { generateKeyByTime } from '../utils';
import { IMPORT_TREE_DND5_CONFIG } from './import-dnd';
import type { TabOutliner } from './parse-tab-outliner';
import { parseTabOutlinerData } from './parse-tab-outliner';

import './import.less';

export interface LinkMapImportData {
    data: ExportJsonData;
    type: 'linkMap';
}

export interface TabOutlinerImportData {
    data: TabOutliner.ExportData;
    type: 'tabOutliner';
}

export type LocalStorageImportData = LinkMapImportData | TabOutlinerImportData;

const resetProps = (data: ExportJsonData) => {
    NodeUtils.traverse(data.rawData, (node) => {
        node.key = `${generateKeyByTime()}-${node.key}`;
        node.active = false;
        const nodeData = node.data;
        if (nodeData.nodeType === 'tab') {
            node.data.closed = true;
            (nodeData as TabData).tabActive = false;
        } else if (nodeData.nodeType === 'window') {
            node.data.closed = true;
        }
    });
};

const App = () => {
    const [loading, setLoading] = useState(true);
    const [importData, setImportData] = useState<ExportJsonData>({ rawData: [] });
    const tabMasterTreeProps: TabMasterTreeProps = {
        source: importData.rawData,
        enableBrowserEventHandler: false,
        enableOperateBrowser: false,
        enableEdit: false,
        enableContextMenu: false,
        enablePersist: false,
        dndConfig: IMPORT_TREE_DND5_CONFIG,
    };

    const toggle = (checked: boolean) => {
        setLoading(checked);
    };

    useEffect(() => {
        browser.storage.local.get('importData').then((localData) => {
            const { data, type } = localData.importData as LocalStorageImportData;
            if (type === 'linkMap') {
                const linMapImportData: ExportJsonData = data;
                resetProps(linMapImportData);
                setImportData(linMapImportData);
            } else if (type === 'tabOutliner') {
                const treeNodeDataArr = parseTabOutlinerData(data as TabOutliner.ExportData);
                const result = { rawData: treeNodeDataArr };
                resetProps(result);
                setImportData(result);
            }
            toggle(false);
        });
    }, []);

    return (
        <div className="app">
            <Spin spinning={loading} />
            <div className={'import-container'}>
                <div className={'import-info'}>
                    <div>💡{browser.i18n.getMessage('importPageInfo')}</div>
                    <div className={'import-backup-date'}>
                        {importData.exportTime
                            ? `${browser.i18n.getMessage(
                                  'importPageExportTime',
                              )}: ${importData.exportTime?.replaceAll('_', ':')}`
                            : null}
                    </div>
                </div>
                <TabMasterTree {...tabMasterTreeProps} />
            </div>
        </div>
    );
};

export default App;
