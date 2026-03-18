import { createTopicSection } from '../TopicSection/createTopicSection';

const ShortestPathOverviewSection = createTopicSection({
  id: '5.3.1',
  name: 'Shortest Path and Applications',
  chapterNumber: '5.3.1',
  overview: 'Shortest-path problems model minimal cost routes on weighted/unweighted graphs and appear in maps, networks, and scheduling.',
  concepts: [
    { title: 'Problem Types', content: 'Single-source, single-pair, and all-pairs shortest paths.', examples: ['Routing', 'Transit planning'] },
    { title: 'Weight Constraints', content: 'Algorithm choice depends on negative edges and graph density.', examples: ['Dijkstra vs Bellman-Ford vs Floyd'] }
  ],
  complexity: { time: { varies: 'Depends on chosen algorithm' }, space: 'Depends on representation' },
  operations: [
    {
      name: 'Run Dijkstra',
      description: 'Single-source shortest path on non-negative directed weighted graph.',
      steps: ['Input start index', 'Select minimum tentative node', 'Relax outgoing edges']
    },
    {
      name: 'Run Bellman-Ford',
      description: 'Single-source shortest path with full edge relaxation rounds.',
      steps: ['Input start index', 'Relax all edges for V-1 rounds', 'Observe distance array evolution']
    },
    {
      name: 'Run Floyd',
      description: 'All-pairs shortest path matrix updates by intermediate vertex expansion.',
      steps: ['Initialize distance matrix', 'Iterate intermediate vertex k', 'Update all i-j pairs']
    }
  ],
  exercises: [{
    title: 'Algorithm Selection',
    difficulty: 'Easy',
    description: 'Pick proper shortest-path algorithm for each scenario.',
    hints: ['Check negative edges', 'Check query volume'],
    solutions: `#include <string>

std::string chooseShortestPathAlgorithm(bool hasNegativeEdge, bool allPairs, bool unweighted) {
  if (allPairs) return "Floyd-Warshall";
  if (unweighted) return "BFS";
  if (hasNegativeEdge) return "Bellman-Ford";
  return "Dijkstra";
}`
  },
    {
      title: 'Concept Check: Shortest Path and Applications',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Shortest Path and Applications and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `#include <string>

std::string chooseAlgorithm(bool negativeEdge, bool allPairs, bool unweighted) {
  if (allPairs) return "Floyd-Warshall";
  if (unweighted) return "BFS";
  if (negativeEdge) return "Bellman-Ford";
  return "Dijkstra";
}`,
      operations: `// Decision factors: edge sign, graph density, query mode (single/all-pairs).`,
      advanced: `// Advanced: Johnson algorithm for sparse all-pairs with possible negative edges (no negative cycles).`
    },
    c: {
      basic: `/* Select among BFS / Dijkstra / Bellman-Ford / Floyd by constraints. */`,
      operations: `/* Check whether edges are weighted, negative, and whether all-pairs is required. */`,
      advanced: `/* Advanced: combine reweighting with Dijkstra in specialized scenarios. */`
    }
  },
    theoryLinks: [
    { title: 'Shortest Paths Overview', url: 'https://cp-algorithms.com/graph/', platform: 'CP-Algorithms'}
  ],
  practiceLinks: [
    { title: 'Shortest Paths Overview', url: 'https://cp-algorithms.com/graph/', platform: 'CP-Algorithms'}
  ],
  visualNodes: ['0', '1', '2', '3', '4', '5'],
  visualCaption: 'Integrated shortest path comparison on directed weighted graph',
  visualForm: 'graph',
  visualScript: { kind: 'graph', autoGenerate: true },
});

export default ShortestPathOverviewSection;
