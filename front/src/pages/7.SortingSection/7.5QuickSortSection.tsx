import { createTopicSection } from '../TopicSection/createTopicSection';

const QuickSortSection = createTopicSection({
  id: '7.5',
  name: 'Quick Sort',
  chapterNumber: '7.5',
  overview: 'Quick sort partitions data around a pivot and recursively sorts partitions. It is fast in practice and in-place.',
  concepts: [{ title: 'Partitioning', content: 'Elements smaller than pivot move left, larger move right.', examples: ['Lomuto and Hoare schemes'] }],
  complexity: { time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n^2)' }, space: 'O(log n) recursion avg' },
  operations: [{ name: 'Quick Sort', description: 'Rearrange around pivot', steps: ['Pick pivot', 'Partition', 'Recurse left/right'] }],
    exercises: [{
    title: 'In-place Quick Sort',
    difficulty: 'Medium',
    description: 'Implement partition and recursion.',
    hints: ['Handle indices carefully'],
    solutions: `#include <iostream>
  #include <vector>

  int partition(std::vector<int>& arr, int left, int right) {
    int pivot = arr[right];
    int i = left;
    for (int j = left; j < right; ++j) {
      if (arr[j] < pivot) {
        std::swap(arr[i], arr[j]);
        ++i;
      }
    }
    std::swap(arr[i], arr[right]);
    return i;
  }

  void quickSort(std::vector<int>& arr, int left, int right) {
    if (left >= right) return;
    int p = partition(arr, left, right);
    quickSort(arr, left, p - 1);
    quickSort(arr, p + 1, right);
  }

  int main() {
    std::vector<int> arr = {9, 3, 7, 1, 8, 2};
    quickSort(arr, 0, static_cast<int>(arr.size()) - 1);
    for (int x : arr) std::cout << x << " ";
    std::cout << std::endl;
    return 0;
  }`
    },
    {
      title: 'Concept Check: Quick Sort',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Quick Sort and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
    practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `#include <vector>

int partition(std::vector<int>& arr, int l, int r) {
  int pivot = arr[r], i = l;
  for (int j = l; j < r; ++j) if (arr[j] < pivot) std::swap(arr[i++], arr[j]);
  std::swap(arr[i], arr[r]);
  return i;
}

void quickSort(std::vector<int>& arr, int l, int r) {
  if (l >= r) return;
  int p = partition(arr, l, r);
  quickSort(arr, l, p - 1);
  quickSort(arr, p + 1, r);
}`,
      operations: `int partitionLomuto(std::vector<int>& arr, int l, int r) {
  int pivot = arr[r], i = l;
  for (int j = l; j < r; ++j) if (arr[j] <= pivot) std::swap(arr[i++], arr[j]);
  std::swap(arr[i], arr[r]);
  return i;
}`,
      advanced: `// Advanced: randomize pivot to reduce worst-case risk.`
    },
    c: {
      basic: `int partition(int arr[], int l, int r) {
  int pivot = arr[r], i = l;
  for (int j = l; j < r; ++j) {
    if (arr[j] < pivot) {
      int t = arr[i]; arr[i] = arr[j]; arr[j] = t; ++i;
    }
  }
  int t = arr[i]; arr[i] = arr[r]; arr[r] = t;
  return i;
}

void quick_sort(int arr[], int l, int r) {
  if (l >= r) return;
  int p = partition(arr, l, r);
  quick_sort(arr, l, p - 1);
  quick_sort(arr, p + 1, r);
}`,
      operations: `int partition_lomuto(int arr[], int l, int r) {
  int pivot = arr[r], i = l;
  for (int j = l; j < r; ++j) if (arr[j] <= pivot) {
    int t = arr[i]; arr[i] = arr[j]; arr[j] = t; ++i;
  }
  int t = arr[i]; arr[i] = arr[r]; arr[r] = t;
  return i;
}`,
      advanced: `/* Advanced: median-of-three/random pivot for robustness. */`
    }
  },
    theoryLinks: [
    { title: 'Quick Sort', url: 'https://www.geeksforgeeks.org/quick-sort/', platform: 'GeeksforGeeks'}
  ],
  practiceLinks: [
    { title: 'Sort', url: 'https://leetcode.cn/problem-list/sorting/', platform: 'Leetcode'}
  ],
  visualNodes: ['9', '3', '7', '1', '8', '2'],
  visualCaption: 'Partition by pivot',
  visualForm: 'algorithm',
  visualScript: { kind: 'array', autoGenerate: true },
});

export default QuickSortSection;
