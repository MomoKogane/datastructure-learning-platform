import { createTopicSection } from '../TopicSection/createTopicSection';

const binaryTreeExamples = {
  javascript: {
    basic: `class Node {\n  constructor(val) {\n    this.val = val;\n    this.left = null;\n    this.right = null;\n  }\n}\n\nconst root = new Node(10);`,
    operations: `function inorder(root, result = []) {\n  if (!root) return result;\n  inorder(root.left, result);\n  result.push(root.val);\n  inorder(root.right, result);\n  return result;\n}`,
    advanced: `function insertBST(root, val) {\n  if (!root) return new Node(val);\n  if (val < root.val) root.left = insertBST(root.left, val);\n  else root.right = insertBST(root.right, val);\n  return root;\n}`
  },
  typescript: {
    basic: `class Node {\n  val: number;\n  left: Node | null = null;\n  right: Node | null = null;\n  constructor(val: number) {\n    this.val = val;\n  }\n}\n\nconst root = new Node(10);`,
    operations: `function inorder(root: Node | null, result: number[] = []): number[] {\n  if (!root) return result;\n  inorder(root.left, result);\n  result.push(root.val);\n  inorder(root.right, result);\n  return result;\n}`,
    advanced: `function insertBST(root: Node | null, val: number): Node {\n  if (!root) return new Node(val);\n  if (val < root.val) root.left = insertBST(root.left, val);\n  else root.right = insertBST(root.right, val);\n  return root;\n}`
  },
  python: {
    basic: `class Node:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n\nroot = Node(10)`,
    operations: `def inorder(root, result=None):\n    if result is None:\n        result = []\n    if not root:\n        return result\n    inorder(root.left, result)\n    result.append(root.val)\n    inorder(root.right, result)\n    return result`,
    advanced: `def insert_bst(root, val):\n    if root is None:\n        return Node(val)\n    if val < root.val:\n        root.left = insert_bst(root.left, val)\n    else:\n        root.right = insert_bst(root.right, val)\n    return root`
  },
  java: {
    basic: `class Node {\n    int val;\n    Node left, right;\n    Node(int val) { this.val = val; }\n}\n\nNode root = new Node(10);`,
    operations: `void inorder(Node root, List<Integer> result) {\n    if (root == null) return;\n    inorder(root.left, result);\n    result.add(root.val);\n    inorder(root.right, result);\n}`,
    advanced: `Node insertBST(Node root, int val) {\n    if (root == null) return new Node(val);\n    if (val < root.val) root.left = insertBST(root.left, val);\n    else root.right = insertBST(root.right, val);\n    return root;\n}`
  },
  cpp: {
    basic: `#include <iostream>\n\nstruct Node {\n    int val;\n    Node* left;\n    Node* right;\n    explicit Node(int v) : val(v), left(nullptr), right(nullptr) {}\n};\n\nint main() {\n    Node* root = new Node(10);\n    root->left = new Node(6);\n    root->right = new Node(15);\n\n    std::cout << "root = " << root->val << std::endl;\n    return 0;\n}`,
    operations: `#include <iostream>\n#include <vector>\n\nstruct Node {\n    int val;\n    Node* left;\n    Node* right;\n    explicit Node(int v) : val(v), left(nullptr), right(nullptr) {}\n};\n\nvoid inorder(Node* root, std::vector<int>& result) {\n    if (!root) return;\n    inorder(root->left, result);\n    result.push_back(root->val);\n    inorder(root->right, result);\n}\n\nint main() {\n    Node* root = new Node(10);\n    root->left = new Node(6);\n    root->right = new Node(15);\n\n    std::vector<int> result;\n    inorder(root, result);\n    for (int x : result) std::cout << x << " ";\n    std::cout << std::endl;\n    return 0;\n}`,
    advanced: `#include <iostream>\n\nstruct Node {\n    int val;\n    Node* left;\n    Node* right;\n    explicit Node(int v) : val(v), left(nullptr), right(nullptr) {}\n};\n\nNode* insertBST(Node* root, int val) {\n    if (!root) return new Node(val);\n    if (val < root->val) root->left = insertBST(root->left, val);\n    else root->right = insertBST(root->right, val);\n    return root;\n}\n\nvoid inorder(Node* root) {\n    if (!root) return;\n    inorder(root->left);\n    std::cout << root->val << " ";\n    inorder(root->right);\n}\n\nint main() {\n    Node* root = nullptr;\n    int values[] = {10, 6, 15, 4, 8, 12, 18};\n    for (int v : values) root = insertBST(root, v);\n\n    inorder(root);\n    std::cout << std::endl;\n    return 0;\n}`
  },
  c: {
    basic: `#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct Node {\n    int val;\n    struct Node* left;\n    struct Node* right;\n} Node;\n\nNode* create(int val) {\n    Node* n = (Node*)malloc(sizeof(Node));\n    n->val = val;\n    n->left = NULL;\n    n->right = NULL;\n    return n;\n}\n\nint main(void) {\n    Node* root = create(10);\n    root->left = create(6);\n    root->right = create(15);\n    printf("root = %d\\n", root->val);\n    return 0;\n}`,
    operations: `#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct Node {\n    int val;\n    struct Node* left;\n    struct Node* right;\n} Node;\n\nNode* create(int val) {\n    Node* n = (Node*)malloc(sizeof(Node));\n    n->val = val;\n    n->left = NULL;\n    n->right = NULL;\n    return n;\n}\n\nvoid inorder(Node* root) {\n    if (!root) return;\n    inorder(root->left);\n    printf("%d ", root->val);\n    inorder(root->right);\n}\n\nint main(void) {\n    Node* root = create(10);\n    root->left = create(6);\n    root->right = create(15);\n    inorder(root);\n    printf("\\n");\n    return 0;\n}`,
    advanced: `#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct Node {\n    int val;\n    struct Node* left;\n    struct Node* right;\n} Node;\n\nNode* create(int val) {\n    Node* n = (Node*)malloc(sizeof(Node));\n    n->val = val;\n    n->left = NULL;\n    n->right = NULL;\n    return n;\n}\n\nNode* insertBST(Node* root, int val) {\n    if (!root) return create(val);\n    if (val < root->val) root->left = insertBST(root->left, val);\n    else root->right = insertBST(root->right, val);\n    return root;\n}\n\nvoid inorder(Node* root) {\n    if (!root) return;\n    inorder(root->left);\n    printf("%d ", root->val);\n    inorder(root->right);\n}\n\nint main(void) {\n    int values[] = {10, 6, 15, 4, 8, 12, 18};\n    int n = sizeof(values) / sizeof(values[0]);\n\n    Node* root = NULL;\n    for (int i = 0; i < n; ++i) root = insertBST(root, values[i]);\n\n    inorder(root);\n    printf("\\n");\n    return 0;\n}`
  }
} as const;

const BinaryTreeSection = createTopicSection({
  id: '4.3',
  name: 'Binary Tree',
  chapterNumber: '4.3',
  overview:
    'Binary trees are hierarchical structures where each node has at most two children. They model parent-child relationships and support efficient traversal and search when structured as a BST.\n\nKey goals: represent hierarchy, enable recursive decomposition, and support tree traversals for processing nodes in different orders.',
  concepts: [
    {
      title: 'Node and Tree Properties',
      content:
        'A binary tree node has left and right child references. Important properties include height, depth, subtree size, and balance. A complete tree fills levels left-to-right, while a full tree has 0 or 2 children per node.',
      examples: ['Root, internal node, leaf node', 'Height and depth definitions']
    },
    {
      title: 'Traversals',
      content:
        'Traversal orders define how to visit nodes: preorder (root-left-right), inorder (left-root-right), postorder (left-right-root), and level-order (BFS). Each traversal is useful for different tasks.',
      examples: ['Inorder yields sorted order in BST', 'Level-order uses a queue']
    },
    {
      title: 'Binary Search Tree (BST)',
      content:
        'In a BST, left subtree keys are smaller and right subtree keys are larger. This enables O(log n) search and insertion when balanced.',
      examples: ['Insert, search, delete in BST', 'Skewed BST degrades to O(n)']
    }
  ],
  complexity: {
    time: {
      traversal: 'O(n)',
      search: 'O(log n) avg, O(n) worst',
      insertion: 'O(log n) avg, O(n) worst',
      deletion: 'O(log n) avg, O(n) worst'
    },
    space: 'O(n)'
  },
  operations: [
    {
      name: 'Insert Node',
      description: 'Select a node and append a new child without changing existing node relationships.',
      steps: ['Select node by index/click', 'Create new node', 'Append as a child and keep all existing links unchanged']
    },
    {
      name: 'Delete Node',
      description: 'Promote selected node left child to replace it and reconnect remaining subtrees.',
      steps: ['Select node by index/click', 'Promote left child', 'Reconnect remaining subtree to the right side']
    },
    {
      name: 'Modify Node',
      description: 'Update selected node value without topology change.',
      steps: ['Select node by index/click', 'Input new value', 'Apply value update']
    },
    {
      name: 'Preorder Traversal',
      description: 'Visit root-left-right.',
      steps: ['Visit root', 'Traverse left subtree', 'Traverse right subtree']
    },
    {
      name: 'Inorder Traversal',
      description: 'Visit left-root-right.',
      steps: ['Traverse left subtree', 'Visit root', 'Traverse right subtree']
    },
    {
      name: 'Postorder Traversal',
      description: 'Visit left-right-root.',
      steps: ['Traverse left subtree', 'Traverse right subtree', 'Visit root']
    }
  ],
  exercises: [
    {
      title: 'Binary Tree Traversal',
      difficulty: 'Easy',
      description: 'Implement preorder, inorder, and postorder traversals.',
      hints: ['Use recursion', 'Return array of visited values']
    },
    {
      title: 'Check Balanced Tree',
      difficulty: 'Medium',
      description: 'Determine if a tree is height-balanced.',
      hints: ['Compute heights bottom-up', 'Early exit on imbalance']
    },
    {
      title: 'Lowest Common Ancestor',
      difficulty: 'Medium',
      description: 'Find the LCA of two nodes in a binary tree.',
      hints: ['Use recursion', 'Return node when both sides match']
    }
  ],
  theoryLinks: [
    {
      title: 'GeeksforGeeks - Binary Tree',
      url: 'https://www.geeksforgeeks.org/binary-tree-data-structure/',
      platform: 'GeeksforGeeks'
    }
  ],
  practiceLinks: [
    {
      title: 'LeetCode - Binary Tree',
      url: 'https://leetcode.com/tag/binary-tree/',
      platform: 'LeetCode'
    }
  ],
  practiceSections: {
    example: {
      title: 'Binary Tree Traversal',
      difficulty: 'Easy',
      description: 'Implement preorder, inorder, and postorder traversals.',
      hints: ['Use recursion', 'Return array of visited values'],
      solution: `#include <vector>\n\nstruct Node {\n    int val;\n    Node* left;\n    Node* right;\n};\n\nvoid inorder(Node* root, std::vector<int>& result) {\n    if (!root) return;\n    inorder(root->left, result);\n    result.push_back(root->val);\n    inorder(root->right, result);\n}`
    },
    thinking: [
      {
        title: 'Check Balanced Tree',
        difficulty: 'Medium',
        description: 'Determine if a tree is height-balanced.',
        hints: ['Compute heights bottom-up', 'Early exit on imbalance']
      }
    ],
    programming: [
      {
        title: 'LeetCode - Binary Tree',
        url: 'https://leetcode.com/tag/binary-tree/',
        platform: 'LeetCode'
      }
    ]
  },
  practiceExampleLanguage: 'cpp',
  visualNodes: ['10', '6', '15', '4', '8', '12', '18'],
  visualCaption: 'Binary Tree Hierarchical Visualization',
  visualForm: 'tree',
  visualScript: {
    kind: 'tree',
    autoGenerate: true
  },
  fallbackCodeExamples: binaryTreeExamples
});

export default BinaryTreeSection;
