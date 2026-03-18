import { createTopicSection } from '../TopicSection/createTopicSection';

const RedBlackTreeSection = createTopicSection({
  id: '4.7',
  name: 'Red-Black Tree',
  chapterNumber: '4.7',
  overview: 'Red-Black tree balances search performance via color constraints and local fixes, guaranteeing logarithmic height.',
  concepts: [
    { title: 'Color Rules', content: 'Root black, red nodes cannot have red children, equal black-height on all root-leaf paths.', examples: ['Black-height invariant'] },
    { title: 'Fix-up Strategy', content: 'Insertion/deletion uses recoloring and rotations.', examples: ['Uncle red case', 'Uncle black case'] }
  ],
  complexity: { time: { search: 'O(log n)', insert: 'O(log n)', delete: 'O(log n)' }, space: 'O(n)' },
  operations: [
    { name: 'Query/Insert', description: 'Query path and insert into red-black tree with recolor/rotate fix-up.', steps: ['Locate insert position', 'Insert red node', 'Fix violations via recolor and rotations'] },
    { name: 'Query/Delete', description: 'Query path and delete from red-black tree with fix-up.', steps: ['Locate delete node', 'Delete/replace node', 'Fix double-black via recolor and rotations'] }
  ],
  exercises: [{
    title: 'Coloring Validation',
    difficulty: 'Hard',
    description: 'Check whether a tree satisfies all red-black invariants.',
    hints: ['Check root, red-red, black-height'],
    solutions: `#include <algorithm>

enum Color { RED, BLACK };

struct Node {
  int val;
  Color color;
  Node* left;
  Node* right;
};

int check(Node* root) {
  if (!root) return 1;
  int leftBH = check(root->left);
  int rightBH = check(root->right);
  if (leftBH == 0 || rightBH == 0 || leftBH != rightBH) return 0;
  if (root->color == RED) {
    if ((root->left && root->left->color == RED) ||
        (root->right && root->right->color == RED)) return 0;
  }
  return leftBH + (root->color == BLACK ? 1 : 0);
}

bool validateRB(Node* root) {
  if (!root) return true;
  if (root->color != BLACK) return false;
  return check(root) != 0;
}`
  },
    {
      title: 'Concept Check: Red-Black Tree',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Red-Black Tree and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `// Red-black trees enforce color rules to keep height logarithmic.`,
      operations: `// Fix-up uses recoloring and rotations after insert/delete.`,
      advanced: `// Validate invariants: root black, no red-red, equal black height.`
    },
    c: {
      basic: `/* Red-black tree uses color constraints for balance. */`,
      operations: `/* Recolor and rotate to fix violations. */`,
      advanced: `/* Validate black-height and red-parent rules. */`
    }
  },
    theoryLinks: [
    { title: 'Red Black Tree', url: 'https://www.geeksforgeeks.org/red-black-tree-set-1-introduction-2/', platform: 'GeeksforGeeks'}
  ],
  practiceLinks: [
    { title: 'Red Black Tree', url: 'https://leetcode.cn/search/?q=%E7%BA%A2%E9%BB%91%E6%A0%91', platform: 'LeetCode'}
  ],
  visualNodes: ['20', '10', '30', '5', '15', '25', '35'],
  visualCaption: 'Red-black tree query-insert and query-delete (with node colors)',
  visualForm: 'tree',
  visualScript: { kind: 'tree', autoGenerate: true },
  forceLocalVisualization: true,
});

export default RedBlackTreeSection;
