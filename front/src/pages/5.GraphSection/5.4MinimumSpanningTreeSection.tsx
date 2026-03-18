import { createTopicSection } from '../TopicSection/createTopicSection';

const MinimumSpanningTreeSection = createTopicSection({
  id: '5.4',
  name: 'Minimum Spanning Tree',
  chapterNumber: '5.4',
  overview: 'A minimum spanning tree (MST) connects all vertices with minimum total edge weight and no cycles.',
  concepts: [
    { title: 'Prim Algorithm', content: 'Grow tree from one vertex using minimum crossing edge.', examples: ['Priority queue with visited set'] },
    { title: 'Kruskal Algorithm', content: 'Sort edges and add smallest non-cycling edges.', examples: ['Disjoint set union (DSU)'] }
  ],
  complexity: { time: { prim: 'O(E log V)', kruskal: 'O(E log E)' }, space: 'O(V+E)' },
  operations: [
    { name: 'Prim Step', description: 'Add minimum edge from tree to outside', steps: ['Pick min crossing edge', 'Expand tree'] },
    { name: 'Kruskal Step', description: 'Add edge if endpoints in different sets', steps: ['Sort edges', 'Union-find check', 'Merge sets'] }
  ],
  exercises: [{
    title: 'Build MST',
    difficulty: 'Medium',
    description: 'Construct MST and return total cost.',
    hints: ['Kruskal + DSU'],
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

int kruskalMst(int n, std::vector<std::tuple<int,int,int>> edges) {
  std::sort(edges.begin(), edges.end(), [](auto& a, auto& b) {
    return std::get<2>(a) < std::get<2>(b);
  });
  DSU dsu(n);
  int total = 0, used = 0;
  for (auto [u, v, w] : edges) {
    if (dsu.unite(u, v)) {
      total += w;
      if (++used == n - 1) break;
    }
  }
  return used == n - 1 ? total : -1;
}`
  },
    {
      title: 'Concept Check: Minimum Spanning Tree',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Minimum Spanning Tree and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `// MST picks edges with minimal total weight while keeping graph connected and acyclic.`,
      operations: `// Common methods: Prim (grow from a node) and Kruskal (sort edges + DSU).`,
      advanced: `// Advanced: verify MST uniqueness and handle disconnected graphs (minimum spanning forest).`
    },
    c: {
      basic: `/* Minimum Spanning Tree connects all vertices with minimum total weight. */`,
      operations: `/* Build MST using Prim or Kruskal + union-find. */`,
      advanced: `/* Advanced: for disconnected graph compute a minimum spanning forest. */`
    }
  },
    theoryLinks: [
    { title: 'MST Overview', url: 'https://cp-algorithms.com/graph/mst_kruskal.html', platform: 'CP-Algorithms'},
    { title: 'MST', url: 'https://oiwiki.org/graph/mst', platform: 'OI Wiki'}
  ],
  practiceLinks: [
    { title: 'MST', url: 'https://oiwiki.org/graph/mst', platform: 'OI Wiki'}
  ],
  visualNodes: ['1', '2', '3', '4', '5'],
  visualCaption: 'MST over weighted graph',
  visualForm: 'graph',
  visualScript: { kind: 'graph', autoGenerate: true },
});

export default MinimumSpanningTreeSection;
