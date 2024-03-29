import { sendMessage } from '@garinz/webext-bridge';
import { Button, message, Modal, Select, Upload } from 'antd';
import type { RcFile } from 'antd/es/upload/interface';
import log from 'loglevel';
import { useContext, useState } from 'react';
import browser from 'webextension-polyfill';

import type { ThemeType } from '../../../storage/idb';
import { downloadJsonWithExtensionAPI, getFormattedData } from '../../../utils';
import { SettingContext } from '../../context';
import Feedback from '../feedback/Feedback';
import store from '../store';
import type { TreeData, TreeNode } from '../tab-master-tree/nodes/nodes';

import './settings.less';

export interface ExportJsonData {
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

const Settings = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { setting, setSetting } = useContext(SettingContext);

    const showModal = () => {
        setIsModalOpen(true);
    };

    const hideModal = () => {
        setIsModalOpen(false);
    };

    const handleLinkMapImport = async (file: RcFile) => {
        const fileContent = await file.text();
        const jsonData: ExportJsonData = JSON.parse(fileContent);
        // TODO: 这里需要做一些数据校验
        log.debug('import-data', jsonData);
        await sendMessage('import-data', jsonData);
        hideModal();
        return '';
    };

    const handleTabOutlinerImport = async (file: RcFile) => {
        const fileContent = await file.text();
        const jsonData = JSON.parse(fileContent);
        if (
            !Array.isArray(jsonData) ||
            !jsonData[jsonData.length - 1].type ||
            jsonData[jsonData.length - 1].type !== 11111
        ) {
            message.error('Invalid Tab Outliner data.');
            return '';
        }
        await sendMessage('import-tabOutliner-data', jsonData);
        hideModal();
        return '';
    };

    const handleThemeChange = async (value: ThemeType) => {
        await store.db.updateSettingPartial({ theme: value });
        setSetting({ ...setting, theme: value });
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
                title={browser.i18n.getMessage('settings')}
                open={isModalOpen}
                className={'settings-modal'}
                onCancel={hideModal}
                onOk={hideModal}
                footer={null}
            >
                <div className={'setting-section'}>
                    <div className="setting-head divider">
                        {browser.i18n.getMessage('appearance')}
                    </div>
                    <div className="settings-item">
                        <span className="settings-item-desc">
                            {browser.i18n.getMessage('theme')}:
                        </span>
                        <Select
                            value={setting.theme}
                            style={{ width: 120 }}
                            size={'small'}
                            onChange={handleThemeChange}
                            popupClassName={'settings-select-popup'}
                            options={[
                                { value: 'light', label: browser.i18n.getMessage('themeLight') },
                                { value: 'dark', label: browser.i18n.getMessage('themeDark') },
                                { value: 'auto', label: browser.i18n.getMessage('themeAuto') },
                            ]}
                        />
                    </div>
                </div>
                <div className={'setting-section'}>
                    <div className="setting-head divider">
                        {browser.i18n.getMessage('settingsImportExport')}
                    </div>
                    <div className="settings-item">
                        <Button className="setting-item-btn" onClick={handleExport}>
                            {browser.i18n.getMessage('exportLinkMapData')}
                        </Button>
                    </div>
                    <div className="settings-item">
                        <Upload
                            name={'file'}
                            action={handleLinkMapImport}
                            fileList={[]}
                            accept={'.json'}
                        >
                            <Button className="setting-item-btn">
                                {browser.i18n.getMessage('importLinkMapData')}
                            </Button>
                        </Upload>
                    </div>
                    <div className="settings-item">
                        <Upload
                            name={'file'}
                            action={handleTabOutlinerImport}
                            fileList={[]}
                            accept={'.json, .tree'}
                        >
                            <Button className="setting-item-btn">
                                {browser.i18n.getMessage('importTabOutlinerData')}
                            </Button>
                        </Upload>
                    </div>
                </div>
                <div className={'setting-section'}>
                    <div className="setting-head divider">
                        {browser.i18n.getMessage('feedback')}
                    </div>
                    <div className="settings-item">
                        <span className="settings-item-desc">
                            {browser.i18n.getMessage('feedbackDesc')}:
                        </span>
                        <Feedback />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Settings;
