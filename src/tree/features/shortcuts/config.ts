import { message } from 'antd';
import type { ExtendedKeyboardEvent } from 'mousetrap';
import browser from 'webextension-polyfill';

import { getShortcutSettingUrl } from '../../../config/browser-adapter-config';
import { getOS } from '../../../utils';
import { FancyTabMasterTree } from '../tab-master-tree/fancy-tab-master-tree';

const DEFAULT_MESSAGE_DURATION = 0.5;
export type ShortcutTypes = 'Basic Operation' | 'Navigation';
export const shortcutTypesOrder = [
    {
        type: 'Basic Operation',
        name: browser.i18n.getMessage('basicOperation'),
    },
    {
        type: 'Navigation',
        name: browser.i18n.getMessage('navigation'),
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
    activeLinkMap: {
        name: browser.i18n.getMessage('commandTriggerLinkMap'),
        key: [getOS() === 'MacOS' ? 'Shift + Command + L' : 'Shift + Ctrl + L'],
        type: 'Basic Operation',
        index: 0,
        setUrl: getShortcutSettingUrl(),
    },
    edit: {
        name: browser.i18n.getMessage('ctxMenuEdit'),
        key: ['shift+click'],
        type: 'Basic Operation',
        index: 1,
    },
    close: {
        name: browser.i18n.getMessage('ctxMenuClose'),
        key: [getOS() === 'MacOS' ? 'command+backspace' : 'ctrl+backspace'],
        type: 'Basic Operation',
        index: 2,
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
        index: 3,
        callback: (e, tmTree) => {
            const activeNode = tmTree.tree.getActiveNode();
            if (!activeNode) return;
            e.preventDefault();
            FancyTabMasterTree.removeNodes(activeNode);
        },
    },
    copyLink: {
        name: browser.i18n.getMessage('ctxMenuCopyLink'),
        key: [getOS() === 'MacOS' ? 'command+c' : 'ctrl+c'],
        type: 'Basic Operation',
        index: 4,
        callback: (e, tmTree) => {
            const activeNode = tmTree.tree.getActiveNode();
            if (!activeNode) return;
            e.preventDefault();
            navigator.clipboard.writeText(activeNode.data.url || '').then(() => {
                message.success('Copy url successfully', DEFAULT_MESSAGE_DURATION);
            });
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

export const getShortCutMap = async () => {
    const shortcuts = await browser.commands.getAll();
    const activeShortCut = shortcuts.find((shortcut) => shortcut.name === 'openLinkMap')!.shortcut;
    const key = activeShortCut
        ? activeShortCut?.split('').join(' + ')
        : browser.i18n.getMessage('commandUnset');
    ShortcutMap.activeLinkMap.key = [key];
    return ShortcutMap;
};
