import { createTopicSection } from '../TopicSection/createTopicSection';

const DijkstraAlgorithmSection = createTopicSection({
  id: '5.3.2',
  name: 'Dijkstra Algorithm',
  chapterNumber: '5.3.2',
  overview: 'Dijkstra computes single-source shortest paths on graphs with non-negative edge weights using greedy relaxation.',
  concepts: [
    { title: 'Greedy Relaxation', content: 'Always finalize the unvisited node with minimum tentative distance.', examples: ['Priority queue optimization'] },
    { title: 'Non-negative Requirement', content: 'Correctness relies on non-negative edges.', examples: ['Negative edge breaks guarantee'] }
  ],
  complexity: { time: { heap: 'O((V+E) log V)', array: 'O(V^2)' }, space: 'O(V+E)' },
  operations: [{
    name: 'Run Dijkstra',
    description: 'Single-source shortest path on non-negative directed weighted graph.',
    steps: ['Input start index', 'Select minimum tentative node', 'Relax outgoing edges']
  }],
  exercises: [{
      title: 'Dijkstra Trace',
      difficulty: 'Medium',
      description: 'Trace distance updates for a weighted graph.',
      hints: ['Record predecessor table'],
      solutions: `#include <limits>
  #include <queue>
  #include <utility>
  #include <vector>

  std::vector<int> dijkstra(const std::vector<std::vector<std::pair<int,int>>>& g, int s) {
    const int INF = std::numeric_limits<int>::max();
    std::vector<int> dist(g.size(), INF);
    using State = std::pair<int,int>;
    std::priority_queue<State, std::vector<State>, std::greater<State>> pq;
    dist[s] = 0;
    pq.push({0, s});
    while (!pq.empty()) {
      auto [d, u] = pq.top(); pq.pop();
      if (d > dist[u]) continue;
      for (auto [v, w] : g[u]) {
        if (dist[u] + w < dist[v]) {
          dist[v] = dist[u] + w;
          pq.push({dist[v], v});
        }
      }
    }
    return dist;
  }`
    },
    {
      title: 'Concept Check: Dijkstra Algorithm',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Dijkstra Algorithm and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
    practiceExampleLanguage: 'cpp',
    fallbackCodeExamples: {
      cpp: {
        basic: `// Dijkstra requires non-negative edge weights.`,
        operations: `// Core operation: relax edge (u,v,w) if dist[u] + w < dist[v].`,
        advanced: `// Advanced: reconstruct shortest path with predecessor array.`
      },
      c: {
        basic: `/* Dijkstra on non-negative weighted graph. */`,
        operations: `/* Repeatedly select node with minimum tentative distance. */`,
        advanced: `/* Advanced: maintain predecessor[] for path reconstruction. */`
      }
    },
    theoryLinks: [
    { title: 'Dijkstra', url: 'https://cp-algorithms.com/graph/dijkstra.html', platform: 'CP-Algorithms'},
    { title: 'Dijkstra algorithm', url: 'https://oiwiki.org/graph/shortest-path/#dijkstra-%E7%AE%97%E6%B3%95', platform: 'OI Wiki'}
  ],
  practiceLinks: [
    { title: 'Dijkstra Practice', url: 'https://leetcode.com/tag/dijkstra/', platform: 'LeetCode'},
    { title: 'Dijkstra algorithm', url: 'https://oiwiki.org/graph/shortest-path/#dijkstra-%E7%AE%97%E6%B3%95', platform: 'OI Wiki'}
  ],
  visualNodes: ['0', '1', '2', '3', '4', '5'],
  visualCaption: 'Dijkstra shortest-path process on directed weighted graph',
  visualForm: 'graph',
  visualScript: { kind: 'graph', autoGenerate: true },
});

export default DijkstraAlgorithmSection;
