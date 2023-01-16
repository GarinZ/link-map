import { tabs } from 'webextension-polyfill';

import { BrowserExtensionUtils, FancyTreeUtils, logLazy } from './utils';

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
    // autoExpandMS: 400,
    // preventForeignNodes: true,
    // preventNonNodes: true,
    preventRecursion: true, // Prevent dropping nodes on own descendants
    // preventSameParent: true,
    preventVoidMoves: true, // Prevent moving nodes 'before self', etc.
    // effectAllowed: "all",
    // dropEffectDefault: "move", // "auto",

    dragStart(node: Fancytree.FancytreeNode, data: DND5Data) {
        data.effectAllowed = 'all';
        data.dropEffect = 'move';
        return true;
    },
    dragDrag(_node: Fancytree.FancytreeNode, data: DND5Data) {
        logLazy(
            'dragDrag',
            null,
            2000,
            `${'T1: dragDrag: ' + 'data: '}${data.dropEffect}/${
                data.effectAllowed
            }, dataTransfer: ${data.dataTransfer.dropEffect}/${data.dataTransfer.effectAllowed}`,
        );
    },
    // dragEnd: function(node, data) {
    //   node.debug( "T1: dragEnd: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
    //     ", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed, data);
    //     alert("T1: dragEnd")
    // },

    // --- Drop-support:

    dragEnter(node: Fancytree.FancytreeNode, data: DND5Data) {
        node.debug(
            `${'T1: dragEnter: ' + 'data: '}${data.dropEffect}/${
                data.effectAllowed
            }, dataTransfer: ${data.dataTransfer.dropEffect}/${data.dataTransfer.effectAllowed}`,
        );

        // data.dropEffect = "copy";
        return true;
    },
    dragOver(_node: Fancytree.FancytreeNode, data: DND5Data) {
        logLazy(
            'dragOver',
            null,
            2000,
            `${'T1: dragOver: ' + 'data: '}${data.dropEffect}/${
                data.effectAllowed
            }, dataTransfer: ${data.dataTransfer.dropEffect}/${data.dataTransfer.effectAllowed}`,
        );

        // Assume typical mapping for modifier keys
        data.dropEffect = data.dropEffectSuggested;
        // data.dropEffect = "move";
    },
    dragDrop(targetNode: Fancytree.FancytreeNode, data: DND5Data) {
        /* This function MUST be defined to enable dropping of items on
         * the tree.
         */
        let newNode;
        const transfer = data.dataTransfer;
        let sourceNodes = data.otherNodeList;
        const mode = data.dropEffect;
        // 1. 若hitMode设置为after，直接
        if (data.hitMode === 'after') {
            // If node are inserted directly after target node one-by-one,
            // this would reverse them. So we compensate:
            sourceNodes = sourceNodes.reverse();
        }
        // 2. 从当前树中移动节点（没有跨树移动），移动节点中包含子树
        if (data.otherNode) {
            // Drop another Fancytree node from same frame (maybe a different tree however)
            const sameTree = data.otherNode.tree === data.tree;
            if (mode === 'move') {
                data.otherNode.moveTo(targetNode, data.hitMode);
                if (data.othernode.data.nodeType === 'window') {
                    // 若移动的是windowNode，什么也不做
                    return;
                }
                sortOnDrop(targetNode, sourceNodes);
            } else {
                newNode = data.otherNode.copyTo(targetNode, data.hitMode);
                if (mode === 'link') newNode.setTitle(`Link to ${newNode.title}`);
                else newNode.setTitle(`Copy of ${newNode.title}`);
            }
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

async function sortOnDrop(
    targetNode: Fancytree.FancytreeNode,
    dropNodeList: Fancytree.FancytreeNode[],
): Promise<void> {
    // 1. 先对window.children校正一下index字段
    const windowNode = FancyTreeUtils.findWindowNode(targetNode);
    console.log('windowNode:', windowNode);
    const tabId2Index = await BrowserExtensionUtils.getTabId2Index(windowNode.data.id);
    FancyTreeUtils.resetNodeIndex(targetNode.tree, windowNode.data.id, tabId2Index);
    // 2. 逐个设置index字段
    // const tabId2TargetIndex = {}
    const targetNodeIndex = targetNode.data.index;
    const tabIds = dropNodeList.map((item) => item.data.id);
    tabs.move(tabIds, { index: targetNodeIndex + 1 });
    // 3. 根据修改后的index字段调用API修改顺序
}

type MoveType =
    | 'moveToClosedWindow'
    | 'moveInsideWindow'
    | 'moveToAnotherWindow'
    | 'moveToNewWindow';
