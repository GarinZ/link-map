import { message } from 'antd';
import log from 'loglevel';
import type { ExtendedKeyboardEvent } from 'mousetrap';
import browser from 'webextension-polyfill';

import { getShortcutSettingUrl } from '../../../config/browser-adapter-config';
import { commandKeyMap } from '../../../manifest';
import { getOS } from '../../../utils';
import { FancyTabMasterTree } from '../tab-master-tree/fancy-tab-master-tree';

const DEFAULT_MESSAGE_DURATION = 0.5;
export type ShortcutTypes = 'Basic Operation' | 'Navigation' | 'Tag';
export const shortcutTypesOrder = [
    {
        type: 'Basic Operation',
        name: browser.i18n.getMessage('basicOperation'),
    },
    {
        type: 'Navigation',
        name: browser.i18n.getMessage('navigation'),
    },
    {
        type: 'Tag',
        name: browser.i18n.getMessage('ctxMenuNotes'),
    },
];

interface IShortcut {
    name: string;
    key: string[];
    type: ShortcutTypes;
    index: number;
    callback?: (e: ExtendedKeyboardEvent, tmTree: FancyTabMasterTree) => void;
    setUrl?: string;
}

export interface IShortcutMap {
    [shortcutType: string]: IShortcut;
}

export const ShortcutMap: IShortcutMap = {
    search: {
        name: browser.i18n.getMessage('search'),
        key: [getOS() === 'MacOS' ? 'command+k' : 'ctrl+k'],
        type: 'Navigation',
        index: 0,
    },
    goToPreviousNode: {
        name: browser.i18n.getMessage('goToPreviousNode'),
        key: ['↑'],
        type: 'Navigation',
        index: 1,
    },
    goToNextNode: {
        name: browser.i18n.getMessage('goToNextNode'),
        key: ['↓'],
        type: 'Navigation',
        index: 2,
    },
    goToParentNode: {
        name: browser.i18n.getMessage('goToParentNode'),
        key: ['Backspace'],
        type: 'Navigation',
        index: 3,
    },
    expand: {
        name: browser.i18n.getMessage('expand'),
        key: ['→'],
        type: 'Navigation',
        index: 4,
    },
    collapse: {
        name: browser.i18n.getMessage('collapse'),
        key: ['←'],
        type: 'Navigation',
        index: 5,
    },
    expandAll: {
        name: browser.i18n.getMessage('expandAll'),
        key: ['shift+command+]'],
        type: 'Navigation',
        index: 6,
        callback: (_e, tmTree) => {
            tmTree.tree.expandAll();
        },
    },
    collapseAll: {
        name: browser.i18n.getMessage('collapseAll'),
        key: ['shift+command+['],
        type: 'Navigation',
        index: 7,
        callback: (_e, tmTree) => {
            tmTree.tree.expandAll(false);
        },
    },
    activeLinkMap: {
        name: browser.i18n.getMessage('commandTriggerLinkMap'),
        key: [getOS() === 'MacOS' ? 'Shift + Command + L' : 'Shift + Ctrl + L'],
        type: 'Basic Operation',
        index: 0,
        setUrl: getShortcutSettingUrl(),
    },
    activeOrOpen: {
        name: browser.i18n.getMessage('activeOrOpen'),
        key: ['enter', 'double-Click'],
        type: 'Basic Operation',
        index: 1,
        callback: async (_e, tmTree) => {
            const activeNode = tmTree.tree.getActiveNode();
            if (!activeNode) return;
            if (activeNode.data.nodeType === 'note') {
                FancyTabMasterTree.insertTag(activeNode, 'after');
            } else {
                await FancyTabMasterTree.onDbClick(activeNode);
            }
        },
    },
    save: {
        name: 'Save',
        key: ['command+s'],
        type: 'Basic Operation',
        index: 2,
        callback: async (e, tmTree) => {
            e.preventDefault();
            const activeNode = tmTree.tree.getActiveNode();
            if (!activeNode) return;
            FancyTabMasterTree.save(activeNode);
        },
    },
    edit: {
        name: browser.i18n.getMessage('ctxMenuEdit'),
        key: ['shift+click', 'space'],
        type: 'Basic Operation',
        index: 2,
        callback: (_e, tmTree) => {
            const activeNode = tmTree.tree.getActiveNode();
            if (!activeNode) return;
            activeNode.editStart();
        },
    },
    close: {
        name: browser.i18n.getMessage('ctxMenuClose'),
        key: [getOS() === 'MacOS' ? 'command+backspace' : 'ctrl+backspace'],
        type: 'Basic Operation',
        index: 3,
        callback: (e, tmTree) => {
            const activeNode = tmTree.tree.getActiveNode();
            if (!activeNode) return;
            e.preventDefault();
            FancyTabMasterTree.closeNodes(activeNode);
        },
    },
    delete: {
        name: browser.i18n.getMessage('ctxMenuDelete'),
        key: [getOS() === 'MacOS' ? 'shift+command+backspace' : 'shift+ctrl+backspace'],
        type: 'Basic Operation',
        index: 4,
        callback: (e, tmTree) => {
            const activeNode = tmTree.tree.getActiveNode();
            if (!activeNode) return;
            e.preventDefault();
            const nextActiveNode = getNextOrPrevNode(activeNode);
            FancyTabMasterTree.removeNodes(activeNode);
            nextActiveNode?.setActive();
        },
    },
    copyLink: {
        name: browser.i18n.getMessage('ctxMenuCopyLink'),
        key: [getOS() === 'MacOS' ? 'command+c' : 'ctrl+c'],
        type: 'Basic Operation',
        index: 5,
        callback: (e, tmTree) => {
            const activeNode = tmTree.tree.getActiveNode();
            if (!activeNode) return;
            e.preventDefault();
            navigator.clipboard.writeText(activeNode.data.url || '').then(() => {
                message.success('Copy url successfully', DEFAULT_MESSAGE_DURATION);
            });
        },
    },
    insertTagAsAfter: {
        name: browser.i18n.getMessage('ctxMenuNotesCreateAfter'),
        key: ['enter'],
        type: 'Tag',
        index: 0,
    },
    insertTagAsParent: {
        name: browser.i18n.getMessage('ctxMenuNotesCreateAsParent'),
        key: ['shift+command+enter'],
        type: 'Tag',
        index: 1,
        callback: (e, tmTree) => {
            const activeNode = tmTree.tree.getActiveNode();
            if (!activeNode) return;
            e.preventDefault();
            FancyTabMasterTree.insertTag(activeNode, 'parent');
        },
    },
    insertTagAsLastChild: {
        name: browser.i18n.getMessage('ctxMenuNotesCreateAsLastSubNode'),
        key: ['command+enter'],
        type: 'Tag',
        index: 2,
        callback: (e, tmTree) => {
            const activeNode = tmTree.tree.getActiveNode();
            if (!activeNode) return;
            e.preventDefault();
            FancyTabMasterTree.insertTag(activeNode, 'child');
        },
    },
};

function capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export const getDisplayName = (keys: string[]) => {
    return keys
        .map((key) => {
            const displayName = key
                .split('+')
                .map((element) => capitalizeFirstLetter(element))
                .join(' + ');
            return displayName.replace('Command', '⌘');
        })
        .join('/');
};

const keyDisplayNameByOS = (key: string) => {
    return getOS() === 'MacOS' ? [...key].join(' + ') : key.split('+').join(' + ');
};

export const getShortCutMap = async () => {
    const shortcuts = await browser.commands.getAll();
    const activeShortCut = shortcuts.find(
        (shortcut) => shortcut.name === commandKeyMap.openLinkMap,
    )!.shortcut;
    log.debug('activeShortCut', activeShortCut);
    const key = activeShortCut
        ? keyDisplayNameByOS(activeShortCut)
        : browser.i18n.getMessage('commandUnset');
    ShortcutMap.activeLinkMap.key = [key];
    return ShortcutMap;
};

export function getNextOrPrevNode(node: Fancytree.FancytreeNode): Fancytree.FancytreeNode | null {
    let targetNode: Fancytree.FancytreeNode | null = null;
    node.tree.visitRows(
        (n) => {
            targetNode = n;
            return false;
        },
        { start: node, includeSelf: false },
    );
    if (targetNode) return targetNode;
    node.tree.visitRows(
        (n) => {
            targetNode = n;
            return false;
        },
        { start: node, includeSelf: true, reverse: true },
    );
    return targetNode;
}
