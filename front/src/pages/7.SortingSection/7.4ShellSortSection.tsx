import { createTopicSection } from '../TopicSection/createTopicSection';

const ShellSortSection = createTopicSection({
  id: '7.4',
  name: 'Shell Sort',
  chapterNumber: '7.4',
  overview: 'Shell sort generalizes insertion sort by comparing elements at a gap, reducing large inversions early.',
  concepts: [{ title: 'Gap Sequence', content: 'Performance depends on chosen gap sequence.', examples: ['n/2, n/4, ... ,1'] }],
  complexity: { time: { average: 'O(n^1.3~n^1.5)', worst: 'depends on gaps' }, space: 'O(1)' },
  operations: [{ name: 'Shell Sort', description: 'Insertion sort over gap-separated subsequences', steps: ['Choose gap', 'Sort each subsequence', 'Reduce gap to 1'] }],
    exercises: [{
    title: 'Shell Sort with Gap Sequence',
    difficulty: 'Medium',
    description: 'Implement shell sort.',
    hints: ['Outer loop over gaps'],
    solutions: `#include <iostream>
  #include <vector>

  void shellSort(std::vector<int>& arr) {
    int n = static_cast<int>(arr.size());
    for (int gap = n / 2; gap > 0; gap /= 2) {
      for (int i = gap; i < n; ++i) {
        int temp = arr[i];
        int j = i;
        while (j >= gap && arr[j - gap] > temp) {
          arr[j] = arr[j - gap];
          j -= gap;
        }
        arr[j] = temp;
      }
    }
  }

  int main() {
    std::vector<int> arr = {10, 7, 8, 9, 1, 5};
    shellSort(arr);
    for (int x : arr) std::cout << x << " ";
    std::cout << std::endl;
    return 0;
  }`
    },
    {
      title: 'Concept Check: Shell Sort',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Shell Sort and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
    practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `#include <vector>

void shellSort(std::vector<int>& arr) {
  int n = static_cast<int>(arr.size());
  for (int gap = n / 2; gap > 0; gap /= 2) {
    for (int i = gap; i < n; ++i) {
      int temp = arr[i], j = i;
      while (j >= gap && arr[j - gap] > temp) { arr[j] = arr[j - gap]; j -= gap; }
      arr[j] = temp;
    }
  }
}`,
      operations: `void gappedInsertion(std::vector<int>& arr, int gap) {
  for (int i = gap; i < static_cast<int>(arr.size()); ++i) {
    int temp = arr[i], j = i;
    while (j >= gap && arr[j - gap] > temp) { arr[j] = arr[j - gap]; j -= gap; }
    arr[j] = temp;
  }
}`,
      advanced: `// Advanced: choose better gap sequence (e.g., Knuth/Sedgewick).`
    },
    c: {
      basic: `void shell_sort(int arr[], int n) {
  for (int gap = n / 2; gap > 0; gap /= 2) {
    for (int i = gap; i < n; ++i) {
      int temp = arr[i], j = i;
      while (j >= gap && arr[j - gap] > temp) { arr[j] = arr[j - gap]; j -= gap; }
      arr[j] = temp;
    }
  }
}`,
      operations: `void gapped_insertion(int arr[], int n, int gap) {
  for (int i = gap; i < n; ++i) {
    int temp = arr[i], j = i;
    while (j >= gap && arr[j - gap] > temp) { arr[j] = arr[j - gap]; j -= gap; }
    arr[j] = temp;
  }
}`,
      advanced: `/* Advanced: tune gap sequence for better empirical performance. */`
    }
  },
    theoryLinks: [
    { title: 'Shell Sort', url: 'https://www.geeksforgeeks.org/shellsort/', platform: 'GeeksforGeeks'}
  ],
  practiceLinks: [
    { title: 'Sort', url: 'https://leetcode.cn/problem-list/sorting/', platform: 'Leetcode'}
  ],
  visualNodes: ['10', '7', '8', '9', '1', '5'],
  visualCaption: 'Gap-based comparisons',
  visualForm: 'algorithm',
  visualScript: { kind: 'array', autoGenerate: true },
});

export default ShellSortSection;
