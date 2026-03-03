# link-map 多选功能技术方案

## 1. 架构设计

- **SelectionContext**: React Context 管理选择状态
- **TabMasterTree**: Fancytree 集成
- **OperationBar**: 批量操作 UI

## 2. 选择状态接口

```typescript
interface SelectionState {
  selectedKeys: Set<string>;      // 已选节点 keys
  indeterminateKeys: Set<string>;  // 半选状态（父节点）
  anchorKey: string | null;       // Shift 范围选择锚点
}
```

## 3. 范围选择算法

- 使用 `tree.visit()` 遍历可见节点
- 使用 `node.getNextNode(true)` 获取下一个可见节点
- 在锚点和目标节点之间收集所有节点

## 4. Fancytree 集成

- **selectMode**: 2 (标准多选，v1)
- **select 事件**: 同步到 React state
- **防循环**: 使用 flag 防止 React 更新触发 Fancytree 事件

## 5. 批量 Chrome Tabs API

```typescript
// 批量关闭
chrome.tabs.remove([tabIds])

// 批量移动到指定窗口
chrome.tabs.move([tabIds], { windowId, index })

// 移动到新窗口
const win = await chrome.windows.create({});
chrome.tabs.move([tabIds], { windowId: win.id, index: 0 })
```

- 添加 try-catch 错误处理
- 部分失败时提示用户并更新选择集

### 5.1 批量分组
- 使用 `chrome.tabGroups` API
- 创建新分组：`chrome.tabGroups.create({ tabIds })`
- OperationBar 添加"添加到分组"入口

### 5.2 复制链接
- 格式：`URL \n Title` 或 Markdown 链接
- 使用 Clipboard API 或 `document.execCommand('copy')`
- 仅针对 tab 节点，窗口/笔记节点禁用

## 6. 外部关闭同步

- 监听 `chrome.tabs.onRemoved`
- 自动从选择中移除已关闭的标签
- 全部关闭时隐藏 OperationBar
- 部分关闭时重算 indeterminate

## 7. 性能优化

- 使用 `useMemo` / `useCallback` 防止不必要重渲染
- 大批量操作添加进度提示
- **目标：100+ 节点选中 <100ms**
- 选择集用 Set 避免重复

## 8. 键盘支持

| 按键 | 功能 |
|------|------|
| `↑/↓` | 焦点移动 |
| `Space` | 切换选择 |
| `Shift + ↑/↓` | 范围选择 |
| `Ctrl/Cmd + A` | 全选可见节点 |
| `Enter` | 执行主操作（默认操作） |
| `Esc` | 取消选择 |

## 9. OperationBar 行为

- `selectedKeys.size > 0` 时显示
- 显示已选数量：`X tabs selected`
- 显示操作按钮：关闭、移动到...、分组、复制链接
- 窗口/笔记节点禁用"复制链接"

## 10. 无障碍 (Accessibility)

- 容器：`role="listbox"`
- 节点：`role="option"` + `aria-selected`
- 父节点半选：`aria-checked="mixed"`
- 数量播报：`aria-live="polite"` 区域
- 焦点管理：树获得焦点时启用键盘导航

## 11. 文件修改清单

| 文件 | 操作 |
|------|------|
| `src/tree/contexts/SelectionContext.tsx` | 新建 |
| `src/tree/features/tab-master-tree/TabMasterTree.tsx` | 修改 |
| `src/tree/features/tab-master-tree/nodes/tab-node-operations.ts` | 修改 |
| `src/tree/features/operation-bar/OperationBar.tsx` | 修改 |

## 12. 实现顺序

1. **SelectionContext** - 定义选择状态接口
2. **Fancytree 复选框** - 集成 checkbox 到树节点
3. **键盘处理** - Space/Arrow/Shift+Click
4. **OperationBar** - 批量操作 UI
5. **批量 API** - 关闭/移动实现
6. **外部同步** - tabs.onRemoved 监听

---

**状态**：✅ Gemini + ClawMini 联合 review 通过  
**版本**：1.0  
**日期**：2026-03-04
