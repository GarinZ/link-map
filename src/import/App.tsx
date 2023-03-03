import { Spin } from 'antd';
import log from 'loglevel';
import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';

import type { TreeData, TreeNode } from '../tree/features/tab-master-tree/nodes/nodes';
import type { TabData } from '../tree/features/tab-master-tree/nodes/tab-node-operations';
import { NodeUtils } from '../tree/features/tab-master-tree/nodes/utils';
import type { TabMasterTreeProps } from '../tree/features/tab-master-tree/TabMasterTree';
import { TabMasterTree } from '../tree/features/tab-master-tree/TabMasterTree';
import { generateKeyByTime } from '../utils';
import { IMPORT_TREE_DND5_CONFIG } from './import-dnd';

const resetProps = (data: TreeNode<TreeData>[]) => {
    NodeUtils.traverse(data, (node) => {
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
    const [importData, setImportData] = useState<TreeNode<TreeData>[]>([]);
    const tabMasterTreeProps: TabMasterTreeProps = {
        source: importData,
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
            const importData: TreeNode<TreeData>[] = data.importData;
            log.debug('send-import-data', data.importData);
            resetProps(importData);
            setImportData(importData);
            toggle(false);
        });
    }, []);

    return (
        <div className="app">
            <Spin spinning={loading} />
            <TabMasterTree {...tabMasterTreeProps} />
        </div>
    );
};

export default App;
