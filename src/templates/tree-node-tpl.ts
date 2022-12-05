import Mustache from 'mustache';

export enum TPL_CONSTANTS {
    TYPE_ATTR = 'zt-type',
    NODE_ITEM = 'node-item',
    NODE_KEY = 'node-key',
    NODE_CLOSE = 'node-item-close',
    NODE_EDIT = 'node-item-edit',
}

const { TYPE_ATTR, NODE_CLOSE, NODE_KEY, NODE_EDIT, NODE_ITEM } = TPL_CONSTANTS;

class TreeNodeTpl {
    /** 按钮组HTML结构 */
    static BUTTON_GROUP = `<span class="zt-node-button-group">
        <span class="zt-node-btn edit-alias" ${TYPE_ATTR}="${NODE_CLOSE}" ${NODE_KEY}="{{key}}">❌</span>
        <span class="zt-node-btn close-tab" ${TYPE_ATTR}="${NODE_EDIT}" ${NODE_KEY}="{{key}}">✅</span>
    </span>`;

    /** Node HTML结构 */
    static TEMPLATE = `<span class="zt-node {{closedClass}}" ${TYPE_ATTR}="${NODE_ITEM}" ${NODE_KEY}="{{key}}">
        <span class="zt-node-title fancytree-title">{{title}}{{#closedWindow?}}(closed){{/closedWindow?}}</span>
        {{#buttonGroup?}}
            {{> buttonGroup}}
        {{/buttonGroup?}}
    </span>`;

    /** rendered mustache html */
    public html: string;

    constructor(node: Fancytree.FancytreeNode) {
        const { key, title, data } = node;
        const { closed, windowType } = data;
        if (windowType) console.log(key, closed);

        this.html = Mustache.render(
            TreeNodeTpl.TEMPLATE,
            {
                key,
                title,
                'buttonGroup?': title !== 'pending',
                'closedWindow?': closed && windowType,
                'closedClass': closed ? 'closed' : '',
            },
            { buttonGroup: TreeNodeTpl.BUTTON_GROUP },
        );
    }
}

Mustache.parse(TreeNodeTpl.TEMPLATE);
Mustache.parse(TreeNodeTpl.BUTTON_GROUP);

export default TreeNodeTpl;
