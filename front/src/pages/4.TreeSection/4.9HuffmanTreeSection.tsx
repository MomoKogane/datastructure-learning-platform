import { createTopicSection } from '../TopicSection/createTopicSection';

const HuffmanTreeSection = createTopicSection({
  id: '4.9',
  name: 'Huffman Tree',
  chapterNumber: '4.9',
  overview: 'Huffman tree is an optimal prefix code tree used for data compression, minimizing weighted path length based on symbol frequency.',
  concepts: [
    { title: 'Prefix Code', content: 'No code is a prefix of another code.', examples: ['Supports unambiguous decoding'] },
    { title: 'Greedy Construction', content: 'Repeatedly merge two minimum-frequency nodes.', examples: ['Use min-heap priority queue'] }
  ],
  complexity: { time: { build: 'O(n log n)', encode: 'O(L)', decode: 'O(L)' }, space: 'O(n)' },
  operations: [
    { name: 'Build Tree', description: 'Construct Huffman tree from frequencies', steps: ['Push leaves to min-heap', 'Pop two min nodes', 'Merge and push back'] },
    { name: 'Generate Codes', description: 'Traverse tree to assign 0/1 codes', steps: ['Left append 0', 'Right append 1', 'Leaf produces code'] }
  ],
  exercises: [
    {
      title: 'Construct Huffman Codes',
      difficulty: 'Medium',
      description: 'Build codes from character frequencies.',
      hints: ['Use priority queue'],
      solutions: `#include <queue>
#include <string>
#include <unordered_map>
#include <vector>

struct Node {
  char ch;
  int freq;
  Node* left;
  Node* right;
  Node(char c, int f) : ch(c), freq(f), left(nullptr), right(nullptr) {}
  Node(Node* l, Node* r) : ch('\0'), freq(l->freq + r->freq), left(l), right(r) {}
};

struct Cmp {
  bool operator()(Node* a, Node* b) const { return a->freq > b->freq; }
};

void buildCodes(Node* root, const std::string& path, std::unordered_map<char,std::string>& out) {
  if (!root) return;
  if (!root->left && !root->right) {
    out[root->ch] = path.empty() ? "0" : path;
    return;
  }
  buildCodes(root->left, path + "0", out);
  buildCodes(root->right, path + "1", out);
}

std::unordered_map<char,std::string> huffmanCodes(const std::vector<std::pair<char,int>>& freq) {
  std::priority_queue<Node*, std::vector<Node*>, Cmp> pq;
  for (auto [ch, f] : freq) pq.push(new Node(ch, f));
  while (pq.size() > 1) {
    Node* a = pq.top(); pq.pop();
    Node* b = pq.top(); pq.pop();
    pq.push(new Node(a, b));
  }
  std::unordered_map<char,std::string> codes;
  if (!pq.empty()) buildCodes(pq.top(), "", codes);
  return codes;
}`
    }
  ,
    {
      title: 'Concept Check: Huffman Tree',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Huffman Tree and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `// Huffman coding builds optimal prefix codes from symbol frequencies.`,
      operations: `// Use a min-heap to repeatedly merge two lowest-frequency nodes.`,
      advanced: `// Generate codes by DFS: left=0, right=1.`
    },
    c: {
      basic: `/* Huffman coding is an optimal prefix code. */`,
      operations: `/* Min-heap merge two smallest nodes until one tree remains. */`,
      advanced: `/* Assign codes by traversing the tree (0/1). */`
    }
  },
    theoryLinks: [
    { title: 'Huffman Coding', url: 'https://www.geeksforgeeks.org/huffman-coding-greedy-algo-3/', platform: 'GeeksforGeeks'}
  ],
  visualNodes: ['A:45', 'B:13', 'C:12', 'D:16', 'E:9', 'F:5'],
  visualCaption: 'Frequency-based Huffman input',
  visualForm: 'tree',
  visualScript: { kind: 'tree', autoGenerate: true },
});

export default HuffmanTreeSection;
