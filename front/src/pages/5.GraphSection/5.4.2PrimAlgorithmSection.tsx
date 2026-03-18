import { createTopicSection } from '../TopicSection/createTopicSection';

const PrimAlgorithmSection = createTopicSection({
  id: '5.4.2',
  name: 'Prim Algorithm',
  chapterNumber: '5.4.2',
  overview: 'Prim grows MST from an initial vertex by repeatedly adding the minimum-weight edge crossing the current cut.',
  concepts: [
    { title: 'Cut Expansion', content: 'Maintain selected and unselected sets, always choose minimum crossing edge.', examples: ['Priority queue frontier'] },
    { title: 'Graph Density Preference', content: 'Prim with adjacency matrix is practical for dense graphs; heap for sparse graphs.', examples: ['O(V^2) vs O(E log V)'] }
  ],
  complexity: { time: { matrix: 'O(V^2)', heap: 'O(E log V)' }, space: 'O(V+E)' },
  operations: [{
    name: 'Run Prim',
    description: 'Construct minimum spanning tree by growing from a start vertex.',
    steps: ['Input start index', 'Select minimum crossing edge', 'Expand visited vertex set']
  }],
  exercises: [{
      title: 'Prim Frontier Trace',
      difficulty: 'Medium',
      description: 'Track candidate edges and chosen edge sequence.',
      hints: ['Record selected set each round'],
      solutions: `#include <queue>
  #include <utility>
  #include <vector>

  int primMst(const std::vector<std::vector<std::pair<int,int>>>& g) {
    int n = static_cast<int>(g.size());
    std::vector<bool> vis(n, false);
    using Edge = std::pair<int,int>;
    std::priority_queue<Edge, std::vector<Edge>, std::greater<Edge>> pq;
    pq.push({0, 0});
    int total = 0, used = 0;
    while (!pq.empty() && used < n) {
      auto [w, u] = pq.top(); pq.pop();
      if (vis[u]) continue;
      vis[u] = true;
      total += w;
      ++used;
      for (auto [v, cost] : g[u]) {
        if (!vis[v]) pq.push({cost, v});
      }
    }
    return used == n ? total : -1;
  }`
    },
    {
      title: 'Concept Check: Prim Algorithm',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Prim Algorithm and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
    practiceExampleLanguage: 'cpp',
    fallbackCodeExamples: {
      cpp: {
        basic: `// Prim starts from one node and grows MST edge by edge.`,
        operations: `// Keep minimum crossing edge in priority queue.`,
        advanced: `// Advanced: compare heap-based Prim and matrix-based Prim by graph density.`
      },
      c: {
        basic: `/* Prim incrementally grows the MST from a start vertex. */`,
        operations: `/* Always choose minimum-weight edge crossing current cut. */`,
        advanced: `/* Advanced: choose O(V^2) matrix or heap optimization based on density. */`
      }
    },
    theoryLinks: [
    { title: 'Prim Algorithm', url: 'https://cp-algorithms.com/graph/mst_prim.html', platform: 'CP-Algorithms'},
    { title: 'Prim Algorithm', url: 'https://oiwiki.org/graph/mst/#prim-%E7%AE%97%E6%B3%95', platform: 'OI Wiki'}
  ],
  practiceLinks: [
    { title: 'Prim Algorithm', url: 'https://oiwiki.org/graph/mst/#prim-%E7%AE%97%E6%B3%95', platform: 'OI Wiki'},
    { title: 'Prim Practice', url: 'https://www.luogu.com.cn/problem/P2504', platform: 'Luogu'}
  ],
  visualNodes: ['0', '1', '2', '3', '4', '5'],
  visualCaption: 'Prim MST growth on weighted graph',
  visualForm: 'graph',
  visualScript: { kind: 'graph', autoGenerate: true },
});

export default PrimAlgorithmSection;
