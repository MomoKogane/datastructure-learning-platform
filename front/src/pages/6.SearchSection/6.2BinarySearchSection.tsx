import { createTopicSection } from '../TopicSection/createTopicSection';

const BinarySearchSection = createTopicSection({
  id: '6.2',
  name: 'Binary Search',
  chapterNumber: '6.2',
  overview: 'Binary search halves the search interval on each step in sorted data, achieving logarithmic search time.',
  concepts: [
    { title: 'Precondition', content: 'Input must be sorted.', examples: ['Ascending array required'] },
    { title: 'Variants', content: 'Lower bound, upper bound, first/last occurrence.', examples: ['Find insertion position'] }
  ],
  complexity: { time: { search: 'O(log n)' }, space: 'O(1) iterative, O(log n) recursive' },
  operations: [{
    name: 'Binary Search',
    description: 'Input value and locate it by repeatedly halving a sorted interval.',
    steps: ['Read target value', 'Check middle element', 'Discard half interval until found or empty']
  }],
  exercises: [{
    title: 'Lower Bound',
    difficulty: 'Medium',
    description: 'Find first index >= target.',
    hints: ['Keep answer candidate', 'Move right bound'],
    solutions: `#include <iostream>
#include <vector>

int lowerBound(const std::vector<int>& arr, int target) {
  int left = 0;
  int right = static_cast<int>(arr.size());
  while (left < right) {
    int mid = left + (right - left) / 2;
    if (arr[mid] < target) left = mid + 1;
    else right = mid;
  }
  return left;
}

int main() {
  std::vector<int> arr = {1, 3, 5, 7, 9, 11};
  std::cout << lowerBound(arr, 6) << std::endl;
  return 0;
}`
  },
    {
      title: 'Concept Check: Binary Search',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Binary Search and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    python: {
      basic: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
      mid = (left + right) // 2
      if arr[mid] == target:
        return mid
      if arr[mid] < target:
        left = mid + 1
      else:
        right = mid - 1
    return -1`,
      operations: `def lower_bound(arr, target):
    l, r = 0, len(arr)
    while l < r:
      m = (l + r) // 2
      if arr[m] < target:
        l = m + 1
      else:
        r = m
    return l`,
      advanced: `def upper_bound(arr, target):
    l, r = 0, len(arr)
    while l < r:
      m = (l + r) // 2
      if arr[m] <= target:
        l = m + 1
      else:
        r = m
    return l`
    },
    java: {
      basic: `public class BinarySearch {
    static int binarySearch(int[] arr, int target) {
      int left = 0, right = arr.length - 1;
      while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
      }
      return -1;
    }
  }`,
      operations: `public class LowerBound {
    static int lowerBound(int[] arr, int target) {
      int l = 0, r = arr.length;
      while (l < r) {
        int m = l + (r - l) / 2;
        if (arr[m] < target) l = m + 1;
        else r = m;
      }
      return l;
    }
  }`,
      advanced: `public class UpperBound {
    static int upperBound(int[] arr, int target) {
      int l = 0, r = arr.length;
      while (l < r) {
        int m = l + (r - l) / 2;
        if (arr[m] <= target) l = m + 1;
        else r = m;
      }
      return l;
    }
  }`
    },
    cpp: {
      basic: `#include <vector>

int binarySearch(const std::vector<int>& arr, int target) {
  int left = 0, right = static_cast<int>(arr.size()) - 1;
  while (left <= right) {
    int mid = left + (right - left) / 2;
    if (arr[mid] == target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
      operations: `int lowerBound(const std::vector<int>& arr, int target) {
  int l = 0, r = static_cast<int>(arr.size());
  while (l < r) {
    int m = l + (r - l) / 2;
    if (arr[m] < target) l = m + 1;
    else r = m;
  }
  return l;
}`,
      advanced: `int upperBound(const std::vector<int>& arr, int target) {
  int l = 0, r = static_cast<int>(arr.size());
  while (l < r) {
    int m = l + (r - l) / 2;
    if (arr[m] <= target) l = m + 1;
    else r = m;
  }
  return l;
}`
    },
    c: {
      basic: `int binary_search(const int arr[], int n, int target) {
  int left = 0, right = n - 1;
  while (left <= right) {
    int mid = left + (right - left) / 2;
    if (arr[mid] == target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
      operations: `int lower_bound_c(const int arr[], int n, int target) {
  int l = 0, r = n;
  while (l < r) {
    int m = l + (r - l) / 2;
    if (arr[m] < target) l = m + 1;
    else r = m;
  }
  return l;
}`,
      advanced: `int upper_bound_c(const int arr[], int n, int target) {
  int l = 0, r = n;
  while (l < r) {
    int m = l + (r - l) / 2;
    if (arr[m] <= target) l = m + 1;
    else r = m;
  }
  return l;
}`
    }
  },
    theoryLinks: [
    { title: 'Binary Search', url: 'https://cp-algorithms.com/num_methods/binary_search.html', platform: 'CP-Algorithms'},
    { title: 'Binary Search', url: 'https://oiwiki.org/basic/binary/', platform: 'OI Wiki'}
  ],
  practiceLinks: [
    { title: 'Binary Search', url: 'https://leetcode.cn/problem-list/binary-search/', platform: 'LeetCode'},
    { title: 'Binary Search', url: 'https://oiwiki.org/basic/binary/', platform: 'OI Wiki'}
  ],
  visualNodes: ['1', '4', '7', '10', '13', '16', '19'],
  visualCaption: 'Interval halving on sorted list',
  visualForm: 'algorithm',
  visualScript: { kind: 'array', autoGenerate: true },
});

export default BinarySearchSection;
