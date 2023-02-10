type FancytreeNode = Fancytree.FancytreeNode;

export const EDIT_OPTIONS: Fancytree.EditOptions = {
    triggerStart: ['shift+click'],
    allowEmpty: true,
    beforeEdit(_event, data) {
        data.orgTitle = data.node.data.alias ?? '#';
    },
    save(_event, data) {
        // TODO 这里需要escape一下
        console.log(data.input);
        data.node.data.alias = data.input!.val();
        return true;
    },
    close(_event, data) {
        // Editor was removed
        const node: FancytreeNode = data.node;
        if (data.save) {
            // Since we started an async request, mark the node as preliminary
            // $(data.node.span).addClass('pending');
            node.setTitle((this as FancytreeNode).data.title);
        }
    },
};
