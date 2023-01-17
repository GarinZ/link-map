import { flatten } from 'lodash';

import type { NodeData, TreeData, TreeNode } from '@/tree/nodes/nodes';

function prefixChild(strArr: string[], last: boolean): string[] {
    return strArr.map((s, i) => {
        const prefix = i === 0 ? (last ? '└─' : '├─') : last ? '  ' : '│ ';
        return prefix + s;
    });
}
function nodeToStrings<T>(
    tn: T,
    nameFn: (t: T) => string,
    childrenFn: (t: T) => T[] | null,
): string[] {
    const origChildren = childrenFn(tn) || [];
    const children = [...origChildren]; // copy the array
    if (children.length === 0) {
        return [`─ ${nameFn(tn)}`];
    }
    return [
        `┬ ${nameFn(tn)}`,
        ...flatten(
            children.map((c, i) => {
                const strs = nodeToStrings(c, nameFn, childrenFn);
                return prefixChild(strs, i === children.length - 1);
            }),
        ),
    ];
}

function stringifyTree<T>(
    tn: T,
    nameFn: (t: T) => string,
    childrenFn: (t: T) => T[] | null,
): string {
    return nodeToStrings(tn, nameFn, childrenFn).join('\n');
}

const genText = (node: TreeNode<NodeData>) => {
    const { title, data } = node;
    if (data === undefined) {
        return title;
    } else {
        return data.index === undefined
            ? `${data.nodeType}-${data.id}`
            : `${data.index}-${data.id}`;
    }
};

export function toAsciiTree(tree: TreeNode<NodeData>[]) {
    const rootNode = {
        title: '.',
        children: tree,
    } as TreeNode<TreeData>;
    return stringifyTree(rootNode, genText, (node) => node.children ?? []);
}
