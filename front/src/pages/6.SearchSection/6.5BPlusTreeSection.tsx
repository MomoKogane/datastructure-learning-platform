import { createTopicSection } from '../TopicSection/createTopicSection';

const BPlusTreeSection = createTopicSection({
  id: '6.5',
  name: 'B+ Tree',
  chapterNumber: '6.5',
  overview: 'B+ Tree stores all records in linked leaves and keeps internal nodes as routing indexes, ideal for range queries in databases.',
  concepts: [
    { title: 'Leaf Linking', content: 'Leaf nodes are linked for efficient range scan.', examples: ['Sequential access across pages'] },
    { title: 'Index Routing', content: 'Internal nodes store separator keys only.', examples: ['All data at leaves'] }
  ],
  complexity: { time: { search: 'O(log n)', insert: 'O(log n)', rangeQuery: 'O(log n + k)' }, space: 'O(n)' },
  operations: [
    {
      name: 'Query/Insert',
      description: 'Input value, query leaf position then insert; split nodes and update separators when needed.',
      steps: ['Query from root to target leaf', 'Insert into ordered leaf', 'Split leaf/internal node if overflow']
    },
    {
      name: 'Query/Delete',
      description: 'Input value, query leaf position then delete; merge/redistribute and refresh separators when needed.',
      steps: ['Query from root to target leaf', 'Delete key from leaf', 'Merge or redistribute if underflow']
    }
  ],
  exercises: [{
    title: 'B+ Tree Range Scan',
    difficulty: 'Hard',
    description: 'Return keys in [L,R].',
    hints: ['Locate start leaf', 'Traverse linked leaves'],
    solutions: `#include <iostream>
#include <vector>

struct LeafNode {
  std::vector<int> keys;
  LeafNode* next = nullptr;
};

std::vector<int> rangeScan(LeafNode* start, int left, int right) {
  std::vector<int> result;
  for (LeafNode* node = start; node != nullptr; node = node->next) {
    for (int key : node->keys) {
      if (key >= left && key <= right) result.push_back(key);
      if (key > right) return result;
    }
  }
  return result;
}

int main() {
  std::cout << "B+ Tree range scan demo" << std::endl;
  return 0;
}`
  },
    {
      title: 'Concept Check: B+ Tree',
      difficulty: 'Easy',
      description: 'Summarize the core idea of B+ Tree and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `#include <vector>

struct BPlusLeaf {
  std::vector<int> keys;
  BPlusLeaf* next = nullptr;
};

std::vector<int> rangeQuery(BPlusLeaf* leaf, int l, int r) {
  std::vector<int> ans;
  for (BPlusLeaf* p = leaf; p != nullptr; p = p->next) {
    for (int key : p->keys) {
      if (key >= l && key <= r) ans.push_back(key);
      if (key > r) return ans;
    }
  }
  return ans;
}`,
      operations: `BPlusLeaf* locateStartLeaf(/* root, key */) {
  // Descend internal nodes by separator keys.
  return nullptr;
}`,
      advanced: `// Advanced: bulk loading and sibling redistribution on split.`
    },
    c: {
      basic: `typedef struct BPlusLeaf {
  int keys[16];
  int key_count;
  struct BPlusLeaf* next;
} BPlusLeaf;

int range_query(BPlusLeaf* leaf, int l, int r, int out[]) {
  int k = 0;
  for (BPlusLeaf* p = leaf; p != 0; p = p->next) {
    for (int i = 0; i < p->key_count; ++i) {
      int key = p->keys[i];
      if (key >= l && key <= r) out[k++] = key;
      if (key > r) return k;
    }
  }
  return k;
}`,
      operations: `BPlusLeaf* locate_start_leaf(/* root, key */) {
  /* descend by separators to first leaf >= key */
  return 0;
}`,
      advanced: `/* Advanced: prefix compression for internal keys. */`
    }
  },
    theoryLinks: [
    { title: 'B+ Tree', url: 'https://www.geeksforgeeks.org/introduction-of-b-tree/', platform: 'GeeksforGeeks'}
  ],
  practiceLinks: [
    { title: 'B+ Tree', url: 'https://www.geeksforgeeks.org/introduction-of-b-tree/', platform: 'GeeksforGeeks'}
  ],
  visualNodes: ['5', '9', '13', '17', '21', '26', '32', '38'],
  visualCaption: 'Leaves linked for range access',
  visualForm: 'tree',
  visualScript: { kind: 'tree', autoGenerate: true },
});

export default BPlusTreeSection;
