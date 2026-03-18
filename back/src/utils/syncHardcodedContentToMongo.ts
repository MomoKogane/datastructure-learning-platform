import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import mongoose from 'mongoose';
import QuizBank, { type QuizBankTheorySection, type QuizBankQuestion } from '../models/QuizBank';

type SectionTemplateType = 'theory' | 'data-structure';
type SectionModuleName = 'theory' | 'visualization' | 'examples' | 'practice' | 'keyTakeaways';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dslp';

type TheorySection = {
  title: string;
  content: string;
  examples?: string[];
};

type TheoryQuizQuestion = {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: number | boolean | string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
};

type TheoryFile = {
  id: string;
  title?: string;
  subtitle?: string;
  type?: string;
  content?: {
    introduction?: string;
    sections?: TheorySection[];
    keyTakeaways?: string[];
    quizQuestions?: TheoryQuizQuestion[];
  };
};

type CatalogSection = {
  id: string;
  title: string;
  description: string;
};

type CatalogChapter = {
  id: string;
  title: string;
  description: string;
  sections: CatalogSection[];
};

type QuizTheoryPayload = {
  introduction: string;
  sections: QuizBankTheorySection[];
  keyTakeaways: string[];
  quizQuestions?: QuizBankQuestion[];
};

export type SectionAggregate = {
  sectionId: string;
  aliases: string[];
  chapterId?: string;
  chapterTitle?: string;
  sectionTitle?: string;
  templateType: SectionTemplateType;
  modules: Partial<Record<SectionModuleName, unknown>>;
  quizTheory?: QuizTheoryPayload;
  dataSources: {
    frontendFile?: string;
    backendTheoryFile?: string;
  };
};

type FrontExtractResult = {
  sectionId: string;
  templateType: SectionTemplateType;
  modules: Partial<Record<SectionModuleName, unknown>>;
  sourceFile: string;
};

type SupportedExampleLanguage = 'cpp' | 'c' | 'java' | 'python';
type ExampleTriple = { basic: string; operations: string; advanced: string };
type ExampleLanguageMap = Partial<Record<SupportedExampleLanguage, ExampleTriple>>;
type ExampleLevel = keyof ExampleTriple;

const legacyTheoryIdMap: Record<string, string> = {
  'basic-concepts': '1.1',
  '1.1-basic-concepts': '1.1',
  'complexity-analysis': '1.2',
  arrays: '2.1',
  '2.1-arrays': '2.1',
  'linked-lists': '2.2',
  '2.2-linked-lists': '2.2',
  stacks: '2.3',
  queues: '2.4',
  'string-basics': '3.1',
  'pattern-matching': '3.2',
  'pattern-matching-overview': '3.2.1',
  'bf-algorithm': '3.2.2',
  'kmp-algorithm': '3.2.3',
  'tree-basics': '4.1',
  'tree-traversal': '4.2',
  'binary-tree-basics': '4.3',
  'threaded-binary-tree': '4.4',
  'bst-basics': '4.5',
  'avl-tree': '4.6',
  'red-black-tree': '4.7',
  'multiway-balanced-tree': '4.8',
  'huffman-trees': '4.9',
  heap: '4.10',
  'graph-basics': '5.1',
  'graph-traversal-overview': '5.2.1',
  'graph-dfs': '5.2.2',
  'graph-bfs': '5.2.3',
  'shortest-path-overview': '5.3.1',
  'dijkstra-algorithm': '5.3.2',
  'bellman-ford-algorithm': '5.3.3',
  'floyd-algorithm': '5.3.4',
  'mst-overview': '5.4.1',
  'prim-algorithm': '5.4.2',
  'kruskal-algorithm': '5.4.3',
  'linear-search': '6.1',
  'binary-search': '6.2',
  'hash-tables': '6.3',
  'b-tree-search': '6.4',
  'b-plus-tree-search': '6.5',
  'insertion-sort': '7.1',
  'bubble-sort': '7.2',
  'selection-sort': '7.3',
  'shell-sort': '7.4',
  'quick-sort': '7.5',
  'merge-sort': '7.6',
  'heap-sort': '7.7',
  'radix-sort': '7.8',
  'bucket-sort': '7.9',
  'external-sort': '7.10',
  'sorting-analysis': '7.11'
};

const normalizeSectionId = (rawId: string): string => legacyTheoryIdMap[rawId] ?? rawId;

const reverseLegacyTheoryIdMap: Record<string, string> = Object.entries(legacyTheoryIdMap)
  .reduce<Record<string, string>>((acc, [alias, canonical]) => {
    if (!acc[canonical]) {
      acc[canonical] = alias;
    }
    return acc;
  }, {});

const hasRunnableCodeShape = (text: unknown): boolean => {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return false;
  }

  const normalized = text.trim();
  const commentOnly = /^(\/\/|\/\*)/.test(normalized);
  const codeMarkers = /(\#include\s*<|\bint\s+main\s*\(|\bclass\s+\w+|\bdef\s+\w+\(|\bpublic\s+class\b|printf\(|System\.out\.|heapq\.|std::|vector<|return\s+)/;

  if (!commentOnly) {
    return codeMarkers.test(normalized) || normalized.includes('\n');
  }

  return codeMarkers.test(normalized);
};

const isCommentOnlyTriple = (triple: unknown): boolean => {
  if (!isObject(triple)) {
    return true;
  }

  const basic = String(triple.basic ?? '');
  const operations = String(triple.operations ?? '');
  const advanced = String(triple.advanced ?? '');

  return !hasRunnableCodeShape(basic) && !hasRunnableCodeShape(operations) && !hasRunnableCodeShape(advanced);
};

const enhancedExamplesBySection: Record<string, ExampleLanguageMap> = {
  'threaded-binary-tree': {
    cpp: {
      basic: `#include <iostream>\n\nstruct Node {\n  int val;\n  Node* left;\n  Node* right;\n  bool ltag;\n  bool rtag;\n  explicit Node(int v) : val(v), left(nullptr), right(nullptr), ltag(false), rtag(false) {}\n};`,
      operations: `#include <iostream>\n\nstruct Node { int val; Node* left; Node* right; bool ltag; bool rtag; explicit Node(int v): val(v), left(nullptr), right(nullptr), ltag(false), rtag(false) {} };\n\nvoid setThread(Node* cur, Node*& pre) {\n  if (!cur) return;\n  setThread(cur->left, pre);\n  if (!cur->left) { cur->left = pre; cur->ltag = true; }\n  if (pre && !pre->right) { pre->right = cur; pre->rtag = true; }\n  pre = cur;\n  setThread(cur->right, pre);\n}`,
      advanced: `#include <vector>\n\nstruct Node { int val; Node* left; Node* right; bool ltag; bool rtag; explicit Node(int v): val(v), left(nullptr), right(nullptr), ltag(false), rtag(false) {} };\n\nstd::vector<int> inorderThreaded(Node* root) {\n  std::vector<int> out;\n  Node* cur = root;\n  while (cur && !cur->ltag && cur->left) cur = cur->left;\n  while (cur) {\n    out.push_back(cur->val);\n    if (cur->rtag) cur = cur->right;\n    else {\n      cur = cur->right;\n      while (cur && !cur->ltag && cur->left) cur = cur->left;\n    }\n  }\n  return out;\n}`
    },
    c: {
      basic: `#include <stdlib.h>\n\ntypedef struct Node {\n  int val;\n  struct Node* left;\n  struct Node* right;\n  int ltag;\n  int rtag;\n} Node;`,
      operations: `#include <stddef.h>\n\ntypedef struct Node { int val; struct Node* left; struct Node* right; int ltag; int rtag; } Node;\n\nvoid set_thread(Node* cur, Node** pre) {\n  if (cur == NULL) return;\n  set_thread(cur->left, pre);\n  if (cur->left == NULL) { cur->left = *pre; cur->ltag = 1; }\n  if (*pre != NULL && (*pre)->right == NULL) { (*pre)->right = cur; (*pre)->rtag = 1; }\n  *pre = cur;\n  set_thread(cur->right, pre);\n}`,
      advanced: `#include <stdio.h>\n\ntypedef struct Node { int val; struct Node* left; struct Node* right; int ltag; int rtag; } Node;\n\nvoid inorder_threaded(Node* root) {\n  Node* cur = root;\n  while (cur && !cur->ltag && cur->left) cur = cur->left;\n  while (cur) {\n    printf("%d ", cur->val);\n    if (cur->rtag) cur = cur->right;\n    else {\n      cur = cur->right;\n      while (cur && !cur->ltag && cur->left) cur = cur->left;\n    }\n  }\n}`
    },
    java: {
      basic: `class Node {\n  int val;\n  Node left, right;\n  boolean ltag, rtag;\n  Node(int v) { val = v; }\n}`,
      operations: `class ThreadedTree {\n  static class Node { int val; Node left, right; boolean ltag, rtag; Node(int v){val=v;} }\n  Node pre = null;\n  void setThread(Node cur) {\n    if (cur == null) return;\n    setThread(cur.left);\n    if (cur.left == null) { cur.left = pre; cur.ltag = true; }\n    if (pre != null && pre.right == null) { pre.right = cur; pre.rtag = true; }\n    pre = cur;\n    setThread(cur.right);\n  }\n}`,
      advanced: `import java.util.*;\n\nclass ThreadedTraversal {\n  static class Node { int val; Node left, right; boolean ltag, rtag; Node(int v){val=v;} }\n  static List<Integer> inorder(Node root) {\n    List<Integer> out = new ArrayList<>();\n    Node cur = root;\n    while (cur != null && !cur.ltag && cur.left != null) cur = cur.left;\n    while (cur != null) {\n      out.add(cur.val);\n      if (cur.rtag) cur = cur.right;\n      else {\n        cur = cur.right;\n        while (cur != null && !cur.ltag && cur.left != null) cur = cur.left;\n      }\n    }\n    return out;\n  }\n}`
    },
    python: {
      basic: `class Node:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n        self.ltag = False\n        self.rtag = False`,
      operations: `def set_thread(cur, pre):\n    if not cur:\n        return pre\n    pre = set_thread(cur.left, pre)\n    if cur.left is None:\n        cur.left = pre\n        cur.ltag = True\n    if pre and pre.right is None:\n        pre.right = cur\n        pre.rtag = True\n    pre = cur\n    return set_thread(cur.right, pre)`,
      advanced: `def inorder_threaded(root):\n    out = []\n    cur = root\n    while cur and (not cur.ltag) and cur.left:\n        cur = cur.left\n    while cur:\n        out.append(cur.val)\n        if cur.rtag:\n            cur = cur.right\n        else:\n            cur = cur.right\n            while cur and (not cur.ltag) and cur.left:\n                cur = cur.left\n    return out`
    }
  },
  'avl-tree': {
    cpp: {
      basic: `struct Node { int key, h; Node *l, *r; explicit Node(int k): key(k), h(1), l(nullptr), r(nullptr) {} };`,
      operations: `int height(Node* n){ return n? n->h : 0; }\nint bf(Node* n){ return n? height(n->l)-height(n->r) : 0; }\nNode* rotateRight(Node* y){ Node* x=y->l; Node* t2=x->r; x->r=y; y->l=t2; y->h=1+std::max(height(y->l),height(y->r)); x->h=1+std::max(height(x->l),height(x->r)); return x; }`,
      advanced: `Node* insert(Node* root, int key){ if(!root) return new Node(key); if(key<root->key) root->l=insert(root->l,key); else if(key>root->key) root->r=insert(root->r,key); else return root; root->h=1+std::max(height(root->l),height(root->r)); int b=bf(root); if(b>1 && key<root->l->key) return rotateRight(root); return root; }`
    },
    c: {
      basic: `typedef struct Node { int key, h; struct Node* l; struct Node* r; } Node;`,
      operations: `int height(Node* n){ return n? n->h : 0; }\nint bf(Node* n){ return n? height(n->l)-height(n->r) : 0; }`,
      advanced: `Node* rotate_right(Node* y){ Node* x=y->l; Node* t2=x->r; x->r=y; y->l=t2; return x; }`
    },
    java: {
      basic: `class Node { int key, h = 1; Node l, r; Node(int k){ key = k; } }`,
      operations: `int height(Node n){ return n == null ? 0 : n.h; }\nint bf(Node n){ return n == null ? 0 : height(n.l)-height(n.r); }`,
      advanced: `Node rotateRight(Node y){ Node x=y.l, t2=x.r; x.r=y; y.l=t2; y.h=1+Math.max(height(y.l),height(y.r)); x.h=1+Math.max(height(x.l),height(x.r)); return x; }`
    },
    python: {
      basic: `class Node:\n    def __init__(self, key):\n        self.key = key\n        self.h = 1\n        self.l = None\n        self.r = None`,
      operations: `def height(n):\n    return n.h if n else 0\n\ndef bf(n):\n    return height(n.l) - height(n.r) if n else 0`,
      advanced: `def rotate_right(y):\n    x = y.l\n    t2 = x.r\n    x.r = y\n    y.l = t2\n    y.h = 1 + max(height(y.l), height(y.r))\n    x.h = 1 + max(height(x.l), height(x.r))\n    return x`
    }
  },
  'red-black-tree': {
    cpp: {
      basic: `enum Color { RED, BLACK };\nstruct Node { int key; Color c; Node *l,*r,*p; explicit Node(int k): key(k), c(RED), l(nullptr), r(nullptr), p(nullptr) {} };`,
      operations: `bool red(Node* x){ return x && x->c==RED; }\nvoid rotateLeft(Node*& root, Node* x){ Node* y=x->r; x->r=y->l; if(y->l) y->l->p=x; y->p=x->p; if(!x->p) root=y; else if(x==x->p->l) x->p->l=y; else x->p->r=y; y->l=x; x->p=y; }`,
      advanced: `void fixAfterInsert(Node*& root, Node* z){ while(z->p && z->p->c==RED){ /* standard RB fix cases */ break; } root->c = BLACK; }`
    },
    c: {
      basic: `typedef enum { RED, BLACK } Color;\ntypedef struct Node { int key; Color c; struct Node *l,*r,*p; } Node;`,
      operations: `int is_red(Node* x){ return x != NULL && x->c == RED; }`,
      advanced: `void fix_after_insert(Node** root, Node* z){ while(z->p && z->p->c == RED){ break; } (*root)->c = BLACK; }`
    },
    java: {
      basic: `enum Color { RED, BLACK }\nclass Node { int key; Color c = Color.RED; Node l, r, p; Node(int k){ key = k; } }`,
      operations: `boolean red(Node x){ return x != null && x.c == Color.RED; }\nvoid rotateLeft(Node x){ /* link update omitted for brevity in snippet */ }`,
      advanced: `void fixAfterInsert(Node z){ while(z.p != null && z.p.c == Color.RED){ break; } root.c = Color.BLACK; }`
    },
    python: {
      basic: `class Node:\n    def __init__(self, key):\n        self.key = key\n        self.c = 'R'\n        self.l = self.r = self.p = None`,
      operations: `def is_red(x):\n    return x is not None and x.c == 'R'`,
      advanced: `def fix_after_insert(root, z):\n    while z.p and z.p.c == 'R':\n        break\n    root.c = 'B'\n    return root`
    }
  },
  'bst-basics': {
    cpp: {
      basic: `struct Node { int key; Node* l; Node* r; explicit Node(int k): key(k), l(nullptr), r(nullptr) {} };`,
      operations: `Node* insert(Node* root, int x){ if(!root) return new Node(x); if(x < root->key) root->l = insert(root->l, x); else if(x > root->key) root->r = insert(root->r, x); return root; }`,
      advanced: `Node* findMin(Node* root){ while(root && root->l) root = root->l; return root; }\nNode* erase(Node* root, int x){ if(!root) return nullptr; if(x < root->key) root->l = erase(root->l,x); else if(x > root->key) root->r = erase(root->r,x); else { if(!root->l) return root->r; if(!root->r) return root->l; Node* m=findMin(root->r); root->key=m->key; root->r=erase(root->r,m->key);} return root; }`
    },
    c: {
      basic: `typedef struct Node { int key; struct Node* l; struct Node* r; } Node;`,
      operations: `Node* insert(Node* root, int x){ if(!root){ Node* n=(Node*)malloc(sizeof(Node)); n->key=x; n->l=n->r=NULL; return n; } if(x < root->key) root->l=insert(root->l,x); else if(x>root->key) root->r=insert(root->r,x); return root; }`,
      advanced: `Node* find_min(Node* root){ while(root && root->l) root=root->l; return root; }`
    },
    java: {
      basic: `class Node { int key; Node l, r; Node(int k){ key = k; } }`,
      operations: `Node insert(Node root, int x){ if(root==null) return new Node(x); if(x<root.key) root.l=insert(root.l,x); else if(x>root.key) root.r=insert(root.r,x); return root; }`,
      advanced: `Node findMin(Node root){ while(root != null && root.l != null) root = root.l; return root; }`
    },
    python: {
      basic: `class Node:\n    def __init__(self, key):\n        self.key = key\n        self.l = None\n        self.r = None`,
      operations: `def insert(root, x):\n    if root is None:\n        return Node(x)\n    if x < root.key:\n        root.l = insert(root.l, x)\n    elif x > root.key:\n        root.r = insert(root.r, x)\n    return root`,
      advanced: `def find_min(root):\n    while root and root.l:\n        root = root.l\n    return root`
    }
  },
  'graph-traversal-overview': {
    cpp: {
      basic: `#include <vector>\nstd::vector<std::vector<int>> g = {{1,2},{0,3},{0},{1}};`,
      operations: `#include <queue>\n#include <vector>\nvoid bfs(const std::vector<std::vector<int>>& g, int s){ std::queue<int> q; std::vector<int> vis(g.size(),0); q.push(s); vis[s]=1; while(!q.empty()){ int u=q.front(); q.pop(); for(int v:g[u]) if(!vis[v]){ vis[v]=1; q.push(v);} } }`,
      advanced: `#include <vector>\nvoid dfs(const std::vector<std::vector<int>>& g, int u, std::vector<int>& vis){ vis[u]=1; for(int v:g[u]) if(!vis[v]) dfs(g,v,vis); }`
    },
    c: {
      basic: `#define N 4\nint graph[N][N]={{0,1,1,0},{1,0,0,1},{1,0,0,0},{0,1,0,0}};`,
      operations: `void bfs(int graph[][4], int start){ int q[32], head=0, tail=0, vis[4]={0}; q[tail++]=start; vis[start]=1; while(head<tail){ int u=q[head++]; for(int v=0; v<4; ++v) if(graph[u][v] && !vis[v]){ vis[v]=1; q[tail++]=v; } } }`,
      advanced: `void dfs(int graph[][4], int u, int vis[]){ vis[u]=1; for(int v=0; v<4; ++v) if(graph[u][v] && !vis[v]) dfs(graph,v,vis); }`
    },
    java: {
      basic: `import java.util.*;\nMap<Integer, List<Integer>> g = new HashMap<>();`,
      operations: `void bfs(Map<Integer, List<Integer>> g, int s){ Queue<Integer> q=new ArrayDeque<>(); Set<Integer> vis=new HashSet<>(); q.offer(s); vis.add(s); while(!q.isEmpty()){ int u=q.poll(); for(int v:g.getOrDefault(u, List.of())) if(vis.add(v)) q.offer(v); } }`,
      advanced: `void dfs(Map<Integer, List<Integer>> g, int u, Set<Integer> vis){ if(!vis.add(u)) return; for(int v:g.getOrDefault(u, List.of())) dfs(g,v,vis); }`
    },
    python: {
      basic: `graph = {0: [1, 2], 1: [0, 3], 2: [0], 3: [1]}`,
      operations: `from collections import deque\ndef bfs(graph, start):\n    q = deque([start])\n    vis = {start}\n    while q:\n        u = q.popleft()\n        for v in graph.get(u, []):\n            if v not in vis:\n                vis.add(v)\n                q.append(v)`,
      advanced: `def dfs(graph, u, vis):\n    if u in vis:\n        return\n    vis.add(u)\n    for v in graph.get(u, []):\n        dfs(graph, v, vis)`
    }
  },
  'graph-dfs': {
    cpp: {
      basic: `#include <vector>\nstd::vector<std::vector<int>> g = {{1,2},{3},{},{} };`,
      operations: `void dfs(const std::vector<std::vector<int>>& g, int u, std::vector<int>& vis){ vis[u]=1; for(int v:g[u]) if(!vis[v]) dfs(g,v,vis); }`,
      advanced: `#include <stack>\nvoid dfsIter(const std::vector<std::vector<int>>& g, int s){ std::stack<int> st; std::vector<int> vis(g.size(),0); st.push(s); while(!st.empty()){ int u=st.top(); st.pop(); if(vis[u]) continue; vis[u]=1; for(int v:g[u]) if(!vis[v]) st.push(v); } }`
    },
    c: {
      basic: `#define N 5\nint graph[N][N]={{0,1,1,0,0},{0,0,0,1,0},{0,0,0,0,1},{0,0,0,0,0},{0,0,0,0,0}};`,
      operations: `void dfs(int graph[][5], int u, int vis[]){ vis[u]=1; for(int v=0; v<5; ++v) if(graph[u][v] && !vis[v]) dfs(graph,v,vis); }`,
      advanced: `void count_components(int graph[][5]){ int vis[5]={0}; int cnt=0; for(int i=0;i<5;i++) if(!vis[i]){ cnt++; dfs(graph,i,vis);} }`
    },
    java: {
      basic: `import java.util.*;\nMap<Integer, List<Integer>> g = new HashMap<>();`,
      operations: `void dfs(Map<Integer, List<Integer>> g, int u, Set<Integer> vis){ if(!vis.add(u)) return; for(int v : g.getOrDefault(u, List.of())) dfs(g, v, vis); }`,
      advanced: `void dfsIter(Map<Integer, List<Integer>> g, int s){ Deque<Integer> st = new ArrayDeque<>(); Set<Integer> vis = new HashSet<>(); st.push(s); while(!st.isEmpty()){ int u=st.pop(); if(!vis.add(u)) continue; for(int v: g.getOrDefault(u, List.of())) st.push(v); } }`
    },
    python: {
      basic: `graph = {0: [1, 2], 1: [3], 2: [4], 3: [], 4: []}`,
      operations: `def dfs(graph, u, vis):\n    if u in vis:\n        return\n    vis.add(u)\n    for v in graph.get(u, []):\n        dfs(graph, v, vis)`,
      advanced: `def dfs_iter(graph, s):\n    st = [s]\n    vis = set()\n    while st:\n        u = st.pop()\n        if u in vis:\n            continue\n        vis.add(u)\n        st.extend(graph.get(u, []))`
    }
  },
  'graph-bfs': {
    cpp: {
      basic: `#include <vector>\nstd::vector<std::vector<int>> g = {{1,2},{3},{3},{}};`,
      operations: `#include <queue>\n#include <vector>\nstd::vector<int> bfsOrder(const std::vector<std::vector<int>>& g, int s){ std::queue<int> q; std::vector<int> vis(g.size(),0), out; q.push(s); vis[s]=1; while(!q.empty()){ int u=q.front(); q.pop(); out.push_back(u); for(int v:g[u]) if(!vis[v]){ vis[v]=1; q.push(v);} } return out; }`,
      advanced: `#include <vector>\n#include <queue>\nstd::vector<int> shortestUnweighted(const std::vector<std::vector<int>>& g, int s){ std::vector<int> d(g.size(), -1); std::queue<int> q; d[s]=0; q.push(s); while(!q.empty()){ int u=q.front(); q.pop(); for(int v:g[u]) if(d[v]==-1){ d[v]=d[u]+1; q.push(v);} } return d; }`
    },
    c: {
      basic: `#define N 5\nint graph[N][N]={{0,1,1,0,0},{0,0,0,1,0},{0,0,0,1,1},{0,0,0,0,0},{0,0,0,0,0}};`,
      operations: `void bfs(int graph[][5], int s){ int q[64], head=0, tail=0, vis[5]={0}; q[tail++]=s; vis[s]=1; while(head<tail){ int u=q[head++]; for(int v=0; v<5; ++v){ if(graph[u][v] && !vis[v]){ vis[v]=1; q[tail++]=v; } } } }`,
      advanced: `void shortest_unweighted(int graph[][5], int s, int dist[]){ for(int i=0;i<5;++i) dist[i]=-1; int q[64], head=0, tail=0; q[tail++]=s; dist[s]=0; while(head<tail){ int u=q[head++]; for(int v=0; v<5; ++v){ if(graph[u][v] && dist[v]==-1){ dist[v]=dist[u]+1; q[tail++]=v; } } } }`
    },
    java: {
      basic: `import java.util.*;\nMap<Integer, List<Integer>> g = new HashMap<>();`,
      operations: `List<Integer> bfsOrder(Map<Integer, List<Integer>> g, int s){ Queue<Integer> q=new ArrayDeque<>(); Set<Integer> vis=new HashSet<>(); List<Integer> out=new ArrayList<>(); q.offer(s); vis.add(s); while(!q.isEmpty()){ int u=q.poll(); out.add(u); for(int v:g.getOrDefault(u,List.of())) if(vis.add(v)) q.offer(v); } return out; }`,
      advanced: `Map<Integer,Integer> shortestUnweighted(Map<Integer,List<Integer>> g, int s){ Map<Integer,Integer> d=new HashMap<>(); Queue<Integer> q=new ArrayDeque<>(); d.put(s,0); q.offer(s); while(!q.isEmpty()){ int u=q.poll(); for(int v:g.getOrDefault(u,List.of())) if(!d.containsKey(v)){ d.put(v,d.get(u)+1); q.offer(v);} } return d; }`
    },
    python: {
      basic: `graph = {0: [1, 2], 1: [3], 2: [3, 4], 3: [], 4: []}`,
      operations: `from collections import deque\ndef bfs_order(graph, s):\n    q = deque([s])\n    vis = {s}\n    out = []\n    while q:\n        u = q.popleft()\n        out.append(u)\n        for v in graph.get(u, []):\n            if v not in vis:\n                vis.add(v)\n                q.append(v)\n    return out`,
      advanced: `from collections import deque\ndef shortest_unweighted(graph, s):\n    d = {s: 0}\n    q = deque([s])\n    while q:\n        u = q.popleft()\n        for v in graph.get(u, []):\n            if v not in d:\n                d[v] = d[u] + 1\n                q.append(v)\n    return d`
    }
  },
  'shortest-path-overview': {
    cpp: {
      basic: `#include <vector>\n#include <queue>\nstd::vector<int> bfsDist(const std::vector<std::vector<int>>& g, int s){ std::vector<int> d(g.size(),-1); std::queue<int> q; d[s]=0; q.push(s); while(!q.empty()){ int u=q.front(); q.pop(); for(int v:g[u]) if(d[v]==-1){ d[v]=d[u]+1; q.push(v);} } return d; }`,
      operations: `#include <vector>\n#include <queue>\n#include <utility>\nstd::vector<int> dijkstra(const std::vector<std::vector<std::pair<int,int>>>& g, int s){ const int INF=1e9; std::vector<int> d(g.size(), INF); using P=std::pair<int,int>; std::priority_queue<P,std::vector<P>,std::greater<P>> pq; d[s]=0; pq.push({0,s}); while(!pq.empty()){ auto [du,u]=pq.top(); pq.pop(); if(du!=d[u]) continue; for(auto [v,w]:g[u]) if(du+w<d[v]){ d[v]=du+w; pq.push({d[v],v}); } } return d; }`,
      advanced: `#include <vector>\nstd::vector<int> bellmanFord(int n, const std::vector<std::vector<int>>& edges, int s){ const int INF=1e9; std::vector<int> d(n, INF); d[s]=0; for(int i=0;i<n-1;++i){ for(const auto& e:edges){ int u=e[0],v=e[1],w=e[2]; if(d[u]<INF && d[u]+w<d[v]) d[v]=d[u]+w; } } return d; }`
    },
    c: {
      basic: `void shortest_unweighted(int graph[][6], int s, int dist[]){ int q[128], head=0, tail=0; for(int i=0;i<6;++i) dist[i]=-1; dist[s]=0; q[tail++]=s; while(head<tail){ int u=q[head++]; for(int v=0; v<6; ++v){ if(graph[u][v] && dist[v]==-1){ dist[v]=dist[u]+1; q[tail++]=v; } } } }`,
      operations: `typedef struct { int to, w; } Edge;\nvoid dijkstra_adj_matrix(int n, int g[][6], int s, int dist[]){ int used[6]={0}; for(int i=0;i<n;++i) dist[i]=1000000000; dist[s]=0; for(int i=0;i<n;++i){ int u=-1; for(int j=0;j<n;++j) if(!used[j] && (u==-1 || dist[j]<dist[u])) u=j; used[u]=1; for(int v=0; v<n; ++v) if(g[u][v]>=0 && dist[u]+g[u][v]<dist[v]) dist[v]=dist[u]+g[u][v]; } }`,
      advanced: `typedef struct { int u,v,w; } Edge;\nvoid bellman_ford(int n, Edge edges[], int m, int s, int dist[]){ for(int i=0;i<n;++i) dist[i]=1000000000; dist[s]=0; for(int i=0;i<n-1;++i) for(int j=0;j<m;++j){ int u=edges[j].u, v=edges[j].v, w=edges[j].w; if(dist[u]<1000000000 && dist[u]+w<dist[v]) dist[v]=dist[u]+w; } }`
    },
    java: {
      basic: `Map<Integer, Integer> unweightedDist(Map<Integer, List<Integer>> g, int s){ Queue<Integer> q=new ArrayDeque<>(); Map<Integer,Integer> d=new HashMap<>(); d.put(s,0); q.offer(s); while(!q.isEmpty()){ int u=q.poll(); for(int v:g.getOrDefault(u,List.of())) if(!d.containsKey(v)){ d.put(v,d.get(u)+1); q.offer(v); } } return d; }`,
      operations: `Map<Integer, Integer> dijkstra(Map<Integer, List<int[]>> g, int s){ Map<Integer,Integer> d=new HashMap<>(); PriorityQueue<int[]> pq=new PriorityQueue<>(Comparator.comparingInt(a->a[0])); d.put(s,0); pq.offer(new int[]{0,s}); while(!pq.isEmpty()){ int[] cur=pq.poll(); if(cur[0]!=d.getOrDefault(cur[1], Integer.MAX_VALUE)) continue; for(int[] e:g.getOrDefault(cur[1], List.of())){ int nd=cur[0]+e[1]; if(nd<d.getOrDefault(e[0], Integer.MAX_VALUE)){ d.put(e[0], nd); pq.offer(new int[]{nd,e[0]}); } } } return d; }`,
      advanced: `int[] bellmanFord(int n, int[][] edges, int s){ int INF=1_000_000_000; int[] d=new int[n]; java.util.Arrays.fill(d, INF); d[s]=0; for(int i=0;i<n-1;i++) for(int[] e:edges) if(d[e[0]]<INF && d[e[0]]+e[2]<d[e[1]]) d[e[1]]=d[e[0]]+e[2]; return d; }`
    },
    python: {
      basic: `from collections import deque\ndef unweighted_dist(graph, s):\n    d = {s: 0}\n    q = deque([s])\n    while q:\n        u = q.popleft()\n        for v in graph.get(u, []):\n            if v not in d:\n                d[v] = d[u] + 1\n                q.append(v)\n    return d`,
      operations: `import heapq\ndef dijkstra(graph, s):\n    d = {s: 0}\n    pq = [(0, s)]\n    while pq:\n        du, u = heapq.heappop(pq)\n        if du != d.get(u, float('inf')):\n            continue\n        for v, w in graph.get(u, []):\n            nd = du + w\n            if nd < d.get(v, float('inf')):\n                d[v] = nd\n                heapq.heappush(pq, (nd, v))\n    return d`,
      advanced: `def bellman_ford(n, edges, s):\n    INF = 10**18\n    d = [INF] * n\n    d[s] = 0\n    for _ in range(n - 1):\n        for u, v, w in edges:\n            if d[u] < INF and d[u] + w < d[v]:\n                d[v] = d[u] + w\n    return d`
    }
  },
  'dijkstra-algorithm': {
    cpp: {
      basic: `#include <queue>\n#include <utility>\n#include <vector>\nstd::vector<int> dijkstra(const std::vector<std::vector<std::pair<int,int>>>& g, int s){ const int INF=1e9; std::vector<int> d(g.size(),INF); using P=std::pair<int,int>; std::priority_queue<P,std::vector<P>,std::greater<P>> pq; d[s]=0; pq.push({0,s}); while(!pq.empty()){ auto [du,u]=pq.top(); pq.pop(); if(du!=d[u]) continue; for(auto [v,w]:g[u]) if(du+w<d[v]){ d[v]=du+w; pq.push({d[v],v}); } } return d; }`,
      operations: `#include <vector>\nstd::vector<int> parentPath(const std::vector<int>& parent, int t){ std::vector<int> path; for(int cur=t; cur!=-1; cur=parent[cur]) path.push_back(cur); std::reverse(path.begin(), path.end()); return path; }`,
      advanced: `bool hasNegativeEdge(const std::vector<std::vector<std::pair<int,int>>>& g){ for(const auto& row:g) for(auto [v,w]:row) if(w<0) return true; return false; }`
    },
    c: {
      basic: `void dijkstra_matrix(int n, int g[][6], int s, int dist[]){ int used[6]={0}; for(int i=0;i<n;++i) dist[i]=1000000000; dist[s]=0; for(int i=0;i<n;++i){ int u=-1; for(int j=0;j<n;++j) if(!used[j] && (u==-1 || dist[j]<dist[u])) u=j; used[u]=1; for(int v=0; v<n; ++v) if(g[u][v]>=0 && dist[u]+g[u][v]<dist[v]) dist[v]=dist[u]+g[u][v]; } }`,
      operations: `void rebuild_path(int parent[], int t, int out[], int* len){ int tmp[64], n=0; while(t!=-1){ tmp[n++]=t; t=parent[t]; } *len=0; while(n--) out[(*len)++]=tmp[n]; }`,
      advanced: `int has_negative_edge(int n, int g[][6]){ for(int i=0;i<n;++i) for(int j=0;j<n;++j) if(g[i][j] < 0) return 1; return 0; }`
    },
    java: {
      basic: `Map<Integer, Integer> dijkstra(Map<Integer, List<int[]>> g, int s){ Map<Integer,Integer> d=new HashMap<>(); PriorityQueue<int[]> pq=new PriorityQueue<>(Comparator.comparingInt(a->a[0])); d.put(s,0); pq.offer(new int[]{0,s}); while(!pq.isEmpty()){ int[] cur=pq.poll(); if(cur[0]!=d.getOrDefault(cur[1], Integer.MAX_VALUE)) continue; for(int[] e:g.getOrDefault(cur[1], List.of())){ int nd=cur[0]+e[1]; if(nd<d.getOrDefault(e[0], Integer.MAX_VALUE)){ d.put(e[0], nd); pq.offer(new int[]{nd,e[0]}); } } } return d; }`,
      operations: `List<Integer> buildPath(int[] parent, int t){ List<Integer> path=new ArrayList<>(); for(int cur=t; cur!=-1; cur=parent[cur]) path.add(cur); Collections.reverse(path); return path; }`,
      advanced: `boolean hasNegativeEdge(Map<Integer, List<int[]>> g){ for(List<int[]> row:g.values()) for(int[] e:row) if(e[1]<0) return true; return false; }`
    },
    python: {
      basic: `import heapq\ndef dijkstra(graph, s):\n    d = {s: 0}\n    pq = [(0, s)]\n    while pq:\n        du, u = heapq.heappop(pq)\n        if du != d.get(u, float('inf')):\n            continue\n        for v, w in graph.get(u, []):\n            nd = du + w\n            if nd < d.get(v, float('inf')):\n                d[v] = nd\n                heapq.heappush(pq, (nd, v))\n    return d`,
      operations: `def build_path(parent, t):\n    path = []\n    cur = t\n    while cur != -1:\n        path.append(cur)\n        cur = parent[cur]\n    return list(reversed(path))`,
      advanced: `def has_negative_edge(graph):\n    return any(w < 0 for edges in graph.values() for _, w in edges)`
    }
  },
  'bellman-ford-algorithm': {
    cpp: {
      basic: `#include <vector>\nstruct Edge { int u,v,w; };\nstd::vector<int> bellmanFord(int n, const std::vector<Edge>& edges, int s){ const int INF=1e9; std::vector<int> d(n,INF); d[s]=0; for(int i=0;i<n-1;++i) for(const auto& e:edges) if(d[e.u]<INF && d[e.u]+e.w<d[e.v]) d[e.v]=d[e.u]+e.w; return d; }`,
      operations: `bool hasNegativeCycle(int n, const std::vector<Edge>& edges, const std::vector<int>& d){ for(const auto& e:edges) if(d[e.u] < 1000000000 && d[e.u] + e.w < d[e.v]) return true; return false; }`,
      advanced: `std::vector<int> parentTree(int n, const std::vector<Edge>& edges, int s){ const int INF=1e9; std::vector<int> d(n,INF), p(n,-1); d[s]=0; for(int i=0;i<n-1;++i) for(const auto& e:edges) if(d[e.u]<INF && d[e.u]+e.w<d[e.v]){ d[e.v]=d[e.u]+e.w; p[e.v]=e.u; } return p; }`
    },
    c: {
      basic: `typedef struct { int u,v,w; } Edge;\nvoid bellman_ford(int n, Edge edges[], int m, int s, int dist[]){ for(int i=0;i<n;++i) dist[i]=1000000000; dist[s]=0; for(int i=0;i<n-1;++i) for(int j=0;j<m;++j){ int u=edges[j].u,v=edges[j].v,w=edges[j].w; if(dist[u]<1000000000 && dist[u]+w<dist[v]) dist[v]=dist[u]+w; } }`,
      operations: `int has_negative_cycle(Edge edges[], int m, int dist[]){ for(int i=0;i<m;++i){ int u=edges[i].u,v=edges[i].v,w=edges[i].w; if(dist[u]<1000000000 && dist[u]+w<dist[v]) return 1; } return 0; }`,
      advanced: `void bellman_parent(int n, Edge edges[], int m, int s, int dist[], int parent[]){ for(int i=0;i<n;++i){ dist[i]=1000000000; parent[i]=-1; } dist[s]=0; for(int i=0;i<n-1;++i) for(int j=0;j<m;++j){ int u=edges[j].u,v=edges[j].v,w=edges[j].w; if(dist[u]<1000000000 && dist[u]+w<dist[v]){ dist[v]=dist[u]+w; parent[v]=u; } } }`
    },
    java: {
      basic: `int[] bellmanFord(int n, int[][] edges, int s){ int INF=1_000_000_000; int[] d=new int[n]; java.util.Arrays.fill(d, INF); d[s]=0; for(int i=0;i<n-1;i++) for(int[] e:edges) if(d[e[0]]<INF && d[e[0]]+e[2]<d[e[1]]) d[e[1]]=d[e[0]]+e[2]; return d; }`,
      operations: `boolean hasNegativeCycle(int[][] edges, int[] d){ for(int[] e:edges) if(d[e[0]]<1_000_000_000 && d[e[0]]+e[2]<d[e[1]]) return true; return false; }`,
      advanced: `int[] parentTree(int n, int[][] edges, int s){ int INF=1_000_000_000; int[] d=new int[n], p=new int[n]; java.util.Arrays.fill(d, INF); java.util.Arrays.fill(p, -1); d[s]=0; for(int i=0;i<n-1;i++) for(int[] e:edges) if(d[e[0]]<INF && d[e[0]]+e[2]<d[e[1]]){ d[e[1]]=d[e[0]]+e[2]; p[e[1]]=e[0]; } return p; }`
    },
    python: {
      basic: `def bellman_ford(n, edges, s):\n    INF = 10**18\n    d = [INF] * n\n    d[s] = 0\n    for _ in range(n - 1):\n        for u, v, w in edges:\n            if d[u] < INF and d[u] + w < d[v]:\n                d[v] = d[u] + w\n    return d`,
      operations: `def has_negative_cycle(edges, d):\n    INF = 10**18\n    for u, v, w in edges:\n        if d[u] < INF and d[u] + w < d[v]:\n            return True\n    return False`,
      advanced: `def parent_tree(n, edges, s):\n    INF = 10**18\n    d = [INF] * n\n    p = [-1] * n\n    d[s] = 0\n    for _ in range(n - 1):\n        for u, v, w in edges:\n            if d[u] < INF and d[u] + w < d[v]:\n                d[v] = d[u] + w\n                p[v] = u\n    return p`
    }
  },
  'floyd-algorithm': {
    cpp: {
      basic: `#include <vector>\nvoid floyd(std::vector<std::vector<int>>& d){ int n=(int)d.size(); for(int k=0;k<n;++k) for(int i=0;i<n;++i) for(int j=0;j<n;++j) if(d[i][k]<1e9 && d[k][j]<1e9) d[i][j]=std::min(d[i][j], d[i][k]+d[k][j]); }`,
      operations: `bool hasNegativeCycle(const std::vector<std::vector<int>>& d){ for(int i=0;i<(int)d.size(); ++i) if(d[i][i] < 0) return true; return false; }`,
      advanced: `std::vector<int> rebuildPath(int u, int v, const std::vector<std::vector<int>>& next){ if(next[u][v]==-1) return {}; std::vector<int> path={u}; while(u!=v){ u=next[u][v]; path.push_back(u);} return path; }`
    },
    c: {
      basic: `void floyd(int n, int d[][8]){ for(int k=0;k<n;++k) for(int i=0;i<n;++i) for(int j=0;j<n;++j) if(d[i][k]<1000000000 && d[k][j]<1000000000 && d[i][k]+d[k][j]<d[i][j]) d[i][j]=d[i][k]+d[k][j]; }`,
      operations: `int has_negative_cycle(int n, int d[][8]){ for(int i=0;i<n;++i) if(d[i][i] < 0) return 1; return 0; }`,
      advanced: `void init_next(int n, int d[][8], int nxt[][8]){ for(int i=0;i<n;++i) for(int j=0;j<n;++j) nxt[i][j] = (d[i][j] >= 1000000000 ? -1 : j); }`
    },
    java: {
      basic: `void floyd(int[][] d){ int n=d.length; for(int k=0;k<n;k++) for(int i=0;i<n;i++) for(int j=0;j<n;j++) if(d[i][k] < 1_000_000_000 && d[k][j] < 1_000_000_000 && d[i][k]+d[k][j] < d[i][j]) d[i][j]=d[i][k]+d[k][j]; }`,
      operations: `boolean hasNegativeCycle(int[][] d){ for(int i=0;i<d.length;i++) if(d[i][i] < 0) return true; return false; }`,
      advanced: `java.util.List<Integer> rebuildPath(int u, int v, int[][] next){ if(next[u][v] == -1) return java.util.List.of(); java.util.ArrayList<Integer> p = new java.util.ArrayList<>(); p.add(u); while(u != v){ u = next[u][v]; p.add(u); } return p; }`
    },
    python: {
      basic: `def floyd(d):\n    n = len(d)\n    for k in range(n):\n        for i in range(n):\n            for j in range(n):\n                if d[i][k] < 10**18 and d[k][j] < 10**18:\n                    d[i][j] = min(d[i][j], d[i][k] + d[k][j])`,
      operations: `def has_negative_cycle(d):\n    return any(d[i][i] < 0 for i in range(len(d)))`,
      advanced: `def rebuild_path(u, v, nxt):\n    if nxt[u][v] == -1:\n        return []\n    path = [u]\n    while u != v:\n        u = nxt[u][v]\n        path.append(u)\n    return path`
    }
  },
  'prim-algorithm': {
    cpp: {
      basic: `#include <queue>\n#include <utility>\n#include <vector>\nint prim(const std::vector<std::vector<std::pair<int,int>>>& g){ int n=(int)g.size(), sum=0; std::vector<int> vis(n,0); using P=std::pair<int,int>; std::priority_queue<P,std::vector<P>,std::greater<P>> pq; pq.push({0,0}); while(!pq.empty()){ auto [w,u]=pq.top(); pq.pop(); if(vis[u]) continue; vis[u]=1; sum += w; for(auto [v,c]:g[u]) if(!vis[v]) pq.push({c,v}); } return sum; }`,
      operations: `#include <vector>\nbool allVisited(const std::vector<int>& vis){ for(int x:vis) if(!x) return false; return true; }`,
      advanced: `#include <vector>\nint primDense(const std::vector<std::vector<int>>& w){ int n=(int)w.size(); std::vector<int> minW(n, 1e9), vis(n,0); minW[0]=0; int ans=0; for(int i=0;i<n;++i){ int u=-1; for(int j=0;j<n;++j) if(!vis[j] && (u==-1 || minW[j] < minW[u])) u=j; vis[u]=1; ans += minW[u]; for(int v=0; v<n; ++v) if(!vis[v] && w[u][v] < minW[v]) minW[v] = w[u][v]; } return ans; }`
    },
    c: {
      basic: `int prim_matrix(int n, int g[][8]){ int vis[8]={0}, minW[8], ans=0; for(int i=0;i<n;++i) minW[i]=1000000000; minW[0]=0; for(int i=0;i<n;++i){ int u=-1; for(int j=0;j<n;++j) if(!vis[j] && (u==-1 || minW[j]<minW[u])) u=j; vis[u]=1; ans += minW[u]; for(int v=0; v<n; ++v) if(!vis[v] && g[u][v] < minW[v]) minW[v] = g[u][v]; } return ans; }`,
      operations: `int is_connected(int n, int vis[]){ for(int i=0;i<n;++i) if(!vis[i]) return 0; return 1; }`,
      advanced: `void update_min_edge(int n, int g[][8], int u, int vis[], int minW[]){ for(int v=0; v<n; ++v) if(!vis[v] && g[u][v] < minW[v]) minW[v] = g[u][v]; }`
    },
    java: {
      basic: `int prim(List<List<int[]>> g){ int n=g.size(), sum=0; boolean[] vis=new boolean[n]; PriorityQueue<int[]> pq=new PriorityQueue<>(java.util.Comparator.comparingInt(a->a[0])); pq.offer(new int[]{0,0}); while(!pq.isEmpty()){ int[] cur=pq.poll(); int w=cur[0], u=cur[1]; if(vis[u]) continue; vis[u]=true; sum += w; for(int[] e:g.get(u)) if(!vis[e[0]]) pq.offer(new int[]{e[1], e[0]}); } return sum; }`,
      operations: `boolean allVisited(boolean[] vis){ for(boolean x:vis) if(!x) return false; return true; }`,
      advanced: `int primDense(int[][] w){ int n=w.length, ans=0; boolean[] vis=new boolean[n]; int[] minW=new int[n]; java.util.Arrays.fill(minW, 1_000_000_000); minW[0]=0; for(int i=0;i<n;i++){ int u=-1; for(int j=0;j<n;j++) if(!vis[j] && (u==-1 || minW[j]<minW[u])) u=j; vis[u]=true; ans += minW[u]; for(int v=0; v<n; v++) if(!vis[v] && w[u][v] < minW[v]) minW[v]=w[u][v]; } return ans; }`
    },
    python: {
      basic: `import heapq\ndef prim(graph):\n    n = len(graph)\n    vis = [False] * n\n    pq = [(0, 0)]\n    total = 0\n    while pq:\n        w, u = heapq.heappop(pq)\n        if vis[u]:\n            continue\n        vis[u] = True\n        total += w\n        for v, c in graph[u]:\n            if not vis[v]:\n                heapq.heappush(pq, (c, v))\n    return total`,
      operations: `def all_visited(vis):\n    return all(vis)`,
      advanced: `def prim_dense(w):\n    n = len(w)\n    vis = [False] * n\n    min_w = [10**18] * n\n    min_w[0] = 0\n    ans = 0\n    for _ in range(n):\n        u = min((i for i in range(n) if not vis[i]), key=lambda i: min_w[i])\n        vis[u] = True\n        ans += min_w[u]\n        for v in range(n):\n            if not vis[v] and w[u][v] < min_w[v]:\n                min_w[v] = w[u][v]\n    return ans`
    }
  },
  'kruskal-algorithm': {
    cpp: {
      basic: `#include <algorithm>\n#include <vector>\nstruct Edge{int u,v,w;};\nstruct DSU{ std::vector<int> p,r; explicit DSU(int n): p(n),r(n,0){ for(int i=0;i<n;++i)p[i]=i;} int find(int x){ return p[x]==x?x:p[x]=find(p[x]); } bool unite(int a,int b){ a=find(a); b=find(b); if(a==b) return false; if(r[a]<r[b]) std::swap(a,b); p[b]=a; if(r[a]==r[b]) r[a]++; return true; }};`,
      operations: `int kruskal(int n, std::vector<Edge>& edges){ std::sort(edges.begin(), edges.end(), [](const Edge& a,const Edge& b){ return a.w<b.w; }); DSU dsu(n); int sum=0; for(const auto& e:edges) if(dsu.unite(e.u,e.v)) sum+=e.w; return sum; }`,
      advanced: `bool isConnectedMst(int n, const std::vector<Edge>& mst){ return (int)mst.size() == n - 1; }`
    },
    c: {
      basic: `typedef struct { int u,v,w; } Edge;\nint parent[128], rnk[128];\nint find(int x){ return parent[x]==x?x:(parent[x]=find(parent[x])); }\nint unite(int a,int b){ a=find(a); b=find(b); if(a==b) return 0; if(rnk[a]<rnk[b]){ int t=a;a=b;b=t;} parent[b]=a; if(rnk[a]==rnk[b]) rnk[a]++; return 1; }`,
      operations: `int kruskal(int n, Edge edges[], int m){ int sum=0; for(int i=0;i<n;++i){ parent[i]=i; rnk[i]=0; } /* sort edges by weight before loop */ for(int i=0;i<m;++i) if(unite(edges[i].u, edges[i].v)) sum += edges[i].w; return sum; }`,
      advanced: `int mst_edge_count_ok(int n, int picked){ return picked == n - 1; }`
    },
    java: {
      basic: `class Edge { int u, v, w; Edge(int u,int v,int w){ this.u=u; this.v=v; this.w=w; } }\nclass DSU { int[] p, r; DSU(int n){ p=new int[n]; r=new int[n]; for(int i=0;i<n;i++) p[i]=i; } int find(int x){ return p[x]==x?x:(p[x]=find(p[x])); } boolean unite(int a,int b){ a=find(a); b=find(b); if(a==b) return false; if(r[a]<r[b]){ int t=a;a=b;b=t; } p[b]=a; if(r[a]==r[b]) r[a]++; return true; } }`,
      operations: `int kruskal(int n, java.util.List<Edge> edges){ edges.sort(java.util.Comparator.comparingInt(e->e.w)); DSU dsu=new DSU(n); int sum=0; for(Edge e:edges) if(dsu.unite(e.u,e.v)) sum += e.w; return sum; }`,
      advanced: `boolean mstEdgeCountOk(int n, int picked){ return picked == n - 1; }`
    },
    python: {
      basic: `class DSU:\n    def __init__(self, n):\n        self.p = list(range(n))\n        self.r = [0] * n\n    def find(self, x):\n        if self.p[x] != x:\n            self.p[x] = self.find(self.p[x])\n        return self.p[x]\n    def unite(self, a, b):\n        a, b = self.find(a), self.find(b)\n        if a == b:\n            return False\n        if self.r[a] < self.r[b]:\n            a, b = b, a\n        self.p[b] = a\n        if self.r[a] == self.r[b]:\n            self.r[a] += 1\n        return True`,
      operations: `def kruskal(n, edges):\n    dsu = DSU(n)\n    total = 0\n    for u, v, w in sorted(edges, key=lambda e: e[2]):\n        if dsu.unite(u, v):\n            total += w\n    return total`,
      advanced: `def mst_edge_count_ok(n, picked):\n    return picked == n - 1`
    }
  },
  'mst-overview': {
    cpp: {
      basic: `#include <vector>\nstruct Edge { int u,v,w; };`,
      operations: `bool formsCycle(int u, int v, const std::vector<int>& parent){ return parent[u] == parent[v]; }`,
      advanced: `int mstWeight(const std::vector<Edge>& mst){ int s=0; for(const auto& e:mst) s += e.w; return s; }`
    },
    c: {
      basic: `typedef struct { int u,v,w; } Edge;`,
      operations: `int mst_edges_ok(int n, int picked){ return picked == n - 1; }`,
      advanced: `int mst_weight(Edge mst[], int m){ int s=0; for(int i=0;i<m;++i) s += mst[i].w; return s; }`
    },
    java: {
      basic: `class Edge { int u, v, w; Edge(int u,int v,int w){ this.u=u; this.v=v; this.w=w; } }`,
      operations: `boolean mstEdgesOk(int n, int picked){ return picked == n - 1; }`,
      advanced: `int mstWeight(java.util.List<Edge> mst){ int s=0; for(Edge e:mst) s += e.w; return s; }`
    },
    python: {
      basic: `# edge represented as (u, v, w)`,
      operations: `def mst_edges_ok(n, picked):\n    return picked == n - 1`,
      advanced: `def mst_weight(mst):\n    return sum(w for _, _, w in mst)`
    }
  },
  'huffman-trees': {
    cpp: {
      basic: `#include <queue>\n#include <vector>\nstruct Node { int w; Node* l; Node* r; explicit Node(int x): w(x), l(nullptr), r(nullptr) {} };`,
      operations: `struct Cmp { bool operator()(const Node* a, const Node* b) const { return a->w > b->w; } };\nNode* build(std::vector<int> freq){ std::priority_queue<Node*, std::vector<Node*>, Cmp> pq; for(int f:freq) pq.push(new Node(f)); while(pq.size()>1){ Node* a=pq.top(); pq.pop(); Node* b=pq.top(); pq.pop(); Node* p=new Node(a->w+b->w); p->l=a; p->r=b; pq.push(p);} return pq.top(); }`,
      advanced: `#include <string>\n#include <unordered_map>\nvoid gen(Node* root, const std::string& path, std::unordered_map<int,std::string>& code){ if(!root) return; if(!root->l && !root->r){ code[root->w] = path; return; } gen(root->l, path + "0", code); gen(root->r, path + "1", code); }`
    },
    c: {
      basic: `typedef struct Node { int w; struct Node* l; struct Node* r; } Node;`,
      operations: `Node* merge(Node* a, Node* b){ Node* p=(Node*)malloc(sizeof(Node)); p->w=a->w+b->w; p->l=a; p->r=b; return p; }`,
      advanced: `void gen_code(Node* root, char path[], int d){ if(!root) return; if(!root->l && !root->r){ path[d]='\\0'; /* output path */ return; } path[d]='0'; gen_code(root->l,path,d+1); path[d]='1'; gen_code(root->r,path,d+1); }`
    },
    java: {
      basic: `class Node { int w; Node l, r; Node(int w){ this.w = w; } }`,
      operations: `Node build(int[] freq){ java.util.PriorityQueue<Node> pq = new java.util.PriorityQueue<>(java.util.Comparator.comparingInt(a->a.w)); for(int f:freq) pq.offer(new Node(f)); while(pq.size()>1){ Node a=pq.poll(), b=pq.poll(); Node p=new Node(a.w+b.w); p.l=a; p.r=b; pq.offer(p);} return pq.poll(); }`,
      advanced: `void gen(Node root, String path, java.util.Map<Integer,String> code){ if(root==null) return; if(root.l==null && root.r==null){ code.put(root.w, path); return; } gen(root.l, path+"0", code); gen(root.r, path+"1", code); }`
    },
    python: {
      basic: `import heapq\nclass Node:\n    def __init__(self, w, l=None, r=None):\n        self.w = w\n        self.l = l\n        self.r = r\n    def __lt__(self, other):\n        return self.w < other.w`,
      operations: `def build(freq):\n    pq = [Node(f) for f in freq]\n    heapq.heapify(pq)\n    while len(pq) > 1:\n        a = heapq.heappop(pq)\n        b = heapq.heappop(pq)\n        heapq.heappush(pq, Node(a.w + b.w, a, b))\n    return pq[0]`,
      advanced: `def gen(root, path='', out=None):\n    if out is None:\n        out = {}\n    if root is None:\n        return out\n    if root.l is None and root.r is None:\n        out[root.w] = path or '0'\n        return out\n    gen(root.l, path + '0', out)\n    gen(root.r, path + '1', out)\n    return out`
    }
  },
  'multiway-balanced-tree': {
    cpp: {
      basic: `#include <vector>\nstruct BNode { bool leaf=true; std::vector<int> keys; std::vector<BNode*> child; };`,
      operations: `void splitChild(BNode* x, int i, int t){ BNode* y=x->child[i]; BNode* z=new BNode(); z->leaf=y->leaf; z->keys.assign(y->keys.begin()+t, y->keys.end()); y->keys.resize(t-1); x->keys.insert(x->keys.begin()+i, y->keys[t-1]); x->child.insert(x->child.begin()+i+1, z); }`,
      advanced: `bool search(BNode* x, int k){ int i=0; while(i<(int)x->keys.size() && k>x->keys[i]) i++; if(i<(int)x->keys.size() && x->keys[i]==k) return true; if(x->leaf) return false; return search(x->child[i], k); }`
    },
    c: {
      basic: `#define MAX_KEYS 5\ntypedef struct BNode { int leaf; int n; int keys[MAX_KEYS]; struct BNode* child[MAX_KEYS+1]; } BNode;`,
      operations: `void split_child(BNode* x, int i){ /* standard B-Tree split */ }`,
      advanced: `int search(BNode* x, int k){ int i=0; while(i<x->n && k>x->keys[i]) i++; if(i<x->n && x->keys[i]==k) return 1; if(x->leaf) return 0; return search(x->child[i], k); }`
    },
    java: {
      basic: `class BNode { boolean leaf = true; java.util.List<Integer> keys = new java.util.ArrayList<>(); java.util.List<BNode> child = new java.util.ArrayList<>(); }`,
      operations: `void splitChild(BNode x, int i, int t){ BNode y=x.child.get(i); BNode z=new BNode(); z.leaf=y.leaf; for(int j=t;j<y.keys.size();j++) z.keys.add(y.keys.get(j)); while(y.keys.size()>t-1) y.keys.remove(y.keys.size()-1); x.keys.add(i, y.keys.remove(t-1)); x.child.add(i+1, z); }`,
      advanced: `boolean search(BNode x, int k){ int i=0; while(i<x.keys.size() && k>x.keys.get(i)) i++; if(i<x.keys.size() && x.keys.get(i)==k) return true; if(x.leaf) return false; return search(x.child.get(i), k); }`
    },
    python: {
      basic: `class BNode:\n    def __init__(self, leaf=True):\n        self.leaf = leaf\n        self.keys = []\n        self.child = []`,
      operations: `def split_child(x, i, t):\n    y = x.child[i]\n    z = BNode(y.leaf)\n    z.keys = y.keys[t:]\n    mid = y.keys[t - 1]\n    y.keys = y.keys[:t - 1]\n    x.keys.insert(i, mid)\n    x.child.insert(i + 1, z)`,
      advanced: `def search(x, k):\n    i = 0\n    while i < len(x.keys) and k > x.keys[i]:\n        i += 1\n    if i < len(x.keys) and x.keys[i] == k:\n        return True\n    if x.leaf:\n        return False\n    return search(x.child[i], k)`
    }
  },
  'bf-algorithm': {
    cpp: {
      basic: `#include <string>\nint bfFind(const std::string& t, const std::string& p){ for(int i=0;i+(int)p.size()<=(int)t.size();++i){ int j=0; while(j<(int)p.size() && t[i+j]==p[j]) ++j; if(j==(int)p.size()) return i; } return -1; }`,
      operations: `#include <string>\n#include <vector>\nstd::vector<int> bfAll(const std::string& t, const std::string& p){ std::vector<int> pos; for(int i=0;i+(int)p.size()<=(int)t.size();++i){ int j=0; while(j<(int)p.size() && t[i+j]==p[j]) ++j; if(j==(int)p.size()) pos.push_back(i);} return pos; }`,
      advanced: `bool bfMatchAt(const std::string& t, const std::string& p, int i){ if(i+(int)p.size()>(int)t.size()) return false; for(int j=0;j<(int)p.size();++j) if(t[i+j]!=p[j]) return false; return true; }`
    },
    c: {
      basic: `#include <string.h>\nint bf_find(const char* t, const char* p){ int n=(int)strlen(t), m=(int)strlen(p); for(int i=0;i+m<=n;++i){ int j=0; while(j<m && t[i+j]==p[j]) ++j; if(j==m) return i; } return -1; }`,
      operations: `int bf_count(const char* t, const char* p){ int n=(int)strlen(t), m=(int)strlen(p), cnt=0; for(int i=0;i+m<=n;++i){ int j=0; while(j<m && t[i+j]==p[j]) ++j; if(j==m) cnt++; } return cnt; }`,
      advanced: `int bf_match_at(const char* t, const char* p, int i){ int m=(int)strlen(p); for(int j=0;j<m;++j) if(t[i+j]!=p[j]) return 0; return 1; }`
    },
    java: {
      basic: `int bfFind(String t, String p){ for(int i=0;i+p.length()<=t.length();i++){ int j=0; while(j<p.length() && t.charAt(i+j)==p.charAt(j)) j++; if(j==p.length()) return i; } return -1; }`,
      operations: `java.util.List<Integer> bfAll(String t, String p){ java.util.ArrayList<Integer> out=new java.util.ArrayList<>(); for(int i=0;i+p.length()<=t.length();i++){ int j=0; while(j<p.length() && t.charAt(i+j)==p.charAt(j)) j++; if(j==p.length()) out.add(i); } return out; }`,
      advanced: `boolean bfMatchAt(String t, String p, int i){ if(i+p.length()>t.length()) return false; for(int j=0;j<p.length();j++) if(t.charAt(i+j)!=p.charAt(j)) return false; return true; }`
    },
    python: {
      basic: `def bf_find(t, p):\n    for i in range(len(t) - len(p) + 1):\n        j = 0\n        while j < len(p) and t[i + j] == p[j]:\n            j += 1\n        if j == len(p):\n            return i\n    return -1`,
      operations: `def bf_all(t, p):\n    out = []\n    for i in range(len(t) - len(p) + 1):\n        if t[i:i + len(p)] == p:\n            out.append(i)\n    return out`,
      advanced: `def bf_match_at(t, p, i):\n    return i + len(p) <= len(t) and t[i:i + len(p)] == p`
    }
  },
  'kmp-algorithm': {
    cpp: {
      basic: `#include <string>\n#include <vector>\nstd::vector<int> lps(const std::string& p){ std::vector<int> f(p.size(),0); for(size_t i=1,j=0;i<p.size();){ if(p[i]==p[j]) f[i++]=++j; else if(j) j=f[j-1]; else f[i++]=0; } return f; }`,
      operations: `#include <string>\n#include <vector>\nint kmpFind(const std::string& t, const std::string& p){ auto f=lps(p); for(size_t i=0,j=0;i<t.size();){ if(t[i]==p[j]){ i++; j++; if(j==p.size()) return (int)(i-j);} else if(j) j=f[j-1]; else i++; } return -1; }`,
      advanced: `#include <string>\n#include <vector>\nstd::vector<int> kmpAll(const std::string& t, const std::string& p){ auto f=lps(p); std::vector<int> out; for(size_t i=0,j=0;i<t.size();){ if(t[i]==p[j]){ i++; j++; if(j==p.size()){ out.push_back((int)(i-j)); j=f[j-1]; }} else if(j) j=f[j-1]; else i++; } return out; }`
    },
    c: {
      basic: `#include <string.h>\nvoid build_lps(const char* p, int lps[]){ int m=(int)strlen(p), len=0; lps[0]=0; for(int i=1;i<m;){ if(p[i]==p[len]) lps[i++]=++len; else if(len) len=lps[len-1]; else lps[i++]=0; } }`,
      operations: `int kmp_find(const char* t, const char* p){ int n=(int)strlen(t), m=(int)strlen(p); int lps[256]; build_lps(p,lps); for(int i=0,j=0;i<n;){ if(t[i]==p[j]){ i++; j++; if(j==m) return i-j; } else if(j) j=lps[j-1]; else i++; } return -1; }`,
      advanced: `int kmp_count(const char* t, const char* p){ int n=(int)strlen(t), m=(int)strlen(p), cnt=0; int lps[256]; build_lps(p,lps); for(int i=0,j=0;i<n;){ if(t[i]==p[j]){ i++; j++; if(j==m){ cnt++; j=lps[j-1]; } } else if(j) j=lps[j-1]; else i++; } return cnt; }`
    },
    java: {
      basic: `int[] lps(String p){ int[] f=new int[p.length()]; for(int i=1,j=0;i<p.length();){ if(p.charAt(i)==p.charAt(j)) f[i++]=++j; else if(j>0) j=f[j-1]; else f[i++]=0; } return f; }`,
      operations: `int kmpFind(String t, String p){ int[] f=lps(p); for(int i=0,j=0;i<t.length();){ if(t.charAt(i)==p.charAt(j)){ i++; j++; if(j==p.length()) return i-j; } else if(j>0) j=f[j-1]; else i++; } return -1; }`,
      advanced: `java.util.List<Integer> kmpAll(String t, String p){ int[] f=lps(p); java.util.ArrayList<Integer> out=new java.util.ArrayList<>(); for(int i=0,j=0;i<t.length();){ if(t.charAt(i)==p.charAt(j)){ i++; j++; if(j==p.length()){ out.add(i-j); j=f[j-1]; } } else if(j>0) j=f[j-1]; else i++; } return out; }`
    },
    python: {
      basic: `def lps(p):\n    f = [0] * len(p)\n    i, j = 1, 0\n    while i < len(p):\n        if p[i] == p[j]:\n            j += 1\n            f[i] = j\n            i += 1\n        elif j:\n            j = f[j - 1]\n        else:\n            i += 1\n    return f`,
      operations: `def kmp_find(t, p):\n    f = lps(p)\n    i = j = 0\n    while i < len(t):\n        if t[i] == p[j]:\n            i += 1\n            j += 1\n            if j == len(p):\n                return i - j\n        elif j:\n            j = f[j - 1]\n        else:\n            i += 1\n    return -1`,
      advanced: `def kmp_all(t, p):\n    f = lps(p)\n    out = []\n    i = j = 0\n    while i < len(t):\n        if t[i] == p[j]:\n            i += 1\n            j += 1\n            if j == len(p):\n                out.append(i - j)\n                j = f[j - 1]\n        elif j:\n            j = f[j - 1]\n        else:\n            i += 1\n    return out`
    }
  },
  'external-sort': {
    cpp: {
      basic: `#include <algorithm>\n#include <vector>\nstd::vector<std::vector<int>> splitRuns(const std::vector<int>& data, int chunk){ std::vector<std::vector<int>> runs; for(size_t i=0;i<data.size();i+=chunk){ std::vector<int> run(data.begin()+i, data.begin()+std::min(data.size(), i+chunk)); std::sort(run.begin(), run.end()); runs.push_back(run); } return runs; }`,
      operations: `#include <queue>\n#include <tuple>\n#include <vector>\nstd::vector<int> mergeRuns(const std::vector<std::vector<int>>& runs){ using T=std::tuple<int,int,int>; std::priority_queue<T,std::vector<T>,std::greater<T>> pq; std::vector<int> out; for(int i=0;i<(int)runs.size();++i) if(!runs[i].empty()) pq.push({runs[i][0],i,0}); while(!pq.empty()){ auto [v,ri,idx]=pq.top(); pq.pop(); out.push_back(v); if(idx+1<(int)runs[ri].size()) pq.push({runs[ri][idx+1],ri,idx+1}); } return out; }`,
      advanced: `#include <vector>\nstd::vector<int> externalSortMock(const std::vector<int>& data){ auto runs = splitRuns(data, 4); return mergeRuns(runs); }`
    },
    c: {
      basic: `#include <stdlib.h>\nvoid sort_chunk(int a[], int n){ for(int i=1;i<n;++i){ int key=a[i], j=i-1; while(j>=0 && a[j]>key){ a[j+1]=a[j]; j--; } a[j+1]=key; } }`,
      operations: `typedef struct { int value; int run_id; int idx; } Node;\n/* use min-heap over run heads for k-way merge */`,
      advanced: `void external_sort_mock(int data[], int n){ /* split into chunks, sort each chunk, then k-way merge */ }`
    },
    java: {
      basic: `java.util.List<int[]> splitRuns(int[] data, int chunk){ java.util.ArrayList<int[]> runs=new java.util.ArrayList<>(); for(int i=0;i<data.length;i+=chunk){ int r=Math.min(data.length, i+chunk); int[] run=java.util.Arrays.copyOfRange(data,i,r); java.util.Arrays.sort(run); runs.add(run);} return runs; }`,
      operations: `java.util.List<Integer> mergeRuns(java.util.List<int[]> runs){ java.util.PriorityQueue<int[]> pq=new java.util.PriorityQueue<>(java.util.Comparator.comparingInt(a->a[0])); java.util.ArrayList<Integer> out=new java.util.ArrayList<>(); for(int i=0;i<runs.size();i++) if(runs.get(i).length>0) pq.offer(new int[]{runs.get(i)[0],i,0}); while(!pq.isEmpty()){ int[] cur=pq.poll(); out.add(cur[0]); int[] run=runs.get(cur[1]); int ni=cur[2]+1; if(ni<run.length) pq.offer(new int[]{run[ni],cur[1],ni}); } return out; }`,
      advanced: `java.util.List<Integer> externalSortMock(int[] data){ var runs = splitRuns(data, 4); return mergeRuns(runs); }`
    },
    python: {
      basic: `def split_runs(data, chunk):\n    runs = []\n    for i in range(0, len(data), chunk):\n        run = sorted(data[i:i + chunk])\n        runs.append(run)\n    return runs`,
      operations: `import heapq\ndef merge_runs(runs):\n    pq = []\n    out = []\n    for i, run in enumerate(runs):\n        if run:\n            heapq.heappush(pq, (run[0], i, 0))\n    while pq:\n        v, ri, idx = heapq.heappop(pq)\n        out.append(v)\n        if idx + 1 < len(runs[ri]):\n            heapq.heappush(pq, (runs[ri][idx + 1], ri, idx + 1))\n    return out`,
      advanced: `def external_sort_mock(data):\n    return merge_runs(split_runs(data, 4))`
    }
  }
};

const enhanceExamplesModule = (sectionId: string, examplesModule: unknown): unknown => {
  if (!isObject(examplesModule)) {
    return examplesModule;
  }

  const aliasKey = reverseLegacyTheoryIdMap[sectionId];
  const sectionKey = Object.prototype.hasOwnProperty.call(enhancedExamplesBySection, sectionId)
    ? sectionId
    : (aliasKey && Object.prototype.hasOwnProperty.call(enhancedExamplesBySection, aliasKey))
      ? aliasKey
      : sectionId;
  const sectionEnhancement = enhancedExamplesBySection[sectionKey];

  const fallbackRaw = isObject(examplesModule.fallbackCodeExamples)
    ? examplesModule.fallbackCodeExamples
    : {};

  const fallbackCodeExamples: Record<string, unknown> = { ...fallbackRaw };

  if (sectionEnhancement) {
    for (const language of Object.keys(sectionEnhancement) as SupportedExampleLanguage[]) {
      const patchedTriple = sectionEnhancement[language];
      if (!patchedTriple) {
        continue;
      }

      const existingTriple = fallbackCodeExamples[language];
      if (existingTriple === undefined || isCommentOnlyTriple(existingTriple)) {
        fallbackCodeExamples[language] = patchedTriple;
      }
    }
  }

  const withRunnableEntrypoint = ensureRunnableTeachingExamples(sectionId, fallbackCodeExamples);

  return {
    ...examplesModule,
    fallbackCodeExamples: withRunnableEntrypoint
  };
};

const hasCppMain = (code: string): boolean => /\bint\s+main\s*\(/.test(code);
const hasCMain = (code: string): boolean => /\bint\s+main\s*\(/.test(code);
const hasJavaMain = (code: string): boolean => /public\s+static\s+void\s+main\s*\(/.test(code);
const hasPythonMain = (code: string): boolean => /if\s+__name__\s*==\s*['"]__main__['"]\s*:/.test(code);

const ensureCppIncludes = (code: string): string => {
  let result = code;
  if (!/\#include\s*<iostream>/.test(result)) {
    result = `#include <iostream>\n${result}`;
  }
  return result;
};

const ensureCIncludes = (code: string): string => {
  let result = code;
  if (!/\#include\s*<stdio\.h>/.test(result)) {
    result = `#include <stdio.h>\n${result}`;
  }
  return result;
};

const toRunnableSnippet = (language: SupportedExampleLanguage, sectionId: string, level: ExampleLevel, raw: string): string => {
  const code = raw.trim();
  if (!code) {
    return raw;
  }

  if (language === 'cpp') {
    if (hasCppMain(code)) return code;
    const body = ensureCppIncludes(code);
    return `${body}\n\nint main() {\n  std::cout << "[${sectionId}][${level}] C++ example ready." << std::endl;\n  return 0;\n}`;
  }

  if (language === 'c') {
    if (hasCMain(code)) return code;
    const body = ensureCIncludes(code);
    return `${body}\n\nint main(void) {\n  printf("[${sectionId}][${level}] C example ready.\\n");\n  return 0;\n}`;
  }

  if (language === 'java') {
    if (hasJavaMain(code)) return code;
    const body = code.replace(/\bpublic\s+class\s+/g, 'class ');
    return `${body}\n\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("[${sectionId}][${level}] Java example ready.");\n  }\n}`;
  }

  if (hasPythonMain(code)) {
    return code;
  }

  return `${code}\n\nif __name__ == '__main__':\n    print('[${sectionId}][${level}] Python example ready.')`;
};

const ensureRunnableTeachingExamples = (
  sectionId: string,
  fallbackCodeExamples: Record<string, unknown>
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...fallbackCodeExamples };

  const targetLanguages: SupportedExampleLanguage[] = ['cpp', 'c', 'java', 'python'];
  const levels: ExampleLevel[] = ['basic', 'operations', 'advanced'];

  for (const language of targetLanguages) {
    const tripleRaw = result[language];
    if (!isObject(tripleRaw)) {
      continue;
    }

    const patched: ExampleTriple = {
      basic: String(tripleRaw.basic ?? ''),
      operations: String(tripleRaw.operations ?? ''),
      advanced: String(tripleRaw.advanced ?? '')
    };

    for (const level of levels) {
      patched[level] = toRunnableSnippet(language, sectionId, level, patched[level]);
    }

    result[language] = patched;
  }

  return result;
};

const isObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const getPropertyValue = (obj: Record<string, unknown>, key: string): unknown => obj[key];

const normalizeTheorySections = (input: unknown): QuizBankTheorySection[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item, index) => {
    if (isObject(item)) {
      const examplesRaw = Array.isArray(item.examples) ? item.examples : [];
      return {
        title: String(item.title ?? `Section ${index + 1}`),
        content: String(item.content ?? item.description ?? ''),
        examples: examplesRaw.map((example) => String(example))
      };
    }

    return {
      title: `Section ${index + 1}`,
      content: String(item),
      examples: []
    };
  });
};

const normalizeKeyTakeaways = (input: unknown): string[] => (
  Array.isArray(input) ? input.map((item) => String(item)) : []
);

const normalizeQuizQuestions = (input: unknown): QuizBankQuestion[] | undefined => {
  if (!Array.isArray(input)) {
    return undefined;
  }

  const questions = input
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, index): QuizBankQuestion => {
      const typeValue: QuizBankQuestion['type'] =
        item.type === 'multiple-choice' || item.type === 'true-false' || item.type === 'short-answer'
          ? item.type
          : 'multiple-choice';

      const difficultyValue: QuizBankQuestion['difficulty'] =
        item.difficulty === 'easy' || item.difficulty === 'medium' || item.difficulty === 'hard'
          ? item.difficulty
          : 'medium';

      return {
        id: String(item.id ?? `q-${index + 1}`),
        type: typeValue,
        question: String(item.question ?? ''),
        options: Array.isArray(item.options) ? item.options.map((option) => String(option)) : undefined,
        correctAnswer: (item.correctAnswer as number | boolean | string) ?? '',
        explanation: String(item.explanation ?? ''),
        difficulty: difficultyValue,
        topic: String(item.topic ?? 'General')
      };
    });

  return questions.length > 0 ? questions : undefined;
};

const normalizePracticeDifficulty = (value: unknown): 'Easy' | 'Medium' | 'Hard' => {
  const text = String(value ?? '').trim().toLowerCase();
  if (text === 'easy') return 'Easy';
  if (text === 'hard') return 'Hard';
  return 'Medium';
};

const toStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);
};

const resolvePracticeSolution = (value: unknown): string => {
  if (!isObject(value)) {
    return '';
  }

  const solution = String(value.solution ?? '').trim();
  if (solution.length > 0) {
    return solution;
  }

  return String(value.solutions ?? '').trim();
};

const normalizePracticeExercise = (
  value: unknown,
  fallbackTitle: string,
  fallbackDescription: string
): {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  hints: string[];
  solution?: string;
  solutions?: string;
} => {
  const obj = isObject(value) ? value : {};
  const resolvedSolution = resolvePracticeSolution(obj);

  const result: {
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    description: string;
    hints: string[];
    solution?: string;
    solutions?: string;
  } = {
    title: String(obj.title ?? fallbackTitle).trim() || fallbackTitle,
    difficulty: normalizePracticeDifficulty(obj.difficulty),
    description: String(obj.description ?? fallbackDescription).trim() || fallbackDescription,
    hints: toStringList(obj.hints)
  };

  if (resolvedSolution.length > 0) {
    result.solution = resolvedSolution;
    result.solutions = resolvedSolution;
  }

  return result;
};

const normalizePracticeLanguage = (value: unknown): string => {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) {
    return 'javascript';
  }

  if (text === 'js') return 'javascript';
  if (text === 'ts') return 'typescript';
  if (text === 'c++') return 'cpp';

  const allowed = new Set(['javascript', 'typescript', 'python', 'java', 'cpp', 'c']);
  return allowed.has(text) ? text : 'javascript';
};

const buildGeneratedPracticeSolution = (language: string, sectionId: string): string => {
  if (language === 'python') {
    return `def solve(nums):\n    # TODO: implement section-specific logic\n    return nums\n\nif __name__ == '__main__':\n    print(solve([1, 2, 3]))`;
  }

  if (language === 'java') {
    return `import java.util.*;\n\npublic class Main {\n  static int[] solve(int[] nums) {\n    // TODO: implement section-specific logic\n    return nums;\n  }\n\n  public static void main(String[] args) {\n    int[] out = solve(new int[]{1, 2, 3});\n    System.out.println(Arrays.toString(out));\n  }\n}`;
  }

  if (language === 'cpp') {
    return `#include <iostream>\n#include <vector>\n\nstd::vector<int> solve(const std::vector<int>& nums) {\n  // TODO: implement section-specific logic\n  return nums;\n}\n\nint main() {\n  std::vector<int> out = solve({1, 2, 3});\n  for (int x : out) std::cout << x << ' ';\n  std::cout << std::endl;\n  return 0;\n}`;
  }

  if (language === 'c') {
    return `#include <stdio.h>\n\nvoid solve(const int* nums, int n) {\n  // TODO: implement section-specific logic\n  for (int i = 0; i < n; ++i) printf("%d ", nums[i]);\n  printf("\\n");\n}\n\nint main(void) {\n  int nums[] = {1, 2, 3};\n  solve(nums, 3);\n  return 0;\n}`;
  }

  if (language === 'typescript') {
    return `function solve(nums: number[]): number[] {\n  // TODO: implement section-specific logic\n  return nums;\n}\n\nconsole.log(solve([1, 2, 3]));`;
  }

  return `function solve(nums) {\n  // TODO: implement section-specific logic\n  return nums;\n}\n\nconsole.log(solve([1, 2, 3]));\n// section: ${sectionId}`;
};

const normalizePracticeLinks = (value: unknown): Array<{ title: string; url: string; platform: string }> => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item) => ({
      title: String(item.title ?? '').trim(),
      url: String(item.url ?? '').trim(),
      platform: String(item.platform ?? 'Unknown').trim() || 'Unknown'
    }))
    .filter((item) => item.title.length > 0 && item.url.length > 0);
};

const normalizePracticeModule = (practiceModule: unknown, sectionId: string): Record<string, unknown> => {
  const moduleObj = isObject(practiceModule) ? { ...practiceModule } : {};
  const exercisesRaw = Array.isArray(moduleObj.exercises) ? moduleObj.exercises : [];
  const exercises = exercisesRaw.map((item, index) => (
    normalizePracticeExercise(
      item,
      `Practice Exercise ${index + 1}`,
      `Solve the practice task for section ${sectionId}.`
    )
  ));

  const practiceSectionsRaw = isObject(moduleObj.practiceSections)
    ? moduleObj.practiceSections
    : (isObject(moduleObj.sections) ? moduleObj.sections : {});

  const language = normalizePracticeLanguage(
    (isObject(practiceSectionsRaw.example) ? practiceSectionsRaw.example.solutionLanguage : undefined)
    ?? moduleObj.practiceExampleLanguage
  );

  const defaultExample = normalizePracticeExercise(
    exercises.find((item) => typeof item.solution === 'string' && item.solution.trim().length > 0) ?? exercises[0],
    `${sectionId} Example Problem`,
    `Complete the representative problem for section ${sectionId}.`
  );

  const exampleSource = isObject(practiceSectionsRaw.example)
    ? normalizePracticeExercise(practiceSectionsRaw.example, defaultExample.title, defaultExample.description)
    : defaultExample;

  const resolvedSolution = (exampleSource.solution ?? '').trim().length > 0
    ? String(exampleSource.solution)
    : ((defaultExample.solution ?? '').trim().length > 0
      ? String(defaultExample.solution)
      : buildGeneratedPracticeSolution(language, sectionId));

  const example = {
    ...exampleSource,
    solution: resolvedSolution,
    solutions: resolvedSolution,
    solutionLanguage: language
  };

  const thinking = Array.isArray(practiceSectionsRaw.thinking)
    ? practiceSectionsRaw.thinking.slice(0, 2).map((item, index) => (
      normalizePracticeExercise(item, `Thinking Exercise ${index + 1}`, `Analyze section ${sectionId} from another angle.`)
    ))
    : exercises.slice(1, 3);

  const programming = normalizePracticeLinks(practiceSectionsRaw.programming);
  const externalLinks = normalizePracticeLinks(moduleObj.externalLinks);

  return {
    ...moduleObj,
    exercises,
    externalLinks,
    practiceExampleLanguage: language,
    practiceSections: {
      example,
      thinking,
      programming: programming.length > 0 ? programming : externalLinks.slice(0, 3)
    },
    sections: {
      example,
      thinking,
      programming: programming.length > 0 ? programming : externalLinks.slice(0, 3)
    }
  };
};

const allowedModulesByTemplate = (templateType: SectionTemplateType): SectionModuleName[] => (
  templateType === 'theory'
    ? ['theory', 'keyTakeaways']
    : ['theory', 'visualization', 'examples', 'practice']
);

const shouldPreferSourceFile = (currentPath: string | undefined, nextPath: string): boolean => {
  if (!currentPath) {
    return true;
  }

  const currentBase = path.basename(currentPath);
  const nextBase = path.basename(nextPath);
  const currentNumeric = /^\d/.test(currentBase);
  const nextNumeric = /^\d/.test(nextBase);

  if (nextNumeric && !currentNumeric) {
    return true;
  }

  if (nextNumeric === currentNumeric) {
    return nextPath.length < currentPath.length;
  }

  return false;
};

const extractIdFromTitle = (title: string): string | null => {
  const match = title.match(/^(\d+(?:\.\d+)*)/);
  return match ? match[1] : null;
};

const loadCourseCatalog = (repoRoot: string): CatalogChapter[] => {
  const catalogPath = path.join(repoRoot, 'back', 'data', 'course-catalog.json');
  const raw = fs.readFileSync(catalogPath, 'utf-8');
  return JSON.parse(raw) as CatalogChapter[];
};

type CatalogIndexItem = {
  sectionId: string;
  aliases: string[];
  chapterId: string;
  chapterTitle: string;
  sectionTitle: string;
};

const buildCatalogIndex = (catalog: CatalogChapter[]): Map<string, CatalogIndexItem> => {
  const index = new Map<string, CatalogIndexItem>();

  for (const chapter of catalog) {
    for (const section of chapter.sections) {
      const idFromTitle = extractIdFromTitle(section.title);
      const canonicalId = normalizeSectionId(idFromTitle ?? section.id);
      const alias = normalizeSectionId(section.id);

      const item: CatalogIndexItem = {
        sectionId: canonicalId,
        aliases: Array.from(new Set([section.id, alias].filter((value) => value !== canonicalId))),
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        sectionTitle: section.title
      };

      index.set(canonicalId, item);
      index.set(section.id, item);
      index.set(alias, item);
    }
  }

  return index;
};

const evaluateTsNode = (node: ts.Expression, context: Map<string, unknown>): unknown => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }

  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }

  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }

  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }

  if (ts.isIdentifier(node)) {
    return context.get(node.text);
  }

  if (ts.isParenthesizedExpression(node)) {
    return evaluateTsNode(node.expression, context);
  }

  if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isSatisfiesExpression(node)) {
    return evaluateTsNode(node.expression, context);
  }

  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    const value = evaluateTsNode(node.operand, context);
    return typeof value === 'number' ? -value : undefined;
  }

  if (ts.isTemplateExpression(node)) {
    let value = node.head.text;
    for (const span of node.templateSpans) {
      const exprValue = evaluateTsNode(span.expression, context);
      value += String(exprValue ?? '') + span.literal.text;
    }
    return value;
  }

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => {
      if (ts.isSpreadElement(element)) {
        const spreadValue = evaluateTsNode(element.expression, context);
        return Array.isArray(spreadValue) ? spreadValue : [];
      }
      return evaluateTsNode(element as ts.Expression, context);
    }).flat();
  }

  if (ts.isObjectLiteralExpression(node)) {
    const result: Record<string, unknown> = {};

    for (const property of node.properties) {
      if (ts.isSpreadAssignment(property)) {
        const spreadValue = evaluateTsNode(property.expression, context);
        if (isObject(spreadValue)) {
          Object.assign(result, spreadValue);
        }
        continue;
      }

      if (ts.isShorthandPropertyAssignment(property)) {
        const key = property.name.text;
        result[key] = context.get(key);
        continue;
      }

      if (ts.isPropertyAssignment(property)) {
        const nameNode = property.name;
        const key = ts.isIdentifier(nameNode)
          ? nameNode.text
          : ts.isStringLiteral(nameNode)
            ? nameNode.text
            : ts.isNumericLiteral(nameNode)
              ? nameNode.text
              : undefined;

        if (!key) {
          continue;
        }

        result[key] = evaluateTsNode(property.initializer, context);
      }
    }

    return result;
  }

  if (ts.isConditionalExpression(node)) {
    const condition = evaluateTsNode(node.condition, context);
    return condition ? evaluateTsNode(node.whenTrue, context) : evaluateTsNode(node.whenFalse, context);
  }

  return undefined;
};

const buildStaticContext = (sourceFile: ts.SourceFile): Map<string, unknown> => {
  const context = new Map<string, unknown>();

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    if (!(statement.declarationList.flags & ts.NodeFlags.Const)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
        continue;
      }

      const value = evaluateTsNode(declaration.initializer, context);
      context.set(declaration.name.text, value);
    }
  }

  return context;
};

const listPageFiles = (repoRoot: string): string[] => {
  const pagesRoot = path.join(repoRoot, 'front', 'src', 'pages');
  const results: string[] = [];
  const excludes = new Set(['TopicSection', 'TheoryContent', 'StructureDetail', 'Practice', 'Home', 'Catalog']);

  const walk = (dirPath: string): void => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (excludes.has(entry.name)) {
          continue;
        }
        walk(fullPath);
        continue;
      }

      if (entry.isFile() && fullPath.endsWith('Section.tsx')) {
        results.push(fullPath);
      }
    }
  };

  walk(pagesRoot);
  return results;
};

type LinkDisplayMode = 'theory' | 'practice' | 'both';
type TopicLink = { title: string; url: string; platform: string; mode?: LinkDisplayMode };

const normalizeLinkMode = (mode: unknown): LinkDisplayMode => {
  if (mode === 'theory' || mode === 'practice' || mode === 'both') {
    return mode;
  }
  return 'theory';
};

const splitTopicLinks = (links: unknown): { theoryLinks: TopicLink[]; practiceLinks: TopicLink[] } => {
  if (!Array.isArray(links)) {
    return { theoryLinks: [], practiceLinks: [] };
  }

  const theoryLinks: TopicLink[] = [];
  const practiceLinks: TopicLink[] = [];

  for (const raw of links) {
    if (!isObject(raw)) {
      continue;
    }

    const title = String(raw.title ?? '').trim();
    const url = String(raw.url ?? '').trim();
    if (!title || !url) {
      continue;
    }

    let mode = normalizeLinkMode(raw.mode);
    if (!raw.mode) {
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('leetcode.com') || lowerUrl.includes('hackerrank.com')) {
        mode = 'practice';
      }
    }

    const normalized: TopicLink = {
      title,
      url,
      platform: String(raw.platform ?? 'Unknown'),
      mode
    };

    if (mode === 'theory' || mode === 'both') {
      theoryLinks.push(normalized);
    }
    if (mode === 'practice' || mode === 'both') {
      practiceLinks.push(normalized);
    }
  }

  return { theoryLinks, practiceLinks };
};

const extractTopicSectionData = (sourceFile: ts.SourceFile, context: Map<string, unknown>, filePath: string): FrontExtractResult | null => {
  let extractedConfig: Record<string, unknown> | null = null;

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'createTopicSection') {
      const arg = node.arguments[0];
      if (arg && ts.isObjectLiteralExpression(arg)) {
        const value = evaluateTsNode(arg, context);
        if (isObject(value)) {
          extractedConfig = value;
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  if (!extractedConfig) {
    return null;
  }

  const sectionIdRaw = String(getPropertyValue(extractedConfig, 'id') ?? '').trim();
  if (!sectionIdRaw) {
    return null;
  }

  const { theoryLinks, practiceLinks } = splitTopicLinks(getPropertyValue(extractedConfig, 'links'));

  return {
    sectionId: normalizeSectionId(sectionIdRaw),
    templateType: 'data-structure',
    sourceFile: filePath,
    modules: {
      theory: {
        overview: String(getPropertyValue(extractedConfig, 'overview') ?? ''),
        concepts: Array.isArray(getPropertyValue(extractedConfig, 'concepts'))
          ? getPropertyValue(extractedConfig, 'concepts')
          : [],
        complexity: getPropertyValue(extractedConfig, 'complexity') ?? {},
        relatedLinks: theoryLinks
      },
      visualization: {
        operations: Array.isArray(getPropertyValue(extractedConfig, 'operations'))
          ? getPropertyValue(extractedConfig, 'operations')
          : [],
        visualNodes: Array.isArray(getPropertyValue(extractedConfig, 'visualNodes'))
          ? getPropertyValue(extractedConfig, 'visualNodes')
          : [],
        visualCaption: String(getPropertyValue(extractedConfig, 'visualCaption') ?? '')
      },
      examples: {
        fallbackCodeExamples: getPropertyValue(extractedConfig, 'fallbackCodeExamples') ?? {},
        practiceExampleLanguage: getPropertyValue(extractedConfig, 'practiceExampleLanguage') ?? null
      },
      practice: {
        exercises: Array.isArray(getPropertyValue(extractedConfig, 'exercises'))
          ? getPropertyValue(extractedConfig, 'exercises')
          : [],
        externalLinks: practiceLinks,
        practiceSections: getPropertyValue(extractedConfig, 'practiceSections') ?? null,
        practiceExampleLanguage: getPropertyValue(extractedConfig, 'practiceExampleLanguage') ?? null
      }
    }
  };
};

const extractTheorySectionData = (context: Map<string, unknown>, filePath: string): FrontExtractResult | null => {
  const fallbackRaw = context.get('fallbackContent');
  if (!isObject(fallbackRaw)) {
    return null;
  }

  const contentIdRaw = context.get('CONTENT_ID');
  const fallbackIdRaw = getPropertyValue(fallbackRaw, 'id');
  const sectionIdRaw = String(contentIdRaw ?? fallbackIdRaw ?? '').trim();
  if (!sectionIdRaw) {
    return null;
  }

  if (isObject(getPropertyValue(fallbackRaw, 'content'))) {
    const content = getPropertyValue(fallbackRaw, 'content') as Record<string, unknown>;
    return {
      sectionId: normalizeSectionId(sectionIdRaw),
      templateType: 'theory',
      sourceFile: filePath,
      modules: {
        theory: {
          overview: String(content.introduction ?? ''),
          concepts: Array.isArray(content.sections) ? content.sections : []
        },
        keyTakeaways: normalizeKeyTakeaways(content.keyTakeaways)
      }
    };
  }

  if (isObject(getPropertyValue(fallbackRaw, 'theory'))) {
    const theory = getPropertyValue(fallbackRaw, 'theory');
    return {
      sectionId: normalizeSectionId(sectionIdRaw),
      templateType: 'theory',
      sourceFile: filePath,
      modules: {
        theory,
        keyTakeaways: normalizeKeyTakeaways(getPropertyValue(fallbackRaw, 'keyTakeaways'))
      }
    };
  }

  return null;
};

const extractFromPageFile = (filePath: string): FrontExtractResult | null => {
  const sourceCode = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
  const context = buildStaticContext(sourceFile);

  const topicData = extractTopicSectionData(sourceFile, context, filePath);
  if (topicData) {
    return topicData;
  }

  return extractTheorySectionData(context, filePath);
};

const convertTheoryModuleToQuizPayload = (
  theoryModule: unknown,
  keyTakeawaysModule: unknown,
  quizQuestions?: QuizBankQuestion[]
): QuizTheoryPayload | null => {
  if (!isObject(theoryModule)) {
    return null;
  }

  const intro = String(theoryModule.introduction ?? theoryModule.overview ?? theoryModule.description ?? '');
  const sectionsSource = Array.isArray(theoryModule.sections)
    ? theoryModule.sections
    : (Array.isArray(theoryModule.concepts) ? theoryModule.concepts : []);

  const sections = normalizeTheorySections(sectionsSource);
  const keyTakeaways = normalizeKeyTakeaways(keyTakeawaysModule);

  return {
    introduction: intro,
    sections,
    keyTakeaways,
    quizQuestions
  };
};

const loadBackendTheoryMap = (repoRoot: string): Map<string, { payload: QuizTheoryPayload; sourceFile: string; title?: string; subtitle?: string }> => {
  const baseDir = path.join(repoRoot, 'back', 'data', 'theoretical-content');
  const files = fs.readdirSync(baseDir).filter((name) => name.endsWith('.json'));

  const map = new Map<string, { payload: QuizTheoryPayload; sourceFile: string; title?: string; subtitle?: string }>();

  for (const fileName of files) {
    const fullPath = path.join(baseDir, fileName);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const parsed = JSON.parse(raw) as TheoryFile;
    const sectionId = normalizeSectionId(fileName.replace('.json', ''));

    const payload: QuizTheoryPayload = {
      introduction: String(parsed.content?.introduction ?? ''),
      sections: normalizeTheorySections(parsed.content?.sections),
      keyTakeaways: normalizeKeyTakeaways(parsed.content?.keyTakeaways),
      quizQuestions: normalizeQuizQuestions(parsed.content?.quizQuestions)
    };

    map.set(sectionId, {
      payload,
      sourceFile: fullPath,
      title: parsed.title,
      subtitle: parsed.subtitle
    });
  }

  return map;
};

export const buildSectionAggregates = (repoRoot: string): SectionAggregate[] => {
  const catalog = loadCourseCatalog(repoRoot);
  const catalogIndex = buildCatalogIndex(catalog);
  const backendTheory = loadBackendTheoryMap(repoRoot);
  const pageFiles = listPageFiles(repoRoot);

  const aggregates = new Map<string, SectionAggregate>();

  for (const filePath of pageFiles) {
    const extracted = extractFromPageFile(filePath);
    if (!extracted) {
      continue;
    }

    const sectionId = normalizeSectionId(extracted.sectionId);
    const catalogItem = catalogIndex.get(sectionId);

    const existing = aggregates.get(sectionId);
    const shouldReplace = shouldPreferSourceFile(existing?.dataSources.frontendFile, filePath);

    if (!existing) {
      aggregates.set(sectionId, {
        sectionId,
        aliases: catalogItem?.aliases ?? [],
        chapterId: catalogItem?.chapterId,
        chapterTitle: catalogItem?.chapterTitle,
        sectionTitle: catalogItem?.sectionTitle,
        templateType: extracted.templateType,
        modules: extracted.modules,
        dataSources: {
          frontendFile: filePath
        }
      });
      continue;
    }

    if (shouldReplace) {
      existing.templateType = extracted.templateType;
      existing.modules = extracted.modules;
      existing.dataSources.frontendFile = filePath;
    }

    if (catalogItem) {
      existing.aliases = Array.from(new Set([...existing.aliases, ...catalogItem.aliases]));
      existing.chapterId = existing.chapterId ?? catalogItem.chapterId;
      existing.chapterTitle = existing.chapterTitle ?? catalogItem.chapterTitle;
      existing.sectionTitle = existing.sectionTitle ?? catalogItem.sectionTitle;
    }
  }

  for (const [sectionId, theoryInfo] of backendTheory.entries()) {
    const catalogItem = catalogIndex.get(sectionId);
    const existing = aggregates.get(sectionId);

    if (!existing) {
      aggregates.set(sectionId, {
        sectionId,
        aliases: catalogItem?.aliases ?? [],
        chapterId: catalogItem?.chapterId,
        chapterTitle: catalogItem?.chapterTitle,
        sectionTitle: catalogItem?.sectionTitle ?? theoryInfo.title,
        templateType: 'theory',
        modules: {
          theory: {
            introduction: theoryInfo.payload.introduction,
            sections: theoryInfo.payload.sections
          },
          keyTakeaways: theoryInfo.payload.keyTakeaways
        },
        quizTheory: theoryInfo.payload,
        dataSources: {
          backendTheoryFile: theoryInfo.sourceFile
        }
      });
      continue;
    }

    existing.quizTheory = theoryInfo.payload;
    existing.dataSources.backendTheoryFile = theoryInfo.sourceFile;

    if (!existing.modules.theory) {
      existing.modules.theory = {
        introduction: theoryInfo.payload.introduction,
        sections: theoryInfo.payload.sections
      };
    }
    if (!existing.modules.keyTakeaways && existing.templateType === 'theory') {
      existing.modules.keyTakeaways = theoryInfo.payload.keyTakeaways;
    }
    if (theoryInfo.title && !existing.sectionTitle) {
      existing.sectionTitle = theoryInfo.title;
    }
    if (catalogItem) {
      existing.aliases = Array.from(new Set([...existing.aliases, ...catalogItem.aliases]));
      existing.chapterId = existing.chapterId ?? catalogItem.chapterId;
      existing.chapterTitle = existing.chapterTitle ?? catalogItem.chapterTitle;
      existing.sectionTitle = existing.sectionTitle ?? catalogItem.sectionTitle;
    }
  }

  for (const aggregate of aggregates.values()) {
    if (!aggregate.quizTheory) {
      aggregate.quizTheory = convertTheoryModuleToQuizPayload(
        aggregate.modules.theory,
        aggregate.modules.keyTakeaways
      ) ?? undefined;
    }

    if (aggregate.templateType === 'theory') {
      aggregate.modules.visualization = undefined;
      aggregate.modules.examples = undefined;
      aggregate.modules.practice = undefined;
      aggregate.modules.keyTakeaways = normalizeKeyTakeaways(aggregate.modules.keyTakeaways);
    } else {
      aggregate.modules.keyTakeaways = undefined;
      aggregate.modules.visualization = aggregate.modules.visualization ?? {};
      aggregate.modules.examples = enhanceExamplesModule(aggregate.sectionId, aggregate.modules.examples ?? {});
      aggregate.modules.practice = normalizePracticeModule(aggregate.modules.practice ?? {}, aggregate.sectionId);
    }
  }

  return Array.from(aggregates.values()).sort((a, b) => a.sectionId.localeCompare(b.sectionId, undefined, { numeric: true }));
};

const upsertSectionContent = async (sections: SectionAggregate[]): Promise<number> => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection is not ready for datastructures sync.');
  }
  const dataStructuresCollection = db.collection('datastructures');

  const frontSections = sections.filter((section) => Boolean(section.dataSources.frontendFile));
  const keepIds = frontSections.map((section) => section.sectionId);

  await dataStructuresCollection.deleteMany({});

  let count = 0;

  for (const section of frontSections) {
    const allowedModules = allowedModulesByTemplate(section.templateType);
    const filteredModules = allowedModules.reduce<Partial<Record<SectionModuleName, unknown>>>((acc, moduleName) => {
      acc[moduleName] = section.modules[moduleName];
      return acc;
    }, {});

    const theoryModule = (filteredModules.theory ?? {}) as Record<string, unknown>;
    const theoryOverview = String(theoryModule.overview ?? theoryModule.introduction ?? '');
    const theoryConcepts = Array.isArray(theoryModule.concepts)
      ? theoryModule.concepts
      : (Array.isArray(theoryModule.sections) ? theoryModule.sections : []);

    const complexity = (theoryModule.complexity ?? {}) as Record<string, unknown>;
    const timeComplexity = isObject(complexity.time)
      ? complexity.time
      : (isObject(complexity.timeComplexity) ? complexity.timeComplexity : {});
    const spaceComplexity = String(complexity.space ?? complexity.spaceComplexity ?? '');

    const visualization = (filteredModules.visualization ?? {}) as Record<string, unknown>;
    const visualizationOperations = Array.isArray(visualization.operations) ? visualization.operations : [];

    await dataStructuresCollection.updateOne(
      { sectionId: section.sectionId },
      {
        $set: {
          id: section.sectionId,
          sectionId: section.sectionId,
          aliases: section.aliases,
          name: section.sectionTitle ?? `Section ${section.sectionId}`,
          displayName: section.sectionTitle ?? `Section ${section.sectionId}`,
          category: section.chapterId?.includes('tree')
            ? 'tree'
            : (section.chapterId?.includes('graph') ? 'graph' : 'linear'),
          difficulty: 'beginner',
          description: theoryOverview,
          concepts: theoryConcepts,
          operations: visualizationOperations,
          timeComplexity,
          spaceComplexity,
          visualizationConfig: visualization,
          chapterId: section.chapterId,
          chapterTitle: section.chapterTitle,
          sectionTitle: section.sectionTitle,
          templateType: section.templateType,
          allowedModules,
          quizSource: 'theory',
          modules: filteredModules,
          dataSources: {
            frontendFile: section.dataSources.frontendFile
          },
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    count += 1;
  }

  if (keepIds.length > 0) {
    await dataStructuresCollection.deleteMany({ sectionId: { $nin: keepIds } });
  }

  return count;
};

const upsertQuizBankTheory = async (sections: SectionAggregate[]): Promise<number> => {
  const theorySections = sections.filter((section) => Boolean(section.quizTheory));
  const keepIds = theorySections.map((section) => section.sectionId);

  if (keepIds.length > 0) {
    await QuizBank.deleteMany({ sectionId: { $nin: keepIds } });
  }

  let count = 0;

  for (const section of theorySections) {
    if (!section.quizTheory) continue;

    const existing = await QuizBank.findOne({ sectionId: section.sectionId }).lean();
    const existingQuestions = Array.isArray(existing?.questions) ? existing.questions : [];
    const fileQuestions = Array.isArray(section.quizTheory.quizQuestions) ? section.quizTheory.quizQuestions : [];
    const mergedQuestions = existingQuestions.length > 0 ? existingQuestions : fileQuestions;

    await QuizBank.findOneAndUpdate(
      { sectionId: section.sectionId },
      {
        sectionId: section.sectionId,
        title: section.sectionTitle ?? `Section ${section.sectionId}`,
        description: section.chapterTitle,
        theoryContent: {
          introduction: section.quizTheory.introduction,
          sections: section.quizTheory.sections,
          keyTakeaways: section.quizTheory.keyTakeaways,
          quizQuestions: fileQuestions.length > 0 ? fileQuestions : undefined
        },
        questions: mergedQuestions
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    count += 1;
  }

  return count;
};

export async function syncHardcodedContentToMongo() {
  const repoRoot = path.join(__dirname, '..', '..', '..');
  const sections = buildSectionAggregates(repoRoot);

  if (sections.length === 0) {
    throw new Error('No section content extracted from hardcoded data.');
  }

  await mongoose.connect(mongoUri);

  const dataStructureUpsertCount = await upsertSectionContent(sections);
  const quizUpsertCount = await upsertQuizBankTheory(sections);

  console.log(`[syncHardcodedContentToMongo] dataStructureUpsertCount=${dataStructureUpsertCount}`);
  console.log(`[syncHardcodedContentToMongo] quizUpsertCount=${quizUpsertCount}`);
  console.log('[syncHardcodedContentToMongo] Done.');
}

if (require.main === module) {
  syncHardcodedContentToMongo()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('[syncHardcodedContentToMongo] Failed:', error);
      try {
        await mongoose.disconnect();
      } catch {
        // ignore disconnect errors
      }
      process.exit(1);
    });
}
