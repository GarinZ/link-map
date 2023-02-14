import { flatten } from 'lodash';

import type { NodeData, TreeData, TreeNode } from '@/tree/features/tab-master-tree/nodes/nodes';

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

const genText = (
    node: TreeNode<NodeData>,
    nodeProps: (keyof TreeNode<TreeData>)[] = [],
    dataProps: (keyof NodeData)[] = [],
) => {
    const { title, data } = node;
    let joinedNodeProps = '';
    if (node && nodeProps.length > 0) {
        joinedNodeProps = nodeProps.map((p) => `[${String(p)}: ${node[p]}]`).join(' ');
        joinedNodeProps = `-${joinedNodeProps}`;
    }
    let joinedDataProps = '';
    if (data && dataProps.length > 0) {
        joinedDataProps = dataProps.map((p) => `[${String(p)}: ${data[p]}]`).join(' ');
    }
    if (data === undefined) {
        return title;
    } else {
        return data.index === undefined
            ? `${data.nodeType}-${data.id}${joinedNodeProps}${joinedDataProps}`
            : `${data.index}-${data.id}${joinedNodeProps}${joinedDataProps}`;
    }
};

export function toAsciiTree(
    tree: TreeNode<NodeData>[],
    nodeProps: (keyof TreeNode<TreeData>)[] = [],
    joinProperties: (keyof NodeData)[] = [],
) {
    const rootNode = {
        title: '.',
        children: tree,
    } as TreeNode<TreeData>;
    return stringifyTree(
        rootNode,
        (node) => genText(node, nodeProps, joinProperties),
        (node) => node.children ?? [],
    );
}
