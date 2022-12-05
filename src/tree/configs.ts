import { logLazy } from '../logic/utils';

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

    // --- Drag-support:

    dragStart(node, data) {
        /* This function MUST be defined to enable dragging for the tree.
         *
         * Return false to cancel dragging of node.
         * data.dataTransfer.setData() and .setDragImage() is available
         * here.
         */
        node.debug(`${'T1: dragStart: ' + 'data: '}${data.dropEffect}/${data.effectAllowed}, 
    dataTransfer: ${data.dataTransfer.dropEffect}/${data.dataTransfer.effectAllowed}`);

        // Set the allowed effects (i.e. override the 'effectAllowed' option)
        data.effectAllowed = 'all';

        // Set a drop effect (i.e. override the 'dropEffectDefault' option)
        // data.dropEffect = "link";
        data.dropEffect = 'move';

        // We could use a custom image here:
        // data.dataTransfer.setDragImage($("<div>TEST</div>").appendTo("body")[0], -10, -10);
        // data.useDefaultImage = false;

        // Return true to allow the drag operation
        return true;
    },
    dragDrag(_node, data) {
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

    dragEnter(node, data) {
        node.debug(
            `${'T1: dragEnter: ' + 'data: '}${data.dropEffect}/${
                data.effectAllowed
            }, dataTransfer: ${data.dataTransfer.dropEffect}/${data.dataTransfer.effectAllowed}`,
        );

        // data.dropEffect = "copy";
        return true;
    },
    dragOver(_node, data) {
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
    dragDrop(node: Fancytree.FancytreeNode, data) {
        /* This function MUST be defined to enable dropping of items on
         * the tree.
         */
        let newNode;
        const transfer = data.dataTransfer;
        const sourceNodes = data.otherNodeList;
        const mode = data.dropEffect;

        node.debug(
            `${'T1: dragDrop: effect=' + 'data: '}${data.dropEffect}/${
                data.effectAllowed
            }, dataTransfer: ${transfer.dropEffect}/${transfer.effectAllowed}`,
        );

        alert(
            `Drop on ${node}:\n` +
                `source:${JSON.stringify(data.otherNodeData)}\n` +
                `hitMode:${data.hitMode}, dropEffect:${data.dropEffect}, effectAllowed:${data.effectAllowed}`,
        );

        if (data.hitMode === 'after') {
            // If node are inserted directly after tagrget node one-by-one,
            // this would reverse them. So we compensate:
            sourceNodes.reverse();
        }
        if (data.otherNode) {
            // Drop another Fancytree node from same frame (maybe a different tree however)
            const sameTree = data.otherNode.tree === data.tree;

            if (mode === 'move') {
                data.otherNode.moveTo(node, data.hitMode);
            } else {
                newNode = data.otherNode.copyTo(node, data.hitMode);
                if (mode === 'link') newNode.setTitle(`Link to ${newNode.title}`);
                else newNode.setTitle(`Copy of ${newNode.title}`);
            }
        } else if (data.otherNodeData) {
            // Drop Fancytree node from different frame or window, so we only have
            // JSON representation available
            node.addChildren(data.otherNodeData, data.hitMode);
        } else if (data.files.length > 0) {
            // Drop files
            for (let i = 0; i < data.files.length; i++) {
                const file = data.files[i];
                node.addNode({ title: `'${file.name}' (${file.size} bytes)` }, data.hitMode);
                // var url = "'https://example.com/upload",
                //     formData = new FormData();

                // formData.append("file", transfer.files[0])
                // fetch(url, {
                //   method: "POST",
                //   body: formData
                // }).then(function() { /* Done. Inform the user */ })
                // .catch(function() { /* Error. Inform the user */ });
            }
        } else {
            // Drop a non-node
            node.addNode({ title: transfer.getData('text') }, data.hitMode);
        }
        node.setExpanded();
    },
};
