import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';

import { DEFAULT_SETTING } from '../../storage/idb';
import { getIsNewUser, getIsUpdate, setIsNewUser, setIsUpdate } from '../../storage/user-journey';
import { SettingContext } from '../context';
import Feedback from './feedback/Feedback';
import Help from './help/Help';
import Locate from './locate/Locate';
import { Search } from './search/Search';
import Settings from './settings/Settings';
import store from './store';
import type { FancyTabMasterTree } from './tab-master-tree/fancy-tab-master-tree';
import { TabMasterTree } from './tab-master-tree/TabMasterTree';
import {
    buildTutorialNodes,
    buildUpdateTutorialNodes,
    openUpdateNotification,
} from './tutorial/tutorial-utils';
import Welcome from './tutorial/Welcome';

import '../../styles/app.less';

const updateNotification = async (tmTree: FancyTabMasterTree) => {
    const isUpdate = await getIsUpdate();
    if (!isUpdate) return;
    await setIsUpdate(false);
    openUpdateNotification();
    buildUpdateTutorialNodes(tmTree);
};

const App: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [setting, setSetting] = useState(DEFAULT_SETTING);

    // const matchMediaDark = window.matchMedia('(prefers-color-scheme: dark)');
    // const isDarkMode = matchMediaDark.matches;

    useEffect(() => {
        store.db.getSetting().then((setting) => {
            setting && setSetting(setting);
        });
    }, []);

    useEffect(() => {
        const $root = $(':root');
        if (setting.theme === 'auto') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => {
                mediaQuery.matches ? $root.attr('theme', 'dark') : $root.attr('theme', 'light');
            };
            const isDarkMode = mediaQuery.matches;
            $root.attr('theme', isDarkMode ? 'dark' : 'light');
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            $root.attr('theme', setting.theme);
            return () => {};
        }
    }, [setting.theme]);

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const newUserWelcome = async (tmTree: FancyTabMasterTree) => {
        const isNewUser = await getIsNewUser();
        if (!isNewUser) {
            return;
        }
        await setIsNewUser(false);
        buildTutorialNodes(tmTree);
        setIsModalOpen(true);
    };

    const showNewThings = async (tmTree: FancyTabMasterTree) => {
        // for new user
        newUserWelcome(tmTree);
        // for update
        updateNotification(tmTree);
    };

    return (
        <SettingContext.Provider value={{ setting, setSetting }}>
            <div className="app">
                <div id="header">
                    <Search />
                    <Locate />
                    <Settings />
                </div>
                <TabMasterTree onInit={showNewThings} />
                <div id="footer">
                    <span className={'footer-item'}>
                        <Feedback />
                    </span>
                </div>
                <Help />
                <Modal
                    title={`🎉 ${browser.i18n.getMessage('welcomeTitle')}`}
                    open={isModalOpen}
                    onCancel={handleCancel}
                    footer={null}
                    className={'welcome-modal'}
                >
                    <Welcome />
                </Modal>
            </div>
        </SettingContext.Provider>
    );
};

export default App;
