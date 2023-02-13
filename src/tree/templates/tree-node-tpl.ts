import Mustache from 'mustache';

export enum TPL_CONSTANTS {
    TYPE_ATTR = 'zt-type',
    NODE_ITEM = 'node-item',
    NODE_KEY = 'node-key',
    NODE_CLOSE = 'node-close',
    NODE_EDIT = 'node-edit',
    NODE_REMOVE = 'node-remove',
}

const { TYPE_ATTR, NODE_CLOSE, NODE_KEY, NODE_EDIT, NODE_ITEM, NODE_REMOVE } = TPL_CONSTANTS;

export const generateButtonGroup = (key: string) => `<span class="zt-node-button-group">
        <span class="zt-node-btn edit-alias" ${TYPE_ATTR}="${NODE_EDIT}" ${NODE_KEY}="${key}">🖌️</span>
        <span class="zt-node-btn close" ${TYPE_ATTR}="${NODE_CLOSE}" ${NODE_KEY}="${key}">❎</span>
        <span class="zt-node-btn remove" ${TYPE_ATTR}="${NODE_REMOVE}" ${NODE_KEY}="${key}">🗑️</span>
    </span>`;

export class TreeNodeTpl {
    /** 按钮组HTML结构 */
    static BUTTON_GROUP = `<span class="zt-node-button-group">
        <span class="zt-node-btn edit-alias" ${TYPE_ATTR}="${NODE_EDIT}" ${NODE_KEY}="{{key}}">🖌️</span>
        <span class="zt-node-btn close" ${TYPE_ATTR}="${NODE_CLOSE}" ${NODE_KEY}="{{key}}">❎</span>
        <span class="zt-node-btn remove" ${TYPE_ATTR}="${NODE_REMOVE}" ${NODE_KEY}="{{key}}">🗑️</span>
    </span>`;

    /** Node HTML结构 */
    static TEMPLATE = `<span class="zt-node fancytree-title {{nodeType}} {{closedClass}}" ${TYPE_ATTR}="${NODE_ITEM}" ${NODE_KEY}="{{key}}">
            {{#alias}}
                <span class="zt-node-alias">{{alias}}</span>
            {{/alias}}
            {{#titleAndAlis?}}<span class="zt-node-splitter"> | </span>{{/titleAndAlis?}}
            {{#title}}
            <span class="zt-node-title {{aliasClass}}">{{title}}{{#closedWindow?}}(closed){{/closedWindow?}}</span>
            {{/title}}
        {{#buttonGroup?}}
            {{> buttonGroup}}
        {{/buttonGroup?}}
    </span>`;

    /** rendered mustache html */
    public html: string;

    constructor(node: Fancytree.FancytreeNode) {
        const { key, title, data } = node;
        const { closed, windowType, alias, nodeType } = data;
        if (windowType) console.log(key, closed);
        this.html = Mustache.render(
            TreeNodeTpl.TEMPLATE,
            {
                key,
                title,
                alias,
                nodeType,
                'aliasClass': alias ? 'alias' : '',
                'buttonGroup?': title !== 'pending', // pending节点不显示按钮组
                'closedWindow?': closed && windowType, // closed window节点显示(closed)
                'closedClass': closed ? 'closed' : '',
                'titleAndAlis?': title && alias,
            },
            { buttonGroup: TreeNodeTpl.BUTTON_GROUP },
        );
    }
}

Mustache.parse(TreeNodeTpl.TEMPLATE);
Mustache.parse(TreeNodeTpl.BUTTON_GROUP);

export default TreeNodeTpl;
