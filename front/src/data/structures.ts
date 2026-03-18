import type { DataStructure } from '../types';

// Array/Linear List Data Structure
export const arrayStructure: DataStructure = {
  id: 'array',
  name: 'Array',
  description: 'An array is a linear data structure where elements are stored contiguously in memory and can be accessed quickly through indices.',
  category: 'linear',
  difficulty: 'beginner',
  concepts: [
    'Contiguous memory storage',
    'Random access',
    'Fixed size',
    'Zero-based indexing',
    'Cache-friendly'
  ],
  operations: [
    {
      name: 'Access Element',
      description: 'Access an element in the array through its index',
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
      code: `function get(arr: number[], index: number): number {
  if (index < 0 || index >= arr.length) {
    throw new Error('Index out of bounds');
  }
  return arr[index];
}`
    },
    {
      name: 'Insert Element',
      description: 'Insert a new element at the specified position in the array',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      code: `function insert(arr: number[], index: number, value: number): number[] {
  if (index < 0 || index > arr.length) {
    throw new Error('Index out of bounds');
  }
  const newArr = [...arr];
  newArr.splice(index, 0, value);
  return newArr;
}`
    },
    {
      name: 'Delete Element',
      description: 'Delete an element at the specified position in the array',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      code: `function remove(arr: number[], index: number): number[] {
  if (index < 0 || index >= arr.length) {
    throw new Error('Index out of bounds');
  }
  const newArr = [...arr];
  newArr.splice(index, 1);
  return newArr;
}`
    }
  ]
};

// Linked List Data Structure
export const linkedListStructure: DataStructure = {
  id: 'linkedlist',
  name: 'Linked List',
  description: 'A linked list is a linear data structure where elements are connected through pointers with dynamic memory allocation.',
  category: 'linear',
  difficulty: 'beginner',
  concepts: [
    'Nodes and pointers',
    'Dynamic memory allocation',
    'Sequential access',
    'Flexible insertion and deletion',
    'Additional pointer overhead'
  ],
  operations: [
    {
      name: 'Insert Node',
      description: 'Insert a new node in the linked list',
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
      code: `class ListNode {
  val: number;
  next: ListNode | null;
  
  constructor(val: number) {
    this.val = val;
    this.next = null;
  }
}

function insertAfter(node: ListNode, value: number): void {
  const newNode = new ListNode(value);
  newNode.next = node.next;
  node.next = newNode;
}`
    },
    {
      name: 'Delete Node',
      description: 'Delete a specified node in the linked list',
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
      code: `function deleteNext(node: ListNode): void {
  if (node.next) {
    node.next = node.next.next;
  }
}`
    },
    {
      name: 'Search Node',
      description: 'Search for a node with the specified value in the linked list',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      code: `function search(head: ListNode | null, value: number): ListNode | null {
  let current = head;
  while (current) {
    if (current.val === value) {
      return current;
    }
    current = current.next;
  }
  return null;
}`
    }
  ]
};

// Binary Tree Data Structure
export const binaryTreeStructure: DataStructure = {
  id: 'binarytree',
  name: 'Binary Tree',
  description: 'A binary tree is a hierarchical data structure where each node has at most two child nodes.',
  category: 'tree',
  difficulty: 'intermediate',
  concepts: [
    'Hierarchical structure',
    'Root node, leaf nodes',
    'Left subtree, right subtree',
    'Depth-first traversal',
    'Breadth-first traversal'
  ],
  operations: [
    {
      name: 'Preorder Traversal',
      description: 'Traverse the binary tree in root-left-right order',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(h)',
      code: `class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  
  constructor(val: number) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

function preorderTraversal(root: TreeNode | null): number[] {
  if (!root) return [];
  
  const result: number[] = [];
  const stack: TreeNode[] = [root];
  
  while (stack.length > 0) {
    const node = stack.pop()!;
    result.push(node.val);
    
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
  
  return result;
}`
    },
    {
      name: 'Insert Node',
      description: 'Insert a new node in the binary search tree',
      timeComplexity: 'O(log n)',
      spaceComplexity: 'O(1)',
      code: `function insertIntoBST(root: TreeNode | null, val: number): TreeNode {
  if (!root) {
    return new TreeNode(val);
  }
  
  if (val < root.val) {
    root.left = insertIntoBST(root.left, val);
  } else {
    root.right = insertIntoBST(root.right, val);
  }
  
  return root;
}`
    }
  ]
};

// Collection of all data structures
export const dataStructures: DataStructure[] = [
  arrayStructure,
  linkedListStructure,
  binaryTreeStructure,
];
