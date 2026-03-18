export interface DictionaryTerm {
  english: string;
  chinese: string;
  englishDefinition: string;
  chineseDefinition: string;
}

export const dictionaryTerms: DictionaryTerm[] = [
  // A
  {
    english: 'Abstract Data Type (ADT)',
    chinese: '抽象数据类型',
    englishDefinition: 'A mathematical model for data types, defined by its behavior (semantics) from the point of view of a user, not its implementation.',
    chineseDefinition: '数据类型的数学模型，从用户的角度定义其行为（语义），而不关心其具体实现。'
  },
  {
    english: 'Adjacency List',
    chinese: '邻接表',
    englishDefinition: 'A graph representation where each vertex stores a list of adjacent vertices.',
    chineseDefinition: '一种图表示方式，每个顶点保存与其相邻顶点的列表。'
  },
  {
    english: 'Adjacency Matrix',
    chinese: '邻接矩阵',
    englishDefinition: 'A matrix representation of a graph where matrix entries indicate edges.',
    chineseDefinition: '用矩阵表示图，矩阵元素用于标记顶点间是否存在边。'
  },
  {
    english: 'Algorithm',
    chinese: '算法',
    englishDefinition: 'A finite sequence of well-defined instructions used to solve a class of problems or perform a computation.',
    chineseDefinition: '用于解决一类问题或执行计算的一组有限的、定义明确的指令序列。'
  },
  {
    english: 'Amortized Analysis',
    chinese: '摊还分析',
    englishDefinition: 'A strategy for analyzing a sequence of operations to show that the average cost per operation is small, even though a single operation might be expensive.',
    chineseDefinition: '分析一系列操作平均代价的策略，即使单个操作可能代价很高，但能证明操作序列的平均代价很低。'
  },
  {
    english: 'Array',
    chinese: '数组',
    englishDefinition: 'A linear data structure storing elements in contiguous memory locations.',
    chineseDefinition: '一种线性结构，元素存储在连续内存空间中。'
  },
  {
    english: 'AVL Tree',
    chinese: 'AVL树',
    englishDefinition: 'A self-balancing binary search tree where the height difference between left and right subtrees (balance factor) is at most one for every node.',
    chineseDefinition: '一种自平衡二叉搜索树，其中每个节点的左右子树高度差（平衡因子）最多为1。'
  },

  // B
  {
    english: 'Backtracking',
    chinese: '回溯法',
    englishDefinition: 'A search technique that builds solutions incrementally and abandons (backtracks) a path as soon as it determines it cannot lead to a valid solution.',
    chineseDefinition: '一种逐步构建解的搜索策略，一旦确定当前路径无法通向有效解，就立即回退（回溯）。'
  },
  {
    english: 'Balance Factor',
    chinese: '平衡因子',
    englishDefinition: 'In a binary tree, the value calculated as the height of the left subtree minus the height of the right subtree, used in AVL trees to maintain balance.',
    chineseDefinition: '二叉树中，左子树高度减去右子树高度所得的值，用于AVL树中维持平衡。'
  },
  {
    english: 'Balanced Tree',
    chinese: '平衡树',
    englishDefinition: 'A tree structure where the height of subtrees is kept similar to guarantee O(log n) time complexity for operations.',
    chineseDefinition: '通过控制子树高度差来保证操作的时间复杂度为O(log n)的树结构。'
  },
  {
    english: 'Bellman-Ford Algorithm',
    chinese: '贝尔曼-福特算法',
    englishDefinition: 'An algorithm that finds the shortest paths from a single source vertex to all other vertices in a weighted graph, capable of handling negative edge weights.',
    chineseDefinition: '一种在加权图中计算从单一源点到所有其他顶点的最短路径的算法，能够处理负权边。'
  },
  {
    english: 'Big-O Notation',
    chinese: '大O表示法',
    englishDefinition: 'A mathematical notation describing the limiting behavior of a function, commonly used to classify algorithms by their worst-case or average-case time or space complexity.',
    chineseDefinition: '一种描述函数极限行为的数学表示法，常用于根据最坏情况或平均情况下的时间或空间复杂度对算法进行分类。'
  },
  {
    english: 'Binary Search',
    chinese: '二分查找',
    englishDefinition: 'A logarithmic-time search algorithm on a sorted array by repeatedly dividing the search interval in half.',
    chineseDefinition: '在有序数组中，通过反复将搜索区间对半分割来实现对数时间查找的算法。'
  },
  {
    english: 'Binary Search Tree (BST)',
    chinese: '二叉搜索树',
    englishDefinition: 'A binary tree where for each node, all keys in the left subtree are smaller and all keys in the right subtree are larger.',
    chineseDefinition: '一种二叉树，其中对于每个节点，其左子树中的所有键值都小于它，右子树中的所有键值都大于它。'
  },
  {
    english: 'Binary Tree',
    chinese: '二叉树',
    englishDefinition: 'A tree data structure where each node has at most two children, referred to as the left child and the right child.',
    chineseDefinition: '一种树形数据结构，其中每个节点最多有两个子节点，分别称为左子节点和右子节点。'
  },
  {
    english: 'Breadth-First Search (BFS)',
    chinese: '广度优先搜索',
    englishDefinition: 'A graph traversal algorithm that explores all the neighbor nodes at the present depth before moving on to nodes at the next depth level.',
    chineseDefinition: '一种图遍历算法，在移动到下一层级的节点之前，先探索当前深度层级的所有邻居节点。'
  },
  {
    english: 'Bubble Sort',
    chinese: '冒泡排序',
    englishDefinition: 'A simple sorting algorithm that repeatedly steps through a list, compares adjacent elements, and swaps them if they are in the wrong order.',
    chineseDefinition: '一种简单的排序算法，通过反复遍历列表，比较相邻元素并交换顺序错误的元素来工作。'
  },
  {
    english: 'Bucket',
    chinese: '桶',
    englishDefinition: 'A container or storage location used in hash tables to hold elements that hash to the same index.',
    chineseDefinition: '哈希表中用于存储具有相同哈希索引的元素的容器或存储位置。'
  },
  {
    english: 'B-Tree',
    chinese: 'B树',
    englishDefinition: 'A self-balancing tree data structure that maintains sorted data and allows searches, sequential access, insertions, and deletions in logarithmic time, commonly used in databases and file systems.',
    chineseDefinition: '一种自平衡的树形数据结构，能保持数据有序，并允许在对数时间内进行查找、顺序访问、插入和删除，常用于数据库和文件系统。'
  },

  // C
  {
    english: 'Chaining',
    chinese: '链地址法',
    englishDefinition: 'A collision resolution method in hash tables where each bucket contains a linked list (or another data structure) of elements that hash to that bucket.',
    chineseDefinition: '哈希表的一种冲突解决方法，其中每个桶包含一个由哈希到该桶的元素组成的链表（或其他数据结构）。'
  },
  {
    english: 'Circular Linked List',
    chinese: '循环链表',
    englishDefinition: 'A linked list where the last node points back to the first node, forming a circle.',
    chineseDefinition: '一种链表，其中最后一个节点指向第一个节点，形成一个环。'
  },
  {
    english: 'Collision (Hash)',
    chinese: '哈希冲突',
    englishDefinition: 'A situation where a hash function produces the same index for two or more distinct keys.',
    chineseDefinition: '一个哈希函数对两个或多个不同的键产生相同索引的情况。'
  },
  {
    english: 'Collision Resolution',
    chinese: '冲突解决',
    englishDefinition: 'The process of handling hash collisions, typically through techniques like chaining or open addressing.',
    chineseDefinition: '处理哈希冲突的过程，通常通过链地址法或开放寻址法等技术实现。'
  },
  {
    english: 'Comparison Sort',
    chinese: '比较排序',
    englishDefinition: 'A type of sorting algorithm that reads list elements via a single comparison operation that determines which of two elements should occur first in the final sorted list.',
    chineseDefinition: '一种排序算法，它通过单一的比较操作来读取列表元素，以确定两个元素中哪一个在最终排序列表中应该排在前面。'
  },
  {
    english: 'Complete Binary Tree',
    chinese: '完全二叉树',
    englishDefinition: 'A binary tree in which all levels are completely filled except possibly the lowest level, which is filled from left to right.',
    chineseDefinition: '一种二叉树，除了最底层可能未填满外，其余各层都被完全填满，且最底层的节点从左到右连续排列。'
  },
  {
    english: 'Complexity',
    chinese: '复杂度',
    englishDefinition: 'A measure of the resources (such as time or space) required by an algorithm as a function of the input size.',
    chineseDefinition: '衡量算法所需资源（如时间或空间）与输入规模之间关系的指标。'
  },
  {
    english: 'Connected Graph',
    chinese: '连通图',
    englishDefinition: 'An undirected graph in which there is a path between every pair of vertices.',
    chineseDefinition: '一种无向图，其中任意两个顶点之间都存在一条路径。'
  },
  {
    english: 'Counting Sort',
    chinese: '计数排序',
    englishDefinition: 'An integer sorting algorithm that operates by counting the number of objects that have each distinct key value, using arithmetic on those counts to determine the positions of each key value in the output sequence.',
    chineseDefinition: '一种整数排序算法，通过计算具有每个不同键值的对象数量，并利用这些计数的算术运算来确定每个键值在输出序列中的位置。'
  },
  {
    english: 'Cycle',
    chinese: '环',
    englishDefinition: 'A path in a graph that starts and ends at the same vertex with no other repeated vertices.',
    chineseDefinition: '图中一条起点和终点相同且没有其他重复顶点的路径。'
  },

  // D
  {
    english: 'Data Structure',
    chinese: '数据结构',
    englishDefinition: 'A particular way of organizing and storing data in a computer so that it can be accessed and modified efficiently.',
    chineseDefinition: '在计算机中组织和存储数据的一种特定方式，以便能够高效地访问和修改数据。'
  },
  {
    english: 'Degree (Vertex)',
    chinese: '度 (顶点)',
    englishDefinition: 'In an undirected graph, the number of edges incident to a vertex. In a directed graph, it can be split into in-degree and out-degree.',
    chineseDefinition: '在无向图中，与一个顶点相关联的边的数量。在有向图中，可分为入度和出度。'
  },
  {
    english: 'Depth',
    chinese: '深度',
    englishDefinition: 'The number of edges from the root of a tree to a given node.',
    chineseDefinition: '从树的根节点到给定节点所经过的边的数量。'
  },
  {
    english: 'Depth-First Search (DFS)',
    chinese: '深度优先搜索',
    englishDefinition: 'A graph traversal algorithm that starts at a root node and explores as far as possible along each branch before backtracking.',
    chineseDefinition: '一种从根节点开始，沿着每个分支尽可能深入地探索，然后再回溯的图遍历算法。'
  },
  {
    english: 'Deque (Double-Ended Queue)',
    chinese: '双端队列',
    englishDefinition: 'A linear data structure that allows insertion and deletion of elements from both ends.',
    chineseDefinition: '一种允许在两端进行插入和删除操作的线性数据结构。'
  },
  {
    english: 'Dequeue (Operation)',
    chinese: '出队 (操作)',
    englishDefinition: 'The operation of removing an element from the front of a queue.',
    chineseDefinition: '从队列头部移除元素的操作。'
  },
  {
    english: 'Dijkstra\'s Algorithm',
    chinese: '迪杰斯特拉算法',
    englishDefinition: 'An algorithm for finding the shortest paths between nodes in a graph, which may represent, for example, road networks. It works on weighted graphs with non-negative edge weights.',
    chineseDefinition: '一种用于在图中查找节点之间最短路径的算法，例如道路网络。它适用于具有非负边权的加权图。'
  },
  {
    english: 'Directed Acyclic Graph (DAG)',
    chinese: '有向无环图',
    englishDefinition: 'A directed graph with no directed cycles.',
    chineseDefinition: '一种没有有向环的有向图。'
  },
  {
    english: 'Directed Graph (Digraph)',
    chinese: '有向图',
    englishDefinition: 'A graph where edges have a direction, typically represented as arrows from one vertex to another.',
    chineseDefinition: '一种边具有方向的图，通常表示为从一个顶点指向另一个顶点的箭头。'
  },
  {
    english: 'Divide and Conquer',
    chinese: '分治法',
    englishDefinition: 'An algorithm design paradigm that works by recursively breaking down a problem into two or more sub-problems of the same or related type until they are simple enough to solve directly.',
    chineseDefinition: '一种算法设计范式，通过递归地将一个问题分解为两个或多个相同或相关类型的子问题，直到这些子问题足够简单可以直接解决。'
  },
  {
    english: 'Double Hashing',
    chinese: '双重哈希',
    englishDefinition: 'A collision resolution technique in open addressing hash tables that uses two hash functions to calculate the probe sequence.',
    chineseDefinition: '开放寻址哈希表中的一种冲突解决技术，它使用两个哈希函数来计算探测序列。'
  },
  {
    english: 'Doubly Linked List',
    chinese: '双向链表',
    englishDefinition: 'A linked data structure that consists of a set of sequentially linked records called nodes, where each node contains two links: one pointing to the previous node and one pointing to the next node.',
    chineseDefinition: '一种由一组称为节点的顺序链接记录组成的链式数据结构，其中每个节点包含两个链接：一个指向前一个节点，另一个指向后一个节点。'
  },
  {
    english: 'Dynamic Array',
    chinese: '动态数组',
    englishDefinition: 'A random-access, variable-size list data structure that allows elements to be added or removed. It automatically grows when full.',
    chineseDefinition: '一种随机访问、大小可变的列表数据结构，允许添加或删除元素。当空间满时会自动增长。'
  },
  {
    english: 'Dynamic Programming (DP)',
    chinese: '动态规划',
    englishDefinition: 'An optimization technique used to solve complex problems by breaking them down into simpler overlapping subproblems and storing the results of these subproblems to avoid redundant computations.',
    chineseDefinition: '一种通过将复杂问题分解为更简单的重叠子问题，并存储这些子问题的结果以避免重复计算，从而解决复杂问题的优化技术。'
  },

  // E
  {
    english: 'Edge',
    chinese: '边',
    englishDefinition: 'A connection between two vertices in a graph.',
    chineseDefinition: '图中连接两个顶点的关系。'
  },
  {
    english: 'Enqueue (Operation)',
    chinese: '入队 (操作)',
    englishDefinition: 'The operation of adding an element to the rear of a queue.',
    chineseDefinition: '将元素加入队列尾部的操作。'
  },

  // F
  {
    english: 'Fibonacci Heap',
    chinese: '斐波那契堆',
    englishDefinition: 'A data structure for priority queue operations, consisting of a collection of trees. It has better amortized running times than binary heaps for some operations.',
    chineseDefinition: '一种用于优先队列操作的数据结构，由一组树构成。对于某些操作，它具有比二叉堆更好的摊还运行时间。'
  },
  {
    english: 'FIFO (First-In-First-Out)',
    chinese: '先进先出',
    englishDefinition: 'A property of a queue where the element added first is the one removed first.',
    chineseDefinition: '队列的一种特性，即最先添加的元素最先被移除。'
  },
  {
    english: 'Floyd-Warshall Algorithm',
    chinese: '弗洛伊德-沃舍尔算法',
    englishDefinition: 'An algorithm for finding the shortest paths in a weighted graph with positive or negative edge weights (but no negative cycles). It computes all pairs of vertices simultaneously.',
    chineseDefinition: '一种在具有正或负边权（但无负环）的加权图中寻找最短路径的算法。它一次性计算所有顶点对之间的最短路径。'
  },
  {
    english: 'Full Binary Tree',
    chinese: '满二叉树',
    englishDefinition: 'A binary tree in which every node has either 0 or 2 children.',
    chineseDefinition: '一种每个节点要么有0个子节点要么有2个子节点的二叉树。'
  },

  // G
  {
    english: 'Graph',
    chinese: '图',
    englishDefinition: 'A non-linear data structure consisting of a finite set of vertices (or nodes) and a set of edges connecting them.',
    chineseDefinition: '由一组有限的顶点（或节点）和一组连接这些顶点的边构成的非线性数据结构。'
  },
  {
    english: 'Greedy Algorithm',
    chinese: '贪心算法',
    englishDefinition: 'An algorithmic paradigm that makes the locally optimal choice at each stage with the hope of finding a global optimum.',
    chineseDefinition: '一种在每个阶段都做出当前看来最优的选择，以期找到全局最优解的算法范式。'
  },

  // H
  {
    english: 'Hash Function',
    chinese: '哈希函数',
    englishDefinition: 'A function that maps data of arbitrary size to fixed-size values (hash values or hashes), typically used to index into a hash table.',
    chineseDefinition: '一种将任意大小的数据映射到固定大小值（哈希值）的函数，通常用于索引哈希表。'
  },
  {
    english: 'Hash Table',
    chinese: '哈希表',
    englishDefinition: 'A data structure that implements an associative array abstract data type, mapping keys to values via a hash function for efficient lookup, insertion, and deletion.',
    chineseDefinition: '一种实现关联数组抽象数据类型的数据结构，通过哈希函数将键映射到值，以实现高效的查找、插入和删除操作。'
  },
  {
    english: 'Heap',
    chinese: '堆',
    englishDefinition: 'A specialized tree-based data structure that satisfies the heap property: in a max-heap, the key at each node is greater than or equal to the keys of its children; in a min-heap, it\'s less than or equal.',
    chineseDefinition: '一种基于树的专用数据结构，满足堆属性：在大顶堆中，每个节点的键都大于或等于其子节点的键；在小顶堆中，则小于或等于。'
  },
  {
    english: 'Heapify',
    chinese: '堆化',
    englishDefinition: 'The process of rearranging a heap to maintain the heap property after an insertion or deletion, or to build a heap from an arbitrary array.',
    chineseDefinition: '在插入或删除操作后，为了维持堆属性而重新排列堆的过程；或从一个任意数组构建堆的过程。'
  },
  {
    english: 'Height (Tree)',
    chinese: '高度 (树)',
    englishDefinition: 'The number of edges on the longest downward path between the root and a leaf node.',
    chineseDefinition: '从根节点到最远叶子节点的最长下降路径上的边数。'
  },

  // I
  {
    english: 'In-degree',
    chinese: '入度',
    englishDefinition: 'In a directed graph, the number of edges that point to a given vertex.',
    chineseDefinition: '在有向图中，指向一个给定顶点的边的数量。'
  },
  {
    english: 'In-place Algorithm',
    chinese: '原地算法',
    englishDefinition: 'An algorithm that transforms its input data using a data structure with a small, constant amount of extra storage space.',
    chineseDefinition: '一种使用少量、恒定的额外存储空间来转换输入数据的算法。'
  },
  {
    english: 'Inorder Traversal',
    chinese: '中序遍历',
    englishDefinition: 'A tree traversal method that visits nodes in the order: left subtree, root node, right subtree (for a binary tree).',
    chineseDefinition: '一种按“左子树、根节点、右子树”顺序访问节点的树遍历方法（对于二叉树而言）。'
  },
  {
    english: 'Insertion Sort',
    chinese: '插入排序',
    englishDefinition: 'A simple sorting algorithm that builds the final sorted array one element at a time by repeatedly inserting a new element into the already sorted part of the array.',
    chineseDefinition: '一种简单的排序算法，通过反复将一个新元素插入到数组已排序部分，从而逐步构建最终排序结果。'
  },
  {
    english: 'Iteration',
    chinese: '迭代',
    englishDefinition: 'The repetition of a process or set of instructions, often using constructs like loops, where an explicit counter or condition determines when the process stops.',
    chineseDefinition: '一个过程或一组指令的重复执行，通常使用循环结构，并由显式计数器或条件决定何时停止。'
  },

  // K
  {
    english: 'Kruskal\'s Algorithm',
    chinese: '克鲁斯卡尔算法',
    englishDefinition: 'A minimum-spanning-tree algorithm that finds an edge of the least possible weight that connects any two trees in the forest. It is a greedy algorithm.',
    chineseDefinition: '一种最小生成树算法，它找到连接森林中任意两棵树的最小可能权重的边。这是一种贪心算法。'
  },

  // L
  {
    english: 'LIFO (Last-In-First-Out)',
    chinese: '后进先出',
    englishDefinition: 'A property of a stack where the most recently added element is the one removed first.',
    chineseDefinition: '栈的一种特性，即最近添加的元素最先被移除。'
  },
  {
    english: 'Linear Probing',
    chinese: '线性探测',
    englishDefinition: 'A collision resolution method in open addressing hash tables where, if a collision occurs, the algorithm looks for the next available slot sequentially.',
    chineseDefinition: '开放寻址哈希表中的一种冲突解决方法，当发生冲突时，算法顺序地查找下一个可用的槽位。'
  },
  {
    english: 'Linked List',
    chinese: '链表',
    englishDefinition: 'A linear data structure in which elements, called nodes, are not stored at contiguous memory locations but are linked using pointers.',
    chineseDefinition: '一种线性数据结构，其中的元素（称为节点）不存储在连续的内存位置中，而是通过指针进行链接。'
  },
  {
    english: 'Load Factor',
    chinese: '负载因子',
    englishDefinition: 'A measure of how full a hash table is, typically calculated as number of stored entries divided by the number of buckets. It influences the probability of collisions.',
    chineseDefinition: '衡量哈希表填满程度的指标，通常计算为已存储条目数除以桶数。它影响冲突的概率。'
  },

  // M
  {
    english: 'Memoization',
    chinese: '记忆化',
    englishDefinition: 'An optimization technique used primarily in dynamic programming to speed up programs by storing the results of expensive function calls and returning the cached result when the same inputs occur again.',
    chineseDefinition: '一种主要用于动态规划的优化技术，通过存储昂贵函数调用的结果，并在相同的输入再次出现时返回缓存的结果，从而加速程序运行。'
  },
  {
    english: 'Merge Sort',
    chinese: '归并排序',
    englishDefinition: 'An efficient, stable, divide-and-conquer sorting algorithm that divides the input array into two halves, recursively sorts them, and then merges the two sorted halves.',
    chineseDefinition: '一种高效、稳定的分治排序算法，它将输入数组分成两半，递归地对它们进行排序，然后合并这两个已排序的半部分。'
  },
  {
    english: 'Minimum Spanning Tree (MST)',
    chinese: '最小生成树',
    englishDefinition: 'A subset of the edges of a connected, edge-weighted undirected graph that connects all the vertices together without any cycles and with the minimum possible total edge weight.',
    chineseDefinition: '一个连通、边加权无向图的一个边子集，它连接所有顶点，不包含任何环，并且总边权尽可能小。'
  },

  // N
  {
    english: 'Node',
    chinese: '节点',
    englishDefinition: 'A basic unit of a data structure, such as a linked list or tree, that contains data and may link to other nodes.',
    chineseDefinition: '数据结构（如链表或树）中的基本单元，包含数据并可能链接到其他节点。'
  },

  // O
  {
    english: 'Open Addressing',
    chinese: '开放寻址',
    englishDefinition: 'A collision resolution method in hash tables where all elements are stored directly in the hash table array itself, with collisions resolved by probing for empty slots.',
    chineseDefinition: '哈希表的一种冲突解决方法，其中所有元素直接存储在哈希表数组中，通过探测空槽来解决冲突。'
  },
  {
    english: 'Out-degree',
    chinese: '出度',
    englishDefinition: 'In a directed graph, the number of edges that originate from a given vertex.',
    chineseDefinition: '在有向图中，从一个给定顶点出发的边的数量。'
  },

  // P
  {
    english: 'Path',
    chinese: '路径',
    englishDefinition: 'A sequence of edges that connects a sequence of vertices in a graph.',
    chineseDefinition: '图中连接一系列顶点的一条边序列。'
  },
  {
    english: 'Perfect Binary Tree',
    chinese: '完美二叉树',
    englishDefinition: 'A binary tree in which all interior nodes have two children and all leaves have the same depth.',
    chineseDefinition: '一种所有内部节点都有两个子节点，且所有叶子节点都具有相同深度的二叉树。'
  },
  {
    english: 'Postorder Traversal',
    chinese: '后序遍历',
    englishDefinition: 'A tree traversal method that visits nodes in the order: left subtree, right subtree, root node.',
    chineseDefinition: '一种按“左子树、右子树、根节点”顺序访问节点的树遍历方法。'
  },
  {
    english: 'Preorder Traversal',
    chinese: '前序遍历',
    englishDefinition: 'A tree traversal method that visits nodes in the order: root node, left subtree, right subtree.',
    chineseDefinition: '一种按“根节点、左子树、右子树”顺序访问节点的树遍历方法。'
  },
  {
    english: 'Prim\'s Algorithm',
    chinese: '普里姆算法',
    englishDefinition: 'A greedy algorithm that finds a minimum spanning tree for a weighted undirected graph by building the tree one vertex at a time.',
    chineseDefinition: '一种贪心算法，通过一次添加一个顶点的方式，为加权无向图寻找最小生成树。'
  },
  {
    english: 'Priority Queue',
    chinese: '优先队列',
    englishDefinition: 'An abstract data type similar to a regular queue or stack but where each element has a priority, and elements are served based on their priority.',
    chineseDefinition: '一种类似于普通队列或栈的抽象数据类型，但每个元素都有一个优先级，元素的出队顺序基于其优先级。'
  },
  {
    english: 'Pruning',
    chinese: '剪枝',
    englishDefinition: 'A technique used in search algorithms (especially backtracking) to eliminate branches that cannot possibly lead to a valid or optimal solution.',
    chineseDefinition: '在搜索算法（尤其是回溯法）中使用的一种技术，用于消除不可能产生有效或最优解的分支。'
  },
  {
    english: 'Push (Stack Operation)',
    chinese: '压栈 (操作)',
    englishDefinition: 'The operation of adding an element to the top of a stack.',
    chineseDefinition: '将一个元素添加到栈顶的操作。'
  },

  // Q
  {
    english: 'Queue',
    chinese: '队列',
    englishDefinition: 'A linear data structure that follows the First-In-First-Out (FIFO) principle.',
    chineseDefinition: '遵循先进先出（FIFO）原则的线性数据结构。'
  },
  {
    english: 'Quick Sort',
    chinese: '快速排序',
    englishDefinition: 'An efficient, in-place, divide-and-conquer sorting algorithm that picks an element as a pivot and partitions the array around the pivot.',
    chineseDefinition: '一种高效的原地分治排序算法，它选择一个元素作为基准，并将数组围绕基准进行分区。'
  },

  // R
  {
    english: 'Radix Sort',
    chinese: '基数排序',
    englishDefinition: 'A non-comparative integer sorting algorithm that sorts data by processing individual digits of the keys, either from the least significant digit (LSD) or most significant digit (MSD).',
    chineseDefinition: '一种非比较型的整数排序算法，它通过处理键的各个数位来排序数据，可以从最低有效位（LSD）或最高有效位（MSD）开始。'
  },
  {
    english: 'Randomized Algorithm',
    chinese: '随机化算法',
    englishDefinition: 'An algorithm that uses a degree of randomness as part of its logic to achieve good average performance or to simplify the design.',
    chineseDefinition: '一种在其逻辑中使用一定随机性的算法，以达到良好的平均性能或简化设计。'
  },
  {
    english: 'Recursion',
    chinese: '递归',
    englishDefinition: 'A technique where a function solves a problem by calling itself on smaller instances of the same problem.',
    chineseDefinition: '一种函数通过在更小的相同问题实例上调用自身来解决问题的方法。'
  },
  {
    english: 'Red-Black Tree',
    chinese: '红黑树',
    englishDefinition: 'A self-balancing binary search tree where each node stores an extra bit representing color (red or black), used to ensure the tree remains balanced during insertions and deletions.',
    chineseDefinition: '一种自平衡二叉搜索树，其中每个节点存储一个表示颜色（红色或黑色）的额外位，用于确保在插入和删除期间树保持平衡。'
  },

  // S
  {
    english: 'Selection Sort',
    chinese: '选择排序',
    englishDefinition: 'A simple, in-place sorting algorithm that repeatedly finds the minimum element from the unsorted part and puts it at the beginning.',
    chineseDefinition: '一种简单的原地排序算法，它反复从未排序部分找到最小元素，并将其放到已排序部分的末尾（即开头）。'
  },
  {
    english: 'Self-Balancing Tree',
    chinese: '自平衡树',
    englishDefinition: 'A tree that automatically keeps its height small in the face of arbitrary insertions and deletions, guaranteeing O(log n) time complexity for operations.',
    chineseDefinition: '一种在任意插入和删除操作下都能自动保持较小高度的树，从而保证操作的时间复杂度为 O(log n)。'
  },
  {
    english: 'Separate Chaining',
    chinese: '分离链接法',
    englishDefinition: 'A synonym for chaining, a collision resolution method for hash tables.',
    chineseDefinition: '链地址法的同义词，一种哈希表的冲突解决方法。'
  },
  {
    english: 'Shortest Path Problem',
    chinese: '最短路径问题',
    englishDefinition: 'The problem of finding a path between two vertices in a graph such that the sum of the weights of its constituent edges is minimized.',
    chineseDefinition: '在图的两个顶点之间寻找一条路径，使得路径上所有边的权值之和最小的问题。'
  },
  {
    english: 'Sorting Algorithm',
    chinese: '排序算法',
    englishDefinition: 'An algorithm that arranges elements of a list or array in a specific order, typically numerical or lexicographical.',
    chineseDefinition: '将列表或数组中的元素按特定顺序（通常是数字或字典顺序）进行排列的算法。'
  },
  {
    english: 'Space Complexity',
    chinese: '空间复杂度',
    englishDefinition: 'The amount of memory space an algorithm or data structure requires as a function of the input size.',
    chineseDefinition: '算法或数据结构作为输入规模函数所需要的内存量。'
  },
  {
    english: 'Stack',
    chinese: '栈',
    englishDefinition: 'A linear data structure that follows the Last-In-First-Out (LIFO) principle.',
    chineseDefinition: '遵循后进先出（LIFO）原则的线性数据结构。'
  },

  // T
  {
    english: 'Tail Recursion',
    chinese: '尾递归',
    englishDefinition: 'A form of recursion where the recursive call is the final instruction in the function, allowing compilers or interpreters to optimize it by reusing stack frames.',
    chineseDefinition: '一种递归形式，其中递归调用是函数中的最后一条指令，允许编译器或解释器通过重用栈帧来优化它。'
  },
  {
    english: 'Ternary Search',
    chinese: '三分查找',
    englishDefinition: 'A divide-and-conquer search algorithm that divides the array into three parts, used to find the maximum or minimum of a unimodal function.',
    chineseDefinition: '一种将数组分成三部分的分治搜索算法，用于查找单峰函数的最大值或最小值。'
  },
  {
    english: 'Time Complexity',
    chinese: '时间复杂度',
    englishDefinition: 'A computational estimate of the amount of time an algorithm takes to run as a function of the length of the input, typically expressed using Big-O notation.',
    chineseDefinition: '对算法运行时间与输入长度之间关系的一种计算估计，通常使用大O表示法表达。'
  },
  {
    english: 'Topological Sort',
    chinese: '拓扑排序',
    englishDefinition: 'A linear ordering of vertices in a directed acyclic graph such that for every directed edge from vertex u to vertex v, u comes before v in the ordering.',
    chineseDefinition: '有向无环图中顶点的一种线性排序，使得对于每一条从顶点 u 指向顶点 v 的边，u 在排序中都出现在 v 之前。'
  },
  {
    english: 'Traversal',
    chinese: '遍历',
    englishDefinition: 'The process of visiting (checking and/or updating) each node in a data structure exactly once.',
    chineseDefinition: '访问数据结构中每个节点一次且仅一次的过程。'
  },
  {
    english: 'Tree',
    chinese: '树',
    englishDefinition: 'A widely-used non-linear hierarchical data structure consisting of nodes connected by edges, with a root node and parent-child relationships.',
    chineseDefinition: '一种广泛使用的非线性分层数据结构，由节点和连接节点的边组成，具有根节点和父子关系。'
  },
  {
    english: 'Trie (Prefix Tree)',
    chinese: '字典树 / 前缀树',
    englishDefinition: 'A tree-like data structure used for efficient retrieval of a key in a large dataset of strings, where the position of a node in the tree represents a prefix of a string.',
    chineseDefinition: '一种树形数据结构，用于在大型字符串数据集中高效检索键，其中节点在树中的位置代表一个字符串的前缀。'
  },

  // U
  {
    english: 'Undirected Graph',
    chinese: '无向图',
    englishDefinition: 'A graph in which edges have no direction, meaning the connection between two vertices is symmetric.',
    chineseDefinition: '一种边没有方向的图，意味着两个顶点之间的连接是对称的。'
  },
  {
    english: 'Union-Find (Disjoint Set Union)',
    chinese: '并查集',
    englishDefinition: 'A data structure that tracks a set of elements partitioned into a number of disjoint (non-overlapping) subsets, with efficient operations to merge sets (union) and find which set an element belongs to (find).',
    chineseDefinition: '一种跟踪一组元素的数据结构，这些元素被划分为多个不相交的子集，并提供高效的合并集合（并）和查找元素所属集合（查）的操作。'
  },

  // V
  {
    english: 'Vertex',
    chinese: '顶点',
    englishDefinition: 'A fundamental unit of which graphs are formed, also known as a node.',
    chineseDefinition: '构成图的基本单元，也称为节点。'
  },

  // W
  {
    english: 'Weighted Graph',
    chinese: '加权图',
    englishDefinition: 'A graph where each edge is assigned a numerical value, called a weight, which may represent cost, distance, capacity, etc.',
    chineseDefinition: '一种每条边都分配了一个称为权重的数值的图，该数值可以表示成本、距离、容量等。'
  }
];