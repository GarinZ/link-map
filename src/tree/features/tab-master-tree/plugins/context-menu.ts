import browser from 'webextension-polyfill';

import { FancyTabMasterTree } from '../fancy-tab-master-tree';

import 'jquery-contextmenu/dist/jquery.contextMenu.min.js';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.css';

export const registerContextMenu = () => {
    $.contextMenu({
        selector: '#tree span.fancytree-title',
        items: {
            save: {
                name: browser.i18n.getMessage('save'),
                icon: () => 'iconfont icon-lock context-menu-icon',
            },
            edit: {
                name: browser.i18n.getMessage('ctxMenuEdit'),
                icon: () => 'iconfont icon-edit context-menu-icon',
            },
            delete: {
                name: browser.i18n.getMessage('ctxMenuDelete'),
                icon: () => 'iconfont icon-trash context-menu-icon',
                items: {
                    deleteNode: {
                        name: browser.i18n.getMessage('deleteNode'),
                        icon: () => 'iconfont icon-pointer context-menu-icon',
                    },
                    deleteSubTree: {
                        name: browser.i18n.getMessage('deleteSubTree'),
                        icon: () => 'iconfont icon-node-multiple context-menu-icon',
                    },
                },
            },
            close: {
                name: browser.i18n.getMessage('ctxMenuClose'),
                icon: () => 'iconfont icon-roundclosefill context-menu-icon',
                items: {
                    closeNode: {
                        name: browser.i18n.getMessage('closeNode'),
                        icon: () => 'iconfont icon-pointer context-menu-icon',
                    },
                    closeSubTree: {
                        name: browser.i18n.getMessage('closeSubTree'),
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
                    copySubtreeAsText: {
                        name: browser.i18n.getMessage('copySubtreeAsText'),
                        icon: () => 'iconfont icon-URLguanli context-menu-icon',
                    },
                    copySubtreeAsMarkdown: {
                        name: browser.i18n.getMessage('copySubtreeAsMarkdown'),
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
            expandAll: {
                name: browser.i18n.getMessage('expandAll'),
                icon: () => 'iconfont icon-expand_all context-menu-icon',
            },
            collapseAll: {
                name: browser.i18n.getMessage('collapseAll'),
                icon: () => 'iconfont icon-collapse_all context-menu-icon',
            },
        },
        callback(itemKey: string, opt) {
            const node = $.ui.fancytree.getNode(opt.$trigger);
            switch (itemKey) {
                case 'save':
                    FancyTabMasterTree.save(node);
                    break;
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
                    FancyTabMasterTree.insertTag(node, 'parent');
                    break;
                }
                case 'insertNodeAsFirstSubNode': {
                    FancyTabMasterTree.insertTag(node, 'firstChild');
                    break;
                }
                case 'insertNodeAsLastSubNode': {
                    FancyTabMasterTree.insertTag(node, 'child');
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
                case 'copySubtreeAsText':
                    FancyTabMasterTree.copySubtree(node, 'txt');
                    break;
                case 'copySubtreeAsMarkdown':
                    FancyTabMasterTree.copySubtree(node, 'md');
                    break;
                case 'expandAll':
                    node.visit((node) => node.setExpanded(true), true);
                    break;
                case 'collapseAll':
                    node.visit((node) => node.setExpanded(false), true);
                    break;
            }
        },
    });
};
