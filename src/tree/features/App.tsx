import { Modal } from 'antd';
import React, { useState } from 'react';
import browser from 'webextension-polyfill';

import { getIsNewUser, setIsNewUser } from '../../storage/new-user';
import Feedback from './feedback/Feedback';
import Locate from './locate/Locate';
import { Search } from './search/Search';
import Settings from './settings/Settings';
import type { FancyTabMasterTree } from './tab-master-tree/fancy-tab-master-tree';
import { TabMasterTree } from './tab-master-tree/TabMasterTree';
import { buildTutorialNodes } from './tutorial/tutorial-nodes';
import Welcome from './tutorial/Welcome';

const App: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

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
    );
};

export default App;
