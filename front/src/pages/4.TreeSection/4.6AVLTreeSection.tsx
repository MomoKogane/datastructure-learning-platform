import { createTopicSection } from '../TopicSection/createTopicSection';

const AVLTreeSection = createTopicSection({
  id: '4.6',
  name: 'AVL Tree',
  chapterNumber: '4.6',
  overview: 'AVL tree is a self-balancing BST. It maintains balance factor in {-1,0,1} by rotations after insertions/deletions.',
  concepts: [
    { title: 'Balance Factor', content: 'Balance factor = height(left) - height(right).', examples: ['Allowed: -1,0,1'] },
    { title: 'Rotations', content: 'Use LL/RR/LR/RL rotations to rebalance.', examples: ['Single rotation', 'Double rotation'] }
  ],
  complexity: { time: { search: 'O(log n)', insert: 'O(log n)', delete: 'O(log n)' }, space: 'O(n)' },
  operations: [
    { name: 'Query/Insert', description: 'Query path and insert into AVL tree, then rotate if needed.', steps: ['Locate insert position', 'Insert key', 'Rebalance using LL/LR/RR/RL rotations'] },
    { name: 'Query/Delete', description: 'Query path and delete from AVL tree, then rotate if needed.', steps: ['Locate delete node', 'Delete key', 'Rebalance with required rotations'] }
  ],
  exercises: [{
    title: 'Rotation Case Drill',
    difficulty: 'Medium',
    description: 'Identify LL/RR/LR/RL for insertion sequences.',
    hints: ['Track insertion path'],
    solutions: `#include <algorithm>

struct Node {
  int val;
  int height;
  Node* left;
  Node* right;
};

int h(Node* n) { return n ? n->height : 0; }

Node* rotateRight(Node* y) {
  Node* x = y->left;
  Node* t2 = x->right;
  x->right = y;
  y->left = t2;
  y->height = std::max(h(y->left), h(y->right)) + 1;
  x->height = std::max(h(x->left), h(x->right)) + 1;
  return x;
}

Node* rotateLeft(Node* x) {
  Node* y = x->right;
  Node* t2 = y->left;
  y->left = x;
  x->right = t2;
  x->height = std::max(h(x->left), h(x->right)) + 1;
  y->height = std::max(h(y->left), h(y->right)) + 1;
  return y;
}

Node* insert(Node* root, int key) {
  if (!root) return new Node{key, 1, nullptr, nullptr};
  if (key < root->val) root->left = insert(root->left, key);
  else if (key > root->val) root->right = insert(root->right, key);
  else return root;
  root->height = std::max(h(root->left), h(root->right)) + 1;
  int balance = h(root->left) - h(root->right);
  if (balance > 1 && key < root->left->val) return rotateRight(root);
  if (balance < -1 && key > root->right->val) return rotateLeft(root);
  if (balance > 1 && key > root->left->val) {
    root->left = rotateLeft(root->left);
    return rotateRight(root);
  }
  if (balance < -1 && key < root->right->val) {
    root->right = rotateRight(root->right);
    return rotateLeft(root);
  }
  return root;
}`
  },
    {
      title: 'Concept Check: AVL Tree',
      difficulty: 'Easy',
      description: 'Summarize the core idea of AVL Tree and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `// AVL keeps balance factor in {-1,0,1}.`,
      operations: `// Fix imbalance with LL/RR/LR/RL rotations.`,
      advanced: `// Track node height and update after each rotation.`
    },
    c: {
      basic: `/* AVL tree maintains balance with rotations. */`,
      operations: `/* Apply LL/RR/LR/RL cases to rebalance. */`,
      advanced: `/* Update node heights after each insertion. */`
    }
  },
    theoryLinks: [
    { title: 'AVL Tree', url: 'https://www.geeksforgeeks.org/introduction-to-avl-tree/', platform: 'GeeksforGeeks'}
  ],
  practiceLinks: [
    { title: 'AVL Tree', url: 'https://leetcode.cn/search/?q=AVL', platform: 'LeetCode'}
  ],
  visualNodes: ['30', '20', '40', '10', '25', '35', '50'],
  visualCaption: 'AVL query-insert and query-delete with balancing',
  visualForm: 'tree',
  visualScript: { kind: 'tree', autoGenerate: true },
  forceLocalVisualization: true,
});

export default AVLTreeSection;
