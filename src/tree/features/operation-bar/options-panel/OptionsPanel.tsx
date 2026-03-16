import React, { useContext } from 'react';
import browser from 'webextension-polyfill';

import { SettingContext } from '../../../context';
import store from '../../store';

import './option-panel.less';

const OptionPanel: React.FC = () => {
    const { setting, setSetting } = useContext(SettingContext);
    const { autoScrollToActiveTab, createNewTabByLevel, showInlineActions } = setting;

    const handleAutoScrollToActiveTab = async () => {
        const newState = !autoScrollToActiveTab;
        await store.db.updateSettingPartial({ autoScrollToActiveTab: newState });
        setSetting({
            ...setting,
            autoScrollToActiveTab: newState,
        });
    };

    const handleCreateNewTabByLevel = async () => {
        const newState = !createNewTabByLevel;
        await store.db.updateSettingPartial({ createNewTabByLevel: newState });
        setSetting({
            ...setting,
            createNewTabByLevel: newState,
        });
    };

    const handleShowInlineActions = async () => {
        const newState = !showInlineActions;
        await store.db.updateSettingPartial({ showInlineActions: newState });
        setSetting({
            ...setting,
            showInlineActions: newState,
        });
    };

    return (
        <div className={'option-panel'}>
            <div
                className={'option-panel-item'}
                onClick={handleAutoScrollToActiveTab}
                aria-hidden={true}
            >
                <div
                    className={'option-panel-item-check iconfont icon-check'}
                    style={{ visibility: autoScrollToActiveTab ? 'visible' : 'hidden' }}
                />
                <div className={'option-panel-item-label'}>
                    {browser.i18n.getMessage('autoScrollToActiveTab')}
                </div>
            </div>
            <div
                className={'option-panel-item'}
                onClick={handleCreateNewTabByLevel}
                aria-hidden={true}
            >
                <div
                    className={'option-panel-item-check iconfont icon-check'}
                    style={{ visibility: createNewTabByLevel ? 'visible' : 'hidden' }}
                />
                <div className={'option-panel-item-label'}>
                    {browser.i18n.getMessage('createNewTabByLevel')}
                </div>
            </div>
            <div className={'option-panel-item'} onClick={handleShowInlineActions} aria-hidden={true}>
                <div
                    className={'option-panel-item-check iconfont icon-check'}
                    style={{ visibility: showInlineActions ? 'visible' : 'hidden' }}
                />
                <div className={'option-panel-item-label'}>
                    {browser.i18n.getMessage('showInlineActions') || 'Show Inline Actions'}
                </div>
            </div>
        </div>
    );
};

export default OptionPanel;
