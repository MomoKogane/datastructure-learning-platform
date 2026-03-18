# 数据结构JSON存储系统

## 目录结构

```
src/data/structures/
├── index.ts                 # 统一导出文件
├── array/                   # 数组数据结构
│   ├── index.json          # 数组结构元数据
│   ├── theory.json         # 理论内容
│   ├── visualization.json  # 可视化配置
│   ├── examples.json       # 代码示例
│   └── practice.json       # 练习题目
├── linked-list/            # 链表（待实现）
├── stack/                  # 栈（待实现）
├── queue/                  # 队列（待实现）
├── tree/                   # 树（待实现）
├── graph/                  # 图（待实现）
├── hash-table/             # 哈希表（待实现）
└── heap/                   # 堆（待实现）
```

## JSON文件说明

### 1. index.json - 结构元数据
包含数据结构的基本信息：
- 名称、描述、难度等级
- 文件路径映射
- 学习路径和先决条件

### 2. theory.json - 理论内容
包含完整的理论知识：
- 核心概念解释
- 时间复杂度分析
- 内存布局说明
- 优缺点对比
- 与其他数据结构的比较

### 3. visualization.json - 可视化配置
包含交互式可视化设置：
- 默认数据和参数
- 支持的操作列表
- 动画配置
- 样式设置

### 4. examples.json - 代码示例
包含多语言代码示例：
- 基本操作实现
- 不同编程语言版本
- 时间复杂度说明
- 实用代码片段

### 5. practice.json - 练习题目
包含练习内容：
- 快速练习模板
- 分级练习题目
- 解题提示
- 完整解答
- 外部练习链接

## 使用方法

### 加载数据结构内容
```typescript
import { DataStructureLoader } from '../utils/dataStructureLoader';

// 加载完整的数组数据结构内容
const arrayContent = await DataStructureLoader.loadDataStructure('array');

// 或者单独加载某个部分
const theoryContent = await DataStructureLoader.loadTheory('array');
const visualizationConfig = await DataStructureLoader.loadVisualization('array');
```

### 在组件中使用
```typescript
import { DataStructureContent, ProgrammingLanguage } from '../types/dataStructureContent';

const MyComponent: React.FC = () => {
  const [content, setContent] = useState<DataStructureContent | null>(null);
  
  useEffect(() => {
    DataStructureLoader.loadDataStructure('array').then(setContent);
  }, []);
  
  // 使用加载的内容渲染组件
};
```

## 数据结构扩展

要添加新的数据结构：

1. 在 `structures/` 下创建新目录
2. 创建对应的5个JSON文件
3. 更新 `DataStructureLoader.getAvailableStructures()` 方法
4. 添加相应的类型定义（如需要）

## 已完成的功能

? **数组 (Array)**: 完整的JSON数据提取
- ? 理论内容：详细的概念解释和比较分析
- ? 可视化配置：插入、删除、搜索、更新操作
- ? 代码示例：C++、Java、TypeScript、C四种语言
- ? 练习题目：3个分级问题 + 外部链接

## 下一步计划

1. ? 修改ArraySection组件使用JSON数据
2. ? 增强理论测试导航功能  
3. ? 实现后端API集成
4. ? 构建智能理论测试系统
5. ? 扩展其他数据结构内容
