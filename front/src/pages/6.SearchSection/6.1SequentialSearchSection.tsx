import { createTopicSection } from '../TopicSection/createTopicSection';

const SequentialSearchSection = createTopicSection({
  id: '6.1',
  name: 'Sequential Search',
  chapterNumber: '6.1',
  overview: 'Sequential (linear) search checks each element one by one until target is found or list ends.',
  concepts: [
    { title: 'Use Cases', content: 'Works on unsorted arrays and linked structures.', examples: ['No preprocessing required'] },
    { title: 'Optimization', content: 'Sentinel technique can reduce boundary checks.', examples: ['Append target sentinel temporarily'] }
  ],
  complexity: { time: { best: 'O(1)', average: 'O(n)', worst: 'O(n)' }, space: 'O(1)' },
  operations: [{
    name: 'Sequential Search',
    description: 'Input value and scan from left to right to find first match.',
    steps: ['Read target value', 'Compare each element in order', 'Stop when found or end reached']
  }],
  exercises: [{
    title: 'First Occurrence',
    difficulty: 'Easy',
    description: 'Return first index of target.',
    hints: ['Single loop'],
    solutions: `#include <iostream>
#include <vector>

int linearSearchFirst(const std::vector<int>& arr, int target) {
  for (int i = 0; i < static_cast<int>(arr.size()); ++i) {
    if (arr[i] == target) return i;
  }
  return -1;
}

int main() {
  std::vector<int> arr = {4, 9, 2, 7, 5};
  std::cout << linearSearchFirst(arr, 7) << std::endl;
  return 0;
}`
  },
    {
      title: 'Concept Check: Sequential Search',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Sequential Search and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    python: {
      basic: `def linear_search(arr, target):
    for i, x in enumerate(arr):
      if x == target:
        return i
    return -1`,
      operations: `def contains_target(arr, target):
    for x in arr:
      if x == target:
        return True
    return False`,
      advanced: `def find_all_indices(arr, target):
    indices = []
    for i, x in enumerate(arr):
      if x == target:
        indices.append(i)
    return indices`
    },
    java: {
      basic: `public class LinearSearch {
    static int linearSearch(int[] arr, int target) {
      for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) return i;
      }
      return -1;
    }
  }`,
      operations: `public class ContainsTarget {
    static boolean containsTarget(int[] arr, int target) {
      for (int x : arr) {
        if (x == target) return true;
      }
      return false;
    }
  }`,
      advanced: `import java.util.*;

  public class FindAllIndices {
    static List<Integer> findAllIndices(int[] arr, int target) {
      List<Integer> ans = new ArrayList<>();
      for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) ans.add(i);
      }
      return ans;
    }
  }`
    },
    cpp: {
      basic: `#include <vector>

int linearSearch(const std::vector<int>& arr, int target) {
  for (int i = 0; i < static_cast<int>(arr.size()); ++i) {
    if (arr[i] == target) return i;
  }
  return -1;
}`,
      operations: `bool containsTarget(const std::vector<int>& arr, int target) {
  for (int x : arr) if (x == target) return true;
  return false;
}`,
      advanced: `std::vector<int> findAllIndices(const std::vector<int>& arr, int target) {
  std::vector<int> indices;
  for (int i = 0; i < static_cast<int>(arr.size()); ++i) if (arr[i] == target) indices.push_back(i);
  return indices;
}`
    },
    c: {
      basic: `int linear_search(const int arr[], int n, int target) {
  for (int i = 0; i < n; ++i) {
    if (arr[i] == target) return i;
  }
  return -1;
}`,
      operations: `int contains_target(const int arr[], int n, int target) {
  for (int i = 0; i < n; ++i) if (arr[i] == target) return 1;
  return 0;
}`,
      advanced: `int find_all_indices(const int arr[], int n, int target, int out[]) {
  int k = 0;
  for (int i = 0; i < n; ++i) if (arr[i] == target) out[k++] = i;
  return k;
}`
    }
  },
    theoryLinks: [
    { title: 'Linear Search', url: 'https://www.geeksforgeeks.org/linear-search/', platform: 'GeeksforGeeks'},
    { title: 'Linear Search', url: 'https://oiwiki.org/search/', platform: 'OI Wiki'}
  ],
  practiceLinks: [
    { title: 'Linear Search', url: 'https://oiwiki.org/search/', platform: 'OI Wiki'}
  ],
  visualNodes: ['4', '9', '2', '7', '5'],
  visualCaption: 'Sequential scan order',
  visualForm: 'algorithm',
  visualScript: { kind: 'array', autoGenerate: true },
});

export default SequentialSearchSection;
