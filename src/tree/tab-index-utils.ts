export const ViewTabIndexUtils = {
    increaseIndex: (tree: Fancytree.Fancytree, windowId: number, index: number) => {
        const parentNode = tree.getNodeByKey(`${windowId}`);
        parentNode.visit((node) => {
            if (
                node.data.nodeType !== 'tab' ||
                node.data.windowId !== windowId ||
                node.data.closed === true
            ) {
                return true;
            }
            if (node.data.index >= index) {
                node.data.index += 1;
            }
            return true;
        });
    },

    changeIndex: (
        tree: Fancytree.Fancytree,
        windowId: number,
        oldIndex: number,
        newIndex: number,
    ) => {
        const parentNode = tree.getNodeByKey(`${windowId}`);
        parentNode.visit((node) => {
            if (node.data.nodeType !== 'tab' || node.data.close === true) {
                return true;
            }
            if (node.data.index === oldIndex) {
                node.data.index = newIndex;
            } else if (node.data.index > oldIndex && node.data.index <= newIndex) {
                node.data.index -= 1;
            } else if (node.data.index < oldIndex && node.data.index >= newIndex) {
                node.data.index += 1;
            }
            return true;
        });
    },

    decreaseIndex: (
        tree: Fancytree.Fancytree,
        windowId: number,
        index: number,
    ): Fancytree.FancytreeNode[] => {
        const changedNode: Fancytree.FancytreeNode[] = [];
        const parentNode = tree.getNodeByKey(`${windowId}`);
        parentNode.visit((node) => {
            if (
                node.data.nodeType !== 'tab' ||
                node.data.windowId !== windowId ||
                node.data.close === true
            ) {
                return true;
            }
            if (node.data.index > index) {
                node.data.index -= 1;
                changedNode.push(node);
            }
            return true;
        });
        return changedNode;
    },
};
