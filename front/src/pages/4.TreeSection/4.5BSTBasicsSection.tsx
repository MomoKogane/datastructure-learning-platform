import { createTopicSection } from '../TopicSection/createTopicSection';

const BSTBasicsSection = createTopicSection({
  id: '4.5',
  name: 'Binary Search Tree Basics',
  chapterNumber: '4.5',
  overview: 'Binary Search Tree maintains ordered key property: left < root < right, enabling efficient search/update on balanced distributions.',
  concepts: [
    { title: 'BST Property', content: 'For each node, keys in left subtree are smaller and right subtree are larger.', examples: ['Inorder traversal is sorted'] },
    { title: 'Core Operations', content: 'Search, insert, and delete rely on key comparisons and recursive descent.', examples: ['Delete leaf', 'Delete with one/two children'] }
  ],
  complexity: { time: { average: 'O(log n)', worst: 'O(n)' }, space: 'O(h)' },
  operations: [
    { name: 'Query/Insert', description: 'Query key path in BST and insert if absent.', steps: ['Compare key along path', 'Find null position', 'Insert node and keep BST order'] },
    { name: 'Query/Delete', description: 'Query key path then delete using predecessor-first replacement.', steps: ['Locate target node', 'Prefer left-subtree rightmost value replacement', 'Fallback to right-subtree leftmost or direct delete'] }
  ],
  exercises: [{
    title: 'BST Deletion Cases',
    difficulty: 'Medium',
    description: 'Implement and test three deletion scenarios.',
    hints: ['Use successor/predecessor for two-child case'],
    solutions: `#include <cstddef>

struct Node {
  int val;
  Node* left;
  Node* right;
};

Node* findMin(Node* root) {
  while (root && root->left) root = root->left;
  return root;
}

Node* deleteNode(Node* root, int key) {
  if (!root) return nullptr;
  if (key < root->val) {
    root->left = deleteNode(root->left, key);
  } else if (key > root->val) {
    root->right = deleteNode(root->right, key);
  } else {
    if (!root->left) {
      Node* r = root->right;
      delete root;
      return r;
    }
    if (!root->right) {
      Node* l = root->left;
      delete root;
      return l;
    }
    Node* succ = findMin(root->right);
    root->val = succ->val;
    root->right = deleteNode(root->right, succ->val);
  }
  return root;
}`
  },
    {
      title: 'Concept Check: Binary Search Tree Basics',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Binary Search Tree Basics and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `// BST supports ordered search/insert/delete on average O(log n).`,
      operations: `// Delete has three cases: leaf, one child, two children.`,
      advanced: `// Use inorder successor to replace deleted node with two children.`
    },
    c: {
      basic: `/* BST supports ordered operations with key comparisons. */`,
      operations: `/* Delete node by handling leaf/one-child/two-child cases. */`,
      advanced: `/* Use inorder successor/predecessor to replace node. */`
    }
  },
    theoryLinks: [
    { title: 'BST Operations', url: 'https://www.geeksforgeeks.org/binary-search-tree-data-structure/', platform: 'GeeksforGeeks'}
  ],
  practiceLinks: [
    { title: 'BST practice', url: 'https://leetcode.cn/problems/validate-binary-search-tree/description/', platform: 'Leetcode'}
  ],
  visualNodes: ['20', '10', '30', '5', '15', '25', '35'],
  visualCaption: 'BST query-insert and query-delete',
  visualForm: 'tree',
  visualScript: { kind: 'tree', autoGenerate: true },
  forceLocalVisualization: true,
});

export default BSTBasicsSection;
