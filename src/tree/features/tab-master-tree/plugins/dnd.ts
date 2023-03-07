import log from 'loglevel';
import browser from 'webextension-polyfill';

import { FancyTabMasterTree } from '../fancy-tab-master-tree';
import { TabNodeOperations } from '../nodes/tab-node-operations';
import { WindowNodeOperations } from '../nodes/window-node-operations';

type FancytreeNode = Fancytree.FancytreeNode;

export type HitMode = 'over' | 'before' | 'after';
export type DropEffect = 'move' | 'link' | 'drop' | 'none';

export interface DND5Data {
    dataTransfer: DataTransfer;
    effectAllowed: string; // ('all', 'copyMove', 'link', 'move', ...) Settable on dragstart only
    dropEffect: 'move' | 'link' | 'drop' | 'none'; // ('move', 'copy', or 'link') access the requested drop effect
    dropEffectSuggested: 'move' | 'link' | 'drop'; // Recommended effect derived from a common key mapping
    files: File[]; // list of `File` objects if any were dropped (may be [])
    hitMode: HitMode;
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
    dropMarkerOffsetX: -40,
    dropMarkerInsertOffsetX: 10,
    preventNonNodes: true,
    preventRecursion: true, // Prevent dropping nodes on own descendants
    preventVoidMoves: true, // Prevent moving nodes 'before self', etc.
    effectAllowed: 'all',
    dropEffectDefault: 'move', // "auto",
    scroll: true,
    multiSource: false,

    dragStart(_node: Fancytree.FancytreeNode, _data: DND5Data) {
        $('#fancytree-drop-marker').addClass('iconfont icon-arrow-right-');
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
    dragLeave(_node: Fancytree.FancytreeNode, _data: DND5Data) {
        return true;
    },
    dragDrop(targetNode: Fancytree.FancytreeNode, data: DND5Data) {
        // This function MUST be defined to enable dropping of items on the tree.
        const transfer = data.dataTransfer;
        log.debug(transfer);
        const mode = data.dropEffect;
        // 2. 从当前树中移动节点（没有跨树移动），移动节点中包含子树
        const sameTree = data.otherNode?.tree === data.tree;
        const transferData = transfer.getData('application/x-fancytree-node');
        if (data.otherNode && sameTree) {
            // Drop another Fancytree node from same frame (maybe a different tree however)
            if (mode === 'move') {
                tabMoveOnDrop(data.otherNode, targetNode, data.hitMode);
            } else {
                throw new Error('Not implemented other dropEffect');
            }
        } else if (data.otherNode && !sameTree) {
            throw new Error('Not implemented cross tree move');
        } else if (transferData) {
            // 若node是从其他frame或window拖拽进来的
            // Drop Fancytree node from different frame or window, so we only have
            // JSON representation available
            const nodeData = JSON.parse(transferData);
            targetNode.addNode(nodeData, data.hitMode);
            // console.log(JSON.parse(transferData));
            // targetNode.addChildren(data.otherNodeData, data.hitMode);
        } else {
            // Drop a non-node
            targetNode.addNode({ title: transfer.getData('text') }, data.hitMode);
        }
        targetNode.setExpanded();
    },
    dragEnd(_node: Fancytree.FancytreeNode, _data: DND5Data) {},
};

export async function tabMoveOnDrop(
    sourceNode: Fancytree.FancytreeNode,
    targetNode: Fancytree.FancytreeNode,
    hitMode: HitMode,
) {
    sourceNode.moveTo(targetNode, hitMode);
    // 1. 整理数据
    const wid2WindowNode: { [windowId: number]: FancytreeNode } = {};
    const wid2TabNode: { [windowId: number]: FancytreeNode[] } = {};
    sourceNode.visit((node) => {
        const { windowId, nodeType } = node.data;
        if (nodeType === 'window') {
            wid2WindowNode[windowId] = node;
        } else if (nodeType === 'tab') {
            Array.isArray(wid2TabNode[windowId])
                ? wid2TabNode[windowId].push(node)
                : (wid2TabNode[windowId] = [node]);
        }
    }, true);
    const toMoveTabNodes: FancytreeNode[] = [];
    const toUpdateWindowIdTabNodes: FancytreeNode[] = [];
    Object.entries(wid2TabNode).forEach(([wid, tabNodes]) => {
        if (wid in wid2WindowNode) return;
        tabNodes.forEach((tabNode) => {
            if (tabNode.data.closed) {
                toUpdateWindowIdTabNodes.push(tabNode);
            } else {
                toMoveTabNodes.push(tabNode);
                tabNode.data.dndOperated = true;
            }
        });
    });
    // 2. 获取移动到窗口
    if (toMoveTabNodes.length === 0 && toUpdateWindowIdTabNodes.length === 0) return;
    let windowNode: FancytreeNode | null = TabNodeOperations.findWindowNode(sourceNode);
    if (toMoveTabNodes.length > 0) {
        if (windowNode && windowNode.data.closed) {
            // 移动到已关闭窗口
            const newWindow = await FancyTabMasterTree.reopenWindowNode(windowNode, []);
            const toMoveTabIds = toMoveTabNodes.map((node) => node.data.id);
            await browser.tabs.move(toMoveTabIds, { windowId: newWindow.id, index: 0 });
            await browser.tabs.remove(newWindow.tabs![0].id!);
        } else if (windowNode) {
            // 移动到同一个窗口 || 不同窗口
            const openedSubTabNodes = WindowNodeOperations.findAllSubTabNodes(windowNode, true);
            const toIndex = openedSubTabNodes.findIndex(
                (node) => node.data.id === sourceNode.data.id,
            );
            const toMoveTabIds = toMoveTabNodes.map((node) => node.data.id);
            await browser.tabs.move(toMoveTabIds, { index: toIndex, windowId: windowNode.data.id });
        } else {
            // 移动到无窗口位置
            const { windowNode: newWindowNode, window } = await FancyTabMasterTree.openWindow(
                sourceNode,
                'before',
                [],
            );
            sourceNode.moveTo(newWindowNode, 'child');
            windowNode = newWindowNode;
            const toMoveTabIds = toMoveTabNodes.map((node) => node.data.id);
            await browser.tabs.move(toMoveTabIds, { index: 0, windowId: windowNode.data.id });
            await browser.tabs.remove(window.tabs![0].id!);
        }
    }
    if (toUpdateWindowIdTabNodes.length > 0) {
        toUpdateWindowIdTabNodes.forEach(
            (node) =>
                windowNode &&
                TabNodeOperations.updatePartial(node, { windowId: windowNode.data.id }),
        );
    }
}
