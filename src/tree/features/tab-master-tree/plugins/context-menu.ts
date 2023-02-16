import { FancyTabMasterTree } from '../fancy-tab-master-tree';
import { NoteNodeOperations } from '../nodes/note-node-operations';

import 'jquery-contextmenu/dist/jquery.contextMenu.min.js';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.css';

export const registerContextMenu = () => {
    $.contextMenu({
        selector: '#tree span.fancytree-title',
        items: {
            delete: { name: 'Delete' },
            close: { name: 'Close' },
            focus: {
                name: 'Focus',
                items: {
                    focusCurrentNode: { name: 'Focus this node' },
                    resetFocus: { name: 'Focus reset' },
                },
            },
            copy: {
                name: 'Copy',
                items: {
                    copyLink: { name: 'Copy Link' },
                    copyMarkdownLink: { name: 'Copy Markdown Link' },
                },
            },
            notes: {
                name: 'Notes',
                items: {
                    insertNodeAsParent: { name: 'insert Note as parent' },
                    insertNodeAsFirstSubNode: { name: 'insert Note as first sub node' },
                    insertNodeAsLastSubNode: { name: 'insert Note as last sub node' },
                },
            },
        },
        callback(itemKey: string, opt) {
            const node = $.ui.fancytree.getNode(opt.$trigger);
            switch (itemKey) {
                case 'delete':
                    FancyTabMasterTree.removeNodes(node);
                    break;
                case 'close':
                    FancyTabMasterTree.closeNodes(node);
                    break;
                case 'insertNodeAsParent':
                    node.moveTo(node.addNode(NoteNodeOperations.createData(), 'before'), 'child');
                    break;
                case 'focusCurrentNode':
                    node.setActive();
                    node.tree.filterBranches((node) => node.isActive(), { mode: 'hide' });
                    break;
                case 'resetFocus':
                    node.tree.clearFilter();
                    break;
                case 'copyLink':
                    navigator.clipboard.writeText(node.data.url);
                    break;
                case 'copyMarkdownLink':
                    navigator.clipboard.writeText(`[${node.data.title}](${node.data.url})`);
                    break;
            }
        },
    });
};
