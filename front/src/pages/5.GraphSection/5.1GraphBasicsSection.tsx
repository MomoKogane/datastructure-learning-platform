import { createTopicSection } from '../TopicSection/createTopicSection';

const GraphBasicsSection = createTopicSection({
  id: '5.1',
  name: 'Graph Fundamentals',
  chapterNumber: '5.1',
  overview:
    'Graphs model relationships between vertices connected by edges. They can be directed or undirected, weighted or unweighted, and are used in routing, networks, and dependencies.',
  concepts: [
    {
      title: 'Representations',
      content: 'Adjacency lists are space-efficient for sparse graphs; adjacency matrices are faster for edge checks.',
      examples: ['List of neighbors', 'Matrix of 0/1 or weights']
    },
    {
      title: 'Traversal',
      content: 'DFS and BFS explore vertices systematically and support connected components and shortest path in unweighted graphs.',
      examples: ['BFS uses queue', 'DFS uses stack/recursion']
    },
    {
      title: 'Common Problems',
      content: 'Shortest paths, minimum spanning trees, and topological ordering are core graph tasks.',
      examples: ['Dijkstra', 'Prim/Kruskal', 'Topo sort']
    }
  ],
  complexity: {
    time: {
      bfs: 'O(V + E)',
      dfs: 'O(V + E)',
      dijkstra: 'O((V+E) log V)',
      mst: 'O(E log V)'
    },
    space: 'O(V + E)'
  },
  operations: [
    {
      name: 'Build Adjacency List',
      description: 'Generate adjacency list (hash-chain style) from directed weighted graph.',
      steps: ['Choose start index', 'Traverse reachable vertices', 'Append weighted outgoing neighbors'],
      script: {
        kind: 'graph',
        autoGenerate: true,
        frames: []
      }
    },
    {
      name: 'Build Adjacency Matrix',
      description: 'Generate adjacency matrix (2D array) from directed weighted graph.',
      steps: ['Choose start index', 'Traverse reachable vertices', 'Fill matrix weights and x'],
      script: {
        kind: 'graph',
        autoGenerate: true,
        frames: []
      }
    }
  ],
  exercises: [
    {
      title: 'Shortest Path in Unweighted Graph',
      difficulty: 'Easy',
      description: 'Compute shortest path using BFS.',
      hints: ['Track parent', 'Queue neighbors'],
      solutions: `#include <queue>
#include <vector>

std::vector<int> shortestPath(const std::vector<std::vector<int>>& graph, int start) {
    std::vector<int> dist(graph.size(), -1);
    std::queue<int> q;
    q.push(start);
    dist[start] = 0;

    while (!q.empty()) {
        int node = q.front();
        q.pop();
        for (int next : graph[node]) {
            if (dist[next] == -1) {
                dist[next] = dist[node] + 1;
                q.push(next);
            }
        }
    }
    return dist;
}`
    },
    {
      title: 'Number of Islands',
      difficulty: 'Medium',
      description: 'Use BFS/DFS to count connected components.',
      hints: ['Traverse grid', 'Mark visited cells']
    }
  ],
  practiceExampleLanguage: 'cpp',
    theoryLinks: [
    {
          title: 'Graph Algorithms',
          url: 'https://oiwiki.org/graph/',
          platform: 'OI Wiki'}
  ],
  practiceLinks: [
    {
          title: 'LeetCode - Graph',
          url: 'https://leetcode.com/tag/graph/',
          platform: 'LeetCode'}
  ],
  visualNodes: ['0', '1', '2', '3', '4', '5'],
  visualCaption: 'Directed weighted graph for adjacency list/matrix construction',
  visualForm: 'graph',
  visualScript: { kind: 'graph', autoGenerate: true },
  fallbackCodeExamples: {
    javascript: {
      basic: `const graph = { A: ['B', 'C'], B: ['A', 'D'], C: ['A'] };`,
      operations: `function bfs(graph, start) {\n  const q = [start];\n  const visited = new Set([start]);\n  while (q.length) {\n    const node = q.shift();\n    for (const next of graph[node]) {\n      if (!visited.has(next)) {\n        visited.add(next);\n        q.push(next);\n      }\n    }\n  }\n}`,
      advanced: `function dijkstra(graph, source) {\n  const dist = {};\n  const visited = new Set();\n  const pq = [[0, source]];\n  for (const node in graph) dist[node] = Infinity;\n  dist[source] = 0;\n  while (pq.length) {\n    pq.sort((a, b) => a[0] - b[0]);\n    const [currentDist, node] = pq.shift();\n    if (visited.has(node)) continue;\n    visited.add(node);\n    for (const [next, weight] of graph[node]) {\n      const candidate = currentDist + weight;\n      if (candidate < dist[next]) {\n        dist[next] = candidate;\n        pq.push([candidate, next]);\n      }\n    }\n  }\n  return dist;\n}`
    },
    typescript: {
      basic: `const graph: Record<string, string[]> = { A: ['B', 'C'], B: ['A', 'D'], C: ['A'] };`,
      operations: `function bfs(graph: Record<string, string[]>, start: string) {\n  const q: string[] = [start];\n  const visited = new Set<string>([start]);\n  while (q.length) {\n    const node = q.shift() as string;\n    for (const next of graph[node]) {\n      if (!visited.has(next)) {\n        visited.add(next);\n        q.push(next);\n      }\n    }\n  }\n}`,
      advanced: `type WeightedGraph = Record<string, Array<[string, number]>>;\nfunction dijkstra(graph: WeightedGraph, source: string): Record<string, number> {\n  const dist: Record<string, number> = {};\n  const visited = new Set<string>();\n  const pq: Array<[number, string]> = [[0, source]];\n  Object.keys(graph).forEach((node) => (dist[node] = Infinity));\n  dist[source] = 0;\n  while (pq.length) {\n    pq.sort((a, b) => a[0] - b[0]);\n    const [currentDist, node] = pq.shift() as [number, string];\n    if (visited.has(node)) continue;\n    visited.add(node);\n    for (const [next, weight] of graph[node]) {\n      const candidate = currentDist + weight;\n      if (candidate < dist[next]) {\n        dist[next] = candidate;\n        pq.push([candidate, next]);\n      }\n    }\n  }\n  return dist;\n}`
    },
    python: {
      basic: `graph = {'A': ['B', 'C'], 'B': ['A', 'D'], 'C': ['A']}`,
      operations: `def bfs(graph, start):\n    q = [start]\n    visited = {start}\n    while q:\n        node = q.pop(0)\n        for nxt in graph[node]:\n            if nxt not in visited:\n                visited.add(nxt)\n                q.append(nxt)`,
      advanced: `import heapq\ndef dijkstra(graph, source):\n    dist = {node: float('inf') for node in graph}\n    dist[source] = 0\n    pq = [(0, source)]\n    while pq:\n        current_dist, node = heapq.heappop(pq)\n        if current_dist > dist[node]:\n            continue\n        for nxt, w in graph[node]:\n            candidate = current_dist + w\n            if candidate < dist[nxt]:\n                dist[nxt] = candidate\n                heapq.heappush(pq, (candidate, nxt))\n    return dist`
    },
    java: {
      basic: `Map<String, List<String>> graph = new HashMap<>();`,
      operations: `void bfs(Map<String, List<String>> graph, String start) {\n    Queue<String> q = new ArrayDeque<>();\n    Set<String> visited = new HashSet<>();\n    q.offer(start);\n    visited.add(start);\n    while (!q.isEmpty()) {\n        String node = q.poll();\n        for (String nxt : graph.get(node)) {\n            if (visited.add(nxt)) q.offer(nxt);\n        }\n    }\n}`,
      advanced: `class Edge {\n    String to;\n    int w;\n    Edge(String to, int w) { this.to = to; this.w = w; }\n}\nMap<String, Integer> dijkstra(Map<String, List<Edge>> graph, String source) {\n    Map<String, Integer> dist = new HashMap<>();\n    for (String node : graph.keySet()) dist.put(node, Integer.MAX_VALUE);\n    dist.put(source, 0);\n    PriorityQueue<String> pq = new PriorityQueue<>(Comparator.comparingInt(dist::get));\n    pq.offer(source);\n    while (!pq.isEmpty()) {\n        String node = pq.poll();\n        for (Edge e : graph.get(node)) {\n            int candidate = dist.get(node) + e.w;\n            if (candidate < dist.get(e.to)) {\n                dist.put(e.to, candidate);\n                pq.offer(e.to);\n            }\n        }\n    }\n    return dist;\n}`
    },
    cpp: {
      basic: `#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<std::vector<int>> graph = {{1, 2}, {0, 3}, {0}, {1}};\n    std::cout << "neighbors of node 0: ";\n    for (int v : graph[0]) std::cout << v << " ";\n    std::cout << std::endl;\n    return 0;\n}`,
      operations: `#include <iostream>\n#include <queue>\n#include <vector>\n\nvoid bfs(const std::vector<std::vector<int>>& graph, int start) {\n    std::queue<int> q;\n    std::vector<int> visited(graph.size(), 0);\n    q.push(start);\n    visited[start] = 1;\n    while (!q.empty()) {\n        int node = q.front();\n        q.pop();\n        std::cout << node << " ";\n        for (int next : graph[node]) {\n            if (!visited[next]) {\n                visited[next] = 1;\n                q.push(next);\n            }\n        }\n    }\n}`,
      advanced: `#include <limits>\n#include <queue>\n#include <utility>\n#include <vector>\n\nstd::vector<int> dijkstra(const std::vector<std::vector<std::pair<int, int>>>& graph, int source) {\n    const int INF = std::numeric_limits<int>::max();\n    std::vector<int> dist(graph.size(), INF);\n    using State = std::pair<int, int>;\n    std::priority_queue<State, std::vector<State>, std::greater<State>> pq;\n    dist[source] = 0;\n    pq.push({0, source});\n    while (!pq.empty()) {\n        auto [currentDist, node] = pq.top();\n        pq.pop();\n        if (currentDist > dist[node]) continue;\n        for (auto [next, weight] : graph[node]) {\n            if (dist[node] + weight < dist[next]) {\n                dist[next] = dist[node] + weight;\n                pq.push({dist[next], next});\n            }\n        }\n    }\n    return dist;\n}`
    },
    c: {
      basic: `#include <stdio.h>\n\n#define N 4\n\nint main(void) {\n    int graph[N][N] = {{0,1,1,0},{1,0,0,1},{1,0,0,1},{0,1,1,0}};\n    printf("neighbors of node 0: ");\n    for (int i = 0; i < N; ++i) if (graph[0][i]) printf("%d ", i);\n    printf("\\n");\n    return 0;\n}`,
      operations: `#include <stdio.h>\n\n#define N 5\n#define CAPACITY 100\n\nvoid bfs(int graph[N][N], int start) {\n    int queue[CAPACITY];\n    int visited[N] = {0};\n    int head = 0, tail = 0;\n    queue[tail++] = start;\n    visited[start] = 1;\n    while (head < tail) {\n        int node = queue[head++];\n        printf("%d ", node);\n        for (int i = 0; i < N; ++i) {\n            if (graph[node][i] && !visited[i]) {\n                visited[i] = 1;\n                queue[tail++] = i;\n            }\n        }\n    }\n}`,
      advanced: `#include <limits.h>\n\n#define N 4\n\nint minDistance(int dist[], int used[]) {\n    int minVal = INT_MAX, minIndex = -1;\n    for (int i = 0; i < N; ++i) {\n        if (!used[i] && dist[i] < minVal) {\n            minVal = dist[i];\n            minIndex = i;\n        }\n    }\n    return minIndex;\n}`
    }
  }
});

export default GraphBasicsSection;
