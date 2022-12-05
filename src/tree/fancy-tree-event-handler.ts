/**
 * FancyTree的事件处理模块
 */

import { sendMessage } from 'webext-bridge';
import type { Windows } from 'webextension-polyfill';

import type { TreeData, TreeNode } from '../logic/nodes';
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
    const browserWindowPromise = await sendMessage('get-tree', null, 'background');
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

const removeTab = (_key?: string) => {
    console.log('remove node item on-clicked');
};

/**
 * Tree Click事件处理
 * 主要用于代理和分发子事件
 */
export const onClick = (event: JQueryEventObject): boolean => {
    const target = $(event.originalEvent.target as Element);
    if (!target.attr(TYPE_ATTR)) return true;

    switch (target.attr(TYPE_ATTR)) {
        case NODE_CLOSE:
            removeTab(target.attr(NODE_KEY));
            break;
    }
    return true;
};

/**
 * 节点激活
 * @param {jQuery.Event} _event
 * @param {EventData} _data
 */
export const onActivated = (_event: JQueryEventObject, _data: Fancytree.EventData): void => {
    // const key = data.node.key
    // sendToServiceWorker(ChannelMsg.buildReq(REQ_WORKER_TYPES.ACTIVATED_TAB, TabNodeFactory.getWindowAndTabIdFromKey(key)))
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
