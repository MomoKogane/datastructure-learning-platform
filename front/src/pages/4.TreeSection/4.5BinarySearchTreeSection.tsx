import { createTopicSection } from '../TopicSection/createTopicSection';

const BinarySearchTreeSection = createTopicSection({
  id: '4.5',
  name: 'Binary Search Tree',
  chapterNumber: '4.5',
  overview: 'Binary Search Tree (BST) keeps left subtree keys smaller and right subtree keys larger than root, supporting ordered operations and efficient average search.',
  concepts: [
    { title: 'BST Property', content: 'For each node: left < root < right.', examples: ['Inorder traversal outputs sorted sequence'] },
    { title: 'Operations', content: 'Search, insert, delete by comparing with current node.', examples: ['Delete has 3 cases: leaf, one child, two children'] }
  ],
  complexity: { time: { search: 'O(log n) avg, O(n) worst', insert: 'O(log n) avg, O(n) worst', delete: 'O(log n) avg, O(n) worst' }, space: 'O(n)' },
  operations: [
    { name: 'Search', description: 'Find value by branch comparison', steps: ['Compare with root', 'Go left/right', 'Repeat'] },
    { name: 'Insert', description: 'Insert while maintaining BST order', steps: ['Traverse to null', 'Attach new node'] }
  ],
  exercises: [
    {
      title: 'Validate BST',
      difficulty: 'Medium',
      description: 'Check if a binary tree satisfies BST property.',
      hints: ['Use min/max bounds'],
      solutions: `#include <climits>

struct Node {
  int val;
  Node* left;
  Node* right;
};

bool isBST(Node* root, long long lo, long long hi) {
  if (!root) return true;
  if (root->val <= lo || root->val >= hi) return false;
  return isBST(root->left, lo, root->val) && isBST(root->right, root->val, hi);
}

bool validateBST(Node* root) {
  return isBST(root, LLONG_MIN, LLONG_MAX);
}`
    }
  ,
    {
      title: 'Concept Check: Binary Search Tree',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Binary Search Tree and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `// BST property: left < root < right for every node.`,
      operations: `// Search/insert by comparing key and moving left/right.`,
      advanced: `// Validate BST using min/max bounds on each subtree.`
    },
    c: {
      basic: `/* BST keeps ordered keys: left < root < right. */`,
      operations: `/* Search/insert by iterative comparisons. */`,
      advanced: `/* Validate with min/max value bounds per subtree. */`
    }
  },
    theoryLinks: [
    { title: 'GeeksforGeeks - Binary Search Tree', url: 'https://www.geeksforgeeks.org/binary-search-tree-data-structure/', platform: 'GeeksforGeeks'}
  ],
  practiceLinks: [
    { title: 'LeetCode - Binary Search Tree', url: 'https://leetcode.com/tag/binary-search-tree/', platform: 'LeetCode'}
  ],
  visualNodes: ['8', '3', '10', '1', '6', '14'],
  visualCaption: 'BST sample nodes',
  visualForm: 'tree',
  visualScript: { kind: 'tree', autoGenerate: true },
});

export default BinarySearchTreeSection;
