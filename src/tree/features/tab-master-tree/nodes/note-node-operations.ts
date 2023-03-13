import { cloneDeep } from 'lodash';

import { generateKeyByTime } from '../../../../utils';
import type { TreeData, TreeNode } from './nodes';

export interface NoteData extends TreeData {
    nodeType: 'note';
    alias?: string;
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

interface OtherData {
    expanded?: boolean;
}
export const NoteNodeOperations = {
    createData(content?: string, otherData: OtherData = {}): TreeNode<NoteData> {
        const newNodeData = cloneDeep(DEFAULT_DATE);
        newNodeData.key = generateKeyByTime();
        if (content) {
            newNodeData.data.alias = content;
        }
        const { expanded } = otherData;
        if (expanded !== undefined) {
            newNodeData.expanded = expanded;
        }
        return newNodeData;
    },
};
