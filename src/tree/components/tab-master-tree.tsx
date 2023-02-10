import { onMessage } from '@garinz/webext-bridge';
import React from 'react';

import { FancyTabMasterTree } from '../fancy-tab-master-tree';
import { registerSearchEventHandler } from '../plugins/filter';

export class TabMasterTree extends React.Component {
    private el?: HTMLElement | null;
    private $el?: JQuery;
    private tree?: FancyTabMasterTree;

    componentDidMount() {
        this.$el = $(this.el!);
        this.tree = new FancyTabMasterTree(this.$el);
        const tabMasterTree = this.tree;
        this.tree.initTree().then(() => {
            onMessage('add-tab', (msg) => {
                tabMasterTree.createTab(msg.data);
            });
            onMessage('remove-tab', (msg) => {
                const { tabId } = msg.data;
                tabMasterTree.removeTab(tabId);
            });
            onMessage('remove-window', (msg) => {
                tabMasterTree.removeWindow(msg.data.windowId);
            });
            onMessage('move-tab', async (msg) => {
                const { windowId, fromIndex, toIndex, tabId } = msg.data;
                // 2. 移动元素
                tabMasterTree.moveTab(windowId, tabId, fromIndex, toIndex);
            });
            onMessage('update-tab', (msg) => {
                tabMasterTree.updateTab(msg.data);
            });
            onMessage('activated-tab', (msg) => {
                const { windowId, tabId } = msg.data;
                tabMasterTree.activeTab(windowId, tabId);
            });
            onMessage('attach-tab', (msg) => {
                const { tabId, windowId, newIndex } = msg.data;
                tabMasterTree.attachTab(windowId, tabId, newIndex);
            });
            onMessage('detach-tab', (msg) => {
                const { tabId } = msg.data;
                tabMasterTree.detachTab(tabId);
            });
            onMessage('window-focus', (msg) => {
                const { windowId } = msg.data;
                tabMasterTree.windowFocus(windowId);
            });
            onMessage('add-window', (msg) => {
                tabMasterTree.createWindow(msg.data);
            });
        });
        const tree = this.tree.tree;
        registerSearchEventHandler(tree);
    }

    componentWillUnmount() {
        // TODO 销毁tree
        // this.tree.tree.
    }

    render() {
        return (
            <div className="tree-container">
                <div id="tree" ref={(el) => (this.el = el)} />
            </div>
        );
    }
}
