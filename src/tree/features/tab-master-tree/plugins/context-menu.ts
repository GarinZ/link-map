import browser from 'webextension-polyfill';

import { FancyTabMasterTree } from '../fancy-tab-master-tree';
import { NoteNodeOperations } from '../nodes/note-node-operations';

import 'jquery-contextmenu/dist/jquery.contextMenu.min.js';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.css';

export const registerContextMenu = () => {
    $.contextMenu({
        selector: '#tree span.fancytree-title',
        items: {
            edit: {
                name: browser.i18n.getMessage('ctxMenuEdit'),
                icon: () => 'iconfont icon-edit context-menu-icon',
            },
            delete: {
                name: browser.i18n.getMessage('ctxMenuDelete'),
                icon: () => 'iconfont icon-trash context-menu-icon',
                items: {
                    deleteNode: {
                        name: 'Delete Node',
                        icon: () => 'iconfont icon-pointer context-menu-icon',
                    },
                    deleteSubTree: {
                        name: 'Delete Subtree',
                        icon: () => 'iconfont icon-node-multiple context-menu-icon',
                    },
                },
            },
            close: {
                name: browser.i18n.getMessage('ctxMenuClose'),
                icon: () => 'iconfont icon-roundclosefill context-menu-icon',
                items: {
                    closeNode: {
                        name: 'Close Node',
                        icon: () => 'iconfont icon-pointer context-menu-icon',
                    },
                    closeSubTree: {
                        name: 'Close Subtree',
                        icon: () => 'iconfont icon-node-multiple context-menu-icon',
                    },
                },
            },
            // focus: {
            //     name: 'Focus',
            //     items: {
            //         focusCurrentNode: { name: 'Focus this node' },
            //         resetFocus: { name: 'Focus reset' },
            //     },
            // },
            copy: {
                name: browser.i18n.getMessage('ctxMenuCopy'),
                icon: () => 'iconfont icon-copy context-menu-icon',
                items: {
                    copyLink: {
                        name: browser.i18n.getMessage('ctxMenuCopyLink'),
                        icon: () => 'iconfont icon-URLguanli context-menu-icon',
                    },
                    copyMarkdownLink: {
                        name: browser.i18n.getMessage('ctxMenuCopyMarkDownLink'),
                        icon: () => 'iconfont icon-markdown context-menu-icon',
                    },
                },
            },
            notes: {
                name: browser.i18n.getMessage('ctxMenuNotes'),
                icon: () => 'iconfont icon-note context-menu-icon',
                items: {
                    insertNodeAsParent: {
                        name: browser.i18n.getMessage('ctxMenuNotesCreateAsParent'),
                        icon: () => 'iconfont icon-a-Parentchild-outlined context-menu-icon',
                    },
                    insertNodeAsFirstSubNode: {
                        name: browser.i18n.getMessage('ctxMenuNotesCreateAsFirstSubNode'),
                        icon: () => 'iconfont icon-top context-menu-icon',
                    },
                    insertNodeAsLastSubNode: {
                        name: browser.i18n.getMessage('ctxMenuNotesCreateAsLastSubNode'),
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
                case 'deleteNode':
                    FancyTabMasterTree.removeNodes(node, 'item');
                    break;
                case 'deleteSubTree':
                    FancyTabMasterTree.removeNodes(node, 'all');
                    break;
                case 'closeNode':
                    FancyTabMasterTree.closeNodes(node, 'item');
                    break;
                case 'closeSubTree':
                    FancyTabMasterTree.closeNodes(node, 'all');
                    break;
                case 'insertNodeAsParent': {
                    const newNode = node.addNode(NoteNodeOperations.createData(), 'before');
                    node.moveTo(newNode, 'child');
                    newNode.editStart();
                    break;
                }
                case 'insertNodeAsFirstSubNode': {
                    const newTag = node.addNode(NoteNodeOperations.createData(), 'firstChild');
                    node.setExpanded(true);
                    newTag.editStart();
                    break;
                }
                case 'insertNodeAsLastSubNode': {
                    const newTag = node.addNode(NoteNodeOperations.createData(), 'child');
                    node.setExpanded(true);
                    newTag.editStart();
                    break;
                }
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
