/**
 * @jest-environment jsdom
 */

import $ from 'jquery';
import type { Tabs } from 'webextension-polyfill';

import type { TreeData, TreeNode } from '../../src/logic/nodes';
import { DND5_CONFIG } from '../../src/tree/configs';
import { onClick, renderTitle } from '../../src/tree/fancy-tree-event-handler';

import 'jquery.fancytree';
import 'jquery.fancytree/dist/modules/jquery.fancytree.dnd5';
import 'jquery.fancytree/dist/modules/jquery.fancytree.childcounter';

export function initFancytree(source: TreeNode<TreeData>[]) {
    document.body.innerHTML = '<div id="tree">';
    $('#tree').fancytree({
        active: true,
        extensions: ['dnd5', 'childcounter'],
        source,
        childcounter: {
            deep: true,
            hideZeros: true,
            hideExpanded: true,
        },
        renderNode(_event, data) {
            data.node.renderTitle();
        },
        click: onClick,
        defaultKey: (node) => `${node.data.id}`,
        dnd5: DND5_CONFIG,
        renderTitle,
    });

    return $.ui.fancytree.getTree('#tree');
}

export function createTab(
    id: number,
    windowId: number,
    index: number,
    openerTabId?: number,
): Tabs.Tab {
    return {
        active: false,
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
