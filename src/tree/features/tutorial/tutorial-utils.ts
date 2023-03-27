import { notification } from 'antd';
import browser from 'webextension-polyfill';

import { getReviewUrl } from '../../../config/browser-adapter-config';
import type { FancyTabMasterTree } from '../tab-master-tree/fancy-tab-master-tree';
import { NoteNodeOperations } from '../tab-master-tree/nodes/note-node-operations';
import { TabNodeOperations } from '../tab-master-tree/nodes/tab-node-operations';

export const buildTutorialNodes = (tmTree: FancyTabMasterTree): void => {
    const rootNote = tmTree.tree.getRootNode();
    const tutorialNode = rootNote.addNode(
        NoteNodeOperations.createData(`🚀 ${browser.i18n.getMessage('tipsTitle')}`),
        'firstChild',
    );
    tutorialNode.addChildren(
        NoteNodeOperations.createData(`1. 🖐️ ${browser.i18n.getMessage('tipsDnd')}`),
    );
    const editTutorialNode = tutorialNode.addNode(
        NoteNodeOperations.createData(`2. ➡️️ ${browser.i18n.getMessage('tipsHover')}`, {
            expanded: false,
        }),
        'child',
    );
    editTutorialNode.addChildren([
        NoteNodeOperations.createData(`2.1 ✍️ ${browser.i18n.getMessage('tipsEdit')}`),
        NoteNodeOperations.createData(`2.2 ❌ ${browser.i18n.getMessage('tipsDelete')}`),
    ]);
    const deleteAll = editTutorialNode.addNode(
        NoteNodeOperations.createData(`2.3 ❌ ${browser.i18n.getMessage('tipsDeleteAll')}`, {
            expanded: false,
        }),
        'child',
    );
    deleteAll
        .addNode(NoteNodeOperations.createData(`${browser.i18n.getMessage('tipsDeleteAllSample')}`))
        .addNode(
            NoteNodeOperations.createData(`${browser.i18n.getMessage('tipsDeleteAllSample')}`),
        );
    deleteAll.collapseSiblings();
    const steps = [
        NoteNodeOperations.createData(`3. 🖱️ ${browser.i18n.getMessage('tipsRClick')}`),
        NoteNodeOperations.createData(`4. 🔍 ${browser.i18n.getMessage('tipsSearch')}`),
        NoteNodeOperations.createData(`5. 🔧 ${browser.i18n.getMessage('tipsSettings')}`),
        NoteNodeOperations.createData(`6. 💌 ${browser.i18n.getMessage('tipsFeedback1')}`),
        NoteNodeOperations.createData(`7. 💌 ${browser.i18n.getMessage('tipsFeedback2')}`),
        NoteNodeOperations.createData(`8. 🎉 ${browser.i18n.getMessage('tipsFinish')}`),
    ];
    tutorialNode.addChildren(steps);
};

export const openUpdateNotification = () => {
    notification.open({
        message: `⭐ ${browser.i18n.getMessage('updateNoteTitle')}`,
        description: browser.i18n.getMessage('updateNoteContent'),
        duration: 3,
    });
};

export const buildUpdateTutorialNodes = (tmTree: FancyTabMasterTree): void => {
    const rootNote = tmTree.tree.getRootNode();
    const tutorialNode = rootNote.addNode(
        NoteNodeOperations.createData(`🎁 ${browser.i18n.getMessage('updateTutorialNode')}`),
        'firstChild',
    );
    tutorialNode
        .addNode(
            NoteNodeOperations.createData(
                `⌨️ ${browser.i18n.getMessage('updateTutorialFeature1')}`,
            ),
        )
        .addNode(
            NoteNodeOperations.createData(browser.i18n.getMessage('updateTutorialFeature1Desc')),
        );
    tutorialNode
        .addNode(
            NoteNodeOperations.createData(
                `🌅 ${browser.i18n.getMessage('updateTutorialFeature2')}`,
            ),
        )
        .addNode(
            NoteNodeOperations.createData(browser.i18n.getMessage('updateTutorialFeature2Desc')),
        );
    tutorialNode
        .addNode(NoteNodeOperations.createData(`🧡 ${browser.i18n.getMessage('reviewLinkMap')}`))
        .addNode(
            TabNodeOperations.createSimple(
                getReviewUrl(),
                browser.i18n.getMessage('reviewLinkMapDesc2'),
                ` 👉${browser.i18n.getMessage('reviewLinkMapDesc')}`,
            ),
        );
};
