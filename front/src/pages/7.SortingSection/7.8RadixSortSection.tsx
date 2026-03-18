import { createTopicSection } from '../TopicSection/createTopicSection';

const RadixSortSection = createTopicSection({
  id: '7.8',
  name: 'Radix Sort',
  chapterNumber: '7.8',
  overview: 'Radix sort processes digits from least significant to most significant (or reverse) using stable counting distribution.',
  concepts: [{ title: 'Digit-wise Stable Sort', content: 'Each pass sorts by one digit/base.', examples: ['LSD radix with counting sort'] }],
  complexity: { time: { sort: 'O(d*(n+k))' }, space: 'O(n+k)' },
  operations: [{ name: 'Radix Sort', description: 'Stable distribute by current digit', steps: ['Count digit frequency', 'Prefix sums', 'Stable write back'] }],
    exercises: [{
    title: 'LSD Radix Sort',
    difficulty: 'Medium',
    description: 'Sort non-negative integers by digits.',
    hints: ['Use base 10 counting sort'],
    solutions: `#include <algorithm>
  #include <iostream>
  #include <vector>

  void countingSortByExp(std::vector<int>& arr, int exp) {
    std::vector<int> output(arr.size());
    int count[10] = {0};

    for (int x : arr) ++count[(x / exp) % 10];
    for (int i = 1; i < 10; ++i) count[i] += count[i - 1];
    for (int i = static_cast<int>(arr.size()) - 1; i >= 0; --i) {
      int digit = (arr[i] / exp) % 10;
      output[count[digit] - 1] = arr[i];
      --count[digit];
    }
    arr = output;
  }

  void radixSort(std::vector<int>& arr) {
    int maxVal = *std::max_element(arr.begin(), arr.end());
    for (int exp = 1; maxVal / exp > 0; exp *= 10) {
      countingSortByExp(arr, exp);
    }
  }

  int main() {
    std::vector<int> arr = {170, 45, 75, 90, 802, 24, 2, 66};
    radixSort(arr);
    for (int x : arr) std::cout << x << " ";
    std::cout << std::endl;
    return 0;
  }`
    },
    {
      title: 'Concept Check: Radix Sort',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Radix Sort and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
    practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `#include <algorithm>
#include <vector>

void countingSortByExp(std::vector<int>& arr, int exp) {
  std::vector<int> out(arr.size());
  int cnt[10] = {0};
  for (int x : arr) ++cnt[(x / exp) % 10];
  for (int i = 1; i < 10; ++i) cnt[i] += cnt[i - 1];
  for (int i = static_cast<int>(arr.size()) - 1; i >= 0; --i) {
    int d = (arr[i] / exp) % 10;
    out[cnt[d] - 1] = arr[i];
    --cnt[d];
  }
  arr = out;
}

void radixSort(std::vector<int>& arr) {
  int mx = *std::max_element(arr.begin(), arr.end());
  for (int exp = 1; mx / exp > 0; exp *= 10) countingSortByExp(arr, exp);
}`,
      operations: `void countingSortDigit(std::vector<int>& arr, int exp) {
  std::vector<int> out(arr.size());
  int cnt[10] = {0};
  for (int x : arr) ++cnt[(x / exp) % 10];
  for (int i = 1; i < 10; ++i) cnt[i] += cnt[i - 1];
  for (int i = static_cast<int>(arr.size()) - 1; i >= 0; --i) {
    int d = (arr[i] / exp) % 10; out[cnt[d] - 1] = arr[i]; --cnt[d];
  }
  arr = out;
}`,
      advanced: `// Advanced: extend to negatives by splitting sign buckets.`
    },
    c: {
      basic: `void counting_sort_exp(int arr[], int n, int exp) {
  int out[1024];
  int cnt[10] = {0};
  for (int i = 0; i < n; ++i) ++cnt[(arr[i] / exp) % 10];
  for (int i = 1; i < 10; ++i) cnt[i] += cnt[i - 1];
  for (int i = n - 1; i >= 0; --i) {
    int d = (arr[i] / exp) % 10;
    out[cnt[d] - 1] = arr[i];
    --cnt[d];
  }
  for (int i = 0; i < n; ++i) arr[i] = out[i];
}

void radix_sort(int arr[], int n, int max_val) {
  for (int exp = 1; max_val / exp > 0; exp *= 10) counting_sort_exp(arr, n, exp);
}`,
      operations: `void counting_sort_digit(int arr[], int n, int exp) {
  int out[1024];
  int cnt[10] = {0};
  for (int i = 0; i < n; ++i) ++cnt[(arr[i] / exp) % 10];
  for (int i = 1; i < 10; ++i) cnt[i] += cnt[i - 1];
  for (int i = n - 1; i >= 0; --i) { int d = (arr[i] / exp) % 10; out[cnt[d] - 1] = arr[i]; --cnt[d]; }
  for (int i = 0; i < n; ++i) arr[i] = out[i];
}`,
      advanced: `/* Advanced: support negative values with offset strategy. */`
    }
  },
    theoryLinks: [
    { title: 'Radix Sort', url: 'https://www.geeksforgeeks.org/radix-sort/', platform: 'GeeksforGeeks'}
  ],
  practiceLinks: [
    { title: 'Sort', url: 'https://leetcode.cn/problem-list/sorting/', platform: 'Leetcode'}
  ],
  visualNodes: ['170', '45', '75', '90', '802'],
  visualCaption: 'Sort by ones, tens, hundreds',
  visualForm: 'algorithm',
  visualScript: { kind: 'array', autoGenerate: true },
});

export default RadixSortSection;
