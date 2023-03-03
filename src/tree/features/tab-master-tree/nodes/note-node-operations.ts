import { cloneDeep } from 'lodash';

import { generateKeyByTime } from '../../../../utils';
import type { TreeData, TreeNode } from './nodes';

export interface NoteData extends TreeData {
    nodeType: 'note';
}

export const DEFAULT_DATE = {
    title: '',
    expanded: true,
    icon: {
        html: '<i class="fancytree-icon note"></i>',
    },
    data: {
        nodeType: 'note',
    },
} as TreeNode<NoteData>;

export const NoteNodeOperations = {
    createData(): TreeNode<NoteData> {
        const newNodeData = cloneDeep(DEFAULT_DATE);
        newNodeData.key = generateKeyByTime();
        return newNodeData;
    },
};
