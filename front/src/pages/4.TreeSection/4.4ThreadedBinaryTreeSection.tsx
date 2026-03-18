import { createTopicSection } from '../TopicSection/createTopicSection';

const ThreadedBinaryTreeSection = createTopicSection({
  id: '4.4',
  name: 'Threaded Binary Tree',
  chapterNumber: '4.4',
  overview: 'Threaded binary trees reuse null pointers to point to traversal predecessor/successor, reducing traversal overhead in specific scenarios.',
  concepts: [
    { title: 'Thread Concept', content: 'Null child pointers can be converted into predecessor/successor links.', examples: ['Inorder thread', 'Preorder thread'] },
    { title: 'Tag Bits', content: 'Node tags distinguish child links from thread links.', examples: ['ltag/rtag'] }
  ],
  complexity: { time: { traverse: 'O(n)', buildThread: 'O(n)' }, space: 'O(1) auxiliary traversal in some variants' },
  operations: [
    { name: 'Inorder Thread Traversal', description: 'Traverse inorder using thread pointers.', steps: ['Build/identify inorder threads', 'Follow successor thread or right child', 'Output inorder sequence'] }
  ],
  exercises: [{
    title: 'Thread Link Identification',
    difficulty: 'Medium',
    description: 'Mark child links and thread links on sample trees.',
    hints: ['Use inorder predecessor/successor'],
    solutions: `#include <cstddef>

struct Node {
  int val;
  Node* left;
  Node* right;
  bool ltag;
  bool rtag;
};

void inorderThread(Node* root, Node*& prev) {
  if (!root) return;
  if (!root->ltag) inorderThread(root->left, prev);
  if (!root->left) {
    root->left = prev;
    root->ltag = true;
  }
  if (prev && !prev->right) {
    prev->right = root;
    prev->rtag = true;
  }
  prev = root;
  if (!root->rtag) inorderThread(root->right, prev);
}`
  },
    {
      title: 'Concept Check: Threaded Binary Tree',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Threaded Binary Tree and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `// Threaded binary trees reuse null pointers as predecessor/successor links.`,
      operations: `// Inorder threading links each node to its inorder predecessor/successor.`,
      advanced: `// Use ltag/rtag flags to distinguish child and thread pointers.`
    },
    c: {
      basic: `/* Threaded trees replace null child pointers with threads. */`,
      operations: `/* Inorder threading links predecessor and successor nodes. */`,
      advanced: `/* Tag bits distinguish child links from thread links. */`
    }
  },
    theoryLinks: [
    { title: 'Threaded Binary Tree', url: 'https://www.geeksforgeeks.org/threaded-binary-tree/', platform: 'GeeksforGeeks'}
  ],
  practiceLinks: [
    { title: 'Threaded Binary Tree', url: 'https://leetcode.cn/problems/zhong-jian-er-cha-shu-lcof/description/', platform: 'Leetcode'}
  ],
  visualNodes: ['10', '6', '15', '4', '8', '12', '18'],
  visualCaption: 'Inorder threaded binary tree traversal',
  visualForm: 'tree',
  visualScript: { kind: 'tree', autoGenerate: true },
  forceLocalVisualization: true,
});

export default ThreadedBinaryTreeSection;
