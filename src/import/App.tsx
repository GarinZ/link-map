import { Spin } from 'antd';
import log from 'loglevel';
import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';

import type { ExportJsonData } from '../tree/features/Settings/Settings';
import type { TabData } from '../tree/features/tab-master-tree/nodes/tab-node-operations';
import { NodeUtils } from '../tree/features/tab-master-tree/nodes/utils';
import type { TabMasterTreeProps } from '../tree/features/tab-master-tree/TabMasterTree';
import { TabMasterTree } from '../tree/features/tab-master-tree/TabMasterTree';
import { generateKeyByTime } from '../utils';
import { IMPORT_TREE_DND5_CONFIG } from './import-dnd';

import './import.less';

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
        browser.storage.local.get('importData').then((data) => {
            const importData: ExportJsonData = data.importData;
            log.debug('send-import-data', data.importData);
            resetProps(importData);
            setImportData(importData);
            toggle(false);
        });
    }, []);

    return (
        <div className="app">
            <Spin spinning={loading} />
            <div className={'import-container'}>
                <div className={'import-info'}>
                    <div>
                        💡Drag and Drop the nodes below to the Link Map Tree to import the data.
                    </div>
                    <div className={'import-backup-date'}>
                        Backup Date: {importData.exportTime?.replaceAll('_', ':')}
                    </div>
                </div>
                <TabMasterTree {...tabMasterTreeProps} />
            </div>
        </div>
    );
};

export default App;
