import { createTopicSection } from '../TopicSection/createTopicSection';

const BinaryTreeBasicsTraversalSection = createTopicSection({
  id: '4.2',
  name: 'Tree Traversal',
  chapterNumber: '4.2',
  overview: 'This section focuses on traversal strategies for tree structures, including preorder, inorder, postorder, and level-order, with extension-ready practical modules.',
  concepts: [
    { title: 'Traversal Objectives', content: 'Traversal defines systematic node visiting order for analysis, transformation, and serialization.', examples: ['Visit all nodes exactly once'] },
    { title: 'Traversal Strategies', content: 'Different traversal orders support expression trees, serialization, and analysis tasks.', examples: ['Preorder', 'Inorder', 'Postorder', 'Level-order'] }
  ],
  complexity: { time: { traverse: 'O(n)' }, space: 'O(h) recursion / O(n) queue' },
  operations: [
    { name: 'General Tree Preorder', description: 'Traverse root -> leftmost subtree -> rightmost subtree.', steps: ['Visit root', 'Traverse children from left to right', 'Record sequence'] },
    { name: 'General Tree Postorder', description: 'Traverse rightmost subtree -> leftmost subtree -> root.', steps: ['Traverse children from right to left', 'Visit root at end', 'Record sequence'] },
    { name: 'Binary Tree Preorder', description: 'Traverse root-left-right.', steps: ['Visit root', 'Traverse left subtree', 'Traverse right subtree'] },
    { name: 'Binary Tree Inorder', description: 'Traverse left-root-right.', steps: ['Traverse left subtree', 'Visit root', 'Traverse right subtree'] },
    { name: 'Binary Tree Postorder', description: 'Traverse left-right-root.', steps: ['Traverse left subtree', 'Traverse right subtree', 'Visit root'] }
  ],
  exercises: [{
    title: 'Traversal Order Conversion',
    difficulty: 'Medium',
    description: 'Given two traversals, reason about tree structure.',
    hints: ['Use root position', 'Split left/right recursively'],
    solutions: `#include <unordered_map>
#include <vector>

struct Node {
  int val;
  Node* left;
  Node* right;
};

Node* buildTree(const std::vector<int>& pre, int pl, int pr,
                const std::vector<int>& in, int il, int ir,
                std::unordered_map<int,int>& idx) {
  if (pl > pr || il > ir) return nullptr;
  int rootVal = pre[pl];
  int k = idx[rootVal];
  int leftSize = k - il;
  Node* root = new Node{rootVal, nullptr, nullptr};
  root->left = buildTree(pre, pl + 1, pl + leftSize, in, il, k - 1, idx);
  root->right = buildTree(pre, pl + leftSize + 1, pr, in, k + 1, ir, idx);
  return root;
}`
  },
    {
      title: 'Concept Check: Tree Traversal',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Tree Traversal and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    python: {
      basic: `class Node:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

root = Node(10)
root.left = Node(6)
root.right = Node(15)` ,
      operations: `from collections import deque

def preorder(root):
    if not root:
        return []
    return [root.val] + preorder(root.left) + preorder(root.right)

def inorder(root):
    if not root:
        return []
    return inorder(root.left) + [root.val] + inorder(root.right)

def level_order(root):
    if not root:
        return []
    q = deque([root])
    ans = []
    while q:
        node = q.popleft()
        ans.append(node.val)
        if node.left:
            q.append(node.left)
        if node.right:
            q.append(node.right)
    return ans`,
      advanced: `def build_tree(preorder, inorder):
    idx = {value: i for i, value in enumerate(inorder)}

    def dfs(pl, pr, il, ir):
        if pl > pr:
            return None
        root_val = preorder[pl]
        k = idx[root_val]
        left_size = k - il
        root = Node(root_val)
        root.left = dfs(pl + 1, pl + left_size, il, k - 1)
        root.right = dfs(pl + left_size + 1, pr, k + 1, ir)
        return root

    return dfs(0, len(preorder) - 1, 0, len(inorder) - 1)`
    },
    java: {
      basic: `class Node {
    int val;
    Node left, right;
    Node(int v) { val = v; }
}

Node root = new Node(10);
root.left = new Node(6);
root.right = new Node(15);`,
      operations: `import java.util.*;

class Traversals {
    static class Node {
        int val;
        Node left, right;
        Node(int v) { val = v; }
    }

    static void preorder(Node root, List<Integer> ans) {
        if (root == null) return;
        ans.add(root.val);
        preorder(root.left, ans);
        preorder(root.right, ans);
    }

    static List<Integer> levelOrder(Node root) {
        List<Integer> ans = new ArrayList<>();
        if (root == null) return ans;
        Queue<Node> q = new ArrayDeque<>();
        q.offer(root);
        while (!q.isEmpty()) {
            Node cur = q.poll();
            ans.add(cur.val);
            if (cur.left != null) q.offer(cur.left);
            if (cur.right != null) q.offer(cur.right);
        }
        return ans;
    }
}`,
      advanced: `import java.util.*;

class BuildTree {
    static class Node {
        int val;
        Node left, right;
        Node(int v) { val = v; }
    }

    static Node buildTree(int[] preorder, int[] inorder) {
        Map<Integer, Integer> pos = new HashMap<>();
        for (int i = 0; i < inorder.length; i++) pos.put(inorder[i], i);
        return dfs(preorder, 0, preorder.length - 1, inorder, 0, inorder.length - 1, pos);
    }

    static Node dfs(int[] pre, int pl, int pr, int[] in, int il, int ir, Map<Integer, Integer> pos) {
        if (pl > pr) return null;
        int rootVal = pre[pl];
        int k = pos.get(rootVal);
        int leftSize = k - il;
        Node root = new Node(rootVal);
        root.left = dfs(pre, pl + 1, pl + leftSize, in, il, k - 1, pos);
        root.right = dfs(pre, pl + leftSize + 1, pr, in, k + 1, ir, pos);
        return root;
    }
}`
    },
    cpp: {
      basic: `#include <iostream>

struct Node {
  int val;
  Node* left;
  Node* right;
  explicit Node(int v) : val(v), left(nullptr), right(nullptr) {}
};

int main() {
  Node* root = new Node(10);
  root->left = new Node(6);
  root->right = new Node(15);
  std::cout << "root=" << root->val << "\n";
  return 0;
}`,
      operations: `#include <iostream>
#include <queue>
#include <vector>

struct Node {
  int val;
  Node* left;
  Node* right;
  explicit Node(int v) : val(v), left(nullptr), right(nullptr) {}
};

void inorder(Node* root, std::vector<int>& out) {
  if (!root) return;
  inorder(root->left, out);
  out.push_back(root->val);
  inorder(root->right, out);
}

std::vector<int> levelOrder(Node* root) {
  std::vector<int> out;
  if (!root) return out;
  std::queue<Node*> q;
  q.push(root);
  while (!q.empty()) {
    Node* cur = q.front();
    q.pop();
    out.push_back(cur->val);
    if (cur->left) q.push(cur->left);
    if (cur->right) q.push(cur->right);
  }
  return out;
}`,
      advanced: `#include <unordered_map>
#include <vector>

struct Node {
  int val;
  Node* left;
  Node* right;
  explicit Node(int v) : val(v), left(nullptr), right(nullptr) {}
};

Node* buildTree(const std::vector<int>& pre, int pl, int pr,
                const std::vector<int>& in, int il, int ir,
                std::unordered_map<int, int>& idx) {
  if (pl > pr || il > ir) return nullptr;
  int rootVal = pre[pl];
  int k = idx[rootVal];
  int leftSize = k - il;
  Node* root = new Node(rootVal);
  root->left = buildTree(pre, pl + 1, pl + leftSize, in, il, k - 1, idx);
  root->right = buildTree(pre, pl + leftSize + 1, pr, in, k + 1, ir, idx);
  return root;
}`
    },
    c: {
      basic: `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
  int val;
  struct Node* left;
  struct Node* right;
} Node;

Node* create(int val) {
  Node* node = (Node*)malloc(sizeof(Node));
  node->val = val;
  node->left = NULL;
  node->right = NULL;
  return node;
}`,
      operations: `#include <stdio.h>

typedef struct Node {
  int val;
  struct Node* left;
  struct Node* right;
} Node;

void inorder(Node* root) {
  if (root == NULL) return;
  inorder(root->left);
  printf("%d ", root->val);
  inorder(root->right);
}

void level_order(Node* root) {
  if (root == NULL) return;
  Node* queue[128];
  int head = 0, tail = 0;
  queue[tail++] = root;
  while (head < tail) {
    Node* cur = queue[head++];
    printf("%d ", cur->val);
    if (cur->left) queue[tail++] = cur->left;
    if (cur->right) queue[tail++] = cur->right;
  }
}`,
      advanced: `#include <stdlib.h>

typedef struct Node {
  int val;
  struct Node* left;
  struct Node* right;
} Node;

Node* create(int val) {
  Node* node = (Node*)malloc(sizeof(Node));
  node->val = val;
  node->left = NULL;
  node->right = NULL;
  return node;
}

Node* insert_bst(Node* root, int val) {
  if (root == NULL) return create(val);
  if (val < root->val) root->left = insert_bst(root->left, val);
  else root->right = insert_bst(root->right, val);
  return root;
}`
    }
  },
    theoryLinks: [
    { title: 'Tree Traversal', url: 'https://www.programiz.com/dsa/tree-traversal', platform: 'Programiz'}
  ],
  practiceLinks: [
    { title: 'Tree Traversal', url: 'https://leetcode.cn/search/?q=tree', platform: 'LeetCode'}
  ],
  visualNodes: ['10', '6', '15', '4', '8', '12', '18'],
  visualCaption: 'Traversal mode supports general tree and binary tree',
  visualForm: 'tree',
  visualScript: { kind: 'tree', autoGenerate: true },
  forceLocalVisualization: true,
});

export default BinaryTreeBasicsTraversalSection;
