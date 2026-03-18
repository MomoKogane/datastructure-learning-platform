import { createTopicSection } from '../TopicSection/createTopicSection';

const BellmanFordAlgorithmSection = createTopicSection({
  id: '5.3.3',
  name: 'Bellman-Ford Algorithm',
  chapterNumber: '5.3.3',
  overview: 'Bellman-Ford handles shortest paths with negative edges and can detect negative cycles by repeated edge relaxation.',
  concepts: [
    { title: 'Repeated Relaxation', content: 'Relax all edges V-1 times to propagate shortest distances.', examples: ['Edge-list implementation'] },
    { title: 'Negative Cycle Check', content: 'An extra pass that still relaxes indicates negative cycle existence.', examples: ['Cycle reachable from source'] }
  ],
  complexity: { time: { total: 'O(VE)' }, space: 'O(V)' },
  operations: [{
    name: 'Run Bellman-Ford',
    description: 'Single-source shortest path with full edge relaxation rounds.',
    steps: ['Input start index', 'Relax all edges for V-1 rounds', 'Observe distance array evolution']
  }],
  exercises: [{
    title: 'Negative Cycle Detection',
    difficulty: 'Medium',
    description: 'Determine whether graph has reachable negative cycle.',
    hints: ['Run one more pass after V-1 rounds'],
    solutions: `#include <limits>
#include <tuple>
#include <vector>

bool hasNegativeCycle(int n, int s, const std::vector<std::tuple<int,int,int>>& edges) {
  const int INF = std::numeric_limits<int>::max() / 4;
  std::vector<int> dist(n, INF);
  dist[s] = 0;
  for (int i = 0; i < n - 1; ++i) {
    bool changed = false;
    for (auto [u, v, w] : edges) {
      if (dist[u] < INF && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        changed = true;
      }
    }
    if (!changed) break;
  }
  for (auto [u, v, w] : edges) {
    if (dist[u] < INF && dist[u] + w < dist[v]) return true;
  }
  return false;
}`
  },
    {
      title: 'Concept Check: Bellman-Ford Algorithm',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Bellman-Ford Algorithm and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `// Bellman-Ford supports graphs with negative edges.`,
      operations: `// Do V-1 relax rounds, then one extra round for negative cycle check.`,
      advanced: `// Advanced: recover shortest path tree with predecessor array.`
    },
    c: {
      basic: `/* Bellman-Ford handles negative edge weights. */`,
      operations: `/* Repeatedly relax all edges for V-1 iterations. */`,
      advanced: `/* Advanced: detect negative cycle via an additional pass. */`
    }
  },
    theoryLinks: [
    { title: 'Bellman Ford', url: 'https://cp-algorithms.com/graph/bellman_ford.html', platform: 'CP-Algorithms'},
    { title: 'Bellman Ford', url: 'https://oiwiki.org/graph/shortest-path/#bellmanford-%E7%AE%97%E6%B3%95', platform: 'OI Wiki'}
  ],
  practiceLinks: [
    { title: 'Bellman Ford', url: 'https://oiwiki.org/graph/shortest-path/#bellmanford-%E7%AE%97%E6%B3%95', platform: 'OI Wiki'}
  ],
  visualNodes: ['0', '1', '2', '3', '4', '5'],
  visualCaption: 'Bellman-Ford relaxation rounds on directed weighted graph',
  visualForm: 'graph',
  visualScript: { kind: 'graph', autoGenerate: true },
});

export default BellmanFordAlgorithmSection;
