import { createTopicSection } from '../TopicSection/createTopicSection';

const MSTOverviewSection = createTopicSection({
  id: '5.4.1',
  name: 'Minimum Spanning Tree and Applications',
  chapterNumber: '5.4.1',
  overview: 'Minimum Spanning Tree connects all vertices with minimum total edge weight and no cycles. It is foundational in network design and clustering.',
  concepts: [
    { title: 'MST Properties', content: 'For connected undirected weighted graph, MST contains V-1 edges and spans all vertices.', examples: ['Cut property', 'Cycle property'] },
    { title: 'Use Cases', content: 'Network wiring, road planning, image segmentation, and approximation methods.', examples: ['Infrastructure design'] }
  ],
  complexity: { time: { depends: 'Prim/Kruskal implementation' }, space: 'O(V+E)' },
  operations: [
    {
      name: 'Run Prim',
      description: 'Construct minimum spanning tree by growing from a start vertex.',
      steps: ['Input start index', 'Select minimum crossing edge', 'Expand visited vertex set']
    },
    {
      name: 'Run Kruskal',
      description: 'Construct minimum spanning tree by sorted edges with cycle checks.',
      steps: ['Sort edges by weight', 'Use union-find to reject cycles', 'Accept until V-1 edges']
    }
  ],
  exercises: [{
    title: 'MST Edge Selection',
    difficulty: 'Easy',
    description: 'Find MST and compute total weight for sample graph.',
    hints: ['Avoid cycles', 'Use greedy choice'],
    solutions: `#include <algorithm>
#include <numeric>
#include <tuple>
#include <vector>

int mstWeight(int n, std::vector<std::tuple<int,int,int>> edges) {
  std::sort(edges.begin(), edges.end(), [](auto& a, auto& b){
    return std::get<2>(a) < std::get<2>(b);
  });
  std::vector<int> parent(n);
  std::iota(parent.begin(), parent.end(), 0);
  auto find = [&](auto&& self, int x) -> int {
    return parent[x] == x ? x : parent[x] = self(self, parent[x]);
  };
  int total = 0, used = 0;
  for (auto [u, v, w] : edges) {
    int ru = find(find, u), rv = find(find, v);
    if (ru != rv) {
      parent[ru] = rv;
      total += w;
      if (++used == n - 1) break;
    }
  }
  return used == n - 1 ? total : -1;
}`
  },
    {
      title: 'Concept Check: Minimum Spanning Tree and Applications',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Minimum Spanning Tree and Applications and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `// MST has exactly V-1 edges and no cycles in a connected graph.`,
      operations: `// Greedy strategy: repeatedly select safe minimum edge.`,
      advanced: `// Advanced: prove correctness with cut and cycle properties.`
    },
    c: {
      basic: `/* MST includes V-1 edges and spans all vertices. */`,
      operations: `/* Use greedy choice while preventing cycles. */`,
      advanced: `/* Advanced: analyze cut property for correctness. */`
    }
  },
    theoryLinks: [
    { title: 'MST Intro', url: 'https://cp-algorithms.com/graph/mst_kruskal.html', platform: 'CP-Algorithms'}
  ],
  practiceLinks: [
    { title: 'MST Applications', url: 'http://poj.org/problem?id=1679', platform: 'Peking University Online Judge'}
  ],
  visualNodes: ['0', '1', '2', '3', '4', '5'],
  visualCaption: 'Integrated MST comparison on weighted graph',
  visualForm: 'graph',
  visualScript: { kind: 'graph', autoGenerate: true },
});

export default MSTOverviewSection;
