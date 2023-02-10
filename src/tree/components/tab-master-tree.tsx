import { onMessage } from '@garinz/webext-bridge';
import React from 'react';

import { FancyTabMasterTree } from '../fancy-tab-master-tree';

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
        this.registerSearchEventHandler(tree);
    }

    componentWillUnmount() {
        // TODO 销毁tree
        // this.tree.tree.
    }

    registerSearchEventHandler(tree: Fancytree.Fancytree) {
        $('input[name=search]')
            .on('keyup', function (e) {
                const args =
                    'autoApply autoExpand fuzzy hideExpanders highlight leavesOnly nodata'.split(
                        ' ',
                    );
                const opts = {};
                const filterFunc = $('#branchMode').is(':checked')
                    ? tree.filterBranches
                    : tree.filterNodes;
                const match = $(this).val();

                $.each(args, (i, o) => {
                    opts[o] = $(`#${o}`).is(':checked');
                });
                opts.mode = $('#hideMode').is(':checked') ? 'hide' : 'dimm';

                if ((e && e.which === $.ui.keyCode.ESCAPE) || $.trim(match) === '') {
                    $('button#btnResetSearch').trigger('click');
                    return;
                }
                const n = $('#regex').is(':checked')
                    ? filterFunc.call(
                          tree,
                          (node) => {
                              return new RegExp(match, 'i').test(node.title);
                          },
                          opts,
                      )
                    : filterFunc.call(tree, match, opts);
                $('button#btnResetSearch').attr('disabled', false);
                $('span#matches').text(`(${n} matches)`);
            })
            .focus();

        $('button#btnResetSearch')
            .click((e) => {
                $('input[name=search]').val('');
                $('span#matches').text('');
                tree.clearFilter();
            })
            .attr('disabled', true);

        $('fieldset input:checkbox').change(function (e) {
            const id = $(this).attr('id');
            const flag = $(this).is(':checked');

            // Some options can only be set with general filter options (not method args):
            switch (id) {
                case 'counter':
                case 'hideExpandedCounter':
                    tree.options.filter[id] = flag;
                    break;
            }
            tree.clearFilter();
            $('input[name=search]').keyup();
        });
    }

    render() {
        return (
            <div className="tree-container">
                <input name="search" placeholder="Filter..." autoComplete="off" />
                <button id="btnResetSearch">&times;</button>
                <div id="tree" ref={(el) => (this.el = el)} />
            </div>
        );
    }
}
