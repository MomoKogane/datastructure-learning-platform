import { createTopicSection } from '../TopicSection/createTopicSection';

const FloydAlgorithmSection = createTopicSection({
  id: '5.3.4',
  name: 'Floyd Algorithm',
  chapterNumber: '5.3.4',
  overview: 'Floyd (Floyd-Warshall) computes all-pairs shortest paths by dynamic programming over intermediate vertices.',
  concepts: [
    { title: 'DP State', content: 'dist[i][j] is shortest distance from i to j using allowed intermediates.', examples: ['Matrix initialization'] },
    { title: 'Transition', content: 'dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]).', examples: ['k outer loop'] }
  ],
  complexity: { time: { total: 'O(V^3)' }, space: 'O(V^2)' },
  operations: [{
    name: 'Run Floyd',
    description: 'All-pairs shortest path matrix updates by intermediate vertex expansion.',
    steps: ['Initialize distance matrix', 'Iterate intermediate vertex k', 'Update all i-j pairs']
  }],
  exercises: [{
    title: 'All-Pairs Matrix Fill',
    difficulty: 'Medium',
    description: 'Complete Floyd updates for a small weighted graph.',
    hints: ['Process one k-layer at a time'],
    solutions: `#include <algorithm>
#include <vector>

const int INF = 1e9;

void floydWarshall(std::vector<std::vector<int>>& dist) {
  int n = static_cast<int>(dist.size());
  for (int k = 0; k < n; ++k) {
    for (int i = 0; i < n; ++i) {
      for (int j = 0; j < n; ++j) {
        if (dist[i][k] < INF && dist[k][j] < INF) {
          dist[i][j] = std::min(dist[i][j], dist[i][k] + dist[k][j]);
        }
      }
    }
  }
}`
  },
    {
      title: 'Concept Check: Floyd Algorithm',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Floyd Algorithm and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `// Floyd-Warshall computes all-pairs shortest paths with DP.`,
      operations: `// Transition: dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]).`,
      advanced: `// Advanced: detect negative cycles when dist[i][i] < 0 after updates.`
    },
    c: {
      basic: `/* Floyd computes all-pairs shortest paths. */`,
      operations: `/* Triple loop order: k outer, then i and j. */`,
      advanced: `/* Advanced: check diagonal values for negative cycles. */`
    }
  },
    theoryLinks: [
    { title: 'Floyd Warshall', url: 'https://cp-algorithms.com/graph/all-pair-shortest-path-floyd-warshall.html', platform: 'CP-Algorithms'},
    { title: 'Floyd Warshall', url: 'https://oiwiki.org/graph/shortest-path/#floyd-%E7%AE%97%E6%B3%95', platform: 'OI Wiki'}
  ],
  practiceLinks: [
    { title: 'Floyd Warshall', url: 'https://oiwiki.org/graph/shortest-path/#floyd-%E7%AE%97%E6%B3%95', platform: 'OI Wiki'}
  ],
  visualNodes: ['0', '1', '2', '3', '4', '5'],
  visualCaption: 'Floyd all-pairs matrix update on directed weighted graph',
  visualForm: 'graph',
  visualScript: { kind: 'graph', autoGenerate: true },
});

export default FloydAlgorithmSection;
