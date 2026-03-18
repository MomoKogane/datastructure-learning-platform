import { createTopicSection } from '../TopicSection/createTopicSection';

const GraphBFSSection = createTopicSection({
  id: '5.2.3',
  name: 'Graph Traversal and BFS Algorithm',
  chapterNumber: '5.2.3',
  overview: 'Breadth-First Search explores layer by layer using a queue, and naturally gives shortest edge-count distance in unweighted graphs.',
  concepts: [
    { title: 'Layered Expansion', content: 'Nodes are expanded in increasing distance from source.', examples: ['Distance array'] },
    { title: 'Queue Discipline', content: 'FIFO queue ensures correct traversal order.', examples: ['Push neighbors once'] }
  ],
  complexity: { time: { bfs: 'O(V+E)' }, space: 'O(V)' },
  operations: [{
    name: 'Run BFS',
    description: 'Breadth-first traversal from the selected start index.',
    steps: ['Input start index', 'Dequeue current vertex', 'Enqueue unvisited outgoing neighbors']
  }],
  exercises: [{
    title: 'Shortest Path in Unweighted Graph',
    difficulty: 'Medium',
    description: 'Compute shortest edge distance from source.',
    hints: ['Maintain predecessor and distance'],
    solutions: `#include <queue>
#include <vector>

std::vector<int> shortestDistance(const std::vector<std::vector<int>>& g, int s) {
  std::vector<int> dist(g.size(), -1);
  std::queue<int> q;
  dist[s] = 0;
  q.push(s);
  while (!q.empty()) {
    int u = q.front(); q.pop();
    for (int v : g[u]) {
      if (dist[v] == -1) {
        dist[v] = dist[u] + 1;
        q.push(v);
      }
    }
  }
  return dist;
}`
  },
    {
      title: 'Concept Check: Graph Traversal and BFS Algorithm',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Graph Traversal and BFS Algorithm and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `#include <queue>
#include <vector>

std::vector<int> bfsDistance(const std::vector<std::vector<int>>& g, int s) {
  std::vector<int> d(g.size(), -1);
  std::queue<int> q;
  d[s] = 0; q.push(s);
  while (!q.empty()) {
    int u = q.front(); q.pop();
    for (int v : g[u]) if (d[v] == -1) { d[v] = d[u] + 1; q.push(v); }
  }
  return d;
}`,
      operations: `#include <queue>
#include <vector>

std::vector<int> bfsParent(const std::vector<std::vector<int>>& g, int s) {
  std::vector<int> p(g.size(), -1), vis(g.size(), 0);
  std::queue<int> q;
  q.push(s); vis[s] = 1;
  while (!q.empty()) {
    int u = q.front(); q.pop();
    for (int v : g[u]) if (!vis[v]) { vis[v] = 1; p[v] = u; q.push(v); }
  }
  return p;
}`,
      advanced: `// Advanced: reconstruct shortest path by backtracking parent array.`
    },
    c: {
      basic: `/* BFS with queue for unweighted shortest path. */`,
      operations: `/* Maintain dist[] and parent[] during traversal. */`,
      advanced: `/* Advanced: recover actual path from parent[] table. */`
    }
  },
    theoryLinks: [
    { 
          title: 'Breadth First Search', 
          url: 'https://cp-algorithms.com/graph/breadth-first-search.html',
          platform: 'CP-Algorithms'}
  ],
  practiceLinks: [
    {
          title: 'BFS Practice Problems', 
          url: 'https://leetcode.cn/problem-list/CB5gCbqz/', 
          platform: 'LeetCode'}
  ],
  visualNodes: ['0', '1', '2', '3', '4', '5'],
  visualCaption: 'BFS traversal on a directed weighted graph',
  visualForm: 'graph',
  visualScript: { kind: 'graph', autoGenerate: true },
});

export default GraphBFSSection;
