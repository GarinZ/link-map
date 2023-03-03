import { sendMessage } from '@garinz/webext-bridge';
import { Button, message, Modal } from 'antd';
import log from 'loglevel';
import { useState } from 'react';

import { downloadJsonWithExtensionAPI, getFormattedData } from '../../../utils';
import store from '../store';
import type { TreeData, TreeNode } from '../tab-master-tree/nodes/nodes';

import './settings.less';

interface ExportJsonData {
    rawData: TreeNode<TreeData>[];
    version?: string;
    exportTime?: string;
}

const handleExport = () => {
    const rawData = store.tree?.toDict();
    const exportJsonData: ExportJsonData = {
        rawData,
        version: __VERSION__,
        exportTime: getFormattedData(),
    };
    const fileName = `link-map-export-${getFormattedData()}.json`;
    downloadJsonWithExtensionAPI(exportJsonData, fileName).then(() => {
        message.success('Export successfully');
    });
};

const handleImport = async () => {
    try {
        if (!window.showOpenFilePicker || !window.showSaveFilePicker) {
            message.error('Your browser does not support this feature.');
            return;
        }
        const [fileHandle] = await window.showOpenFilePicker({
            types: [
                {
                    description: 'JSON files',
                    accept: { 'application/json': ['.json'] },
                },
            ],
        });
        const file = await fileHandle.getFile();
        const fileContent = await file.text();
        const jsonData = JSON.parse(fileContent);
        // TODO: 这里需要做一些数据校验
        log.debug('import-data', jsonData);
        await sendMessage('import-data', jsonData.rawData);
    } catch {
        // do nothing
    }
};

const Settings = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="settings-container">
            <div>
                <Button
                    className="settings-btn"
                    type="primary"
                    onClick={showModal}
                    icon={<span className="iconfont icon-settings" />}
                />
            </div>
            <Modal
                title="Settings"
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                className={'settings-modal'}
                footer={null}
            >
                <div className="setting-head divider">Import / Export</div>
                <div className="settings-item">
                    <Button className="setting-item-btn" onClick={handleExport}>
                        Export Link Map Data
                    </Button>
                </div>
                <div className="settings-item">
                    <Button className="setting-item-btn" onClick={handleImport}>
                        Import
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default Settings;
