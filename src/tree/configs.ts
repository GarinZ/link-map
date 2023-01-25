import browser from 'webextension-polyfill';

import { WindowNodeOperations } from './nodes/window-node-operations';

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
    const sourceWindowId = sourceNode.data.windowId;
    const toMoveTabNodeList = [];
    sourceNode.visit((node) => {
        const { windowId, nodeType, closed } = node.data;
        if (nodeType === 'window' && !closed && windowId === sourceWindowId) {
            toMoveTabNodeList.push(node);
        }
        return true;
    }, true);
    if (toMoveTabNodeList.length === 0) return;
    let targetWindowNode: Fancytree.FancytreeNode | null = null;
    sourceNode.visitParents((parent) => {
        if (parent.data.nodeType === 'window') {
            targetWindowNode = parent;
            return false;
        }
        return true;
    });
    if (targetWindowNode === null) {
        // 2. 移动到无窗口位置或窗口关闭：需要新建窗口
        const window = await browser.windows.create();
        const windowData = WindowNodeOperations.createData(window, false);
        targetWindowNode = sourceNode.addNode(windowData, 'before');
        sourceNode.moveTo(targetWindowNode, 'child');
    } else if (targetWindowNode.data.closed) {
        // 3. 移动到已关闭窗口：需要新建窗口并更新属性
        const window = await browser.windows.create();
        WindowNodeOperations.updatePartial(targetWindowNode, window);
    }

    if (targetWindowNode.data.windowId === sourceWindowId) {
        // 同窗口移动：移动tab
    } else if (targetWindowNode.data.windowId !== sourceWindowId) {
        // 跨窗口移动：跨窗口移动tab
    }
}
