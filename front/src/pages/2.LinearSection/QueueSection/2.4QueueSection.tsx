import { createTopicSection } from '../../TopicSection/createTopicSection';

const QueueSection = createTopicSection({
  id: '2.4',
  name: 'Queue',
  chapterNumber: '2.4',
  overview:
    'A queue is a linear data structure that follows FIFO (First In, First Out). Elements are inserted at the rear and removed from the front. Queues are used in scheduling, buffering, and BFS traversal.',
  concepts: [
    {
      title: 'Core Operations',
      content: 'Enqueue adds an element at the rear, dequeue removes the front, and peek reads the front element.',
      examples: ['enqueue(8)', 'dequeue()', 'peek()']
    },
    {
      title: 'Variants',
      content: 'Circular queues reuse space efficiently. Deques support insertion/removal at both ends.',
      examples: ['Circular queue with head/tail', 'Deque for sliding window']
    },
    {
      title: 'Applications',
      content: 'Queues support BFS, task scheduling, print spooling, and streaming buffers.',
      examples: ['BFS uses queue', 'Producer-consumer buffer']
    }
  ],
  complexity: {
    time: {
      enqueue: 'O(1)',
      dequeue: 'O(1)',
      peek: 'O(1)',
      search: 'O(n)'
    },
    space: 'O(n)'
  },
  operations: [
    {
      name: 'Enqueue',
      description: 'Add element at rear',
      steps: ['Check capacity', 'Write at tail', 'Advance tail'],
      script: {
        kind: 'linked',
        autoGenerate: true,
        frames: []
      }
    },
    {
      name: 'Dequeue',
      description: 'Delete element from front',
      steps: ['Select queue front node', 'Remove front node', 'Move front pointer'],
      script: {
        kind: 'linked',
        autoGenerate: true,
        frames: []
      }
    },
    {
      name: 'Modify',
      description: 'Modify value at selected queue node',
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
      title: 'Implement Circular Queue',
      difficulty: 'Medium',
      description: 'Design a fixed-size circular queue.',
      hints: ['Use head and tail indices', 'Use modulo for wraparound'],
      solutions: `#include <iostream>

class CircularQueue {
private:
    int data[5];
    int head = 0;
    int tail = 0;
    int size = 0;

public:
    bool enqueue(int value) {
        if (size == 5) return false;
        data[tail] = value;
        tail = (tail + 1) % 5;
        ++size;
        return true;
    }

    bool dequeue(int& value) {
        if (size == 0) return false;
        value = data[head];
        head = (head + 1) % 5;
        --size;
        return true;
    }
};

int main() {
    CircularQueue q;
    q.enqueue(10);
    q.enqueue(20);
    int x = 0;
    q.dequeue(x);
    std::cout << x << std::endl;
    return 0;
}`
    },
    {
      title: 'Sliding Window Maximum',
      difficulty: 'Hard',
      description: 'Use a deque to compute max in each sliding window.',
      hints: ['Maintain decreasing order', 'Remove expired indices']
    }
  ],
  practiceExampleLanguage: 'cpp',
    theoryLinks: [
    {
          title: 'GeeksforGeeks - Queue Data Structure',
          url: 'https://www.geeksforgeeks.org/queue-data-structure/',
          platform: 'GeeksforGeeks'},
    {
          title: 'OI Wiki - Deque Data Structure',
          url: 'https://oiwiki.org/ds/deque/',
          platform: 'OI Wiki'}
  ],
  practiceLinks: [
    {
          title: 'LeetCode - Queue',
          url: 'https://leetcode.com/tag/queue/',
          platform: 'LeetCode'}
  ],
  visualNodes: ['Front', '3', '6', '9', 'Rear'],
  visualCaption: 'FIFO order',
  visualForm: 'linked',
  visualScript: { kind: 'linked', autoGenerate: true },
  fallbackCodeExamples: {
    javascript: {
      basic: `const queue = [];\nqueue.push(1);\nqueue.push(2);`,
      operations: `const front = queue[0];\nconst value = queue.shift();`,
      advanced: `function bfs(graph, start) {\n  const q = [start];\n  const visited = new Set([start]);\n  while (q.length) {\n    const node = q.shift();\n    for (const next of graph[node]) {\n      if (!visited.has(next)) {\n        visited.add(next);\n        q.push(next);\n      }\n    }\n  }\n}`
    },
    typescript: {
      basic: `const queue: number[] = [];\nqueue.push(1);\nqueue.push(2);`,
      operations: `const front = queue[0];\nconst value = queue.shift();`,
      advanced: `function bfs(graph: Record<string, string[]>, start: string) {\n  const q: string[] = [start];\n  const visited = new Set<string>([start]);\n  while (q.length) {\n    const node = q.shift() as string;\n    for (const next of graph[node]) {\n      if (!visited.has(next)) {\n        visited.add(next);\n        q.push(next);\n      }\n    }\n  }\n}`
    },
    python: {
      basic: `from collections import deque\nq = deque()\nq.append(1)\nq.append(2)`,
      operations: `front = q[0]\nvalue = q.popleft()`,
      advanced: `from collections import deque\ndef bfs(graph, start):\n    q = deque([start])\n    visited = {start}\n    while q:\n        node = q.popleft()\n        for nxt in graph[node]:\n            if nxt not in visited:\n                visited.add(nxt)\n                q.append(nxt)`
    },
    java: {
      basic: `Queue<Integer> q = new ArrayDeque<>();\nq.offer(1);\nq.offer(2);`,
      operations: `int front = q.peek();\nint value = q.poll();`,
      advanced: `void bfs(Map<Integer, List<Integer>> graph, int start) {\n    Queue<Integer> q = new ArrayDeque<>();\n    Set<Integer> visited = new HashSet<>();\n    q.offer(start);\n    visited.add(start);\n    while (!q.isEmpty()) {\n        int node = q.poll();\n        for (int nxt : graph.get(node)) {\n            if (visited.add(nxt)) q.offer(nxt);\n        }\n    }\n}`
    },
    cpp: {
      basic: `#include <iostream>\n#include <queue>\n\nint main() {\n    std::queue<int> q;\n    q.push(1);\n    q.push(2);\n    q.push(3);\n    std::cout << "front = " << q.front() << std::endl;\n    q.pop();\n    std::cout << "front after pop = " << q.front() << std::endl;\n    return 0;\n}`,
      operations: `#include <iostream>\n\nclass CircularQueue {\nprivate:\n    int data[8];\n    int head = 0;\n    int tail = 0;\n    int size = 0;\npublic:\n    bool enqueue(int value) {\n        if (size == 8) return false;\n        data[tail] = value;\n        tail = (tail + 1) % 8;\n        ++size;\n        return true;\n    }\n    bool dequeue(int& value) {\n        if (size == 0) return false;\n        value = data[head];\n        head = (head + 1) % 8;\n        --size;\n        return true;\n    }\n};`,
      advanced: `#include <iostream>\n#include <queue>\n#include <vector>\n\nvoid bfs(const std::vector<std::vector<int>>& graph, int start) {\n    std::queue<int> q;\n    std::vector<int> visited(graph.size(), 0);\n    q.push(start);\n    visited[start] = 1;\n    while (!q.empty()) {\n        int node = q.front();\n        q.pop();\n        std::cout << node << " ";\n        for (int next : graph[node]) {\n            if (!visited[next]) {\n                visited[next] = 1;\n                q.push(next);\n            }\n        }\n    }\n}`
    },
    c: {
      basic: `#include <stdio.h>\n\n#define CAPACITY 100\n\nint main(void) {\n    int q[CAPACITY];\n    int head = 0, tail = 0;\n    q[tail++] = 1;\n    q[tail++] = 2;\n    q[tail++] = 3;\n    printf("front = %d\\n", q[head]);\n    head++;\n    printf("front after pop = %d\\n", q[head]);\n    return 0;\n}`,
      operations: `#include <stdio.h>\n\ntypedef struct {\n    int data[8];\n    int head;\n    int tail;\n    int size;\n} CircularQueue;\n\nint enqueue(CircularQueue* q, int value) {\n    if (q->size == 8) return 0;\n    q->data[q->tail] = value;\n    q->tail = (q->tail + 1) % 8;\n    q->size++;\n    return 1;\n}\n\nint dequeue(CircularQueue* q, int* out) {\n    if (q->size == 0) return 0;\n    *out = q->data[q->head];\n    q->head = (q->head + 1) % 8;\n    q->size--;\n    return 1;\n}`,
      advanced: `#include <stdio.h>\n\n#define N 5\n#define CAPACITY 100\n\nvoid bfs(int graph[N][N], int start) {\n    int q[CAPACITY];\n    int visited[N] = {0};\n    int head = 0, tail = 0;\n    q[tail++] = start;\n    visited[start] = 1;\n    while (head < tail) {\n        int node = q[head++];\n        printf("%d ", node);\n        for (int i = 0; i < N; ++i) {\n            if (graph[node][i] && !visited[i]) {\n                visited[i] = 1;\n                q[tail++] = i;\n            }\n        }\n    }\n}`
    }
  }
});

export default QueueSection;
