import { createTopicSection } from '../../TopicSection/createTopicSection';

const StackSection = createTopicSection({
  id: '2.3',
  name: 'Stack',
  chapterNumber: '2.3',
  overview:
    'A stack is a linear data structure that follows LIFO (Last In, First Out). The most recent element added is the first one removed. Stacks are commonly used for recursion, undo/redo, and expression evaluation.',
  concepts: [
    {
      title: 'Core Operations',
      content: 'Push adds an element, pop removes the top element, and peek reads the top element without removing it.',
      examples: ['push(5)', 'pop()', 'peek()']
    },
    {
      title: 'Implementation',
      content: 'Stacks can be implemented using arrays (fixed capacity) or linked lists (dynamic).',
      examples: ['Array-based stack with top index', 'Linked list with head as top']
    },
    {
      title: 'Applications',
      content: 'Used in function call stack, parentheses matching, depth-first search, and undo history.',
      examples: ['Call stack frames', 'DFS uses stack']
    }
  ],
  complexity: {
    time: {
      push: 'O(1)',
      pop: 'O(1)',
      peek: 'O(1)',
      search: 'O(n)'
    },
    space: 'O(n)'
  },
  operations: [
    {
      name: 'Push',
      description: 'Add element on top of the stack',
      steps: ['Check capacity', 'Increment top', 'Insert element'],
      script: {
        kind: 'linked',
        autoGenerate: true,
        frames: []
      }
    },
    {
      name: 'Pop',
      description: 'Delete top element',
      steps: ['Select stack top node', 'Remove top node', 'Move top pointer'],
      script: {
        kind: 'linked',
        autoGenerate: true,
        frames: []
      }
    },
    {
      name: 'Modify',
      description: 'Modify value at selected stack node',
      steps: ['Select node by index or click', 'Validate node is not marker', 'Write new value'],
      script: {
        kind: 'linked',
        autoGenerate: true,
        frames: []
      }
    }
  ],
  exercises: [
    {
      title: 'Valid Parentheses',
      difficulty: 'Easy',
      description: 'Use a stack to validate brackets in a string.',
      hints: ['Push opening brackets', 'Pop and match closing brackets'],
      solutions: `#include <iostream>
#include <stack>
#include <string>

bool isValid(const std::string& s) {
    std::stack<char> st;
    for (char ch : s) {
        if (ch == '(' || ch == '[' || ch == '{') {
            st.push(ch);
        } else {
            if (st.empty()) return false;
            char top = st.top();
            st.pop();
            if ((ch == ')' && top != '(') ||
                (ch == ']' && top != '[') ||
                (ch == '}' && top != '{')) {
                return false;
            }
        }
    }
    return st.empty();
}

int main() {
    std::cout << std::boolalpha << isValid("{[()]}") << std::endl;
    return 0;
}`
    },
    {
      title: 'Min Stack',
      difficulty: 'Medium',
      description: 'Design a stack that supports retrieving the minimum element in O(1).',
      hints: ['Use an auxiliary stack', 'Track min values']
    }
  ],
  practiceExampleLanguage: 'cpp',
    theoryLinks: [
    {
          title: 'GeeksforGeeks - Stack Data Structure',
          url: 'https://www.geeksforgeeks.org/stack-data-structure/',
          platform: 'GeeksforGeeks'},
    {
          title: 'OI Wiki - Stack',
          url: 'https://oiwiki.org/ds/stack/',
          platform: 'OI Wiki'}
  ],
  practiceLinks: [
    {
          title: 'LeetCode - Stack',
          url: 'https://leetcode.com/tag/stack/',
          platform: 'LeetCode'}
  ],
  visualNodes: ['Top', '7', '5', '3'],
  visualCaption: 'LIFO order',
  visualForm: 'linked',
  visualScript: { kind: 'linked', autoGenerate: true },
  fallbackCodeExamples: {
    javascript: {
      basic: `const stack = [];\nstack.push(1);\nstack.push(2);`,
      operations: `const top = stack[stack.length - 1];\nconst value = stack.pop();`,
      advanced: `function dfs(graph, start) {\n  const st = [start];\n  const visited = new Set();\n  while (st.length) {\n    const node = st.pop();\n    if (visited.has(node)) continue;\n    visited.add(node);\n    for (const next of graph[node]) st.push(next);\n  }\n}`
    },
    typescript: {
      basic: `const stack: number[] = [];\nstack.push(1);\nstack.push(2);`,
      operations: `const top = stack[stack.length - 1];\nconst value = stack.pop();`,
      advanced: `function dfs(graph: Record<string, string[]>, start: string) {\n  const st: string[] = [start];\n  const visited = new Set<string>();\n  while (st.length) {\n    const node = st.pop() as string;\n    if (visited.has(node)) continue;\n    visited.add(node);\n    for (const next of graph[node]) st.push(next);\n  }\n}`
    },
    python: {
      basic: `stack = []\nstack.append(1)\nstack.append(2)`,
      operations: `top = stack[-1]\nvalue = stack.pop()`,
      advanced: `def dfs(graph, start):\n    st = [start]\n    visited = set()\n    while st:\n        node = st.pop()\n        if node in visited:\n            continue\n        visited.add(node)\n        for nxt in graph[node]:\n            st.append(nxt)`
    },
    java: {
      basic: `Stack<Integer> stack = new Stack<>();\nstack.push(1);\nstack.push(2);`,
      operations: `int top = stack.peek();\nint value = stack.pop();`,
      advanced: `void dfs(Map<Integer, List<Integer>> graph, int start) {\n    Deque<Integer> st = new ArrayDeque<>();\n    Set<Integer> visited = new HashSet<>();\n    st.push(start);\n    while (!st.isEmpty()) {\n        int node = st.pop();\n        if (!visited.add(node)) continue;\n        for (int nxt : graph.get(node)) st.push(nxt);\n    }\n}`
    },
    cpp: {
      basic: `#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> st;\n    st.push_back(1);\n    st.push_back(2);\n    st.push_back(3);\n    std::cout << "top = " << st.back() << std::endl;\n    st.pop_back();\n    std::cout << "size after pop = " << st.size() << std::endl;\n    return 0;\n}`,
      operations: `#include <iostream>\n#include <vector>\n#include <stdexcept>\n\nclass Stack {\nprivate:\n    std::vector<int> data;\npublic:\n    void push(int value) { data.push_back(value); }\n    int pop() {\n        if (data.empty()) throw std::runtime_error("stack is empty");\n        int value = data.back();\n        data.pop_back();\n        return value;\n    }\n    int peek() const {\n        if (data.empty()) throw std::runtime_error("stack is empty");\n        return data.back();\n    }\n};`,
      advanced: `#include <iostream>\n#include <vector>\n\nvoid dfs(const std::vector<std::vector<int>>& graph, int start) {\n    std::vector<int> st = {start};\n    std::vector<int> visited(graph.size(), 0);\n    while (!st.empty()) {\n        int node = st.back();\n        st.pop_back();\n        if (visited[node]) continue;\n        visited[node] = 1;\n        std::cout << node << " ";\n        for (int i = static_cast<int>(graph[node].size()) - 1; i >= 0; --i) {\n            int next = graph[node][i];\n            if (!visited[next]) st.push_back(next);\n        }\n    }\n}`
    },
    c: {
      basic: `#include <stdio.h>\n\n#define CAPACITY 100\n\nint main(void) {\n    int stack[CAPACITY];\n    int top = -1;\n    stack[++top] = 1;\n    stack[++top] = 2;\n    stack[++top] = 3;\n    printf("top = %d\\n", stack[top]);\n    top--;\n    printf("size after pop = %d\\n", top + 1);\n    return 0;\n}`,
      operations: `#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct Node {\n    int value;\n    struct Node* next;\n} Node;\n\nvoid push(Node** head, int value) {\n    Node* node = (Node*)malloc(sizeof(Node));\n    node->value = value;\n    node->next = *head;\n    *head = node;\n}\n\nint pop(Node** head) {\n    if (*head == NULL) return -1;\n    Node* temp = *head;\n    int value = temp->value;\n    *head = temp->next;\n    free(temp);\n    return value;\n}`,
      advanced: `#include <stdio.h>\n\n#define N 5\n#define CAPACITY 100\n\nvoid dfs(int graph[N][N], int start) {\n    int stack[CAPACITY];\n    int visited[N] = {0};\n    int top = -1;\n    stack[++top] = start;\n    while (top >= 0) {\n        int node = stack[top--];\n        if (visited[node]) continue;\n        visited[node] = 1;\n        printf("%d ", node);\n        for (int i = N - 1; i >= 0; --i) {\n            if (graph[node][i] && !visited[i]) stack[++top] = i;\n        }\n    }\n}`
    }
  }
});

export default StackSection;
