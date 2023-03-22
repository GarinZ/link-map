import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';

import { DEFAULT_SETTING } from '../../storage/idb';
import { getIsNewUser, setIsNewUser } from '../../storage/new-user';
import { SettingContext } from '../context';
import Feedback from './feedback/Feedback';
import Locate from './locate/Locate';
import { Search } from './search/Search';
import Settings from './settings/Settings';
import store from './store';
import type { FancyTabMasterTree } from './tab-master-tree/fancy-tab-master-tree';
import { TabMasterTree } from './tab-master-tree/TabMasterTree';
import { buildTutorialNodes } from './tutorial/tutorial-nodes';
import Welcome from './tutorial/Welcome';

const App: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [setting, setSetting] = useState(DEFAULT_SETTING);
    store.db.getSetting().then((setting) => {
        setting && setSetting(setting);
    });

    useEffect(() => {
        $(':root').attr('theme', setting.theme);
    }, [setting]);

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const showNewThings = async (tmTree: FancyTabMasterTree) => {
        const isNewUser = await getIsNewUser();
        if (!isNewUser) {
            return;
        }
        await setIsNewUser(false);
        buildTutorialNodes(tmTree);
        setIsModalOpen(true);
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
