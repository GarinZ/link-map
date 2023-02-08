import { NoteNodeOperations } from './nodes/note-node-operations';

import 'jquery-contextmenu/dist/jquery.contextMenu.min.js';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.css';

export const registerContextMenu = () => {
    $.contextMenu({
        selector: '#tree span.fancytree-title',
        items: {
            notes: {
                name: 'Notes',
                items: {
                    insertNodeAsParent: { name: 'insert Note as parent' },
                    insertNodeAsFirstSubNode: { name: 'insert Note as first sub node' },
                    insertNodeAsLastSubNode: { name: 'insert Note as last sub node' },
                },
            },
        },
        callback(itemKey: string, opt) {
            const node = $.ui.fancytree.getNode(opt.$trigger);
            switch (itemKey) {
                case 'insertNodeAsParent':
                    node.moveTo(node.addNode(NoteNodeOperations.createData(), 'before'), 'child');
            }
        },
    });
};
