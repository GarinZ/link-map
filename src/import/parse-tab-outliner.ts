import type { Tabs, Windows } from 'webextension-polyfill';

import type { TreeData, TreeNode } from '../tree/features/tab-master-tree/nodes/nodes';
import { NoteNodeOperations } from '../tree/features/tab-master-tree/nodes/note-node-operations';
import { TabNodeOperations } from '../tree/features/tab-master-tree/nodes/tab-node-operations';
import type { WindowData } from '../tree/features/tab-master-tree/nodes/window-node-operations';
import { generateWindowTitle } from '../tree/features/tab-master-tree/nodes/window-node-operations';

export namespace TabOutliner {
    export interface Marks {
        relicons: [];
        customTitle: string;
        customFavicon: string;
    }

    export interface SavedWin {
        type: 'savedwin';
        marks?: Marks;
        colapsed?: boolean;
        data: {
            focused: boolean;
            type: Windows.WindowType;
            rect: string; // "25_792_1000_1049"
        };
    }

    export interface TextNote {
        type: 'textnote';
        colapsed?: boolean;
        data: { note: string };
    }

    export interface Group {
        type: 'group';
        marks?: Marks;
        colapsed?: boolean;
        data: { rect: string };
    }

    export interface SeparateLine {
        type: 'separatorline';
        data: { separatorIndx: number };
    }

    export interface Win {
        type: 'win';
        marks?: Marks;
        colapsed?: boolean;
        data: {
            id: number;
            type: Windows.WindowType;
            rect: string;
        };
    }

    export interface Tab {
        type?: 'tab';
        colapsed?: boolean;
        marks?: Marks;
        data: Tabs.Tab;
    }

    export type NodeData = SavedWin | TextNote | Group | SeparateLine | Win | Tab;
    export type NodeInfo = [number, NodeData, Array<number>];
    export type ExportItem =
        | {
              type: number;
              node: {
                  type: 'session';
                  data: {
                      treeId: number;
                      nextDId: number;
                      nonDumpedDId: number;
                  };
              };
          }
        | [number, NodeData, Array<number>]
        | { type: number; time: number };

    export type ExportData = Array<ExportItem>;
}

const transformTabOutlinerData = (data: TabOutliner.NodeData): TreeNode<TreeData> | null => {
    const { type } = data;
    switch (type) {
        case 'savedwin':
        case 'win': {
            const winNode = data as TabOutliner.Win | TabOutliner.SavedWin;
            const { marks, colapsed, data: nodeData } = winNode;
            return {
                title: generateWindowTitle(nodeData.type),
                expanded: !colapsed,
                data: {
                    alias: marks?.customTitle,
                    type: nodeData.type,
                    nodeType: 'window',
                    focused: false,
                    windowId: 0,
                    isBackgroundPage: false,
                    incognito: false,
                    alwaysOnTop: false,
                },
            } as TreeNode<WindowData>;
        }
        case 'textnote': {
            const noteNode = data as TabOutliner.TextNote;
            const { colapsed, data: nodeData } = noteNode;
            const noteNodeData = NoteNodeOperations.createData(nodeData.note);
            noteNodeData.expanded = !colapsed;
            return noteNodeData;
        }
        case 'group': {
            const groupNode = data as TabOutliner.Group;
            const { marks, colapsed } = groupNode;
            return {
                title: 'Group',
                expanded: !colapsed,
                data: {
                    alias: marks?.customTitle,
                    type: 'normal',
                    nodeType: 'window',
                    focused: false,
                    windowId: 0,
                    isBackgroundPage: false,
                    incognito: false,
                    alwaysOnTop: false,
                },
            } as TreeNode<WindowData>;
        }
        case 'separatorline':
            return NoteNodeOperations.createData('separatorline');
        default: {
            const tabNode = data as TabOutliner.Tab;
            const { marks, colapsed } = tabNode;
            tabNode.data.windowId = tabNode.data.windowId ?? -1;
            tabNode.data.id = tabNode.data.id ?? -1;
            const tabNodeData = TabNodeOperations.createData(tabNode.data);
            tabNodeData.expanded = !colapsed;
            tabNodeData.data.alias = marks?.customTitle;
            return tabNodeData;
        }
    }
};

function buildTree(
    treeItem: TreeNode<TreeData>,
    toAddItem: TabOutliner.NodeData,
    keyPathArr: Array<number>,
) {
    const recursive = (treeItem: any, keyPathIndex: number, keyPathArr: number[]) => {
        const keyPath = keyPathArr[keyPathIndex];
        // 遍历到最后一个位置，添加元素到树中
        if (keyPathIndex === keyPathArr.length - 1) {
            const treeNode = transformTabOutlinerData(toAddItem);
            if (treeNode === null) return;
            treeNode.children = [];
            treeItem.children[keyPath] = treeNode;
            return;
        }
        recursive(treeItem.children[keyPath], ++keyPathIndex, keyPathArr);
    };
    recursive(treeItem, 0, keyPathArr);
}

export const parseTabOutlinerData = (data: TabOutliner.ExportData): TreeNode<TreeData>[] => {
    const result: TreeNode<TreeData> = {
        title: '',
        data: { nodeType: 'note' },
        children: [] as TreeNode<TreeData>[],
        expanded: true,
    };
    for (let i = 1; i < data.length - 2; i++) {
        // 获取所有的 type
        const item = data[i] as TabOutliner.NodeInfo;
        try {
            buildTree(result, item[1], item[2]);
        } catch (error) {
            console.error('error', error, i, item);
        }
    }
    return result.children!;
};
