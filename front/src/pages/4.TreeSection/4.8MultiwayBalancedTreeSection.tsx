import { createTopicSection } from '../TopicSection/createTopicSection';

const MultiwayBalancedTreeSection = createTopicSection({
  id: '4.8',
  name: 'Multi-way Balanced Trees',
  chapterNumber: '4.8',
  overview: 'Multi-way balanced trees generalize binary balancing by allowing multiple keys/children per node, making them suitable for external-memory indexing.',
  concepts: [
    { title: 'Multi-way Node', content: 'A node can hold multiple keys and child pointers, reducing height.', examples: ['Order m tree'] },
    { title: 'External Storage Motivation', content: 'Fewer levels means fewer disk I/O operations.', examples: ['Database index pages'] }
  ],
  complexity: { time: { search: 'O(log n)' }, space: 'O(n)' },
  operations: [
    {
      name: 'Query/Insert',
      description: 'Input value, query in B-Tree then insert; split nodes when overflow occurs.',
      steps: ['Query target path from root', 'Insert into target leaf', 'Split and promote key if overflow']
    },
    {
      name: 'Query/Delete',
      description: 'Input value, query in B-Tree then delete; merge/redistribute when underflow occurs.',
      steps: ['Query target path from root', 'Delete key from node/leaf', 'Merge or redistribute if underflow']
    }
  ],
  exercises: [{
    title: 'Order-m Simulation',
    difficulty: 'Medium',
    description: 'Simulate insertions under a given order and show splits.',
    hints: ['Track promoted keys'],
    solutions: `#include <algorithm>
#include <vector>

struct Node {
  bool leaf;
  std::vector<int> keys;
  std::vector<Node*> child;
  explicit Node(bool isLeaf) : leaf(isLeaf) {}
};

void splitChild(Node* x, int i, int t) {
  Node* y = x->child[i];
  Node* z = new Node(y->leaf);
  int midKey = y->keys[t - 1];
  z->keys.assign(y->keys.begin() + t, y->keys.end());
  y->keys.resize(t - 1);
  if (!y->leaf) {
    z->child.assign(y->child.begin() + t, y->child.end());
    y->child.resize(t);
  }
  x->child.insert(x->child.begin() + i + 1, z);
  x->keys.insert(x->keys.begin() + i, midKey);
}

void insertNonFull(Node* x, int k, int t) {
  int i = static_cast<int>(x->keys.size()) - 1;
  if (x->leaf) {
    x->keys.push_back(0);
    while (i >= 0 && k < x->keys[i]) {
      x->keys[i + 1] = x->keys[i];
      --i;
    }
    x->keys[i + 1] = k;
  } else {
    while (i >= 0 && k < x->keys[i]) --i;
    ++i;
    if (static_cast<int>(x->child[i]->keys.size()) == 2 * t - 1) {
      splitChild(x, i, t);
      if (k > x->keys[i]) ++i;
    }
    insertNonFull(x->child[i], k, t);
  }
}

Node* insert(Node* root, int k, int t) {
  if (static_cast<int>(root->keys.size()) == 2 * t - 1) {
    Node* s = new Node(false);
    s->child.push_back(root);
    splitChild(s, 0, t);
    insertNonFull(s, k, t);
    return s;
  }
  insertNonFull(root, k, t);
  return root;
}`
  },
    {
      title: 'Concept Check: Multi-way Balanced Trees',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Multi-way Balanced Trees and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `// Multi-way balanced trees (e.g., B-tree) store multiple keys per node.`,
      operations: `// Insert splits full nodes and promotes median key upward.`,
      advanced: `// Deletion handles borrow/merge to keep node key counts within bounds.`
    },
    c: {
      basic: `/* Multi-way trees reduce height by storing multiple keys per node. */`,
      operations: `/* Split full node and promote median to parent. */`,
      advanced: `/* Deletion uses borrow or merge to fix underflow. */`
    }
  },
    theoryLinks: [
    { title: 'B-Tree Section', url: '/structure/searching/section/b-tree-search', platform: 'Classic Disk-Based Index Implementation of multi-way balanced trees'},
    { title: 'B* Tree Section', url: '/structure/searching/section/b-star-tree-search', platform: 'Optimized B+ Tree for External Memory'}
  ],
  practiceLinks: [
    { title: 'B+ Tree Section', url: '/structure/searching/section/b-plus-tree-search', platform: 'Ordered Leaf-Level Expansion of multi-way balanced trees in Range Queries'}
  ],
  visualNodes: ['8', '12', '15', '20', '24', '30', '35', '40'],
  visualCaption: 'Multi-key balanced nodes',
  visualForm: 'tree',
  visualScript: { kind: 'tree', autoGenerate: true },
  forceLocalVisualization: true,
});

export default MultiwayBalancedTreeSection;
