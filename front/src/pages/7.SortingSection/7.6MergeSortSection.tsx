import { createTopicSection } from '../TopicSection/createTopicSection';

const MergeSortSection = createTopicSection({
  id: '7.6',
  name: 'Merge Sort',
  chapterNumber: '7.6',
  overview: 'Merge sort divides array into halves and merges sorted halves, providing stable O(n log n) performance.',
  concepts: [{ title: 'Divide and Conquer', content: 'Split recursively then merge.', examples: ['Stable sort'] }],
  complexity: { time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' }, space: 'O(n)' },
  operations: [{ name: 'Merge Sort', description: 'Merge two sorted arrays', steps: ['Compare heads', 'Append smaller', 'Drain remainder'] }],
    exercises: [{
    title: 'Implement Merge Sort',
    difficulty: 'Medium',
    description: 'Write split and merge routines.',
    hints: ['Base case length<=1'],
    solutions: `#include <iostream>
  #include <vector>

  void merge(std::vector<int>& arr, int left, int mid, int right) {
    std::vector<int> temp;
    int i = left, j = mid + 1;
    while (i <= mid && j <= right) {
      if (arr[i] <= arr[j]) temp.push_back(arr[i++]);
      else temp.push_back(arr[j++]);
    }
    while (i <= mid) temp.push_back(arr[i++]);
    while (j <= right) temp.push_back(arr[j++]);
    for (int k = 0; k < static_cast<int>(temp.size()); ++k) {
      arr[left + k] = temp[k];
    }
  }

  void mergeSort(std::vector<int>& arr, int left, int right) {
    if (left >= right) return;
    int mid = left + (right - left) / 2;
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);
    merge(arr, left, mid, right);
  }

  int main() {
    std::vector<int> arr = {6, 5, 12, 10, 9, 1};
    mergeSort(arr, 0, static_cast<int>(arr.size()) - 1);
    for (int x : arr) std::cout << x << " ";
    std::cout << std::endl;
    return 0;
  }`
    },
    {
      title: 'Concept Check: Merge Sort',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Merge Sort and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
    practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `#include <vector>

void merge(std::vector<int>& arr, int l, int m, int r) {
  std::vector<int> temp;
  int i = l, j = m + 1;
  while (i <= m && j <= r) temp.push_back(arr[i] <= arr[j] ? arr[i++] : arr[j++]);
  while (i <= m) temp.push_back(arr[i++]);
  while (j <= r) temp.push_back(arr[j++]);
  for (int k = 0; k < static_cast<int>(temp.size()); ++k) arr[l + k] = temp[k];
}

void mergeSort(std::vector<int>& arr, int l, int r) {
  if (l >= r) return;
  int m = l + (r - l) / 2;
  mergeSort(arr, l, m);
  mergeSort(arr, m + 1, r);
  merge(arr, l, m, r);
}`,
      operations: `void mergeTwoSorted(std::vector<int>& a, int l, int m, int r) {
  std::vector<int> temp;
  int i = l, j = m + 1;
  while (i <= m && j <= r) temp.push_back(a[i] <= a[j] ? a[i++] : a[j++]);
  while (i <= m) temp.push_back(a[i++]);
  while (j <= r) temp.push_back(a[j++]);
  for (int k = 0; k < static_cast<int>(temp.size()); ++k) a[l + k] = temp[k];
}`,
      advanced: `// Advanced: bottom-up iterative merge sort to avoid recursion.`
    },
    c: {
      basic: `void merge(int arr[], int l, int m, int r, int temp[]) {
  int i = l, j = m + 1, k = l;
  while (i <= m && j <= r) temp[k++] = (arr[i] <= arr[j]) ? arr[i++] : arr[j++];
  while (i <= m) temp[k++] = arr[i++];
  while (j <= r) temp[k++] = arr[j++];
  for (int p = l; p <= r; ++p) arr[p] = temp[p];
}

void merge_sort(int arr[], int l, int r, int temp[]) {
  if (l >= r) return;
  int m = l + (r - l) / 2;
  merge_sort(arr, l, m, temp);
  merge_sort(arr, m + 1, r, temp);
  merge(arr, l, m, r, temp);
}`,
      operations: `void merge_two_sorted(int arr[], int l, int m, int r, int temp[]) {
  int i = l, j = m + 1, k = l;
  while (i <= m && j <= r) temp[k++] = (arr[i] <= arr[j]) ? arr[i++] : arr[j++];
  while (i <= m) temp[k++] = arr[i++];
  while (j <= r) temp[k++] = arr[j++];
  for (int p = l; p <= r; ++p) arr[p] = temp[p];
}`,
      advanced: `/* Advanced: iterative merge sort to reduce recursion overhead. */`
    }
  },
    theoryLinks: [
    { title: 'Merge Sort', url: 'https://www.geeksforgeeks.org/merge-sort/', platform: 'GeeksforGeeks'}
  ],
  practiceLinks: [
    { title: 'Sort', url: 'https://leetcode.cn/problem-list/sorting/', platform: 'Leetcode'}
  ],
  visualNodes: ['6', '5', '12', '10', '9', '1'],
  visualCaption: 'Split and merge phases',
  visualForm: 'algorithm',
  visualScript: { kind: 'array', autoGenerate: true },
});

export default MergeSortSection;
