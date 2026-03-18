import { createTopicSection } from '../TopicSection/createTopicSection';

const BubbleSortSection = createTopicSection({
  id: '7.2',
  name: 'Bubble Sort',
  chapterNumber: '7.2',
  overview: 'Bubble sort repeatedly swaps adjacent out-of-order elements; largest values bubble to the end each pass.',
  concepts: [{ title: 'Pass-based Comparison', content: 'Simple but inefficient for large arrays.', examples: ['Early-exit optimization'] }],
  complexity: { time: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' }, space: 'O(1)' },
  operations: [{ name: 'Bubble Sort', description: 'Compare neighbors and swap', steps: ['Left-to-right scan', 'Swap if needed', 'Shrink unsorted tail'] }],
    exercises: [{
    title: 'Optimized Bubble Sort',
    difficulty: 'Easy',
    description: 'Stop when no swap occurs.',
    hints: ['Track swapped flag'],
    solutions: `#include <iostream>
  #include <vector>

  void bubbleSort(std::vector<int>& arr) {
    for (int i = 0; i < static_cast<int>(arr.size()) - 1; ++i) {
      bool swapped = false;
      for (int j = 0; j < static_cast<int>(arr.size()) - i - 1; ++j) {
        if (arr[j] > arr[j + 1]) {
          std::swap(arr[j], arr[j + 1]);
          swapped = true;
        }
      }
      if (!swapped) break;
    }
  }

  int main() {
    std::vector<int> arr = {7, 3, 9, 2, 6};
    bubbleSort(arr);
    for (int x : arr) std::cout << x << " ";
    std::cout << std::endl;
    return 0;
  }`
    },
    {
      title: 'Concept Check: Bubble Sort',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Bubble Sort and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
    practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    python: {
      basic: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
      for j in range(n - i - 1):
        if arr[j] > arr[j + 1]:
          arr[j], arr[j + 1] = arr[j + 1], arr[j]`,
      operations: `def bubble_pass(arr, end):
    for j in range(end):
      if arr[j] > arr[j + 1]:
        arr[j], arr[j + 1] = arr[j + 1], arr[j]`,
      advanced: `def bubble_sort_optimized(arr):
    n = len(arr)
    for i in range(n - 1):
      swapped = False
      for j in range(n - i - 1):
        if arr[j] > arr[j + 1]:
          arr[j], arr[j + 1] = arr[j + 1], arr[j]
          swapped = True
      if not swapped:
        break`
    },
    java: {
      basic: `public class BubbleSort {
    static void bubbleSort(int[] arr) {
      for (int i = 0; i < arr.length - 1; i++) {
        for (int j = 0; j < arr.length - i - 1; j++) {
          if (arr[j] > arr[j + 1]) {
            int t = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = t;
          }
        }
      }
    }
  }`,
      operations: `public class BubblePass {
    static void bubblePass(int[] arr, int end) {
      for (int j = 0; j < end; j++) {
        if (arr[j] > arr[j + 1]) {
          int t = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = t;
        }
      }
    }
  }`,
      advanced: `public class BubbleSortOptimized {
    static void bubbleSortOptimized(int[] arr) {
      for (int i = 0; i < arr.length - 1; i++) {
        boolean swapped = false;
        for (int j = 0; j < arr.length - i - 1; j++) {
          if (arr[j] > arr[j + 1]) {
            int t = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = t;
            swapped = true;
          }
        }
        if (!swapped) break;
      }
    }
  }`
    },
    cpp: {
      basic: `#include <vector>

void bubbleSort(std::vector<int>& arr) {
  for (int i = 0; i < static_cast<int>(arr.size()) - 1; ++i) {
    for (int j = 0; j < static_cast<int>(arr.size()) - i - 1; ++j) {
      if (arr[j] > arr[j + 1]) std::swap(arr[j], arr[j + 1]);
    }
  }
}`,
      operations: `void bubblePass(std::vector<int>& arr, int end) {
  for (int j = 0; j < end; ++j) {
    if (arr[j] > arr[j + 1]) std::swap(arr[j], arr[j + 1]);
  }
}`,
      advanced: `void bubbleSortOptimized(std::vector<int>& arr) {
  for (int i = 0; i < static_cast<int>(arr.size()) - 1; ++i) {
    bool swapped = false;
    for (int j = 0; j < static_cast<int>(arr.size()) - i - 1; ++j) {
      if (arr[j] > arr[j + 1]) { std::swap(arr[j], arr[j + 1]); swapped = true; }
    }
    if (!swapped) break;
  }
}`
    },
    c: {
      basic: `void bubble_sort(int arr[], int n) {
  for (int i = 0; i < n - 1; ++i) {
    for (int j = 0; j < n - i - 1; ++j) {
      if (arr[j] > arr[j + 1]) {
        int t = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = t;
      }
    }
  }
}`,
      operations: `void bubble_pass(int arr[], int end) {
  for (int j = 0; j < end; ++j) {
    if (arr[j] > arr[j + 1]) {
      int t = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = t;
    }
  }
}`,
      advanced: `void bubble_sort_optimized(int arr[], int n) {
  for (int i = 0; i < n - 1; ++i) {
    int swapped = 0;
    for (int j = 0; j < n - i - 1; ++j) {
      if (arr[j] > arr[j + 1]) {
        int t = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = t; swapped = 1;
      }
    }
    if (!swapped) break;
  }
}`
    }
  },
    theoryLinks: [
    { title: 'Bubble Sort', url: 'https://www.geeksforgeeks.org/bubble-sort/', platform: 'GeeksforGeeks'},
    { title: 'Bubble Sort', url: 'https://www.programiz.com/dsa/bubble-sort', platform: 'Programiz'}
  ],
  practiceLinks: [
    { title: 'Sort', url: 'https://leetcode.cn/problem-list/sorting/', platform: 'Leetcode'}
  ],
  visualNodes: ['7', '3', '9', '2', '6'],
  visualCaption: 'Adjacent swaps per pass',
  visualForm: 'algorithm',
  visualScript: { kind: 'array', autoGenerate: true },
});

export default BubbleSortSection;
