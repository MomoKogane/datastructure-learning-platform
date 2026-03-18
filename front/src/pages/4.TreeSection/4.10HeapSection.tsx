import { createTopicSection } from '../TopicSection/createTopicSection';

const HeapSection = createTopicSection({
  id: '4.10',
  name: 'Heap',
  chapterNumber: '4.10',
  overview: 'Heap is a complete binary tree that satisfies the heap-order property and is widely used for priority queues and top-k style problems.',
  concepts: [
    { title: 'Complete Binary Tree', content: 'Heap is stored level by level from left to right, making array representation natural.', examples: ['Parent i, children 2i+1 and 2i+2'] },
    { title: 'Heap-order Property', content: 'Max-heap keeps parent >= children, min-heap keeps parent <= children.', examples: ['Top element is always global max/min'] }
  ],
  complexity: { time: { build: 'O(n)', insert: 'O(log n)', extractTop: 'O(log n)', peek: 'O(1)' }, space: 'O(n)' },
  operations: [
    { name: 'Build Heap (Heapify)', description: 'Build max-heap/min-heap from complete binary tree array.', steps: ['Start heapify from last non-leaf node', 'Mark current heapify node', 'Swap with child when needed until heap property holds'] }
  ],
  exercises: [
    {
      title: 'Implement Max Heap',
      difficulty: 'Medium',
      description: 'Support push, pop, and top operations using array storage.',
      hints: ['Write reusable siftUp/siftDown helpers'],
      solutions: `#include <vector>
#include <stdexcept>

class MaxHeap {
 private:
  std::vector<int> heap;

  void siftUp(int i) {
    while (i > 0) {
      int p = (i - 1) / 2;
      if (heap[p] >= heap[i]) break;
      std::swap(heap[p], heap[i]);
      i = p;
    }
  }

  void siftDown(int i) {
    int n = static_cast<int>(heap.size());
    while (true) {
      int l = i * 2 + 1;
      int r = i * 2 + 2;
      int largest = i;
      if (l < n && heap[l] > heap[largest]) largest = l;
      if (r < n && heap[r] > heap[largest]) largest = r;
      if (largest == i) break;
      std::swap(heap[i], heap[largest]);
      i = largest;
    }
  }

 public:
  void push(int x) {
    heap.push_back(x);
    siftUp(static_cast<int>(heap.size()) - 1);
  }

  int top() const {
    if (heap.empty()) throw std::runtime_error("heap is empty");
    return heap[0];
  }

  void pop() {
    if (heap.empty()) throw std::runtime_error("heap is empty");
    heap[0] = heap.back();
    heap.pop_back();
    if (!heap.empty()) siftDown(0);
  }
};`
    }
  ,
    {
      title: 'Concept Check: Heap',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Heap and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples : {
    python: {
      basic: `import heapq

heap = []
for x in [5, 3, 8, 1]:
    heapq.heappush(heap, x)

print('top =', heap[0])`,
      operations: `import heapq

heap = []
for x in [7, 2, 9, 1, 5]:
    heapq.heappush(heap, x)

smallest = heapq.heappop(heap)
heapq.heappush(heap, 4)
print('popped =', smallest)
print('top =', heap[0])`,
      advanced: `def heapify(arr, n, i):
    smallest = i
    l = 2 * i + 1
    r = 2 * i + 2
    if l < n and arr[l] < arr[smallest]:
        smallest = l
    if r < n and arr[r] < arr[smallest]:
        smallest = r
    if smallest != i:
        arr[i], arr[smallest] = arr[smallest], arr[i]
        heapify(arr, n, smallest)

def build_min_heap(arr):
    for i in range(len(arr) // 2 - 1, -1, -1):
        heapify(arr, len(arr), i)`
    },
    java: {
      basic: `import java.util.PriorityQueue;

public class HeapBasic {
    public static void main(String[] args) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        heap.offer(5);
        heap.offer(3);
        heap.offer(8);
        heap.offer(1);
        System.out.println("top = " + heap.peek());
    }
}`,
      operations: `import java.util.PriorityQueue;

public class HeapOps {
    public static void main(String[] args) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int x : new int[]{7, 2, 9, 1, 5}) heap.offer(x);

        int smallest = heap.poll();
        heap.offer(4);
        System.out.println("popped = " + smallest);
        System.out.println("top = " + heap.peek());
    }
}`,
      advanced: `public class BuildHeap {
    static void heapify(int[] arr, int n, int i) {
        int smallest = i;
        int l = 2 * i + 1, r = 2 * i + 2;
        if (l < n && arr[l] < arr[smallest]) smallest = l;
        if (r < n && arr[r] < arr[smallest]) smallest = r;
        if (smallest != i) {
            int t = arr[i]; arr[i] = arr[smallest]; arr[smallest] = t;
            heapify(arr, n, smallest);
        }
    }

    static void buildMinHeap(int[] arr) {
        for (int i = arr.length / 2 - 1; i >= 0; --i) heapify(arr, arr.length, i);
    }
}`
    },
    cpp: {
      basic: `// Heap is a complete binary tree with an order property.
  #include <iostream>
  #include <vector>
  using namespace std;

  // define a simple min-heap class with array storage
  class MinHeap {
  private:
      vector<int> heap; // store heap elements in an array

  public:
      // get parent index
      int parent(int i) { return (i - 1) / 2; }
      // get left child index
      int left(int i) { return 2 * i + 1; }
      // get right child index
      int right(int i) { return 2 * i + 2; }

      // print heap elements
      void printHeap() {
          for (int val : heap) cout << val << " ";
          cout << endl;
      }
  };

  int main() {
      MinHeap heap;
      return 0;
  }`,
      operations: `// Insert uses sift-up; extract-top uses sift-down.
  #include <iostream>
  #include <vector>
  #include <algorithm> // in order to swap
  using namespace std;

  class MinHeap {
  private:
      vector<int> heap;

      // sift-up (insert)
      void siftUp(int i) {
          if (i == 0) return; // root node, no parent
          int p = parent(i);
          if (heap[i] < heap[p]) { // child is smaller than parent, need to swap
              swap(heap[i], heap[p]);
              siftUp(p); // continue sifting up the parent index
          }
      }

      // sift-down (extract top)
      void siftDown(int i) {
          int l = left(i);
          int r = right(i);
          int smallest = i;

          // find the smallest value among i, l, r
          if (l < heap.size() && heap[l] < heap[smallest]) smallest = l;
          if (r < heap.size() && heap[r] < heap[smallest]) smallest = r;

          if (smallest != i) { // if the smallest is not the current index, swap and continue sifting down
              swap(heap[i], heap[smallest]);
              siftDown(smallest); // continue sifting down the smallest index
          }
      }

  public:
      int parent(int i) { return (i - 1) / 2; }
      int left(int i) { return 2 * i + 1; }
      int right(int i) { return 2 * i + 2; }

      // insert a new value into the heap
      void insert(int val) {
          heap.push_back(val);
          siftUp(heap.size() - 1); // insert at the end, then sift up
      }

      // get the top value of the heap
      int extractTop() {
          if (heap.empty()) throw runtime_error("Heap is empty!");
          int top = heap[0];
          heap[0] = heap.back(); // move last element to the top
          heap.pop_back();
          siftDown(0); // sift down the new top element
          return top;
      }
  };

  int main() {
      MinHeap heap;
      heap.insert(5);
      heap.insert(3);
      heap.insert(8);
      cout << "Extracted top: " << heap.extractTop() << endl; // 输出3
      return 0;
  }`,
      advanced: `// Build-heap runs in O(n), better than n inserts O(n log n).
  #include <iostream>
  #include <vector>
  #include <algorithm>
  using namespace std;

  class MinHeap {
  private:
      vector<int> heap;

      void siftDown(int i, int size) {
          int l = 2 * i + 1;
          int r = 2 * i + 2;
          int smallest = i;

          if (l < size && heap[l] < heap[smallest]) smallest = l;
          if (r < size && heap[r] < heap[smallest]) smallest = r;

          if (smallest != i) {
              swap(heap[i], heap[smallest]);
              siftDown(smallest, size);
          }
      }

  public:
      // build-heap runs in O(n), better than n inserts O(n log n)
      void buildHeap(vector<int>& arr) {
          heap = arr;
          int n = heap.size();
          // 从最后一个非叶子节点开始向下调整
          for (int i = n / 2 - 1; i >= 0; i--) {
              siftDown(i, n);
          }
      }

      // heap sort runs in O(n log n)
      void heapSort() {
          int n = heap.size();
          // 逐步提取堆顶，缩小堆范围
          for (int i = n - 1; i > 0; i--) {
              swap(heap[0], heap[i]); // 堆顶移到末尾
              siftDown(0, i); // 调整剩余堆
          }
      }

      void printHeap() {
          for (int val : heap) cout << val << " ";
          cout << endl;
      }
  };

  int main() {
      vector<int> arr = {9, 4, 7, 1, 3, 6, 5};
      MinHeap heap;
      heap.buildHeap(arr);
      cout << "Built heap: ";
      heap.printHeap(); // output: 1 3 5 9 4 6 7
      heap.heapSort();
      cout << "Sorted array: ";
      heap.printHeap(); // output results in sorted order
      return 0;
  }`
    },
    c: {
      basic: `/* Heap supports priority queue operations efficiently. */
  #include <stdio.h>
  #include <stdlib.h>

  #define MAX_HEAP_SIZE 100

  // heap structure using array representation
  typedef struct {
      int data[MAX_HEAP_SIZE];
      int size; // current number of elements in the heap
  } MinHeap;

  // initialize the heap
  void initHeap(MinHeap *heap) {
      heap->size = 0;
  }

  // get parent index
  int parent(int i) {
      return (i - 1) / 2;
  }

  //  get left child index
  int left(int i) {
      return 2 * i + 1;
  }

  //  get right child index
  int right(int i) {
      return 2 * i + 2;
  }

  //    swap two elements in the heap
  void printHeap(MinHeap *heap) {
      for (int i = 0; i < heap->size; i++) {
          printf("%d ", heap->data[i]);
      }
      printf("\\n");
  }

  int main() {
      MinHeap heap;
      initHeap(&heap);
      return 0;
  }`,
      operations: `/* Use array plus sift-up and sift-down. */
  #include <stdio.h>
  #include <stdlib.h>

  #define MAX_HEAP_SIZE 100

  typedef struct {
      int data[MAX_HEAP_SIZE];
      int size;
  } MinHeap;

  void initHeap(MinHeap *heap) {
      heap->size = 0;
  }

  int parent(int i) { return (i - 1) / 2; }
  int left(int i) { return 2 * i + 1; }
  int right(int i) { return 2 * i + 2; }

  // swap two elements in the heap
  void swap(int *a, int *b) {
      int temp = *a;
      *a = *b;
      *b = temp;
  }

  //  sift up to maintain heap property
  void siftUp(MinHeap *heap, int i) {
      if (i == 0) return;
      int p = parent(i);
      if (heap->data[i] < heap->data[p]) {
          swap(&heap->data[i], &heap->data[p]);
          siftUp(heap, p);
      }
  }

  // sift down to maintain heap property
  void siftDown(MinHeap *heap, int i) {
      int l = left(i);
      int r = right(i);
      int smallest = i;

      if (l < heap->size && heap->data[l] < heap->data[smallest]) {
          smallest = l;
      }
      if (r < heap->size && heap->data[r] < heap->data[smallest]) {
          smallest = r;
      }

      if (smallest != i) {
          swap(&heap->data[i], &heap->data[smallest]);
          siftDown(heap, smallest);
      }
  }

  // insert an element into the heap
  int insert(MinHeap *heap, int val) {
      if (heap->size >= MAX_HEAP_SIZE) {
          printf("Heap is full!\\n");
          return -1;
      }
      heap->data[heap->size] = val;
      siftUp(heap, heap->size);
      heap->size++;
      return 0;
  }

  // get the top element of the heap
  int extractTop(MinHeap *heap) {
      if (heap->size == 0) {
          printf("Heap is empty!\\n");
          return -1;
      }
      int top = heap->data[0];
      heap->data[0] = heap->data[heap->size - 1];
      heap->size--;
      siftDown(heap, 0);
      return top;
  }

  int main() {
      MinHeap heap;
      initHeap(&heap);
      insert(&heap, 5);
      insert(&heap, 3);
      insert(&heap, 8);
      printf("Extracted top: %d\\n", extractTop(&heap)); // output: 3
      return 0;
  }`,
      advanced: `/* Bottom-up heapify builds heap in linear time. */
  #include <stdio.h>
  #include <stdlib.h>

  #define MAX_HEAP_SIZE 100

  typedef struct {
      int data[MAX_HEAP_SIZE];
      int size;
  } MinHeap;

  void initHeap(MinHeap *heap) {
      heap->size = 0;
  }

  int parent(int i) { return (i - 1) / 2; }
  int left(int i) { return 2 * i + 1; }
  int right(int i) { return 2 * i + 2; }

  void swap(int *a, int *b) {
      int temp = *a;
      *a = *b;
      *b = temp;
  }

  // si ft down to maintain heap property
  void siftDown(MinHeap *heap, int i, int size) {
      int l = left(i);
      int r = right(i);
      int smallest = i;

      if (l < size && heap->data[l] < heap->data[smallest]) {
          smallest = l;
      }
      if (r < size && heap->data[r] < heap->data[smallest]) {
          smallest = r;
      }

      if (smallest != i) {
          swap(&heap->data[i], &heap->data[smallest]);
          siftDown(heap, smallest, size);
      }
  }

  //  build heap from an array in O(n) time
  void buildHeap(MinHeap *heap, int arr[], int n) {
      if (n > MAX_HEAP_SIZE) {
          printf("Array size exceeds heap limit!\\n");
          return;
      }
      // 复制数组到堆
      for (int i = 0; i < n; i++) {
          heap->data[i] = arr[i];
      }
      heap->size = n;

      //  from last non-leaf node down to root, sift down to maintain heap property
      for (int i = n / 2 - 1; i >= 0; i--) {
          siftDown(heap, i, n);
      }
  }

  // heap sort using the heap structure
  void heapSort(MinHeap *heap) {
      int n = heap->size;
      // get the top element of the heap and put it at the end, then reduce the heap size and sift down the new top element
      for (int i = n - 1; i > 0; i--) {
          swap(&heap->data[0], &heap->data[i]); // swap root with last element
          siftDown(heap, 0, i); // sift down the new root
      }
  }

  void printHeap(MinHeap *heap) {
      for (int i = 0; i < heap->size; i++) {
          printf("%d ", heap->data[i]);
      }
      printf("\\n");
  }

  int main() {
      int arr[] = {9, 4, 7, 1, 3, 6, 5};
      int n = sizeof(arr) / sizeof(arr[0]);
      
      MinHeap heap;
      initHeap(&heap);
      buildHeap(&heap, arr, n);
      
      printf("Built heap: ");
      printHeap(&heap); // output: 1 3 5 9 4 6 7
      
      heapSort(&heap);
      printf("Sorted array: ");
      printHeap(&heap); // output results in sorted order
      
      return 0;
  }`
    }
  },
    theoryLinks: [
    { title: 'Binary Heap', url: 'https://www.geeksforgeeks.org/binary-heap/', platform: 'GeeksforGeeks'}
  ],
  practiceLinks: [
    { title: 'Heap', url: 'https://leetcode.cn/problems/top-k-frequent-elements/description/', platform: 'Leetcode'}
  ],
  visualNodes: ['10', '20', '30', '40', '50', '60', '70'],
  visualCaption: 'Complete binary tree heapify process with current/swap node highlighting',
  visualForm: 'tree',
  visualScript: { kind: 'tree', autoGenerate: true },
  forceLocalVisualization: true,
});

export default HeapSection;
