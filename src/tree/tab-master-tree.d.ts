interface TabMasterTree<Node> {
    createTab(tab: Tabs.Tab): Node;
    createWindow(window: Windows.Window): Node;
    removeTab(tabId: number): void;
    moveTab(windowId: number, tabId: number, fromIndex: number, toIndex: number): void;
    updateTab(tab: Tabs.Tab): void;
    activeTab(tabId: number): void;
    attachTab(windowId: number, tabId: number, fromIndex: number): void;

    detachTab(tabId: number): void;
    replaceTab(addedTabId: number, removedTabId: number): void;
    removeWindow(windowId: number): void;
    windowFocus(windowId: number): void;
    toJsonObj(includeRoot?: boolean): TreeNode<TreeData>;
}
