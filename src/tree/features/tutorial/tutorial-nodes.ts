import browser from 'webextension-polyfill';

import type { FancyTabMasterTree } from '../tab-master-tree/fancy-tab-master-tree';
import { NoteNodeOperations } from '../tab-master-tree/nodes/note-node-operations';

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
