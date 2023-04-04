type FancytreeNode = Fancytree.FancytreeNode;

export const EDIT_OPTIONS: Fancytree.EditOptions = {
    triggerStart: ['shift+click'],
    allowEmpty: true,
    inputCss: { minWidth: '100px' },
    beforeEdit(_event, data) {
        // 设置input的值
        data.orgTitle = data.node.data.alias ?? '';
    },
    save(_event, data) {
        // TODO 这里需要escape一下
        data.node.data.alias = data.input!.val();

        return true;
    },
    beforeClose(_event, data) {
        // 当save返回false时，区分是空值保存还是取消保存
        data.save = !(
            data.originalEvent?.type === 'keydown' && data.originalEvent.key === 'Escape'
        );
    },
    close(_event, data) {
        // Editor was removed
        const node: FancytreeNode = data.node;
        if (data.save) {
            // Since we started an async request, mark the node as preliminary
            // $(data.node.span).addClass('pending');
            node.setTitle((this as FancytreeNode).data.title);
        }
        node.setActive();
    },
};
