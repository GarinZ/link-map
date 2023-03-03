import type { DND5Data } from '../tree/features/tab-master-tree/plugins/dnd';

/** Drag&Drop HTML5 Config */
export const IMPORT_TREE_DND5_CONFIG: Fancytree.Extensions.DragAndDrop5 = {
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
    dragLeave(_node: Fancytree.FancytreeNode, _data: DND5Data) {
        return true;
    },
    dragOver(_node: Fancytree.FancytreeNode, data: DND5Data) {
        // Assume typical mapping for modifier keys
        data.dropEffect = data.dropEffectSuggested;
        // data.dropEffect = "move";
    },
    dragDrop(_targetNode: Fancytree.FancytreeNode, _data: DND5Data) {
        // do nothing
    },
};
