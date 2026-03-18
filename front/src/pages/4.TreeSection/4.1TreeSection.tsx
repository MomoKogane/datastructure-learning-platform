import { createTopicSection } from '../TopicSection/createTopicSection';

const TreeSection = createTopicSection({
  id: '4.1',
  name: 'Tree (General)',
  chapterNumber: '4.1',
  overview:
    'A tree is a hierarchical structure made of nodes and edges with a single root and no cycles. General trees allow any number of children per node and model hierarchical data such as file systems and organizational charts.',
  concepts: [
    {
      title: 'Terminology',
      content: 'Key terms include root, parent, child, sibling, leaf, subtree, degree, height, and depth.',
      examples: ['Root at top', 'Leaves have no children']
    },
    {
      title: 'Tree Types',
      content: 'Common variants include rooted trees, ordered trees, m-ary trees, and forests.',
      examples: ['Ordered tree preserves child order', 'Forest is a set of trees']
    },
    {
      title: 'Traversal',
      content: 'General trees use preorder and postorder traversals, and level-order traversal with a queue.',
      examples: ['Preorder visits parent before children', 'Level-order is BFS']
    }
  ],
  complexity: {
    time: {
      traversal: 'O(n)',
      search: 'O(n)',
      insert: 'O(1) to add child',
      delete: 'O(n) for subtree search'
    },
    space: 'O(n)'
  },
  operations: [
    {
      name: 'Insert Node',
      description: 'Select a node and append a new child node without changing existing node relationships.',
      steps: ['Select node by index/click', 'Create new node', 'Append as a new child and keep all original parent-child links unchanged'],
      script: {
        kind: 'tree',
        autoGenerate: true,
        frames: []
      }
    },
    {
      name: 'Delete Node',
      description: 'Promote the leftmost child to replace selected node and append remaining subtrees to its right.',
      steps: ['Select node by index/click', 'Promote leftmost child one level', 'Attach remaining sibling subtrees to promoted node in relative order'],
      script: {
        kind: 'tree',
        autoGenerate: true,
        frames: []
      }
    },
    {
      name: 'Modify Node',
      description: 'Select node and update its value only.',
      steps: ['Select node by index/click', 'Input new value', 'Update node label without changing subtree topology'],
      script: {
        kind: 'tree',
        autoGenerate: true,
        frames: []
      }
    }
  ],
  exercises: [
    {
      title: 'Tree Height',
      difficulty: 'Easy',
      description: 'Compute the height of a general tree.',
      hints: ['Use recursion', 'Height is 1 + max child height'],
      solutions: `#include <algorithm>
#include <iostream>
#include <vector>

struct Node {
    std::vector<Node*> children;
};

int height(Node* node) {
    if (!node) return 0;
    int best = 0;
    for (Node* child : node->children) best = std::max(best, height(child));
    return best + 1;
}`
    },
    {
      title: 'Serialize Tree',
      difficulty: 'Medium',
      description: 'Encode and decode a general tree.',
      hints: ['Use preorder with child counts', 'Rebuild recursively']
    }
  ],
  practiceExampleLanguage: 'cpp',
    theoryLinks: [
    {
          title: 'GeeksforGeeks - Trees',
          url: 'https://www.geeksforgeeks.org/tree-data-structure/',
          platform: 'GeeksforGeeks'}
  ],
  practiceLinks: [
    {
          title: 'LeetCode - Tree Problems',
          url: 'https://leetcode.com/tag/tree/',
          platform: 'LeetCode'}
  ],
  visualNodes: ['1', '2', '3', '4', '5', '6', '7'],
  visualCaption: 'General tree structure (ordered children)',
  visualForm: 'tree',
  visualScript: { kind: 'tree', autoGenerate: true },
  forceLocalVisualization: true,
  fallbackCodeExamples: {
    javascript: {
      basic: `class Node {\n  constructor(val) {\n    this.val = val;\n    this.children = [];\n  }\n}\nconst root = new Node('A');`,
      operations: `function preorder(node, result = []) {\n  if (!node) return result;\n  result.push(node.val);\n  for (const child of node.children) preorder(child, result);\n  return result;\n}`,
      advanced: `function height(node) {\n  if (!node) return 0;\n  return 1 + Math.max(0, ...node.children.map(height));\n}`
    },
    typescript: {
      basic: `class Node {\n  val: string;\n  children: Node[] = [];\n  constructor(val: string) { this.val = val; }\n}\nconst root = new Node('A');`,
      operations: `function preorder(node: Node | null, result: string[] = []): string[] {\n  if (!node) return result;\n  result.push(node.val);\n  for (const child of node.children) preorder(child, result);\n  return result;\n}`,
      advanced: `function height(node: Node | null): number {\n  if (!node) return 0;\n  return 1 + Math.max(0, ...node.children.map(height));\n}`
    },
    python: {
      basic: `class Node:\n    def __init__(self, val):\n        self.val = val\n        self.children = []\n\nroot = Node('A')`,
      operations: `def preorder(node, result=None):\n    if result is None:\n        result = []\n    if not node:\n        return result\n    result.append(node.val)\n    for child in node.children:\n        preorder(child, result)\n    return result`,
      advanced: `def height(node):\n    if not node:\n        return 0\n    return 1 + max([height(c) for c in node.children] + [0])`
    },
    java: {
      basic: `class Node {\n    String val;\n    List<Node> children = new ArrayList<>();\n    Node(String val) { this.val = val; }\n}\nNode root = new Node("A");`,
      operations: `void preorder(Node node, List<String> result) {\n    if (node == null) return;\n    result.add(node.val);\n    for (Node child : node.children) preorder(child, result);\n}`,
      advanced: `int height(Node node) {\n    if (node == null) return 0;\n    int h = 0;\n    for (Node child : node.children) h = Math.max(h, height(child));\n    return h + 1;\n}`
    },
    cpp: {
      basic: `#include <iostream>\n#include <string>\n#include <vector>\n\nstruct Node {\n    std::string val;\n    std::vector<Node*> children;\n    explicit Node(std::string v) : val(std::move(v)) {}\n};\n\nint main() {\n    Node* root = new Node("A");\n    root->children.push_back(new Node("B"));\n    root->children.push_back(new Node("C"));\n    std::cout << "root: " << root->val << std::endl;\n    return 0;\n}`,
      operations: `#include <string>\n#include <vector>\n\nstruct Node {\n    std::string val;\n    std::vector<Node*> children;\n    explicit Node(std::string v) : val(std::move(v)) {}\n};\n\nvoid preorder(Node* node, std::vector<std::string>& result) {\n    if (!node) return;\n    result.push_back(node->val);\n    for (Node* child : node->children) preorder(child, result);\n}`,
      advanced: `#include <algorithm>\n#include <string>\n#include <vector>\n\nstruct Node {\n    std::string val;\n    std::vector<Node*> children;\n    explicit Node(std::string v) : val(std::move(v)) {}\n};\n\nint height(Node* node) {\n    if (!node) return 0;\n    int h = 0;\n    for (Node* child : node->children) h = std::max(h, height(child));\n    return h + 1;\n}`
    },
    c: {
      basic: `#include <stdio.h>\n\n#define MAX_CHILDREN 8\n\ntypedef struct Node {\n    const char* val;\n    int childCount;\n    struct Node* children[MAX_CHILDREN];\n} Node;\n\nint main(void) {\n    Node root = {"A", 0, {0}};\n    printf("root: %s\\n", root.val);\n    return 0;\n}`,
      operations: `#include <stdio.h>\n\n#define MAX_CHILDREN 8\n\ntypedef struct Node {\n    const char* val;\n    int childCount;\n    struct Node* children[MAX_CHILDREN];\n} Node;\n\nvoid preorder(Node* node) {\n    if (node == NULL) return;\n    printf("%s ", node->val);\n    for (int i = 0; i < node->childCount; ++i) preorder(node->children[i]);\n}`,
      advanced: `#include <stdio.h>\n\n#define MAX_CHILDREN 8\n\ntypedef struct Node {\n    const char* val;\n    int childCount;\n    struct Node* children[MAX_CHILDREN];\n} Node;\n\nint height(Node* node) {\n    if (node == NULL) return 0;\n    int maxChildHeight = 0;\n    for (int i = 0; i < node->childCount; ++i) {\n        int h = height(node->children[i]);\n        if (h > maxChildHeight) maxChildHeight = h;\n    }\n    return maxChildHeight + 1;\n}`
    }
  }
});

export default TreeSection;
