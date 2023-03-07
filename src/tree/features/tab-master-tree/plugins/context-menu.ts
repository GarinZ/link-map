import { FancyTabMasterTree } from '../fancy-tab-master-tree';
import { NoteNodeOperations } from '../nodes/note-node-operations';

import 'jquery-contextmenu/dist/jquery.contextMenu.min.js';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.css';

export const registerContextMenu = () => {
    $.contextMenu({
        selector: '#tree span.fancytree-title',
        items: {
            edit: {
                name: 'Edit',
                icon: () => 'iconfont icon-edit context-menu-icon',
            },
            delete: {
                name: 'Delete',
                icon: () => 'iconfont icon-trash context-menu-icon',
            },
            close: { name: 'Close', icon: () => 'iconfont icon-roundclosefill context-menu-icon' },
            // focus: {
            //     name: 'Focus',
            //     items: {
            //         focusCurrentNode: { name: 'Focus this node' },
            //         resetFocus: { name: 'Focus reset' },
            //     },
            // },
            copy: {
                name: 'Copy',
                icon: () => 'iconfont icon-copy context-menu-icon',
                items: {
                    copyLink: {
                        name: 'Copy Link',
                        icon: () => 'iconfont icon-URLguanli context-menu-icon',
                    },
                    copyMarkdownLink: {
                        name: 'Copy Markdown Link',
                        icon: () => 'iconfont icon-markdown context-menu-icon',
                    },
                },
            },
            notes: {
                name: 'Notes',
                icon: () => 'iconfont icon-note context-menu-icon',
                items: {
                    insertNodeAsParent: {
                        name: 'Create As Parent',
                        icon: () => 'iconfont icon-a-Parentchild-outlined context-menu-icon',
                    },
                    insertNodeAsFirstSubNode: {
                        name: 'Create As First Sub Node',
                        icon: () => 'iconfont icon-top context-menu-icon',
                    },
                    insertNodeAsLastSubNode: {
                        name: 'Create As Last Sub Node',
                        icon: () => 'iconfont icon-bottom context-menu-icon',
                    },
                },
            },
        },
        callback(itemKey: string, opt) {
            const node = $.ui.fancytree.getNode(opt.$trigger);
            switch (itemKey) {
                case 'edit':
                    node.editStart();
                    break;
                case 'delete':
                    FancyTabMasterTree.removeNodes(node);
                    break;
                case 'close':
                    FancyTabMasterTree.closeNodes(node);
                    break;
                case 'insertNodeAsParent':
                    node.moveTo(node.addNode(NoteNodeOperations.createData(), 'before'), 'child');
                    break;
                case 'insertNodeAsFirstSubNode':
                    node.addNode(NoteNodeOperations.createData(), 'firstChild');
                    break;
                case 'insertNodeAsLastSubNode':
                    node.addNode(NoteNodeOperations.createData(), 'child');
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
