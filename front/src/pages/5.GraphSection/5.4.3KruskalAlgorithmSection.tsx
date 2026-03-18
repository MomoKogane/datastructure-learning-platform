import { createTopicSection } from '../TopicSection/createTopicSection';

const KruskalAlgorithmSection = createTopicSection({
  id: '5.4.3',
  name: 'Kruskal Algorithm',
  chapterNumber: '5.4.3',
  overview: 'Kruskal builds MST by sorting edges by weight and adding them when they do not form cycles, typically using Union-Find.',
  concepts: [
    { title: 'Edge Sorting', content: 'Process edges from smallest to largest weight.', examples: ['Global greedy order'] },
    { title: 'Union-Find', content: 'Detect cycles efficiently with disjoint set union.', examples: ['Find root', 'Union sets'] }
  ],
  complexity: { time: { total: 'O(E log E)' }, space: 'O(V)' },
  operations: [{
    name: 'Run Kruskal',
    description: 'Construct minimum spanning tree by sorted edges with cycle checks.',
    steps: ['Sort edges by weight', 'Use union-find to reject cycles', 'Accept until V-1 edges']
  }],
  exercises: [{
    title: 'Kruskal with DSU',
    difficulty: 'Medium',
    description: 'Implement Kruskal and print MST edges.',
    hints: ['Path compression', 'Union by rank'],
    solutions: `#include <algorithm>
#include <numeric>
#include <tuple>
#include <vector>

struct DSU {
  std::vector<int> p, r;
  explicit DSU(int n) : p(n), r(n, 0) { std::iota(p.begin(), p.end(), 0); }
  int find(int x) { return p[x] == x ? x : p[x] = find(p[x]); }
  bool unite(int a, int b) {
    a = find(a); b = find(b);
    if (a == b) return false;
    if (r[a] < r[b]) std::swap(a, b);
    p[b] = a;
    if (r[a] == r[b]) ++r[a];
    return true;
  }
};

int kruskal(int n, std::vector<std::tuple<int,int,int>> edges) {
  std::sort(edges.begin(), edges.end(), [](auto& a, auto& b) {
    return std::get<2>(a) < std::get<2>(b);
  });
  DSU dsu(n);
  int total = 0;
  for (auto [u, v, w] : edges) {
    if (dsu.unite(u, v)) total += w;
  }
  return total;
}`
  },
    {
      title: 'Concept Check: Kruskal Algorithm',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Kruskal Algorithm and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `// Kruskal sorts edges globally by weight and greedily selects safe edges.`,
      operations: `// Use DSU to skip edges that connect already connected components.`,
      advanced: `// Advanced: optimize DSU with path compression + union by rank.`
    },
    c: {
      basic: `/* Kruskal processes edges in ascending weight order. */`,
      operations: `/* Add edge only when endpoints are in different components. */`,
      advanced: `/* Advanced: implement efficient union-find heuristics. */`
    }
  },
    theoryLinks: [
    {
          title: 'Kruskal Algorithm', 
          url: 'https://cp-algorithms.com/graph/mst_kruskal_with_dsu.html',
          platform: 'CP-Algorithms'},
    {
          title: 'Kruskal Algorithm',
          url: 'https://oiwiki.org/graph/mst/#kruskal-%E7%AE%97%E6%B3%95',
          platform: 'OI Wiki'}
  ],
  practiceLinks: [
    {
          title: 'Kruskal Algorithm',
          url: 'https://oiwiki.org/graph/mst/#kruskal-%E7%AE%97%E6%B3%95',
          platform: 'OI Wiki'},
    {
          title: 'Kruskal Algorithm',
          url: 'https://loj.ac/p/2149',
          platform: 'LOJ'}
  ],
  visualNodes: ['0', '1', '2', '3', '4', '5'],
  visualCaption: 'Kruskal MST edge acceptance on weighted graph',
  visualForm: 'graph',
  visualScript: { kind: 'graph', autoGenerate: true },
});

export default KruskalAlgorithmSection;
