type NodeType = 'tab' | 'window' | 'note';

export interface TreeData {
    id?: number;
    closed?: boolean;
    alias?: string;
    nodeType: NodeType;
    save?: boolean;
}

export type NodeData = TabData | WindowData;

export interface TreeNode<T extends TreeData> extends Fancytree.NodeData {
    /** Node id (must be unique inside the tree) */
    key?: string;
    /** Display name (may contain HTML) */
    title: string;
    /** Contains all extra data that was passed on node creation */
    data: T;
    /** Array of child nodes. For lazy nodes, null or undefined means 'not yet loaded'. Use an empty array to define a node that has no children. */
    children?: TreeNode<TreeData>[];
    /** Use isExpanded(), setExpanded() to access this property. */
    expanded: boolean;
    /** Addtional CSS classes, added to the node's `<span>`. */
    extraClasses?: string;
    /** Folder nodes have different default icons and click behavior. Note: Also non-folders may have children. */
    folder?: boolean;
    /** Icon of the tree node. */
    icon?:
        | string
        | {
              html?: string;
              text?: string;
              addClass?: string;
          }
        | undefined;
    /** null or type of temporarily generated system node like 'loading', or 'error'. */
    statusNodeType?: string;
    /** True if this node is loaded on demand, i.e. on first expansion. */
    lazy?: boolean;
    /** Alternative description used as hover banner */
    tooltip?: string;
    /** Outer element of single nodes */
    span?: HTMLElement;
    /** Outer element of single nodes for table extension */
    tr?: HTMLTableRowElement;
}
