import type { TreeData, TreeNode } from './nodes';

export interface NoteData extends TreeData {
    nodeType: 'note';
}

export const NoteNodeOperations = {
    createData(): TreeNode<NoteData> {
        return {
            title: '',
            expanded: true,
            data: {
                nodeType: 'note',
            },
        };
    },
};
