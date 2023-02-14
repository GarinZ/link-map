import type { TreeData } from './nodes';
import { DEFAULT_DATE } from './note-node-operations';
import { NodeUtils } from './utils';

export function dataCheckAndSupply(treeDataList: Fancytree.NodeData[]): void {
    NodeUtils.traverse(treeDataList, (node) => {
        const data = node.data as TreeData;
        if (data.nodeType === 'note' && node.icon === undefined) {
            node.icon = DEFAULT_DATE.icon;
        }
    });
}
