import { onMessage } from 'webext-bridge';
import { windows } from 'webextension-polyfill';

import {
    activatedNode,
    addNodeFromTab,
    addNodeFromTabAtIndex,
    addNodeFromWindow,
    moveNode,
    removeNode,
    resetNodeIndex,
    updateNode,
} from '../tree/chrome-tab-tree-operation';
import { DND5_CONFIG } from './configs';
import { initTree, onActivated, onClick, renderTitle } from './fancy-tree-event-handler';

$('#tree').fancytree({
    active: true,
    extensions: ['dnd5', 'childcounter'],
    source: [{ title: 'pending' }],
    childcounter: {
        deep: true,
        hideZeros: true,
        hideExpanded: true,
    },
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
    const { tabId } = msg.data;
    removeNode(tree, `${tabId}`, true);
});
onMessage('remove-window', (msg) => {
    const { windowId } = msg.data;
    console.log('remove window!');
    removeNode(tree, `${windowId}`, false);
});
onMessage('move-tab', async (msg) => {
    const { windowId, fromIndex, toIndex, tabId } = msg.data;
    const window = await windows.get(windowId, { populate: true });
    const tabId2Index: { [tabId: number]: number } = {};
    window.tabs!.forEach((tab) => (tabId2Index[tab.id!] = tab.index));
    // 1. 重置所有节点的index属性
    resetNodeIndex(tree, windowId, tabId2Index);
    // 2. 移动元素
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
