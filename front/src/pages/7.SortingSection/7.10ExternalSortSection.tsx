import { createTopicSection } from '../TopicSection/createTopicSection';

const ExternalSortSection = createTopicSection({
  id: '7.10',
  name: 'External Sort',
  chapterNumber: '7.10',
  overview: 'External sorting handles datasets larger than memory by sorting chunks and merging runs on disk.',
  concepts: [{ title: 'Run Generation + K-way Merge', content: 'Split input into sorted runs and merge efficiently.', examples: ['Multi-pass merge with limited memory'] }],
  complexity: { time: { io: 'Dominated by disk I/O', merge: 'O(n log k)' }, space: 'Depends on memory buffer size' },
  operations: [{ name: 'External Sort', description: 'Merge multiple sorted files', steps: ['Load block buffers', 'Select min head', 'Write output block'] }],
   exercises: [{
     title: 'Simulate External Merge',
     difficulty: 'Hard',
     description: 'Compute merge passes for file size and memory limit.',
     hints: ['Estimate number of runs'],
     solutions: `#include <fstream>
  #include <iostream>
  #include <queue>
  #include <string>
  #include <vector>

  struct Node {
    int value;
    int fileId;
    bool operator>(const Node& other) const {
      return value > other.value;
    }
  };

  int main() {
    std::vector<std::string> files = {"run1.txt", "run2.txt", "run3.txt"};
    std::vector<std::ifstream> ins(files.size());
    for (int i = 0; i < static_cast<int>(files.size()); ++i) {
      ins[i].open(files[i]);
    }

    std::priority_queue<Node, std::vector<Node>, std::greater<Node>> minHeap;
    for (int i = 0; i < static_cast<int>(ins.size()); ++i) {
      int x;
      if (ins[i] >> x) minHeap.push({x, i});
    }

    std::ofstream out("merged.txt");
    while (!minHeap.empty()) {
      Node cur = minHeap.top();
      minHeap.pop();
      out << cur.value << "\n";

      int nextValue;
      if (ins[cur.fileId] >> nextValue) {
        minHeap.push({nextValue, cur.fileId});
      }
    }

    for (auto& f : ins) f.close();
    out.close();
    std::cout << "Merge completed to merged.txt" << std::endl;
    return 0;
  }`
   },
    {
      title: 'Concept Check: External Sort',
      difficulty: 'Easy',
      description: 'Summarize the core idea of External Sort and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
   practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `#include <fstream>
#include <queue>
#include <string>
#include <vector>

struct Node {
  int value;
  int fileId;
  bool operator>(const Node& other) const { return value > other.value; }
};

void mergeRuns(const std::vector<std::string>& files, const std::string& outFile) {
  std::vector<std::ifstream> ins(files.size());
  for (int i = 0; i < static_cast<int>(files.size()); ++i) ins[i].open(files[i]);

  std::priority_queue<Node, std::vector<Node>, std::greater<Node>> pq;
  for (int i = 0; i < static_cast<int>(ins.size()); ++i) {
    int x;
    if (ins[i] >> x) pq.push({x, i});
  }

  std::ofstream out(outFile);
  while (!pq.empty()) {
    Node cur = pq.top(); pq.pop();
    out << cur.value << "\n";
    int nextValue;
    if (ins[cur.fileId] >> nextValue) pq.push({nextValue, cur.fileId});
  }
}`,
      operations: `// Step 1: split source data into sorted run files.\n// Step 2: k-way merge all run files with min-heap.`,
      advanced: `// Advanced: double buffering + async I/O for higher throughput.`
    },
    c: {
      basic: `/* C external merge (basic idea)
 * 1) Read chunks that fit memory and sort each chunk.
 * 2) Write chunks to run files.
 * 3) Open all run files and repeatedly output the smallest head value.
 */

typedef struct {
  int value;
  int file_id;
} HeapNode;

void external_merge_sort_basic(void) {
  /* implementation depends on file format and buffer management */
}`,
      operations: `/* Operation: choose min head among k runs, write to output, refill from that run. */`,
      advanced: `/* Advanced: replacement selection + multi-pass polyphase merge. */`
    }
  },
    theoryLinks: [
    { title: 'External Sorting', url: 'https://www.geeksforgeeks.org/external-sorting/', platform: 'GeeksforGeeks'},
    { title: 'replacement selection', url: 'https://c.biancheng.net/view/3454.html', platform: 'C Language'}
  ],
  practiceLinks: [
    { title: 'External Sorting', url: 'https://www.geeksforgeeks.org/external-sorting/', platform: 'GeeksforGeeks'},
    { title: 'loser-tree', url: 'https://oi-ol.com/ds/loser-tree/', platform: 'OI'}
  ],
  visualNodes: ['Run1', 'Run2', 'Run3', 'Run4'],
  visualCaption: 'Merge sorted disk runs',
  visualForm: 'algorithm',
  visualScript: { kind: 'array', autoGenerate: true },
});

export default ExternalSortSection;
