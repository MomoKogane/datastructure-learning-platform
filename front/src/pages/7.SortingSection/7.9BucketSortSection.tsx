import { createTopicSection } from '../TopicSection/createTopicSection';

const BucketSortSection = createTopicSection({
  id: '7.9',
  name: 'Bucket Sort',
  chapterNumber: '7.9',
  overview: 'Bucket sort distributes values into buckets, sorts each bucket, then concatenates.',
  concepts: [{ title: 'Distribution Assumption', content: 'Works well when values are uniformly distributed.', examples: ['Float values in [0,1)'] }],
  complexity: { time: { average: 'O(n+k)', worst: 'O(n^2)' }, space: 'O(n+k)' },
  operations: [{ name: 'Bucket Sort', description: 'Place each item in corresponding bucket', steps: ['Create buckets', 'Distribute values', 'Sort each bucket', 'Concatenate'] }],
    exercises: [{
    title: 'Bucket Sort Floats',
    difficulty: 'Medium',
    description: 'Sort floating numbers in [0,1).',
    hints: ['Use insertion sort per bucket'],
    solutions: `#include <algorithm>
  #include <iostream>
  #include <vector>

  void bucketSort(std::vector<float>& arr) {
    int n = static_cast<int>(arr.size());
    std::vector<std::vector<float>> buckets(n);

    for (float x : arr) {
      int idx = static_cast<int>(x * n);
      if (idx == n) idx = n - 1;
      buckets[idx].push_back(x);
    }

    for (auto& bucket : buckets) std::sort(bucket.begin(), bucket.end());

    int pos = 0;
    for (const auto& bucket : buckets) {
      for (float x : bucket) arr[pos++] = x;
    }
  }

  int main() {
    std::vector<float> arr = {0.42f, 0.32f, 0.23f, 0.52f, 0.25f, 0.47f, 0.51f};
    bucketSort(arr);
    for (float x : arr) std::cout << x << " ";
    std::cout << std::endl;
    return 0;
  }`
    },
    {
      title: 'Concept Check: Bucket Sort',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Bucket Sort and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
    practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `#include <algorithm>
#include <vector>

void bucketSort(std::vector<float>& arr) {
  int n = static_cast<int>(arr.size());
  std::vector<std::vector<float>> buckets(n);
  for (float x : arr) {
    int idx = static_cast<int>(x * n);
    if (idx == n) idx = n - 1;
    buckets[idx].push_back(x);
  }
  for (auto& b : buckets) std::sort(b.begin(), b.end());
  int k = 0;
  for (const auto& b : buckets) for (float x : b) arr[k++] = x;
}`,
      operations: `void distributeToBuckets(const std::vector<float>& arr, std::vector<std::vector<float>>& buckets) {
  int n = static_cast<int>(arr.size());
  for (float x : arr) {
    int idx = static_cast<int>(x * n);
    if (idx == n) idx = n - 1;
    buckets[idx].push_back(x);
  }
}`,
      advanced: `// Advanced: adaptive bucket count based on distribution.`
    },
    c: {
      basic: `void bucket_sort(float arr[], int n) {
  int bucket_count = n;
  float buckets[128][128];
  int sizes[128] = {0};

  for (int i = 0; i < n; ++i) {
    int idx = (int)(arr[i] * bucket_count);
    if (idx >= bucket_count) idx = bucket_count - 1;
    buckets[idx][sizes[idx]++] = arr[i];
  }

  for (int b = 0; b < bucket_count; ++b) {
    for (int i = 1; i < sizes[b]; ++i) {
      float key = buckets[b][i];
      int j = i - 1;
      while (j >= 0 && buckets[b][j] > key) { buckets[b][j + 1] = buckets[b][j]; --j; }
      buckets[b][j + 1] = key;
    }
  }

  int k = 0;
  for (int b = 0; b < bucket_count; ++b) for (int i = 0; i < sizes[b]; ++i) arr[k++] = buckets[b][i];
}`,
      operations: `void insertion_sort_bucket(float bucket[], int size) {
  for (int i = 1; i < size; ++i) {
    float key = bucket[i]; int j = i - 1;
    while (j >= 0 && bucket[j] > key) { bucket[j + 1] = bucket[j]; --j; }
    bucket[j + 1] = key;
  }
}`,
      advanced: `/* Advanced: choose bucket boundaries by sampling quantiles. */`
    }
  },
    theoryLinks: [
    { title: 'Bucket Sort', url: 'https://www.geeksforgeeks.org/bucket-sort-2/', platform: 'GeeksforGeeks'}
  ],
  practiceLinks: [
    { title: 'Sort', url: 'https://leetcode.cn/problem-list/sorting/', platform: 'Leetcode'}
  ],
  visualNodes: ['0.12', '0.87', '0.45', '0.23', '0.68'],
  visualCaption: 'Distribute into value ranges',
  visualForm: 'algorithm',
  visualScript: { kind: 'array', autoGenerate: true },
});

export default BucketSortSection;
