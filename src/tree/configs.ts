import browser from 'webextension-polyfill';

import { FancyTabMasterTree } from './fancy-tab-master-tree';
import { TabNodeOperations } from './nodes/tab-node-operations';

interface DND5Data {
    dataTransfer: {
        dropEffect: 'none';
        effectAllowed: string; // ('all', 'copyMove', 'link', 'move', ...) Settable on dragstart only
        [otherProp: string]: any;
    };
    effectAllowed: string; // ('all', 'copyMove', 'link', 'move', ...) Settable on dragstart only
    dropEffect: 'move' | 'link' | 'drop' | 'none'; // ('move', 'copy', or 'link') access the requested drop effect
    dropEffectSuggested: 'move' | 'link' | 'drop'; // Recommended effect derived from a common key mapping
    files: File[]; // list of `File` objects if any were dropped (may be [])
    hitMode: 'over' | 'after' | 'before';
    isCancelled: boolean; // Set for dragend and drop events
    isMove: boolean; // false for copy or link effects
    node: Fancytree.FancytreeNode; // The node that the event refers to (also passed as first argument)
    options: Fancytree.FancytreeOptions; // Tree options (plugin options accessible as `options.dnd5`)
    originalEvent: DragEvent; // The original jQuery Event that caused this callback
    otherNode: Fancytree.FancytreeNode; // If applicable: the other node, e.g. drag source, ...
    otherNodeList: Fancytree.FancytreeNode[];
    tree: Fancytree.Fancytree; // The tree that the event refers to
    useDefaultImage: true; // (Default: true) Developer can set this to false if a custom setDragImage() was called
    [otherProp: string]: any;
}

/** Drag&Drop HTML5 Config */
export const DND5_CONFIG: Fancytree.Extensions.DragAndDrop5 = {
    autoExpandMS: 400,
    preventNonNodes: true,
    preventRecursion: true, // Prevent dropping nodes on own descendants
    preventVoidMoves: true, // Prevent moving nodes 'before self', etc.
    effectAllowed: 'all',
    dropEffectDefault: 'move', // "auto",
    scroll: true,
    multiSource: false,

    dragStart(_node: Fancytree.FancytreeNode, _data: DND5Data) {
        return true;
    },
    dragDrag(_node: Fancytree.FancytreeNode, _data: DND5Data) {},
    dragEnter(_node: Fancytree.FancytreeNode, _data: DND5Data) {
        return true;
    },
    dragOver(_node: Fancytree.FancytreeNode, data: DND5Data) {
        // Assume typical mapping for modifier keys
        data.dropEffect = data.dropEffectSuggested;
        // data.dropEffect = "move";
    },
    dragDrop(targetNode: Fancytree.FancytreeNode, data: DND5Data) {
        // This function MUST be defined to enable dropping of items on the tree.
        const transfer = data.dataTransfer;
        const mode = data.dropEffect;
        // 2. 从当前树中移动节点（没有跨树移动），移动节点中包含子树
        const sameTree = data.otherNode.tree === data.tree;
        if (data.otherNode && sameTree) {
            // Drop another Fancytree node from same frame (maybe a different tree however)
            if (mode === 'move') {
                data.otherNode.moveTo(targetNode, data.hitMode);
                tabMoveOnDrop(data.otherNode);
            } else {
                throw new Error('Not implemented other dropEffect');
            }
        } else if (data.otherNode && !sameTree) {
            throw new Error('Not implemented cross tree move');
        } else if (data.otherNodeData) {
            // 若node是从其他frame或window拖拽进来的
            // Drop Fancytree node from different frame or window, so we only have
            // JSON representation available
            targetNode.addChildren(data.otherNodeData, data.hitMode);
        } else {
            // Drop a non-node
            targetNode.addNode({ title: transfer.getData('text') }, data.hitMode);
        }
        targetNode.setExpanded();
    },
};

async function tabMoveOnDrop(sourceNode: Fancytree.FancytreeNode): Promise<void> {
    // 1. 非tabNode移动：什么都不用做
    if (sourceNode.data.nodeType !== 'tab') return;
    // 2. 移动tabNode
    // 2.1 先找打开的tabNode
    const oldWindowId = sourceNode.data.windowId;
    const toMoveTabNodeList: Fancytree.FancytreeNode[] = [];
    sourceNode.visit((node) => {
        const { windowId, nodeType, closed } = node.data;
        if (nodeType === 'tab' && !closed && windowId === oldWindowId) {
            toMoveTabNodeList.push(node);
        }
        return true;
    }, true);
    if (toMoveTabNodeList.length === 0) return;
    // 2.2 找到需要移动到的window
    let targetWindowNode: Fancytree.FancytreeNode | null =
        TabNodeOperations.findWindowNode(sourceNode);
    if (targetWindowNode === null) {
        // 2. 移动到无窗口位置需要新建窗口
        targetWindowNode = await FancyTabMasterTree.createWindowNodeAsParent(sourceNode);
    } else if (targetWindowNode.data.closed) {
        // 3. 移动到已关闭窗口：需要新建窗口并更新属性
        await FancyTabMasterTree.reopenWindowNode(targetWindowNode, toMoveTabNodeList);
    }
    const newWindowId = targetWindowNode.data.windowId;
    const toMoveTabIds = toMoveTabNodeList.map((node) => node.data.id);
    const prevOpenedTabNode = TabNodeOperations.findPrevOpenedTabNode(sourceNode);
    const toIndex = prevOpenedTabNode ? prevOpenedTabNode.getIndex() + 1 : 0;
    await browser.tabs.move(toMoveTabIds, { windowId: newWindowId, index: toIndex });
    // TODO index变化是否可以通过回调做兼容？
}
