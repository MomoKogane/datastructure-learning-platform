import { createTopicSection } from '../TopicSection/createTopicSection';

const GraphTraversalOverviewSection = createTopicSection({
  id: '5.2.1',
  name: 'Graph Traversal and Applications',
  chapterNumber: '5.2.1',
  overview: 'Traversal explores graph vertices/edges systematically. This overview compares DFS/BFS and introduces practical use cases with extension-ready modules.',
  concepts: [
    { title: 'Traversal Goal', content: 'Visit all reachable nodes while tracking visit states.', examples: ['Connectivity', 'Reachability'] },
    { title: 'Typical Applications', content: 'Path finding, component counting, scheduling, and state-space search.', examples: ['Dependency graph analysis'] }
  ],
  complexity: { time: { dfs: 'O(V+E)', bfs: 'O(V+E)' }, space: 'O(V)' },
  operations: [
    {
      name: 'Run DFS',
      description: 'Depth-first traversal from the selected start index.',
      steps: ['Input start index', 'Visit node and push deeper', 'Backtrack until completion']
    },
    {
      name: 'Run BFS',
      description: 'Breadth-first traversal from the selected start index.',
      steps: ['Input start index', 'Dequeue current vertex', 'Enqueue unvisited outgoing neighbors']
    }
  ],
  exercises: [{
    title: 'Traversal Method Choice',
    difficulty: 'Easy',
    description: 'Choose DFS/BFS for given scenarios.',
    hints: ['Depth preference vs shortest edge-count path'],
    solutions: `#include <string>

std::string chooseTraversal(bool needShortestEdges, bool deepExploration) {
  if (needShortestEdges) return "BFS";
  if (deepExploration) return "DFS";
  return "BFS";
}`
  },
    {
      title: 'Concept Check: Graph Traversal and Applications',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Graph Traversal and Applications and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `#include <vector>

std::vector<std::vector<int>> g = {{1,2}, {0,3}, {0}, {1}};`,
      operations: `#include <queue>
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
      advanced: `// Advanced: choose DFS/BFS by objective and constraints.`
    },
    c: {
      basic: `/* Graph can be represented by adjacency list or matrix. */`,
      operations: `/* BFS gives shortest edge-count path in unweighted graphs. */`,
      advanced: `/* Advanced: traversal strategy depends on task objective. */`
    }
  },
    theoryLinks: [
    { title: 'Graph Traversal Basics', url: 'https://cp-algorithms.com/graph/breadth-first-search.html', platform: 'CP-Algorithms'}
  ],
  practiceLinks: [
    { title: 'Graph', url: 'https://leetcode.cn/problem-list/graph/', platform: 'LeetCode'}
  ],
  visualNodes: ['0', '1', '2', '3', '4', '5'],
  visualCaption: 'Traversal overview on a strongly connected directed weighted graph',
  visualForm: 'graph',
  visualScript: { kind: 'graph', autoGenerate: true },
});

export default GraphTraversalOverviewSection;
