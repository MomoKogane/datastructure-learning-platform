import { createTopicSection } from '../TopicSection/createTopicSection';

const HuffmanTreeExtendedSection = createTopicSection({
  id: '4.9',
  name: 'Huffman Trees',
  chapterNumber: '4.9',
  overview: 'Huffman tree builds optimal prefix codes from symbol frequencies. This extended section keeps room for richer visualization, coding labs, and practical compression tasks.',
  concepts: [
    { title: 'Greedy Construction', content: 'Repeatedly combine two minimum-frequency nodes.', examples: ['Priority queue based build'] },
    { title: 'Prefix Code Property', content: 'No code word is prefix of another, enabling unambiguous decoding.', examples: ['Variable-length coding'] }
  ],
  complexity: { time: { build: 'O(n log n)', encode: 'O(L)', decode: 'O(L)' }, space: 'O(n)' },
  operations: [
    { name: 'Build Huffman Tree', description: 'Build Huffman tree from one-row array frequencies.', steps: ['Read input frequency array', 'Repeatedly merge two minimum nodes', 'Output final Huffman tree'] }
  ],
  exercises: [{
    title: 'Coding Table Generation',
    difficulty: 'Medium',
    description: 'Generate Huffman codes for a symbol set and compare average length.',
    hints: ['Compute weighted path length'],
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

void dfs(Node* root, const std::string& code, std::unordered_map<char,std::string>& out) {
  if (!root) return;
  if (!root->left && !root->right) {
    out[root->ch] = code.empty() ? "0" : code;
    return;
  }
  dfs(root->left, code + "0", out);
  dfs(root->right, code + "1", out);
}

std::unordered_map<char,std::string> buildTable(const std::vector<std::pair<char,int>>& freq) {
  std::priority_queue<Node*, std::vector<Node*>, Cmp> pq;
  for (auto [ch, f] : freq) pq.push(new Node(ch, f));
  while (pq.size() > 1) {
    Node* a = pq.top(); pq.pop();
    Node* b = pq.top(); pq.pop();
    pq.push(new Node(a, b));
  }
  std::unordered_map<char,std::string> table;
  if (!pq.empty()) dfs(pq.top(), "", table);
  return table;
}`
  },
    {
      title: 'Concept Check: Huffman Trees',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Huffman Trees and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `// Huffman tree produces optimal prefix-free codes.`,
      operations: `// Build tree by repeatedly merging two smallest-frequency nodes.`,
      advanced: `// Compare average code length using sum(freq * codeLen).`
    },
    c: {
      basic: `/* Huffman tree generates prefix-free codes. */`,
      operations: `/* Merge two minimal nodes until one tree remains. */`,
      advanced: `/* Compute average code length from frequency table. */`
    }
  },
    theoryLinks: [
    { title: 'Huffman Coding', url: 'https://www.geeksforgeeks.org/huffman-coding-greedy-algo-3/', platform: 'GeeksforGeeks'}
  ],
  practiceLinks: [
    { title: 'Huffman Coding', url: 'https://oiwiki.org/ds/huffman-tree/', platform: 'OI Wiki'}
  ],
  visualNodes: ['45', '13', '12', '16', '9', '5'],
  visualCaption: 'Huffman tree build process from array input',
  visualForm: 'tree',
  visualScript: { kind: 'tree', autoGenerate: true },
  forceLocalVisualization: true,
});

export default HuffmanTreeExtendedSection;
