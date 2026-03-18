export type DefaultOjProblemPayload = {
  title: string;
  description: string;
  inputDescription: string;
  outputDescription: string;
  sampleInput: string;
  sampleOutput: string;
  dataRange: string;
  constraints: {
    timeLimitMs: number;
    memoryLimitMb: number;
    stackLimitKb: number;
  };
  testCases: Array<{
    input: string;
    output: string;
  }>;
  source: 'leetcode' | 'zoj' | 'pta' | 'custom';
  defaultLanguage: 'cpp' | 'java' | 'typescript' | 'python';
  starterCode: {
    cpp: string;
    java: string;
    typescript: string;
    python?: string;
  };
};

type ProblemCore = Omit<DefaultOjProblemPayload, 'constraints' | 'source' | 'defaultLanguage' | 'starterCode'>;

type ProblemTemplateName =
  | 'complexityCount'
  | 'twoSum'
  | 'reverseSequence'
  | 'parenthesesValid'
  | 'queueOps'
  | 'maxCharFreq'
  | 'kmpIndex'
  | 'prefixBorder'
  | 'patternCount'
  | 'treeHeight'
  | 'preInToPost'
  | 'inorderSuccessor'
  | 'bstInorder'
  | 'isBalanced'
  | 'blackCount'
  | 'lowerBound'
  | 'huffmanWpl'
  | 'heapPopOrder'
  | 'graphDegree'
  | 'bfsShortest'
  | 'dfsReachable'
  | 'componentsCount'
  | 'dijkstra'
  | 'bellmanFord'
  | 'floydQueries'
  | 'multiSource'
  | 'mstWeight'
  | 'spanningTreeValidate'
  | 'linearSearch'
  | 'binarySearch'
  | 'hashMembership'
  | 'rangeCount'
  | 'sortAscending'
  | 'bubbleSwapCount'
  | 'radixSort'
  | 'bucketSort'
  | 'kWayMerge'
  | 'inversionCount'
  | 'helloWorld';

const baseStarterCode = {
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // 实现题目逻辑并输出结果\n    return 0;\n}',
  java: 'import java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // 实现题目逻辑并输出结果\n    }\n}',
  typescript: 'import * as fs from \"fs\";\n\nconst tokens = fs.readFileSync(0, \"utf8\").trim().split(/\\s+/);\nlet ptr = 0;\n\nfunction next(): string {\n  return tokens[ptr++];\n}\n\nfunction main(): void {\n  // 实现题目逻辑并输出结果\n}\n\nmain();',
  python: 'import sys\n\ndef main() -> None:\n    data = sys.stdin.read().strip().split()\n    # 实现题目逻辑并输出结果\n\nif __name__ == "__main__":\n    main()\n'
};

const fixedStarterCode = {
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    cout << "Hello World!" << endl;\n    return 0;\n}',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World!");\n    }\n}',
  typescript: 'function main(): void {\n  console.log("Hello World!");\n}\n\nmain();',
  python: 'print("Hello World!")\n'
};

const buildProblem = (core: ProblemCore, starter = baseStarterCode, source: DefaultOjProblemPayload['source'] = 'custom'): DefaultOjProblemPayload => ({
  ...core,
  constraints: {
    timeLimitMs: 1200,
    memoryLimitMb: 128,
    stackLimitKb: 8192
  },
  source,
  defaultLanguage: 'cpp',
  starterCode: starter
});

const templates: Record<ProblemTemplateName, ProblemCore> = {
  complexityCount: {
    title: '操作次数统计',
    description: '输入整数 n，输出 n*(n-1)/2。',
    inputDescription: '一行输入一个整数 n。',
    outputDescription: '输出一个整数。',
    sampleInput: '5',
    sampleOutput: '10',
    dataRange: '1 <= n <= 10^9',
    testCases: [
      { input: '1', output: '0' },
      { input: '3', output: '3' },
      { input: '5', output: '10' },
      { input: '10', output: '45' },
      { input: '100', output: '4950' }
    ]
  },
  twoSum: {
    title: '两数之和下标',
    description: '给定整数数组和目标值，输出和为目标值的两个下标（升序，0-based）。',
    inputDescription: '第一行输入数组；第二行输入 target。',
    outputDescription: '输出两个下标。',
    sampleInput: '2 7 11 15\n9',
    sampleOutput: '0 1',
    dataRange: '2 <= n <= 10^5，保证唯一解',
    testCases: [
      { input: '2 7 11 15\n9', output: '0 1' },
      { input: '3 2 4\n6', output: '1 2' },
      { input: '3 3\n6', output: '0 1' },
      { input: '-1 -2 -3 -4 -5\n-8', output: '2 4' },
      { input: '1 5 1 5\n10', output: '1 3' }
    ]
  },
  reverseSequence: {
    title: '链表反转输出',
    description: '输入 n 个整数，按单链表反转后的顺序输出。',
    inputDescription: '第一行 n，第二行 n 个整数。',
    outputDescription: '输出反转后的序列。',
    sampleInput: '5\n1 2 3 4 5',
    sampleOutput: '5 4 3 2 1',
    dataRange: '1 <= n <= 2*10^5',
    testCases: [
      { input: '1\n42', output: '42' },
      { input: '3\n1 2 3', output: '3 2 1' },
      { input: '5\n1 2 3 4 5', output: '5 4 3 2 1' },
      { input: '4\n0 -1 -2 -3', output: '-3 -2 -1 0' },
      { input: '6\n9 8 7 6 5 4', output: '4 5 6 7 8 9' }
    ]
  },
  parenthesesValid: {
    title: '栈括号匹配',
    description: '给定仅由 ()[]{} 组成的字符串，判断是否有效匹配。',
    inputDescription: '一行字符串 s。',
    outputDescription: '有效输出 YES，否则输出 NO。',
    sampleInput: '([]{})',
    sampleOutput: 'YES',
    dataRange: '1 <= |s| <= 2*10^5',
    testCases: [
      { input: '()', output: 'YES' },
      { input: '([{}])', output: 'YES' },
      { input: '(]', output: 'NO' },
      { input: '([)]', output: 'NO' },
      { input: '(((())))', output: 'YES' }
    ]
  },
  queueOps: {
    title: '队列操作模拟',
    description: '支持 push x、pop、front 操作；pop/front 在空队列时输出 EMPTY。',
    inputDescription: '第一行 q，后续 q 行每行一条操作。',
    outputDescription: '对每次 pop/front 输出结果，每行一个。',
    sampleInput: '6\npush 3\npush 5\nfront\npop\npop\npop',
    sampleOutput: '3\n3\n5\nEMPTY',
    dataRange: '1 <= q <= 2*10^5',
    testCases: [
      { input: '4\npop\nfront\npush 2\nfront', output: 'EMPTY\nEMPTY\n2' },
      { input: '6\npush 3\npush 5\nfront\npop\npop\npop', output: '3\n3\n5\nEMPTY' },
      { input: '5\npush 1\npush 2\npop\nfront\npop', output: '1\n2\n2' },
      { input: '3\npush 9\npop\nfront', output: '9\nEMPTY' },
      { input: '5\npush 7\nfront\nfront\npop\nfront', output: '7\n7\n7\nEMPTY' }
    ]
  },
  maxCharFreq: {
    title: '字符串最高频次',
    description: '输入小写字母字符串，输出出现次数最多字符的频次。',
    inputDescription: '一行字符串 s。',
    outputDescription: '输出一个整数。',
    sampleInput: 'abacaba',
    sampleOutput: '4',
    dataRange: '1 <= |s| <= 10^6',
    testCases: [
      { input: 'a', output: '1' },
      { input: 'abacaba', output: '4' },
      { input: 'zzzz', output: '4' },
      { input: 'abcabcabc', output: '3' },
      { input: 'aabbbbccddd', output: '4' }
    ]
  },
  kmpIndex: {
    title: '模式串首次匹配位置',
    description: '给定文本串 text 和模式串 pattern，输出 pattern 在 text 中首次出现的下标（0-based），不存在输出 -1。',
    inputDescription: '第一行 text，第二行 pattern。',
    outputDescription: '输出一个整数。',
    sampleInput: 'ababcabcacbab\nabcac',
    sampleOutput: '5',
    dataRange: '1 <= |text|,|pattern| <= 2*10^5',
    testCases: [
      { input: 'hello\nll', output: '2' },
      { input: 'aaaaa\nbba', output: '-1' },
      { input: 'ababcabcacbab\nabcac', output: '5' },
      { input: 'abc\nabc', output: '0' },
      { input: 'mississippi\nissi', output: '1' }
    ]
  },
  prefixBorder: {
    title: '最长相等前后缀',
    description: '给定字符串 s，输出其最长真前缀且同时是真后缀的长度。',
    inputDescription: '一行字符串 s。',
    outputDescription: '输出一个整数。',
    sampleInput: 'ababa',
    sampleOutput: '3',
    dataRange: '1 <= |s| <= 2*10^5',
    testCases: [
      { input: 'a', output: '0' },
      { input: 'ababa', output: '3' },
      { input: 'aaaa', output: '3' },
      { input: 'abcdabc', output: '3' },
      { input: 'abcde', output: '0' }
    ]
  },
  patternCount: {
    title: '模式串不重叠计数',
    description: '给定 text 和 pattern，统计 pattern 在 text 中不重叠出现次数。',
    inputDescription: '第一行 text，第二行 pattern。',
    outputDescription: '输出一个整数。',
    sampleInput: 'aaaaa\naa',
    sampleOutput: '2',
    dataRange: '1 <= |text|,|pattern| <= 2*10^5',
    testCases: [
      { input: 'aaaaa\naa', output: '2' },
      { input: 'abcabcabc\nabc', output: '3' },
      { input: 'abababa\naba', output: '2' },
      { input: 'hello\nworld', output: '0' },
      { input: 'zzzzzz\nzzz', output: '2' }
    ]
  },
  treeHeight: {
    title: '二叉树高度',
    description: '层序输入二叉树节点，空节点用 # 表示，输出树高度。',
    inputDescription: '一行层序序列（空格分隔），例如 1 2 3 # # 4 5。',
    outputDescription: '输出一个整数高度（空树为0）。',
    sampleInput: '1 2 3 # # 4 5',
    sampleOutput: '3',
    dataRange: '节点数 <= 2*10^5',
    testCases: [
      { input: '#', output: '0' },
      { input: '1', output: '1' },
      { input: '1 2 3 # # 4 5', output: '3' },
      { input: '1 2 # 3 # 4 #', output: '4' },
      { input: '1 2 3 4 5 6 7', output: '3' }
    ]
  },
  preInToPost: {
    title: '由先序和中序求后序',
    description: '给定一棵无重复节点二叉树的先序和中序遍历，输出后序遍历。',
    inputDescription: '第一行 n，第二行先序，第三行中序。',
    outputDescription: '输出后序序列。',
    sampleInput: '7\n1 2 4 5 3 6 7\n4 2 5 1 6 3 7',
    sampleOutput: '4 5 2 6 7 3 1',
    dataRange: '1 <= n <= 10^5',
    testCases: [
      { input: '1\n8\n8', output: '8' },
      { input: '3\n1 2 3\n2 1 3', output: '2 3 1' },
      { input: '7\n1 2 4 5 3 6 7\n4 2 5 1 6 3 7', output: '4 5 2 6 7 3 1' },
      { input: '4\n1 2 3 4\n4 3 2 1', output: '4 3 2 1' },
      { input: '4\n1 2 3 4\n1 2 3 4', output: '4 3 2 1' }
    ]
  },
  inorderSuccessor: {
    title: '中序后继查询',
    description: '给定 BST 的中序序列和查询值 x，输出 x 的中序后继；不存在输出 -1。',
    inputDescription: '第一行 n，第二行严格递增序列，第三行 x。',
    outputDescription: '输出后继值或 -1。',
    sampleInput: '5\n1 3 6 9 11\n6',
    sampleOutput: '9',
    dataRange: '1 <= n <= 2*10^5',
    testCases: [
      { input: '5\n1 3 6 9 11\n6', output: '9' },
      { input: '4\n2 4 6 8\n8', output: '-1' },
      { input: '1\n10\n10', output: '-1' },
      { input: '6\n1 2 3 4 5 6\n3', output: '4' },
      { input: '6\n1 5 7 9 10 20\n1', output: '5' }
    ]
  },
  bstInorder: {
    title: 'BST 插入后中序输出',
    description: '依次将 n 个整数插入 BST，输出中序遍历。',
    inputDescription: '第一行 n，第二行 n 个整数。',
    outputDescription: '输出中序序列（升序，含重复时重复值放右子树）。',
    sampleInput: '5\n5 3 7 2 4',
    sampleOutput: '2 3 4 5 7',
    dataRange: '1 <= n <= 2*10^5',
    testCases: [
      { input: '5\n5 3 7 2 4', output: '2 3 4 5 7' },
      { input: '4\n1 2 3 4', output: '1 2 3 4' },
      { input: '4\n4 3 2 1', output: '1 2 3 4' },
      { input: '6\n5 5 5 5 5 5', output: '5 5 5 5 5 5' },
      { input: '6\n9 1 8 2 7 3', output: '1 2 3 7 8 9' }
    ]
  },
  isBalanced: {
    title: '平衡二叉树判定',
    description: '层序输入二叉树节点，空节点用 # 表示，判断是否平衡。',
    inputDescription: '一行层序序列。',
    outputDescription: '平衡输出 YES，否则输出 NO。',
    sampleInput: '3 9 20 # # 15 7',
    sampleOutput: 'YES',
    dataRange: '节点数 <= 2*10^5',
    testCases: [
      { input: '3 9 20 # # 15 7', output: 'YES' },
      { input: '1 2 # 3 # 4 #', output: 'NO' },
      { input: '#', output: 'YES' },
      { input: '1 2 2 3 3 # # 4 4', output: 'NO' },
      { input: '1 2 3 4 5 6 #', output: 'YES' }
    ]
  },
  blackCount: {
    title: '黑色节点计数',
    description: '输入由 B/R 构成的颜色序列，输出黑色节点个数。',
    inputDescription: '一行字符串，仅含 B 和 R。',
    outputDescription: '输出 B 的个数。',
    sampleInput: 'BRRBBRB',
    sampleOutput: '4',
    dataRange: '1 <= |s| <= 10^6',
    testCases: [
      { input: 'B', output: '1' },
      { input: 'R', output: '0' },
      { input: 'BRRBBRB', output: '4' },
      { input: 'RRRRRR', output: '0' },
      { input: 'BBBBBR', output: '5' }
    ]
  },
  lowerBound: {
    title: '有序关键字查找',
    description: '在有序序列中查找第一个 >= x 的位置下标（0-based），不存在输出 -1。',
    inputDescription: '第一行 n，第二行有序序列，第三行 x。',
    outputDescription: '输出下标。',
    sampleInput: '5\n1 3 5 7 9\n6',
    sampleOutput: '3',
    dataRange: '1 <= n <= 2*10^5',
    testCases: [
      { input: '5\n1 3 5 7 9\n6', output: '3' },
      { input: '5\n1 3 5 7 9\n10', output: '-1' },
      { input: '5\n1 3 5 7 9\n1', output: '0' },
      { input: '6\n2 2 2 3 4 5\n2', output: '0' },
      { input: '4\n-5 -2 0 8\n-3', output: '1' }
    ]
  },
  huffmanWpl: {
    title: '哈夫曼树 WPL',
    description: '给定 n 个权值，构造哈夫曼树并输出带权路径长度 WPL。',
    inputDescription: '第一行 n，第二行 n 个正整数权值。',
    outputDescription: '输出一个整数 WPL。',
    sampleInput: '5\n1 2 3 4 5',
    sampleOutput: '33',
    dataRange: '1 <= n <= 2*10^5，权值 <= 10^9',
    testCases: [
      { input: '1\n7', output: '0' },
      { input: '2\n1 2', output: '3' },
      { input: '5\n1 2 3 4 5', output: '33' },
      { input: '4\n5 5 5 5', output: '40' },
      { input: '3\n10 20 30', output: '90' }
    ]
  },
  heapPopOrder: {
    title: '堆出堆序列',
    description: '给定 n 个整数构建大根堆，反复弹出堆顶直到为空，输出弹出序列。',
    inputDescription: '第一行 n，第二行 n 个整数。',
    outputDescription: '输出弹出序列（降序）。',
    sampleInput: '5\n3 1 6 2 5',
    sampleOutput: '6 5 3 2 1',
    dataRange: '1 <= n <= 2*10^5',
    testCases: [
      { input: '1\n7', output: '7' },
      { input: '5\n3 1 6 2 5', output: '6 5 3 2 1' },
      { input: '4\n9 9 1 2', output: '9 9 2 1' },
      { input: '6\n-1 -3 -2 -5 -4 -6', output: '-1 -2 -3 -4 -5 -6' },
      { input: '5\n10 20 30 40 50', output: '50 40 30 20 10' }
    ]
  },
  graphDegree: {
    title: '图节点度数统计',
    description: '给定无向图，输出 1..n 每个节点的度数。',
    inputDescription: '第一行 n m，后续 m 行每行一条边 u v。',
    outputDescription: '输出 n 个整数。',
    sampleInput: '4 3\n1 2\n2 3\n2 4',
    sampleOutput: '1 3 1 1',
    dataRange: '1 <= n <= 2*10^5',
    testCases: [
      { input: '3 0', output: '0 0 0' },
      { input: '4 3\n1 2\n2 3\n2 4', output: '1 3 1 1' },
      { input: '5 4\n1 2\n2 3\n3 4\n4 5', output: '1 2 2 2 1' },
      { input: '2 2\n1 2\n1 2', output: '2 2' },
      { input: '4 4\n1 2\n1 3\n1 4\n2 3', output: '3 2 2 1' }
    ]
  },
  bfsShortest: {
    title: 'BFS 最短路',
    description: '无向无权图中，求 s 到 t 的最短边数，不可达输出 -1。',
    inputDescription: '第一行 n m，接着 m 行边，最后一行 s t。',
    outputDescription: '输出最短路长度。',
    sampleInput: '5 4\n1 2\n2 3\n3 4\n4 5\n1 5',
    sampleOutput: '4',
    dataRange: '1 <= n <= 2*10^5',
    testCases: [
      { input: '5 4\n1 2\n2 3\n3 4\n4 5\n1 5', output: '4' },
      { input: '4 2\n1 2\n3 4\n1 4', output: '-1' },
      { input: '3 3\n1 2\n2 3\n1 3\n1 3', output: '1' },
      { input: '1 0\n1 1', output: '0' },
      { input: '6 5\n1 2\n2 3\n3 4\n4 5\n5 6\n2 6', output: '4' }
    ]
  },
  dfsReachable: {
    title: 'DFS 可达节点数',
    description: '无向图中，从起点 s 出发可达多少个节点。',
    inputDescription: '第一行 n m，接着 m 行边，最后一行 s。',
    outputDescription: '输出可达节点数量。',
    sampleInput: '5 3\n1 2\n2 3\n4 5\n1',
    sampleOutput: '3',
    dataRange: '1 <= n <= 2*10^5',
    testCases: [
      { input: '5 3\n1 2\n2 3\n4 5\n1', output: '3' },
      { input: '5 0\n2', output: '1' },
      { input: '4 3\n1 2\n2 3\n3 4\n1', output: '4' },
      { input: '6 3\n1 2\n3 4\n5 6\n5', output: '2' },
      { input: '3 2\n1 2\n2 3\n2', output: '3' }
    ]
  },
  componentsCount: {
    title: '连通分量个数',
    description: '给定无向图，输出连通分量数量。',
    inputDescription: '第一行 n m，后续 m 行边。',
    outputDescription: '输出一个整数。',
    sampleInput: '5 2\n1 2\n4 5',
    sampleOutput: '3',
    dataRange: '1 <= n <= 2*10^5',
    testCases: [
      { input: '5 2\n1 2\n4 5', output: '3' },
      { input: '4 3\n1 2\n2 3\n3 4', output: '1' },
      { input: '6 0', output: '6' },
      { input: '6 3\n1 2\n3 4\n5 6', output: '3' },
      { input: '3 3\n1 2\n2 3\n1 3', output: '1' }
    ]
  },
  dijkstra: {
    title: 'Dijkstra 单源最短路',
    description: '有向带权图（非负权）中，求 s 到 t 的最短距离，不可达输出 -1。',
    inputDescription: '第一行 n m，接着 m 行 u v w，最后一行 s t。',
    outputDescription: '输出最短距离。',
    sampleInput: '4 4\n1 2 2\n1 3 5\n2 3 1\n3 4 2\n1 4',
    sampleOutput: '5',
    dataRange: '1 <= n <= 2*10^5',
    testCases: [
      { input: '4 4\n1 2 2\n1 3 5\n2 3 1\n3 4 2\n1 4', output: '5' },
      { input: '3 1\n1 2 3\n1 3', output: '-1' },
      { input: '5 7\n1 2 2\n1 3 4\n2 3 1\n2 4 7\n3 5 3\n4 5 1\n1 5 10\n1 5', output: '6' },
      { input: '2 1\n1 2 9\n1 2', output: '9' },
      { input: '1 0\n1 1', output: '0' }
    ]
  },
  bellmanFord: {
    title: 'Bellman-Ford 最短路',
    description: '有向带权图中，求 s 到 t 的最短距离（保证无负环影响到答案），不可达输出 INF。',
    inputDescription: '第一行 n m，接着 m 行 u v w，最后一行 s t。',
    outputDescription: '输出最短距离或 INF。',
    sampleInput: '3 3\n1 2 4\n1 3 5\n2 3 -2\n1 3',
    sampleOutput: '2',
    dataRange: '1 <= n <= 5000',
    testCases: [
      { input: '3 3\n1 2 4\n1 3 5\n2 3 -2\n1 3', output: '2' },
      { input: '4 2\n1 2 3\n3 4 -1\n1 4', output: 'INF' },
      { input: '2 1\n1 2 -5\n1 2', output: '-5' },
      { input: '4 5\n1 2 1\n2 3 1\n3 4 1\n1 4 10\n2 4 3\n1 4', output: '4' },
      { input: '1 0\n1 1', output: '0' }
    ]
  },
  floydQueries: {
    title: 'Floyd 多源最短路查询',
    description: '有向带权图，回答多组最短路查询；不可达输出 INF。',
    inputDescription: '第一行 n m q，接着 m 行 u v w，再 q 行 a b。',
    outputDescription: '每个查询输出一行最短距离或 INF。',
    sampleInput: '3 3 2\n1 2 2\n2 3 3\n1 3 10\n1 3\n3 1',
    sampleOutput: '5\nINF',
    dataRange: '1 <= n <= 300',
    testCases: [
      { input: '3 3 2\n1 2 2\n2 3 3\n1 3 10\n1 3\n3 1', output: '5\nINF' },
      { input: '2 1 2\n1 2 7\n1 2\n2 1', output: '7\nINF' },
      { input: '4 4 3\n1 2 1\n2 3 1\n3 4 1\n1 4 10\n1 4\n2 4\n1 3', output: '3\n2\n2' },
      { input: '1 0 1\n1 1', output: '0' },
      { input: '3 0 2\n1 2\n2 3', output: 'INF\nINF' }
    ]
  },
  multiSource: {
    title: '多源最短距离',
    description: '无向无权图中，给定 k 个源点与目标 t，求任一源点到 t 的最短距离。',
    inputDescription: '第一行 n m k，接着 m 行边，下一行 k 个源点，最后一行 t。',
    outputDescription: '输出最短距离，不可达输出 -1。',
    sampleInput: '6 5 2\n1 2\n2 3\n3 4\n4 5\n5 6\n1 6\n4',
    sampleOutput: '2',
    dataRange: '1 <= n <= 2*10^5',
    testCases: [
      { input: '6 5 2\n1 2\n2 3\n3 4\n4 5\n5 6\n1 6\n4', output: '2' },
      { input: '5 2 2\n1 2\n4 5\n1 5\n3', output: '-1' },
      { input: '4 3 1\n1 2\n2 3\n3 4\n1\n4', output: '3' },
      { input: '3 2 3\n1 2\n2 3\n1 2 3\n3', output: '0' },
      { input: '1 0 1\n1\n1', output: '0' }
    ]
  },
  mstWeight: {
    title: '最小生成树权值',
    description: '给定无向连通图，输出最小生成树总权值。若不连通输出 -1。',
    inputDescription: '第一行 n m，后续 m 行 u v w。',
    outputDescription: '输出一个整数。',
    sampleInput: '4 5\n1 2 1\n1 3 4\n2 3 2\n2 4 7\n3 4 3',
    sampleOutput: '6',
    dataRange: '1 <= n <= 2*10^5',
    testCases: [
      { input: '4 5\n1 2 1\n1 3 4\n2 3 2\n2 4 7\n3 4 3', output: '6' },
      { input: '3 1\n1 2 3', output: '-1' },
      { input: '2 1\n1 2 9', output: '9' },
      { input: '5 7\n1 2 1\n1 3 2\n2 3 2\n2 4 3\n3 5 4\n4 5 5\n1 5 10', output: '10' },
      { input: '1 0', output: '0' }
    ]
  },
  spanningTreeValidate: {
    title: '生成树合法性与权值',
    description: '给定 n 与 n-1 条边，判断是否构成一棵树；是则输出权值和，否则输出 -1。',
    inputDescription: '第一行 n，后续 n-1 行 u v w。',
    outputDescription: '输出权值和或 -1。',
    sampleInput: '4\n1 2 1\n2 3 2\n3 4 3',
    sampleOutput: '6',
    dataRange: '1 <= n <= 2*10^5',
    testCases: [
      { input: '4\n1 2 1\n2 3 2\n3 4 3', output: '6' },
      { input: '4\n1 2 1\n2 1 2\n3 4 3', output: '-1' },
      { input: '1', output: '0' },
      { input: '3\n1 2 5\n2 3 6', output: '11' },
      { input: '5\n1 2 1\n2 3 1\n3 1 1\n4 5 1', output: '-1' }
    ]
  },
  linearSearch: {
    title: '顺序查找首下标',
    description: '在序列中查找目标值 x，输出首次出现下标（0-based），不存在输出 -1。',
    inputDescription: '第一行 n，第二行序列，第三行 x。',
    outputDescription: '输出一个整数。',
    sampleInput: '5\n4 7 1 7 9\n7',
    sampleOutput: '1',
    dataRange: '1 <= n <= 10^6',
    testCases: [
      { input: '5\n4 7 1 7 9\n7', output: '1' },
      { input: '3\n1 2 3\n4', output: '-1' },
      { input: '1\n8\n8', output: '0' },
      { input: '6\n9 9 9 9 9 9\n9', output: '0' },
      { input: '4\n-1 -2 -3 -4\n-3', output: '2' }
    ]
  },
  binarySearch: {
    title: '二分查找下标',
    description: '在有序序列中查找目标值 x，输出任意一个命中下标，不存在输出 -1。',
    inputDescription: '第一行 n，第二行有序序列，第三行 x。',
    outputDescription: '输出一个整数下标。',
    sampleInput: '5\n1 3 5 7 9\n7',
    sampleOutput: '3',
    dataRange: '1 <= n <= 2*10^5',
    testCases: [
      { input: '5\n1 3 5 7 9\n7', output: '3' },
      { input: '5\n1 3 5 7 9\n2', output: '-1' },
      { input: '1\n10\n10', output: '0' },
      { input: '6\n2 2 2 2 2 2\n2', output: '0' },
      { input: '4\n-5 -2 0 8\n-5', output: '0' }
    ]
  },
  hashMembership: {
    title: '哈希集合查询',
    description: '给定初始集合与查询，查询值是否存在集合中。',
    inputDescription: '第一行 n q，第二行 n 个数，第三行 q 个查询值。',
    outputDescription: '按查询顺序输出 YES/NO（空格分隔）。',
    sampleInput: '5 4\n1 3 5 7 9\n3 4 9 10',
    sampleOutput: 'YES NO YES NO',
    dataRange: '1 <= n,q <= 2*10^5',
    testCases: [
      { input: '5 4\n1 3 5 7 9\n3 4 9 10', output: 'YES NO YES NO' },
      { input: '3 3\n1 1 1\n1 2 3', output: 'YES NO NO' },
      { input: '1 1\n-5\n-5', output: 'YES' },
      { input: '4 5\n2 4 6 8\n1 2 3 4 8', output: 'NO YES NO YES YES' },
      { input: '2 2\n100 200\n300 100', output: 'NO YES' }
    ]
  },
  rangeCount: {
    title: '区间查询计数',
    description: '给定有序序列与区间 [l,r] 查询，输出每个查询区间内元素个数。',
    inputDescription: '第一行 n q，第二行有序序列，后续 q 行每行 l r。',
    outputDescription: '每个查询输出一行计数。',
    sampleInput: '5 3\n1 3 5 7 9\n1 5\n4 8\n10 20',
    sampleOutput: '3\n2\n0',
    dataRange: '1 <= n,q <= 2*10^5',
    testCases: [
      { input: '5 3\n1 3 5 7 9\n1 5\n4 8\n10 20', output: '3\n2\n0' },
      { input: '4 2\n2 2 2 2\n2 2\n1 1', output: '4\n0' },
      { input: '6 2\n-5 -2 0 3 7 10\n-3 8\n-10 -6', output: '4\n0' },
      { input: '1 2\n100\n100 100\n99 99', output: '1\n0' },
      { input: '5 1\n1 2 3 4 5\n3 3', output: '1' }
    ]
  },
  sortAscending: {
    title: '排序结果输出',
    description: '输入 n 个整数，按升序输出。',
    inputDescription: '第一行 n，第二行 n 个整数。',
    outputDescription: '输出升序序列。',
    sampleInput: '5\n5 3 1 4 2',
    sampleOutput: '1 2 3 4 5',
    dataRange: '1 <= n <= 2*10^5',
    testCases: [
      { input: '5\n5 3 1 4 2', output: '1 2 3 4 5' },
      { input: '1\n7', output: '7' },
      { input: '6\n9 9 1 1 5 5', output: '1 1 5 5 9 9' },
      { input: '4\n-1 -3 -2 -4', output: '-4 -3 -2 -1' },
      { input: '5\n10 8 6 4 2', output: '2 4 6 8 10' }
    ]
  },
  bubbleSwapCount: {
    title: '冒泡交换次数',
    description: '对序列执行标准冒泡排序，输出交换次数。',
    inputDescription: '第一行 n，第二行 n 个整数。',
    outputDescription: '输出交换次数。',
    sampleInput: '5\n5 1 4 2 3',
    sampleOutput: '6',
    dataRange: '1 <= n <= 5000',
    testCases: [
      { input: '5\n5 1 4 2 3', output: '6' },
      { input: '4\n1 2 3 4', output: '0' },
      { input: '4\n4 3 2 1', output: '6' },
      { input: '3\n1 1 1', output: '0' },
      { input: '5\n2 3 8 6 1', output: '5' }
    ]
  },
  radixSort: {
    title: '基数排序结果',
    description: '输入非负整数序列，按升序输出。',
    inputDescription: '第一行 n，第二行 n 个非负整数。',
    outputDescription: '输出升序序列。',
    sampleInput: '5\n170 45 75 90 802',
    sampleOutput: '45 75 90 170 802',
    dataRange: '0 <= a[i] <= 10^9',
    testCases: [
      { input: '5\n170 45 75 90 802', output: '45 75 90 170 802' },
      { input: '4\n0 0 0 0', output: '0 0 0 0' },
      { input: '6\n9 99 999 1 10 100', output: '1 9 10 99 100 999' },
      { input: '3\n5 3 4', output: '3 4 5' },
      { input: '5\n1000 2 20 200 0', output: '0 2 20 200 1000' }
    ]
  },
  bucketSort: {
    title: '桶排序（小数）',
    description: '输入 [0,1) 内小数，升序输出并保留 3 位小数。',
    inputDescription: '第一行 n，第二行 n 个小数。',
    outputDescription: '输出升序结果（3位小数）。',
    sampleInput: '5\n0.78 0.17 0.39 0.26 0.72',
    sampleOutput: '0.170 0.260 0.390 0.720 0.780',
    dataRange: '1 <= n <= 10^5',
    testCases: [
      { input: '5\n0.78 0.17 0.39 0.26 0.72', output: '0.170 0.260 0.390 0.720 0.780' },
      { input: '3\n0.001 0.010 0.100', output: '0.001 0.010 0.100' },
      { input: '4\n0.999 0.001 0.500 0.250', output: '0.001 0.250 0.500 0.999' },
      { input: '2\n0.333 0.333', output: '0.333 0.333' },
      { input: '5\n0.9 0.8 0.7 0.6 0.5', output: '0.500 0.600 0.700 0.800 0.900' }
    ]
  },
  kWayMerge: {
    title: '外部排序多路归并',
    description: '给定 k 路已升序序列，归并为一个升序序列输出。',
    inputDescription: '第一行 k；每路先输入长度，再输入该路序列。',
    outputDescription: '输出归并后的升序序列。',
    sampleInput: '3\n3 1 4 7\n2 2 6\n3 0 5 8',
    sampleOutput: '0 1 2 4 5 6 7 8',
    dataRange: '总元素 <= 2*10^5',
    testCases: [
      { input: '3\n3 1 4 7\n2 2 6\n3 0 5 8', output: '0 1 2 4 5 6 7 8' },
      { input: '1\n4 3 4 5 6', output: '3 4 5 6' },
      { input: '2\n0\n3 1 1 1', output: '1 1 1' },
      { input: '3\n2 -3 -1\n2 -2 0\n2 -5 4', output: '-5 -3 -2 -1 0 4' },
      { input: '2\n3 1 2 3\n3 4 5 6', output: '1 2 3 4 5 6' }
    ]
  },
  inversionCount: {
    title: '逆序对计数',
    description: '给定整数序列，输出逆序对数量。',
    inputDescription: '第一行 n，第二行 n 个整数。',
    outputDescription: '输出一个整数。',
    sampleInput: '5\n2 4 1 3 5',
    sampleOutput: '3',
    dataRange: '1 <= n <= 2*10^5',
    testCases: [
      { input: '5\n2 4 1 3 5', output: '3' },
      { input: '4\n1 2 3 4', output: '0' },
      { input: '4\n4 3 2 1', output: '6' },
      { input: '3\n1 1 1', output: '0' },
      { input: '6\n6 5 4 3 2 1', output: '15' }
    ]
  },
  helloWorld: {
    title: 'Hello World',
    description: '输出字符串 Hello World!。',
    inputDescription: '无输入。',
    outputDescription: '输出 Hello World!。',
    sampleInput: '无',
    sampleOutput: 'Hello World!',
    dataRange: '无',
    testCases: [
      { input: '无', output: 'Hello World!' },
      { input: '无', output: 'Hello World!' },
      { input: '无', output: 'Hello World!' },
      { input: '无', output: 'Hello World!' },
      { input: '无', output: 'Hello World!' }
    ]
  }
};

const sectionToTemplateBatch1: Record<string, { template: ProblemTemplateName; title: string }> = {
  '1.1': { template: 'complexityCount', title: '1.1 抽象操作次数统计' },
  '1.2': { template: 'complexityCount', title: '1.2 时间复杂度求和估计' },
  '2.1': { template: 'twoSum', title: '2.1 顺序表-两数之和' },
  '2.2': { template: 'reverseSequence', title: '2.2 链表反转输出' },
  '2.3': { template: 'parenthesesValid', title: '2.3 栈-括号匹配' },
  '2.4': { template: 'queueOps', title: '2.4 队列操作模拟' },
  '3.1': { template: 'maxCharFreq', title: '3.1 字符串字符频次' },
  '3.2': { template: 'kmpIndex', title: '3.2 模式匹配首位置' },
  '3.2.1': { template: 'prefixBorder', title: '3.2.1 前缀函数最长边界' },
  '3.2.2': { template: 'patternCount', title: '3.2.2 模式串不重叠计数' },
  '3.2.3': { template: 'kmpIndex', title: '3.2.3 KMP 首次命中下标' }
};

const sectionToTemplateBatch2: Record<string, { template: ProblemTemplateName; title: string }> = {
  '4.1': { template: 'treeHeight', title: '4.1 树的高度计算' },
  '4.2': { template: 'preInToPost', title: '4.2 二叉树遍历重建' },
  '4.3': { template: 'helloWorld', title: '4.3 入门输出题' },
  '4.4': { template: 'inorderSuccessor', title: '4.4 线索化后继查询' },
  '4.5': { template: 'bstInorder', title: '4.5 BST 插入与中序' },
  '4.6': { template: 'isBalanced', title: '4.6 AVL 平衡判定' },
  '4.7': { template: 'blackCount', title: '4.7 红黑节点统计' },
  '4.8': { template: 'lowerBound', title: '4.8 多路平衡查找关键字定位' },
  '4.9': { template: 'huffmanWpl', title: '4.9 哈夫曼树 WPL 计算' },
  '4.10': { template: 'heapPopOrder', title: '4.10 堆的出堆序列' },
  '5.1': { template: 'graphDegree', title: '5.1 图节点度数统计' },
  '5.2.1': { template: 'bfsShortest', title: '5.2.1 图遍历-BFS 最短路' },
  '5.2.2': { template: 'dfsReachable', title: '5.2.2 图遍历-DFS 可达计数' },
  '5.2.3': { template: 'componentsCount', title: '5.2.3 图遍历-连通分量' },
  '5.3.1': { template: 'dijkstra', title: '5.3.1 Dijkstra 最短路' },
  '5.3.2': { template: 'bellmanFord', title: '5.3.2 Bellman-Ford 最短路' },
  '5.3.3': { template: 'floydQueries', title: '5.3.3 Floyd 多源查询' },
  '5.3.4': { template: 'multiSource', title: '5.3.4 多源最短距离' },
  '5.4.1': { template: 'mstWeight', title: '5.4.1 Prim 最小生成树' },
  '5.4.2': { template: 'mstWeight', title: '5.4.2 Kruskal 最小生成树' },
  '5.4.3': { template: 'spanningTreeValidate', title: '5.4.3 生成树合法性校验' }
};

const sectionToTemplateBatch3: Record<string, { template: ProblemTemplateName; title: string }> = {
  '6.1': { template: 'linearSearch', title: '6.1 顺序查找' },
  '6.2': { template: 'binarySearch', title: '6.2 二分查找' },
  '6.3': { template: 'hashMembership', title: '6.3 哈希查找集合查询' },
  '6.4': { template: 'lowerBound', title: '6.4 B-树关键字定位' },
  '6.5': { template: 'rangeCount', title: '6.5 B+树区间计数' },
  '7.1': { template: 'sortAscending', title: '7.1 插入排序结果输出' },
  '7.2': { template: 'bubbleSwapCount', title: '7.2 冒泡排序交换次数' },
  '7.3': { template: 'sortAscending', title: '7.3 选择排序结果输出' },
  '7.4': { template: 'sortAscending', title: '7.4 希尔排序结果输出' },
  '7.5': { template: 'sortAscending', title: '7.5 快速排序结果输出' },
  '7.6': { template: 'sortAscending', title: '7.6 归并排序结果输出' },
  '7.7': { template: 'sortAscending', title: '7.7 堆排序结果输出' },
  '7.8': { template: 'radixSort', title: '7.8 基数排序' },
  '7.9': { template: 'bucketSort', title: '7.9 桶排序（浮点）' },
  '7.10': { template: 'kWayMerge', title: '7.10 外部排序多路归并' },
  '7.11': { template: 'inversionCount', title: '7.11 排序算法分析-逆序对' }
};

const toProblem = (templateName: ProblemTemplateName, title: string): DefaultOjProblemPayload => {
  const core = templates[templateName];
  if (templateName === 'helloWorld') {
    return buildProblem({ ...core, title }, fixedStarterCode, 'pta');
  }
  if (templateName === 'twoSum') {
    return buildProblem({ ...core, title }, baseStarterCode, 'leetcode');
  }
  return buildProblem({ ...core, title });
};

const mergeBatches = (
  ...batches: Array<Record<string, { template: ProblemTemplateName; title: string }>>
): Record<string, DefaultOjProblemPayload> => {
  const merged: Record<string, DefaultOjProblemPayload> = {};
  for (const batch of batches) {
    for (const [sectionId, entry] of Object.entries(batch)) {
      merged[sectionId] = toProblem(entry.template, entry.title);
    }
  }
  return merged;
};

export const defaultOjProblemBank = mergeBatches(
  sectionToTemplateBatch1,
  sectionToTemplateBatch2,
  sectionToTemplateBatch3
);

export default defaultOjProblemBank;
