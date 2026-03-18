import { createTopicSection } from '../TopicSection/createTopicSection';

const ShortestPathSection = createTopicSection({
  id: '5.3',
  name: 'Shortest Path Algorithms',
  chapterNumber: '5.3',
  overview: 'Shortest path algorithms compute minimum-distance routes in weighted or unweighted graphs.',
  concepts: [
    { title: 'Dijkstra', content: 'Single-source shortest path for non-negative weights.', examples: ['Priority queue optimization'] },
    { title: 'Bellman-Ford / Floyd', content: 'Bellman-Ford handles negative edges; Floyd solves all-pairs shortest path.', examples: ['Detect negative cycle'] }
  ],
  complexity: { time: { dijkstra: 'O((V+E)logV)', bellmanFord: 'O(VE)', floyd: 'O(V^3)' }, space: 'O(V^2) max for Floyd' },
  operations: [
    { name: 'Relax Edge', description: 'Update tentative distance', steps: ['dist[u] + w < dist[v]', 'update dist[v]'] },
    { name: 'Dijkstra Loop', description: 'Process nearest unvisited vertex', steps: ['Pop min distance', 'Relax outgoing edges'] }
  ],
  exercises: [{
    title: 'Network Delay Time',
    difficulty: 'Medium',
    description: 'Compute max shortest path from source.',
    hints: ['Use Dijkstra'],
    solutions: `#include <limits>
#include <queue>
#include <utility>
#include <vector>

int networkDelay(const std::vector<std::vector<std::pair<int,int>>>& g, int s) {
  const int INF = std::numeric_limits<int>::max();
  std::vector<int> dist(g.size(), INF);
  using State = std::pair<int,int>;
  std::priority_queue<State, std::vector<State>, std::greater<State>> pq;
  dist[s] = 0;
  pq.push({0, s});

  while (!pq.empty()) {
    auto [d, u] = pq.top();
    pq.pop();
    if (d > dist[u]) continue;
    for (auto [v, w] : g[u]) {
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        pq.push({dist[v], v});
      }
    }
  }

  int ans = 0;
  for (int d : dist) {
    if (d == INF) return -1;
    if (d > ans) ans = d;
  }
  return ans;
}`
  },
    {
      title: 'Concept Check: Shortest Path Algorithms',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Shortest Path Algorithms and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `// Unweighted shortest path baseline: BFS.`,
      operations: `// Weighted non-negative shortest path: Dijkstra with min-heap.`,
      advanced: `// Advanced: negative edges -> Bellman-Ford; all-pairs -> Floyd-Warshall.`
    },
    c: {
      basic: `/* Unweighted shortest path => BFS. */`,
      operations: `/* Weighted non-negative => Dijkstra. */`,
      advanced: `/* Advanced: Bellman-Ford/Floyd by constraints. */`
    }
  },
    theoryLinks: [
    { title: 'Dijkstra Algorithm', url: 'https://cp-algorithms.com/graph/dijkstra.html', platform: 'CP-Algorithms'}
  ],
  practiceLinks: [
    { title: 'Dijkstra Algorithm', url: 'https://cp-algorithms.com/graph/dijkstra.html', platform: 'CP-Algorithms'}
  ],
  visualNodes: ['S', 'A', 'B', 'C', 'T'],
  visualCaption: 'Weighted shortest-path example',
  visualForm: 'graph',
  visualScript: { kind: 'graph', autoGenerate: true },
});

export default ShortestPathSection;
