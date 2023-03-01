import { Button, message, Modal } from 'antd';
import { useState } from 'react';

import { getFormattedData } from '../../../utils';
import store from '../store';

import './settings.less';

const handleExport = () => {
    const rawData = store.tree?.toDict();
    const exportData = { rawData };
    const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `link-map-export-${getFormattedData()}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    message.success('Export successfully.');
};

const handleImport = async () => {
    try {
        if (window.showOpenFilePicker && window.showSaveFilePicker) {
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
            console.log(jsonData); // 输出解析后的 JSON 数据
        } else if (chrome && chrome.fileSystem) {
            chrome.fileSystem.chooseEntry({ type: 'openFile' }, (entry) => {
                entry.file((file) => {
                    const reader = new FileReader();
                    reader.addEventListener('load', (event) => {
                        const contents = event.target.result;
                        console.log(contents);
                    });
                    reader.readAsText(file);
                });
            });
        } else {
            message.error('Your browser does not support this feature.');
        }
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
                <div className="setting-head">Import/Export</div>
                <Button onClick={handleExport}>Export</Button>
                <Button onClick={handleImport}>Import</Button>
            </Modal>
        </div>
    );
};

export default Settings;
