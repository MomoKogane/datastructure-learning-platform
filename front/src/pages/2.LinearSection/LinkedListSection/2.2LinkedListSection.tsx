import { createTopicSection } from '../../TopicSection/createTopicSection';

const LinkedListSection = createTopicSection({
  id: '2.2',
  name: 'Linked List',
  chapterNumber: '2.2',
  overview:
    'Linked lists are dynamic linear data structures where elements (nodes) are stored in arbitrary memory locations and connected through pointers. Unlike arrays, linked lists can grow or shrink during runtime and do not require contiguous memory allocation.',
  concepts: [
    {
      title: 'Node Structure',
      content: 'Each node stores data and a pointer to the next node (and optionally previous node).',
      examples: ['struct Node { int data; Node* next; }', '[data|next] -> [data|next] -> NULL']
    },
    {
      title: 'Types of Linked Lists',
      content: 'Common variants include singly, doubly, and circular linked lists.',
      examples: ['Singly: A -> B -> C -> NULL', 'Doubly: A <-> B <-> C']
    },
    {
      title: 'Sequential Traversal',
      content: 'Random index access is not supported efficiently; traversal is from head node step by step.',
      examples: ['Access O(n)', 'Insert at head O(1)']
    }
  ],
  complexity: {
    time: {
      access: 'O(n)',
      search: 'O(n)',
      insertion: 'O(1) at head, O(n) at position',
      deletion: 'O(1) at head, O(n) at position'
    },
    space: 'O(n)'
  },
  operations: [
    {
      name: 'Insert at Head',
      description: 'Insert a new node right after the head node',
      steps: ['Create new node', 'Set new.next to head.next', 'Set head.next to new node'],
      script: {
        kind: 'linked',
        autoGenerate: true,
        frames: []
      }
    },
    {
      name: 'Insert at Position',
      description: 'Add a new node at a specific position',
      steps: ['Traverse to position - 1', 'Link new node', 'Reconnect next pointers'],
      script: {
        kind: 'linked',
        autoGenerate: true,
        frames: []
      }
    },
    {
      name: 'Delete from Head',
      description: 'Delete the node right after the head node',
      steps: ['Check whether head.next is valid', 'Set head.next to head.next.next', 'Release removed node'],
      script: {
        kind: 'linked',
        autoGenerate: true,
        frames: []
      }
    },
    {
      name: 'Delete Current',
      description: 'Delete node at the selected position',
      steps: ['Select target node index', 'Relink previous node to next node', 'Release removed node'],
      script: {
        kind: 'linked',
        autoGenerate: true,
        frames: []
      }
    },
    {
      name: 'Modify',
      description: 'Modify node value at the selected position',
      steps: ['Select target node index', 'Validate node is not head/NULL', 'Write updated value'],
      script: {
        kind: 'linked',
        autoGenerate: true,
        frames: []
      }
    }
  ],
  exercises: [
    {
      title: 'Reverse a Linked List',
      difficulty: 'Easy',
      description: 'Given the head of a singly linked list, reverse the list and return the new head.',
      hints: [
        'Think about changing the direction of pointers',
        'Track previous, current, and next nodes',
        'The original head becomes the tail after reversal'
      ],
      solutions: `#include <iostream>

struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(nullptr) {}
};

ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    ListNode* curr = head;
    while (curr) {
        ListNode* nxt = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nxt;
    }
    return prev;
}`
    },
    {
      title: 'Detect Cycle in Linked List',
      difficulty: 'Medium',
      description: 'Determine if a linked list has a cycle using fast and slow pointers.',
      hints: ['Use two pointers moving at different speeds', 'If they meet, there is a cycle']
    },
    {
      title: 'Merge Two Sorted Lists',
      difficulty: 'Easy',
      description: 'Merge two sorted linked lists and return one sorted list.',
      hints: ['Use a dummy node', 'Attach the smaller node each step']
    }
  ],
  practiceExampleLanguage: 'cpp',
    theoryLinks: [
    {
          title: 'GeeksforGeeks - Linked List Data Structure',
          url: 'https://www.geeksforgeeks.org/data-structures/linked-list/',
          platform: 'GeeksforGeeks'},
    {
          title: 'OI Wiki - Linked List',
          url: 'https://oiwiki.org/ds/linked-list/',
          platform: 'OI Wiki'}
  ],
  practiceLinks: [
    {
          title: 'LeetCode - Linked List Problems',
          url: 'https://leetcode.com/tag/linked-list/',
          platform: 'LeetCode'},
    {
          title: 'HackerRank - Linked Lists',
          url: 'https://www.hackerrank.com/domains/data-structures/linked-lists',
          platform: 'HackerRank'}
  ],
  visualNodes: ['Head', '10', '20', '30', 'NULL'],
  visualCaption: 'Node links from head to tail',
  visualForm: 'linked',
  visualScript: { kind: 'linked', autoGenerate: true },
  fallbackCodeExamples: {
    cpp: {
      basic: `#include <iostream>

struct Node {
    int data;
    Node* next;
    Node(int d) : data(d), next(nullptr) {}
};

int main() {
    Node* head = new Node(10);
    head->next = new Node(20);
    head->next->next = new Node(30);
    return 0;
}`,
      operations: `#include <iostream>

struct Node {
    int data;
    Node* next;
    Node(int d) : data(d), next(nullptr) {}
};

void insertAtHead(Node*& head, int value) {
    Node* node = new Node(value);
    node->next = head;
    head = node;
}

Node* search(Node* head, int target) {
    while (head) {
        if (head->data == target) return head;
        head = head->next;
    }
    return nullptr;
}`,
      advanced: `#include <iostream>

struct Node {
    int data;
    Node* next;
    Node(int d) : data(d), next(nullptr) {}
};

bool hasCycle(Node* head) {
    Node* slow = head;
    Node* fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}`
    },
    c: {
      basic: `#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

Node* create_node(int value) {
    Node* n = (Node*)malloc(sizeof(Node));
    n->data = value;
    n->next = NULL;
    return n;
}`,
      operations: `#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

void insert_head(Node** head, int value) {
    Node* n = (Node*)malloc(sizeof(Node));
    n->data = value;
    n->next = *head;
    *head = n;
}

Node* search(Node* head, int target) {
    while (head) {
        if (head->data == target) return head;
        head = head->next;
    }
    return NULL;
}`,
      advanced: `typedef struct Node {
    int data;
    struct Node* next;
} Node;

int has_cycle(Node* head) {
    Node* slow = head;
    Node* fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return 1;
    }
    return 0;
}`
    },
    java: {
      basic: `class Node {
    int data;
    Node next;
    Node(int d) { data = d; }
}`,
      operations: `class LinkedListOps {
    Node head;

    void insertAtHead(int value) {
        Node node = new Node(value);
        node.next = head;
        head = node;
    }

    Node search(int target) {
        Node cur = head;
        while (cur != null) {
            if (cur.data == target) return cur;
            cur = cur.next;
        }
        return null;
    }
}`,
      advanced: `boolean hasCycle(Node head) {
    Node slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}`
    },
    python: {
      basic: `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None`,
      operations: `def insert_head(head, value):
    node = Node(value)
    node.next = head
    return node

def search(head, target):
    cur = head
    while cur:
        if cur.data == target:
            return cur
        cur = cur.next
    return None`,
      advanced: `def has_cycle(head):
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False`
    }
  }
});

export default LinkedListSection;
