import { createTopicSection } from '../TopicSection/createTopicSection';

const HeapSortSection = createTopicSection({
  id: '7.7',
  name: 'Heap Sort',
  chapterNumber: '7.7',
  overview: 'Heap sort builds a heap and repeatedly extracts max/min to produce sorted order.',
  concepts: [{ title: 'Heap Property', content: 'Parent key dominates children in max-heap/min-heap.', examples: ['Array-based complete binary tree'] }],
  complexity: { time: { buildHeap: 'O(n)', sort: 'O(n log n)' }, space: 'O(1)' },
  operations: [{ name: 'Heap Sort', description: 'Restore heap property', steps: ['Compare with children', 'Swap larger/smaller', 'Continue downward'] }],
    exercises: [{
    title: 'Heap Sort Implementation',
    difficulty: 'Medium',
    description: 'Sort array using max-heap.',
    hints: ['Build heap first'],
    solutions: `#include <iostream>
  #include <vector>

  void heapify(std::vector<int>& arr, int n, int i) {
    int largest = i;
    int left = 2 * i + 1;
    int right = 2 * i + 2;

    if (left < n && arr[left] > arr[largest]) largest = left;
    if (right < n && arr[right] > arr[largest]) largest = right;

    if (largest != i) {
      std::swap(arr[i], arr[largest]);
      heapify(arr, n, largest);
    }
  }

  void heapSort(std::vector<int>& arr) {
    int n = static_cast<int>(arr.size());
    for (int i = n / 2 - 1; i >= 0; --i) heapify(arr, n, i);
    for (int i = n - 1; i > 0; --i) {
      std::swap(arr[0], arr[i]);
      heapify(arr, i, 0);
    }
  }

  int main() {
    std::vector<int> arr = {16, 14, 10, 8, 7, 9, 3};
    heapSort(arr);
    for (int x : arr) std::cout << x << " ";
    std::cout << std::endl;
    return 0;
  }`
    },
    {
      title: 'Concept Check: Heap Sort',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Heap Sort and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
    practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `#include <vector>

void heapify(std::vector<int>& arr, int n, int i) {
  int largest = i, l = 2 * i + 1, r = 2 * i + 2;
  if (l < n && arr[l] > arr[largest]) largest = l;
  if (r < n && arr[r] > arr[largest]) largest = r;
  if (largest != i) { std::swap(arr[i], arr[largest]); heapify(arr, n, largest); }
}

void heapSort(std::vector<int>& arr) {
  int n = static_cast<int>(arr.size());
  for (int i = n / 2 - 1; i >= 0; --i) heapify(arr, n, i);
  for (int i = n - 1; i > 0; --i) { std::swap(arr[0], arr[i]); heapify(arr, i, 0); }
}`,
      operations: `void heapifyDown(std::vector<int>& arr, int n, int i) {
  int largest = i, l = 2 * i + 1, r = 2 * i + 2;
  if (l < n && arr[l] > arr[largest]) largest = l;
  if (r < n && arr[r] > arr[largest]) largest = r;
  if (largest != i) { std::swap(arr[i], arr[largest]); heapifyDown(arr, n, largest); }
}`,
      advanced: `// Advanced: use iterative heapify to reduce recursion overhead.`
    },
    c: {
      basic: `void heapify(int arr[], int n, int i) {
  int largest = i, l = 2 * i + 1, r = 2 * i + 2;
  if (l < n && arr[l] > arr[largest]) largest = l;
  if (r < n && arr[r] > arr[largest]) largest = r;
  if (largest != i) {
    int t = arr[i]; arr[i] = arr[largest]; arr[largest] = t;
    heapify(arr, n, largest);
  }
}

void heap_sort(int arr[], int n) {
  for (int i = n / 2 - 1; i >= 0; --i) heapify(arr, n, i);
  for (int i = n - 1; i > 0; --i) {
    int t = arr[0]; arr[0] = arr[i]; arr[i] = t;
    heapify(arr, i, 0);
  }
}`,
      operations: `void heapify_down(int arr[], int n, int i) {
  int largest = i, l = 2 * i + 1, r = 2 * i + 2;
  if (l < n && arr[l] > arr[largest]) largest = l;
  if (r < n && arr[r] > arr[largest]) largest = r;
  if (largest != i) { int t = arr[i]; arr[i] = arr[largest]; arr[largest] = t; heapify_down(arr, n, largest); }
}`,
      advanced: `/* Advanced: iterative sift-down implementation. */`
    }
  },
    theoryLinks: [
    { title: 'Heap Sort', url: 'https://www.geeksforgeeks.org/heap-sort/', platform: 'GeeksforGeeks'}
  ],
  practiceLinks: [
    { title: 'Sort', url: 'https://leetcode.cn/problem-list/sorting/', platform: 'Leetcode'}
  ],
  visualNodes: ['16', '14', '10', '8', '7', '9', '3'],
  visualCaption: 'Heap-ordered structure',
  visualForm: 'algorithm',
  visualScript: { kind: 'array', autoGenerate: true },
});

export default HeapSortSection;
