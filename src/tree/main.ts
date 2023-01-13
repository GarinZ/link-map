import { onMessage } from '@garinz/webext-bridge';

import { FancyTabMasterTree } from './fancy-tab-master-tree';

const tree = new FancyTabMasterTree('#tree');
tree.initTree();

onMessage('add-tab', (msg) => {
    tree.createTab(msg.data);
});
onMessage('remove-tab', (msg) => {
    const { tabId } = msg.data;
    tree.removeTab(tabId);
});
onMessage('remove-window', (msg) => {
    tree.removeWindow(msg.data.windowId);
});
onMessage('move-tab', async (msg) => {
    const { windowId, fromIndex, toIndex, tabId } = msg.data;
    // 2. 移动元素
    tree.moveTab(windowId, tabId, toIndex, fromIndex);
});
onMessage('update-tab', (msg) => {
    tree.updateTab(msg.data);
});
onMessage('activated-tab', (msg) => {
    tree.activeTab(msg.data.tabId);
});
onMessage('add-window', (msg) => {
    tree.createWindow(msg.data);
});
