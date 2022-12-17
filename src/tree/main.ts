import { onMessage } from 'webext-bridge';

import {
    activatedNode,
    addNodeFromTab,
    addNodeFromTabAtIndex,
    addNodeFromWindow,
    moveNode,
    removeNode,
    updateNode,
} from '../tree/chrome-tab-tree-operation';
import { DND5_CONFIG } from './configs';
import { initTree, onActivated, onClick, renderTitle } from './fancy-tree-event-handler';

$('#tree').fancytree({
    active: true,
    extensions: ['dnd5'],
    source: [{ title: 'pending' }],
    activate: onActivated,
    renderTitle,
    click: onClick,
    defaultKey: (node) => `${node.data.id}`,
    dnd5: DND5_CONFIG,
});

const tree = $.ui.fancytree.getTree('#tree');

onMessage('add-tab', (msg) => {
    // 添加node一定是尾部追加
    addNodeFromTab(tree, msg.data);
});
onMessage('remove-tab', (msg) => {
    const { windowId, tabId } = msg.data;
    removeNode(tree, windowId, tabId, true);
});
onMessage('remove-window', (msg) => {
    const { windowId } = msg.data;
    removeNode(tree, windowId, 0, false);
});
onMessage('move-tab', (msg) => {
    const { windowId, fromIndex, toIndex, tabId } = msg.data;
    moveNode(tree, windowId, fromIndex, toIndex, tabId);
});
onMessage('update-tab', (msg) => {
    updateNode(tree, msg.data);
});
onMessage('activated-tab', (msg) => {
    const { windowId, tabId } = msg.data;
    activatedNode(tree, windowId, tabId);
});
onMessage('add-tab-with-index', (msg) => {
    const { newTab, newWindowId, toIndex } = msg.data;
    addNodeFromTabAtIndex(tree, newTab, newWindowId, toIndex);
});
onMessage('add-window', (msg) => {
    addNodeFromWindow(tree, msg.data);
});

initTree(tree);
/** 持久化循环，定时同步一次 */
// const intervalHandle = setInterval(persistence, 5000);
