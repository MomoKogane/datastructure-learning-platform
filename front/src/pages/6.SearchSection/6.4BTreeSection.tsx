import { createTopicSection } from '../TopicSection/createTopicSection';

const BTreeSection = createTopicSection({
  id: '6.4',
  name: 'B-Tree',
  chapterNumber: '6.4',
  overview: 'B-Tree is a balanced multi-way search tree optimized for external storage, minimizing disk I/O.',
  concepts: [
    { title: 'Node Structure', content: 'Each node stores multiple keys and children.', examples: ['Order m defines max children'] },
    { title: 'Rebalancing', content: 'Split and merge maintain balance during updates.', examples: ['Root split increases height'] }
  ],
  complexity: { time: { search: 'O(log n)', insert: 'O(log n)', delete: 'O(log n)' }, space: 'O(n)' },
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
    title: 'B-Tree Insert Simulation',
    difficulty: 'Hard',
    description: 'Simulate insertion sequence.',
    hints: ['Track split propagation'],
    solutions: `#include <iostream>
#include <vector>

struct BTreeNode {
  std::vector<int> keys;
  std::vector<BTreeNode*> children;
  bool leaf = true;
};

int main() {
  std::cout << "B-Tree insert simulation: track leaf insert and split propagation." << std::endl;
  std::cout << "Steps: find leaf -> insert key -> split on overflow -> promote median." << std::endl;
  return 0;
}`
  },
    {
      title: 'Concept Check: B-Tree',
      difficulty: 'Easy',
      description: 'Summarize the core idea of B-Tree and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `#include <vector>

struct BTreeNode {
  std::vector<int> keys;
  std::vector<BTreeNode*> children;
  bool leaf = true;
};

int searchBTree(const BTreeNode* node, int key) {
  int i = 0;
  while (i < static_cast<int>(node->keys.size()) && key > node->keys[i]) ++i;
  if (i < static_cast<int>(node->keys.size()) && node->keys[i] == key) return 1;
  if (node->leaf) return 0;
  return searchBTree(node->children[i], key);
}`,
      operations: `void splitChild(/* parent, childIndex, degree */) {
  // Move median key to parent and split child into two nodes.
}`,
      advanced: `
      class BTreeNode {
  constructor(t, leaf) {
    this.keys = [];
    this.t = t;
    this.C = [];
    this.leaf = leaf;
  }

  isFull() {
    return this.keys.length === 2 * this.t - 1;
  }

  traverse(tab) {
    const s = "\t".repeat(tab);

    if (!this.leaf) {
      for (let i = 0; i < this.keys.length; i++) {
        this.C[i].traverse(tab + 1);
        console.log(s + this.keys[i]);
      }
      this.C[this.keys.length].traverse(tab + 1);
    } else {
      for (let i = 0; i < this.keys.length; i++) {
        console.log(s + this.keys[i]);
      }
    }
  }

  split() {
    const newEntry = new BTreeNode(this.t, this.leaf);
    const val = this.keys[this.t - 1];
    newEntry.keys = this.keys.slice(this.t);
    this.keys = this.keys.slice(0, this.t - 1);

    if (!this.leaf) {
      newEntry.C = this.C.slice(this.t);
      this.C = this.C.slice(0, this.t);
    }

    return [val, newEntry];
  }

  // Insert a new key into the B-tree
  insert(newKey) {
    let newEntry = null;

    if (!this.leaf) {
      // Use binary search to find the index for insertion
      const i = this.binarySearch(newKey);
      // Recursively call insert on the child node
      newEntry = this.C[i].insert(newKey);

      // Check if a new entry needs to be split
      if (newEntry !== null) {
        if (this.keys.length < 2 * this.t - 1) {
          // Insert the new entry into the current node
          this.keys.splice(i, 0, newEntry[0]);
          this.C.splice(i + 1, 0, newEntry[1]);
          newEntry = null;
        } else {
          // Split the current node and insert the new entry
          this.keys.splice(i, 0, newEntry[0]);
          this.C.splice(i + 1, 0, newEntry[1]);
          [newKey, newEntry] = this.split();
        }
      }
    } else {
      // Use binary search to find the index for insertion
      const i = this.binarySearch(newKey);
      // Insert the new key into the leaf node
      this.keys.splice(i, 0, newKey);

      // Check if the leaf node is full and needs to be split
      if (this.keys.length === 2 * this.t - 1) {
        newEntry = this.split();
      }
    }

    return newEntry;
  }

  // Perform binary search to find the index for insertion
  binarySearch(newKey) {
    let left = 0;
    let right = this.keys.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      if (this.keys[mid] === newKey) {
        return mid;
      } else if (this.keys[mid] < newKey) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return left;
  }

  // Create a new root node
  makeNewRoot(val, newEntry) {
    const root = new BTreeNode(this.t, false);
    root.keys.push(val);
    root.C.push(this);
    root.C.push(newEntry);
    return root;
  }
}

class BTree {
  constructor(t) {
    this.root = new BTreeNode(t, true);
    this.t = t;
  }

  // Insert a new key into the B-tree
  insert(key) {
    const newEntry = this.root.insert(key);

    // Check if a new entry needs to be split and create a new root if necessary
    if (newEntry !== null) {
      this.root = this.root.makeNewRoot(newEntry[0], newEntry[1]);
    }
  }

  // Display the B-tree
  display() {
    this.root.traverse(0);
  }
}

// Driver code
const tree = new BTree(2);
console.log("After inserting 1 and 2");
tree.insert(1);
tree.insert(2);
tree.display();

console.log("After inserting 5 and 6");
tree.insert(5);
tree.insert(6);
tree.display();

console.log("After inserting 3 and 4");
tree.insert(3);
tree.insert(4);
tree.display();
      `
    },
    c: {
      basic: `typedef struct BTreeNode {
  int keys[8];
  struct BTreeNode* children[9];
  int key_count;
  int leaf;
} BTreeNode;

int search_btree(BTreeNode* node, int key) {
  int i = 0;
  while (i < node->key_count && key > node->keys[i]) ++i;
  if (i < node->key_count && node->keys[i] == key) return 1;
  if (node->leaf) return 0;
  return search_btree(node->children[i], key);
}`,
      operations: `void split_child(/* parent, index, degree */) {
  /* split overflow child and promote median key */
}`,
      advanced: `/* Advanced: deletion with predecessor/successor replacement. */`
    }
  },
    theoryLinks: [
    { title: 'B-Tree Intro', url: 'https://www.geeksforgeeks.org/introduction-of-b-tree-2/', platform: 'GeeksforGeeks'},
    { title: 'B-Tree', url: 'https://cp-algorithms.com/data_structures/btree.html', platform: 'CP Algorithms'}
  ],
  practiceLinks: [
    { title: 'B-Tree', url: 'https://cp-algorithms.com/data_structures/btree.html', platform: 'CP Algorithms'}
  ],
  visualNodes: ['8', '12', '15', '20', '24', '30', '35', '40'],
  visualCaption: 'Multi-key balanced nodes',
  visualForm: 'tree',
  visualScript: { kind: 'tree', autoGenerate: true },
});

export default BTreeSection;
