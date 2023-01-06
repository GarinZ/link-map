/**
 * FancyTree的事件处理模块
 */

import type { Windows } from 'webextension-polyfill';
import browser from 'webextension-polyfill';

import type { NodeType, TreeData, TreeNode } from '../logic/nodes';
import type { WindowData } from '../logic/nodes.js';
import * as WindowNodes from '../logic/window-nodes';
import TreeNodeTpl, { TPL_CONSTANTS } from '../templates/tree-node-tpl';

const { TYPE_ATTR, NODE_CLOSE, NODE_KEY } = TPL_CONSTANTS;

const removeBackgroundPageWindowNode = (windowNodeMap: { [key: string]: TreeNode<WindowData> }) => {
    let backgroundPageId = '';
    Object.keys(windowNodeMap).forEach((k) => {
        if (windowNodeMap[k].data.isBackgroundPage) backgroundPageId = k;
    });
    delete windowNodeMap[backgroundPageId];
};

/**
 * merge(DB, browser) && save to storage
 */
export const persistence = async (): Promise<TreeNode<TreeData>[]> => {
    // 1. 获取 Chrome tab list
    const browserWindowPromise = await browser.windows.getAll({ populate: true });
    const unknown = browserWindowPromise as unknown;
    const windows = unknown as Windows.Window[];
    return windows.map((w) => WindowNodes.create(w));
    // 2. 从indexed db中获取存储的数据
    // const tabDataPromise = Storage.getTabData()
    // let mergedWindowNodeMap = {}
    // 3. merge indexedDB和chrome当前状态
    // return Promise.all([browserWindowPromise, tabDataPromise]).then(([windowArrays, dbNodesArr]) => {
    //   // FIXME: 需要存储一下index，直接转map的话顺序信息就丢了
    //   const uniqueKey2WindowNodes = nodesArr2Map(dbNodesArr)
    //   // FIXME: 这里需要改一改才能正常merge
    //   const windowId2ChromeWindowNode = nodesArr2Map(windowArrays)
    //   mergedWindowNodeMap = WindowNode.mergeArrPurely(uniqueKey2WindowNodes, windowId2ChromeWindowNode)
    //   // 3.2 删除插件WindowNode，不做持久化
    //   removeBackgroundPageWindowNode(mergedWindowNodeMap)
    //   // 3.3 将tree更新到indexedDB
    //   Storage.updateAll(mergedWindowNodeMap)
    //   return mergedWindowNodeMap
    // })
};

/**
 * 初始化TreeView，向ServiceWorker请求当前的Tab
 * @param {Fancytree} tree
 */
export const initTree = async (tree: Fancytree.Fancytree) => {
    const windowNodes = await persistence();
    console.log('TreeNodes', windowNodes);
    tree.reload(windowNodes);
};

/**
 * 关闭节点
 * TODO 现在的处理方式是，如果是window节点，那么就关闭其下面的所有的tab
 * 更好的方式是，如果是window节点，直接关闭window，不管其下面的tab
 * @param _event
 * @param data
 */
const closeNodes = (_event: JQueryEventObject, data: Fancytree.EventData) => {
    const targetNode = data.node;
    const nodeType: NodeType = targetNode.data.type;
    const operatedNodes = [];
    if (targetNode.expanded === undefined || targetNode.expanded === true) {
        // 1. node展开：只处理头节点
        if (nodeType === 'window') {
            targetNode.visit((node) => {
                if (node.data.windowId === targetNode.data.id) {
                    node.data.closed = true;
                    operatedNodes.push(node);
                }
            }, true);
            browser.windows.remove(targetNode.data.id);
        } else if (nodeType === 'tab') {
            targetNode.data.closed = true;
            browser.tabs.remove(targetNode.data.id);
            operatedNodes.push(targetNode);
        } else {
            throw new Error('invalid node type');
        }
    } else {
        // 2. node合起：处理尾节点
        const toRemovedTabIds: number[] = [];
        targetNode.visit((node) => {
            // 2.2 对每个node.data.close === true
            if ('closed' in node.data) {
                node.data.closed = true;
                operatedNodes.push(node);
            }
            if (node.data.type === 'tab' && closed === false) {
                toRemovedTabIds.push(node.data.id);
            }
        }, true);
        // 2.3 调用tabs.remove方法(批量)
        browser.tabs.remove(toRemovedTabIds);
    }
    operatedNodes.forEach((node) => node.renderTitle());
};

/**
 * Tree Click事件处理
 * 主要用于代理和分发子事件
 */
export const onClick = (event: JQueryEventObject, data: Fancytree.EventData): boolean => {
    const target = $(event.originalEvent.target as Element);
    if (!target.attr(TYPE_ATTR)) return true;

    switch (target.attr(TYPE_ATTR)) {
        case NODE_CLOSE:
            closeNodes(event, data);
            break;
    }
    return true;
};

/**
 * 节点激活
 * @param {jQuery.Event} _event
 * @param {EventData} _data
 */
export const onActivated = (_event: JQueryEventObject, data: Fancytree.EventData): void => {
    // const key = data.node.key
    // sendMessage('focus-node', data.node.data.id)
};

export const renderTitle = (_eventData: JQueryEventObject, data: Fancytree.EventData): string => {
    const treeNode = new TreeNodeTpl(data.node);
    return treeNode.html;
};

/**
 * windowNode数组转Map，字段key作为map的key
 */
// const nodesArr2Map = (nodeArr: TreeNode<TreeData>[]): TreeNodeMap => {
//   const key2Value: { [prop: string]: TreeNode<TreeData> } = {}
//   nodeArr.forEach(item => key2Value[item.key] = item)
//   return key2Value
// }

/**
 * 初始化WindowNodes
 * 1. 把flatten结构转成嵌套结构
 * 2. 将所有windowNodes和tabNodes置为closed，在后面merge的时候在重新计算
 * @param {Object.<key, WindowNode | TabNode>} dbNodesMap
 * @returns {Object.<windowId, WindowNode>}
 */
// const flattenStorageNodes = (dbNodesMap) => {
//   const nestedNodeMap = {}
//   Object.values(dbNodesMap).filter(node => node.hasOwnProperty('windowType'))
//     .forEach((windowNode) => {
//       const tabNodesArr = windowNode.children.map((tabKey) => {
//         dbNodesMap[tabKey].closed = true
//         return dbNodesMap[tabKey]
//       })
//       const nestedWindowNode = cloneDeep(windowNode)
//       nestedWindowNode.children = tabNodesArr
//       nestedWindowNode.closed = true
//       nestedNodeMap[nestedWindowNode.key] = nestedWindowNode
//     })
//   return nestedNodeMap
// }

/**
 * 将嵌套结构展开成完全的kv结构
 * windowNode的children存tab的key，tabNode存储到最顶层
 * @param {Object.<windowId, WindowNode>} windowNodeMap
 * @return {Object.<key, WindowNode | TabNode>}
 */
// const flattenNodes = (windowNodeMap) => {
//   const flattenMap = {}
//   Object.values(windowNodeMap).forEach((windowNode) => {
//     const tabKeyArr = []
//     Object.values(windowNode.children).forEach((tabNode) => {
//       tabKeyArr.push(tabNode.key)
//       flattenMap[tabNode.key] = tabNode
//     })
//     const windowNodeForStorage = cloneDeep(windowNode)
//     windowNodeForStorage.children = tabKeyArr
//     flattenMap[windowNodeForStorage.key] = windowNodeForStorage
//   })
//   return flattenMap
// }
