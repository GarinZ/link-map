import { Spin } from 'antd';
import log from 'loglevel';
import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';

import type { TreeData, TreeNode } from '../tree/features/tab-master-tree/nodes/nodes';
import { NodeUtils } from '../tree/features/tab-master-tree/nodes/utils';
import { TabMasterTree } from '../tree/features/tab-master-tree/TabMasterTree';

const App = () => {
    const [loading, setLoading] = useState(true);
    const [importData, setImportData] = useState<TreeNode<TreeData>[]>([]);

    const toggle = (checked: boolean) => {
        setLoading(checked);
    };

    useEffect(() => {
        browser.storage.local.get('importData').then((data) => {
            const importData: TreeNode<TreeData>[] = data.importData;
            log.debug('send-import-data', data.importData);
            // 递归删除所有节点的key并将closed设置为true
            NodeUtils.traverse(importData, (node) => {
                delete node.key;
                node.data.closed = true;
            });
            setImportData(importData);
            toggle(false);
        });
    }, []);

    return (
        <div className="app">
            <Spin spinning={loading} />
            <TabMasterTree source={importData} isDummy={true} />
        </div>
    );
};

export default App;
