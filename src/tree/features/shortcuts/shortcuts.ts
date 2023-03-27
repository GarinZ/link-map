import Mousetrap from 'mousetrap';

import type { FancyTabMasterTree } from '../tab-master-tree/fancy-tab-master-tree';
import { ShortcutMap } from './config';

const registerShortcuts = (tmTree: FancyTabMasterTree) => {
    Object.values(ShortcutMap).forEach((shortcut) => {
        if (!shortcut.callback) {
            return;
        }
        Mousetrap.bind(shortcut.key, (e) => {
            shortcut.callback!(e, tmTree);
        });
    });
    // Copy Markdown Link
    // Mousetrap.bind(['ctrl+shift+c', 'command+shift+c'], (e) => {
    //     const activeNode = tmTree.tree.getActiveNode();
    //     if (!activeNode) return;
    //     e.preventDefault()
    //     navigator.clipboard.writeText(`[${activeNode.data.title}](${activeNode.data.url})`).then(() => {
    //         message.success('Copy markdown url successfully', DEFAULT_MESSAGE_DURATION);
    //     });
    // });
};

export default registerShortcuts;
