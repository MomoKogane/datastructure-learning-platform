import { createTopicSection } from '../TopicSection/createTopicSection';

const SelectionSortSection = createTopicSection({
  id: '7.3',
  name: 'Selection Sort',
  chapterNumber: '7.3',
  overview: 'Selection sort selects the minimum element from the unsorted part and swaps it to the front.',
  concepts: [{ title: 'Few Swaps', content: 'Performs n-1 swaps but many comparisons.', examples: ['Useful when write operations are costly'] }],
  complexity: { time: { best: 'O(n^2)', average: 'O(n^2)', worst: 'O(n^2)' }, space: 'O(1)' },
  operations: [{ name: 'Selection Sort', description: 'Find min in unsorted range', steps: ['Scan unsorted range', 'Find min index', 'Swap to front'] }],
    exercises: [{
    title: 'In-place Selection Sort',
    difficulty: 'Easy',
    description: 'Sort array using min-index selection.',
    hints: ['Nested loop'],
    solutions: `#include <iostream>
  #include <vector>

  void selectionSort(std::vector<int>& arr) {
    for (int i = 0; i < static_cast<int>(arr.size()) - 1; ++i) {
      int minIndex = i;
      for (int j = i + 1; j < static_cast<int>(arr.size()); ++j) {
        if (arr[j] < arr[minIndex]) {
          minIndex = j;
        }
      }
      std::swap(arr[i], arr[minIndex]);
    }
  }

  int main() {
    std::vector<int> arr = {8, 4, 1, 7, 3};
    selectionSort(arr);
    for (int x : arr) std::cout << x << " ";
    std::cout << std::endl;
    return 0;
  }`
    },
    {
      title: 'Concept Check: Selection Sort',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Selection Sort and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
    practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    python: {
      basic: `def selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
      min_idx = i
      for j in range(i + 1, n):
        if arr[j] < arr[min_idx]:
          min_idx = j
      arr[i], arr[min_idx] = arr[min_idx], arr[i]`,
      operations: `def select_min_index(arr, start):
    min_idx = start
    for i in range(start + 1, len(arr)):
      if arr[i] < arr[min_idx]:
        min_idx = i
    return min_idx`,
      advanced: `def stable_like_selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
      min_idx = i
      for j in range(i + 1, n):
        if arr[j] < arr[min_idx]:
          min_idx = j
      key = arr[min_idx]
      while min_idx > i:
        arr[min_idx] = arr[min_idx - 1]
        min_idx -= 1
      arr[i] = key`
    },
    java: {
      basic: `public class SelectionSort {
    static void selectionSort(int[] arr) {
      for (int i = 0; i < arr.length - 1; i++) {
        int minIndex = i;
        for (int j = i + 1; j < arr.length; j++) {
          if (arr[j] < arr[minIndex]) minIndex = j;
        }
        int t = arr[i];
        arr[i] = arr[minIndex];
        arr[minIndex] = t;
      }
    }
  }`,
      operations: `public class SelectMinIndex {
    static int selectMinIndex(int[] arr, int start) {
      int minIndex = start;
      for (int i = start + 1; i < arr.length; i++) {
        if (arr[i] < arr[minIndex]) minIndex = i;
      }
      return minIndex;
    }
  }`,
      advanced: `public class StableLikeSelectionSort {
    static void stableLikeSelectionSort(int[] arr) {
      for (int i = 0; i < arr.length - 1; i++) {
        int minIndex = i;
        for (int j = i + 1; j < arr.length; j++) {
          if (arr[j] < arr[minIndex]) minIndex = j;
        }
        int key = arr[minIndex];
        while (minIndex > i) {
          arr[minIndex] = arr[minIndex - 1];
          minIndex--;
        }
        arr[i] = key;
      }
    }
  }`
    },
    cpp: {
      basic: `#include <vector>

void selectionSort(std::vector<int>& arr) {
  for (int i = 0; i < static_cast<int>(arr.size()) - 1; ++i) {
    int minIndex = i;
    for (int j = i + 1; j < static_cast<int>(arr.size()); ++j) {
      if (arr[j] < arr[minIndex]) minIndex = j;
    }
    std::swap(arr[i], arr[minIndex]);
  }
}`,
      operations: `int selectMinIndex(const std::vector<int>& arr, int start) {
  int minIndex = start;
  for (int i = start + 1; i < static_cast<int>(arr.size()); ++i) {
    if (arr[i] < arr[minIndex]) minIndex = i;
  }
  return minIndex;
}`,
      advanced: `void selectionSortStableLike(std::vector<int>& arr) {
  for (int i = 0; i < static_cast<int>(arr.size()) - 1; ++i) {
    int minIndex = i;
    for (int j = i + 1; j < static_cast<int>(arr.size()); ++j) if (arr[j] < arr[minIndex]) minIndex = j;
    int key = arr[minIndex];
    while (minIndex > i) { arr[minIndex] = arr[minIndex - 1]; --minIndex; }
    arr[i] = key;
  }
}`
    },
    c: {
      basic: `void selection_sort(int arr[], int n) {
  for (int i = 0; i < n - 1; ++i) {
    int min_index = i;
    for (int j = i + 1; j < n; ++j) {
      if (arr[j] < arr[min_index]) min_index = j;
    }
    int t = arr[i]; arr[i] = arr[min_index]; arr[min_index] = t;
  }
}`,
      operations: `int select_min_index(int arr[], int n, int start) {
  int min_index = start;
  for (int i = start + 1; i < n; ++i) if (arr[i] < arr[min_index]) min_index = i;
  return min_index;
}`,
      advanced: `void stable_like_selection_sort(int arr[], int n) {
  for (int i = 0; i < n - 1; ++i) {
    int min_index = i;
    for (int j = i + 1; j < n; ++j) if (arr[j] < arr[min_index]) min_index = j;
    int key = arr[min_index];
    while (min_index > i) { arr[min_index] = arr[min_index - 1]; --min_index; }
    arr[i] = key;
  }
}`
    }
  },
    theoryLinks: [
    { title: 'Selection Sort', url: 'https://www.geeksforgeeks.org/selection-sort/', platform: 'GeeksforGeeks'}
  ],
  practiceLinks: [
    { title: 'Sort', url: 'https://leetcode.cn/problem-list/sorting/', platform: 'Leetcode'}
  ],
  visualNodes: ['8', '4', '1', '7', '3'],
  visualCaption: 'Select minimum each round',
  visualForm: 'algorithm',
  visualScript: { kind: 'array', autoGenerate: true },
});

export default SelectionSortSection;
