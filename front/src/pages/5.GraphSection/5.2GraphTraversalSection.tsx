import { createTopicSection } from '../TopicSection/createTopicSection';

const GraphTraversalSection = createTopicSection({
  id: '5.2',
  name: 'Graph Traversal',
  chapterNumber: '5.2',
  overview: 'Graph traversal systematically visits vertices. DFS explores depth-first; BFS explores level-by-level.',
  concepts: [
    { title: 'DFS', content: 'Use recursion or stack to go deep first.', examples: ['Connected components', 'Topological preprocessing'] },
    { title: 'BFS', content: 'Use queue to visit by distance layers.', examples: ['Shortest path in unweighted graph'] }
  ],
  complexity: { time: { dfs: 'O(V+E)', bfs: 'O(V+E)' }, space: 'O(V)' },
  operations: [
    { name: 'DFS', description: 'Depth-first traversal', steps: ['Mark visited', 'Visit neighbor recursively'] },
    { name: 'BFS', description: 'Breadth-first traversal', steps: ['Enqueue start', 'Process queue', 'Enqueue unvisited neighbors'] }
  ],
  exercises: [{
    title: 'Number of Components',
    difficulty: 'Medium',
    description: 'Count connected components.',
    hints: ['Run DFS/BFS from unvisited nodes'],
    solutions: `#include <vector>

void dfs(int node, const std::vector<std::vector<int>>& g, std::vector<int>& vis) {
  vis[node] = 1;
  for (int nxt : g[node]) if (!vis[nxt]) dfs(nxt, g, vis);
}

int countComponents(const std::vector<std::vector<int>>& g) {
  std::vector<int> vis(g.size(), 0);
  int components = 0;
  for (int i = 0; i < static_cast<int>(g.size()); ++i) {
    if (!vis[i]) {
      ++components;
      dfs(i, g, vis);
    }
  }
  return components;
}`
  },
    {
      title: 'Concept Check: Graph Traversal',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Graph Traversal and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `#include <vector>

void dfs(int u, const std::vector<std::vector<int>>& g, std::vector<int>& vis) {
  vis[u] = 1;
  for (int v : g[u]) if (!vis[v]) dfs(v, g, vis);
}`,
      operations: `#include <queue>
#include <vector>

std::vector<int> bfsOrder(const std::vector<std::vector<int>>& g, int s) {
  std::vector<int> vis(g.size(), 0), order;
  std::queue<int> q;
  q.push(s);
  vis[s] = 1;
  while (!q.empty()) {
    int u = q.front(); q.pop();
    order.push_back(u);
    for (int v : g[u]) if (!vis[v]) { vis[v] = 1; q.push(v); }
  }
  return order;
}`,
      advanced: `// Advanced: count connected components by launching DFS/BFS from every unvisited node.`
    },
    c: {
      basic: `/* DFS traversal skeleton with adjacency list. */\nvoid dfs(int u) {\n  visited[u] = 1;\n  for each v in adj[u] if (!visited[v]) dfs(v);\n}`,
      operations: `/* BFS traversal skeleton with queue. */\nvoid bfs(int s) {\n  enqueue(s); visited[s] = 1;\n  while (!empty()) {\n    int u = dequeue();\n    for each v in adj[u] if (!visited[v]) { visited[v] = 1; enqueue(v); }\n  }\n}`,
      advanced: `/* Advanced: traverse disconnected graph with repeated launches. */`
    }
  },
    theoryLinks: [
    { title: 'Graph Traversal', url: 'https://cp-algorithms.com/graph/search-for-connected-components.html', platform: 'CP-Algorithms'},
    { title: 'Graph Traversal', url: 'https://www.geeksforgeeks.org/graph-and-its-representations/', platform: 'GeeksForGeeks'}
  ],
  practiceLinks: [
    { title: 'Graph Traversal', url: 'https://leetcode.cn/problem-list/graph/', platform: 'LeetCode'}
  ],
  visualNodes: ['A', 'B', 'C', 'D', 'E'],
  visualCaption: 'Traversal over connected graph',
  visualForm: 'graph',
  visualScript: { kind: 'graph', autoGenerate: true },
});

export default GraphTraversalSection;
