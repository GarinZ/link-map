/**
 * @jest-environment jsdom
 */

import type { Tabs } from 'webextension-polyfill';

import { FancyTabMasterTree } from '@/tree/fancy-tab-master-tree';
import type { TreeData, TreeNode } from '@/tree/nodes/nodes';

import 'jquery.fancytree';
import 'jquery.fancytree/dist/modules/jquery.fancytree.dnd5';
import 'jquery.fancytree/dist/modules/jquery.fancytree.childcounter';

export function initFancytree(source: TreeNode<TreeData>[]): FancyTabMasterTree {
    document.body.innerHTML = '<div id="tree">';
    const tree = new FancyTabMasterTree('#tree');
    tree.initTree(source);
    return tree;
}

export function createTab(
    id: number,
    windowId: number,
    index: number,
    openerTabId?: number,
): Tabs.Tab {
    return {
        active: true,
        audible: false,
        autoDiscardable: true,
        discarded: false,
        favIconUrl: '',
        height: 939,
        highlighted: false,
        id,
        incognito: false,
        index,
        mutedInfo: {
            muted: false,
        },
        pinned: false,
        status: 'complete',
        title: `test-title-${id}`,
        url: 'https://baidu.com',
        width: 1792,
        windowId,
        openerTabId,
    };
}
