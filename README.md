# LazyScrollTable 组件

`LazyScrollTable` 是一个高效的表格组件，支持虚拟滚动和批量操作功能，适用于需要展示大量数据的场景。

## Props

### `value?`
- 类型: `T[]`  
- 默认值: `[]`  
- 描述: 表格的数据源。

### `onChange?`
- 类型: `(e: T[]) => void`  
- 描述: 数据变化时的回调函数，用于接收更新后的数据。

### `maxRows?`
- 类型: `number`  
- 默认值: `Infinity`  
- 描述: 最大支持的行数，限制表格可显示的最大行数。

### `importBatchConfig?`
- 类型: `ImportBatchConfig | false`  
- 默认值: `false`  
- 描述: 批量导入配置，设置为 `false` 表示禁用批量导入。

### `exportBatchConfig?`
- 类型: `ExportBatchConfig | false`  
- 默认值: `false`  
- 描述: 批量导出配置，设置为 `false` 表示禁用批量导出。

### `columns`
- 类型: `LazyScrollTableColumm<T>[]`  
- 描述: 表格的列配置。每列的配置项会定义该列的标题、数据、渲染方式等。

### `onDelete?`
- 类型: `(e: T) => void`  
- 描述: 删除行数据时的回调函数。

### `onAdd?`
- 类型: `(e: T) => void`  
- 描述: 添加行数据时的回调函数。

### `showTotal?`
- 类型: `boolean`  
- 默认值: `false`  
- 描述: 是否显示表格数据的总数。

### `showReturnBtn?`
- 类型: `boolean`  
- 默认值: `false`  
- 描述: 是否显示回到顶部/底部按钮。

### `showAddBtn?`
- 类型: `boolean`  
- 默认值: `true`  
- 描述: 是否显示“添加”按钮。

### `allowDelete?`
- 类型: `boolean`  
- 默认值: `true`  
- 描述: 是否允许删除行数据。

### `windowSize?`
- 类型: `number`  
- 默认值: `10`  
- 描述: 滚动窗口的尺寸，表示每次可显示的行数。

### `rowHeight?`
- 类型: `number`  
- 默认值: `40`  
- 描述: 每行的高度。

### `preRenderRows?`
- 类型: `number`  
- 默认值: `50`  
- 描述: 预先渲染的行数，减少首次渲染时的卡顿。

### `autoRefresh?`
- 类型: `boolean`  
- 默认值: `true`  
- 描述: 是否自动刷新数据。如果需要使用外部状态（如表单）来控制数据更新，设置为 `false`。

## 示例代码

```tsx
import React, { useState } from 'react';
import LazyScrollTable from './LazyScrollTable';

const App = () => {
  const [data, setData] = useState<MyData[]>([]);

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Age', dataIndex: 'age' },
    // 其他列配置...
  ];

  const handleDelete = (record: MyData) => {
    // 删除逻辑
  };

  const handleAdd = (newData: MyData) => {
    // 添加逻辑
  };

  return (
    <LazyScrollTable
      value={data}
      onChange={setData}
      columns={columns}
      onDelete={handleDelete}
      onAdd={handleAdd}
      maxRows={100}
      showTotal={true}
      showReturnBtn={true}
      showAddBtn={true}
      allowDelete={true}
      windowSize={20}
      rowHeight={50}
      preRenderRows={60}
      autoRefresh={true}
    />
  );
};
# lazy-scroll-table
