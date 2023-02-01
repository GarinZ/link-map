import browser from 'sinon-chrome';

import type { FancyTabMasterTree } from '@/tree/fancy-tab-master-tree';

export const mockTabMove = (tabMasterTree: FancyTabMasterTree) => {
    const tree = tabMasterTree.tree;
    browser.tabs.move.callsFake((tabIds, moveProperties) => {
        const { windowId, index } = moveProperties;
        tabIds.forEach((tabId: number) => {
            const targetNode = tree.getNodeByKey(`${tabId}`);
            const { index: fromIndex, windowId: fromWindowId } = targetNode.data;
            const toWindowId = windowId ?? fromWindowId;
            if (!windowId || windowId === fromWindowId) {
                // 1. 同窗口移动调用move
                tabMasterTree.moveTab(toWindowId, tabId, fromIndex, index);
            } else {
                // 2. 跨窗口移动调用detach/attach
                tabMasterTree.detachTab(tabId);
                tabMasterTree.attachTab(toWindowId, tabId, index);
            }
        });
    });
};

export const mockTabRemove = (tabMasterTree: FancyTabMasterTree) => {
    browser.tabs.remove.callsFake(async (tabIds) => {
        await Promise.all(
            tabIds.map(async (tabId: number) => await tabMasterTree.removeTab(tabId)),
        );
    });
};

// export const mockTabQuery = (tabMasterTree: FancyTabMasterTree) => {};

// export const mockTabGet = (tabMasterTree: FancyTabMasterTree) => {};

export const mockTabCreate = (tabMasterTree: FancyTabMasterTree, newTabId: number) => {
    browser.tabs.create.callsFake(async (createProperties) => {
        const { windowId, index, url } = createProperties;
        return { id: newTabId, url, index, windowId };
    });
};
