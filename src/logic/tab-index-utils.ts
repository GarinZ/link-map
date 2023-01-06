export const ViewTabIndexUtils = {
    // 添加tab
    // 1. 根据index找到元素
    // 2. 选择适合的方式添加元素
    // 3. 后面元素的index + 1

    // 删除tab
    // 1. 删除元素
    // 2. 后面元素的index - 1

    // 移动tab
    // 1. 根据index找到元素
    // 2. 和目标元素交换index

    increaseIndex: (tree: Fancytree.Fancytree, windowId: number, index: number) => {
        const parentNode = tree.getNodeByKey(`${windowId}`);
        parentNode.visit((node) => {
            if (
                node.data.type !== 'tab' ||
                node.data.windowId !== windowId ||
                node.data.close === true
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
            if (
                node.data.type !== 'tab' ||
                node.data.windowId !== windowId ||
                node.data.close === true
            ) {
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

    decreaseIndex: (tree: Fancytree.Fancytree, windowId: number, index: number) => {
        const parentNode = tree.getNodeByKey(`${windowId}`);
        parentNode.visit((node) => {
            if (
                node.data.type !== 'tab' ||
                node.data.windowId !== windowId ||
                node.data.close === true
            ) {
                return true;
            }
            if (node.data.index > index) {
                node.data.index -= 1;
            }
            return true;
        });
    },
};
