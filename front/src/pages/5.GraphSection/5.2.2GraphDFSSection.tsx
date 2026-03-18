import { createTopicSection } from '../TopicSection/createTopicSection';

const GraphDFSSection = createTopicSection({
  id: '5.2.2',
  name: 'Graph Traversal and DFS Algorithm',
  chapterNumber: '5.2.2',
  overview: 'Depth-First Search explores as deep as possible before backtracking, implemented recursively or with an explicit stack.',
  concepts: [
    { title: 'Recursive DFS', content: 'Use call stack to explore neighbors deeply.', examples: ['Backtracking pattern'] },
    { title: 'Iterative DFS', content: 'Use explicit stack for controlled traversal.', examples: ['Non-recursive implementation'] }
  ],
  complexity: { time: { dfs: 'O(V+E)' }, space: 'O(V)' },
  operations: [{
    name: 'Run DFS',
    description: 'Depth-first traversal from the selected start index.',
    steps: ['Input start index', 'Visit node and push deeper', 'Backtrack until completion']
  }],
  exercises: [{
    title: 'Component Counting via DFS',
    difficulty: 'Medium',
    description: 'Count connected components in undirected graph.',
    hints: ['Run DFS from each unvisited node'],
    solutions: `#include <vector>

void dfs(int u, const std::vector<std::vector<int>>& g, std::vector<int>& vis) {
  vis[u] = 1;
  for (int v : g[u]) if (!vis[v]) dfs(v, g, vis);
}

int countComponents(const std::vector<std::vector<int>>& g) {
  std::vector<int> vis(g.size(), 0);
  int ans = 0;
  for (int i = 0; i < static_cast<int>(g.size()); ++i) {
    if (!vis[i]) {
      ++ans;
      dfs(i, g, vis);
    }
  }
  return ans;
}`
  },
    {
      title: 'Concept Check: Graph Traversal and DFS Algorithm',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Graph Traversal and DFS Algorithm and analyze the time complexity of its key operations.',
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
      operations: `#include <functional>
#include <vector>

std::vector<int> dfsOrder(const std::vector<std::vector<int>>& g, int s) {
  std::vector<int> vis(g.size(), 0), order;
  std::function<void(int)> go = [&](int u) {
    vis[u] = 1;
    order.push_back(u);
    for (int v : g[u]) if (!vis[v]) go(v);
  };
  go(s);
  return order;
}`,
      advanced: `// Advanced: classify DFS edges in directed graph.`
    },
    c: {
      basic: `/* Recursive DFS template. */\nvoid dfs(int u) { visited[u] = 1; for each v in adj[u] if (!visited[v]) dfs(v); }`,
      operations: `/* Count components by launching DFS from each unvisited node. */`,
      advanced: `/* Advanced: iterative DFS with explicit stack. */`
    }
  },
    theoryLinks: [
    {
           title: 'Depth First Search', 
           url: 'https://cp-algorithms.com/graph/depth-first-search.html', 
           platform: 'CP-Algorithms'}
  ],
  practiceLinks: [
    {
          title: 'DFS Practice Problems', 
          url: 'https://leetcode.cn/problem-list/OsJON0sR/', 
          platform: 'LeetCode'}
  ],
  visualNodes: ['0', '1', '2', '3', '4', '5'],
  visualCaption: 'DFS traversal on a directed weighted graph',
  visualForm: 'graph',
  visualScript: { kind: 'graph', autoGenerate: true },
});

export default GraphDFSSection;
