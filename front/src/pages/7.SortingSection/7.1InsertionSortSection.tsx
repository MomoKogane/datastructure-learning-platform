import { createTopicSection } from '../TopicSection/createTopicSection';

const InsertionSortSection = createTopicSection({
  id: '7.1',
  name: 'Insertion Sort',
  chapterNumber: '7.1',
  overview: 'Insertion sort builds a sorted prefix by inserting each element into its proper position.',
  concepts: [{ title: 'Stable In-place Sort', content: 'Good for small or nearly sorted data.', examples: ['Online sorting'] }],
  complexity: { time: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' }, space: 'O(1)' },
  operations: [{ name: 'Insertion Sort', description: 'Shift larger items and insert key', steps: ['Take key', 'Shift right', 'Place key'] }],
  
  exercises: [{
    title: 'Sort Small Array',
    difficulty: 'Easy',
    description: 'Implement insertion sort.',
    hints: ['Use inner while'],
    solutions: `#include <iostream>
  #include <vector>

  void insertionSort(std::vector<int>& arr) {
    for (int i = 1; i < static_cast<int>(arr.size()); ++i) {
      int key = arr[i];
      int j = i - 1;

      while (j >= 0 && arr[j] > key) {
        arr[j + 1] = arr[j];
        --j;
      }

      arr[j + 1] = key;
    }
  }

  int main() {
    std::vector<int> arr = {5, 2, 4, 6, 1, 3};
    insertionSort(arr);

    for (int x : arr) {
      std::cout << x << " ";
    }
    std::cout << std::endl;
    return 0;
  }`
    
},
    {
      title: 'Concept Check: Insertion Sort',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Insertion Sort and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `#include <iostream>
#include <vector>

void insertionSort(std::vector<int>& arr) {
  for (int i = 1; i < static_cast<int>(arr.size()); ++i) {
    int key = arr[i];
    int j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      --j;
    }
    arr[j + 1] = key;
  }
}

int main() {
  std::vector<int> arr = {5, 2, 4, 6, 1, 3};
  insertionSort(arr);
  for (int x : arr) std::cout << x << " ";
  std::cout << std::endl;
  return 0;
}`,
      operations: `#include <iostream>
#include <vector>

void insertionSortStep(std::vector<int>& arr, int i) {
  int key = arr[i];
  int j = i - 1;
  while (j >= 0 && arr[j] > key) {
    arr[j + 1] = arr[j];
    --j;
  }
  arr[j + 1] = key;
}

int main() {
  std::vector<int> arr = {5, 2, 4, 6, 1, 3};
  insertionSortStep(arr, 1);
  insertionSortStep(arr, 2);
  for (int x : arr) std::cout << x << " ";
  std::cout << std::endl;
  return 0;
}`,
      advanced: `#include <algorithm>
#include <iostream>
#include <vector>

void binaryInsertionSort(std::vector<int>& arr) {
  for (int i = 1; i < static_cast<int>(arr.size()); ++i) {
    int key = arr[i];
    int left = 0;
    int right = i;

    while (left < right) {
      int mid = left + (right - left) / 2;
      if (arr[mid] <= key) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    for (int j = i; j > left; --j) {
      arr[j] = arr[j - 1];
    }
    arr[left] = key;
  }
}

int main() {
  std::vector<int> arr = {9, 7, 5, 3, 1, 2, 4, 6, 8};
  binaryInsertionSort(arr);
  for (int x : arr) std::cout << x << " ";
  std::cout << std::endl;
  return 0;
}`
    },
    c: {
      basic: `#include <stdio.h>

void insertionSort(int arr[], int n) {
  for (int i = 1; i < n; ++i) {
    int key = arr[i];
    int j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      --j;
    }
    arr[j + 1] = key;
  }
}

int main() {
  int arr[] = {5, 2, 4, 6, 1, 3};
  int n = sizeof(arr) / sizeof(arr[0]);
  insertionSort(arr, n);
  for (int i = 0; i < n; ++i) printf("%d ", arr[i]);
  printf("\n");
  return 0;
}`,
      operations: `#include <stdio.h>

void insertionSortStep(int arr[], int i) {
  int key = arr[i];
  int j = i - 1;
  while (j >= 0 && arr[j] > key) {
    arr[j + 1] = arr[j];
    --j;
  }
  arr[j + 1] = key;
}

int main() {
  int arr[] = {5, 2, 4, 6, 1, 3};
  insertionSortStep(arr, 1);
  insertionSortStep(arr, 2);
  for (int i = 0; i < 6; ++i) printf("%d ", arr[i]);
  printf("\n");
  return 0;
}`,
      advanced: `#include <stdio.h>

int lowerBound(int arr[], int left, int right, int target) {
  while (left < right) {
    int mid = left + (right - left) / 2;
    if (arr[mid] <= target) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return left;
}

void binaryInsertionSort(int arr[], int n) {
  for (int i = 1; i < n; ++i) {
    int key = arr[i];
    int pos = lowerBound(arr, 0, i, key);
    for (int j = i; j > pos; --j) {
      arr[j] = arr[j - 1];
    }
    arr[pos] = key;
  }
}

int main() {
  int arr[] = {9, 7, 5, 3, 1, 2, 4, 6, 8};
  int n = sizeof(arr) / sizeof(arr[0]);
  binaryInsertionSort(arr, n);
  for (int i = 0; i < n; ++i) printf("%d ", arr[i]);
  printf("\n");
  return 0;
}`
    },
    java: {
      basic: `public class InsertionSortBasic {
  static void insertionSort(int[] arr) {
    for (int i = 1; i < arr.length; i++) {
      int key = arr[i];
      int j = i - 1;
      while (j >= 0 && arr[j] > key) {
        arr[j + 1] = arr[j];
        j--;
      }
      arr[j + 1] = key;
    }
  }

  public static void main(String[] args) {
    int[] arr = {5, 2, 4, 6, 1, 3};
    insertionSort(arr);
    for (int x : arr) System.out.print(x + " ");
    System.out.println();
  }
}`,
      operations: `public class InsertionSortOperations {
  static void insertionSortStep(int[] arr, int i) {
    int key = arr[i];
    int j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }

  public static void main(String[] args) {
    int[] arr = {5, 2, 4, 6, 1, 3};
    insertionSortStep(arr, 1);
    insertionSortStep(arr, 2);
    for (int x : arr) System.out.print(x + " ");
    System.out.println();
  }
}`,
      advanced: `public class BinaryInsertionSort {
  static int lowerBound(int[] arr, int right, int target) {
    int left = 0;
    while (left < right) {
      int mid = left + (right - left) / 2;
      if (arr[mid] <= target) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    return left;
  }

  static void binaryInsertionSort(int[] arr) {
    for (int i = 1; i < arr.length; i++) {
      int key = arr[i];
      int pos = lowerBound(arr, i, key);
      for (int j = i; j > pos; j--) {
        arr[j] = arr[j - 1];
      }
      arr[pos] = key;
    }
  }

  public static void main(String[] args) {
    int[] arr = {9, 7, 5, 3, 1, 2, 4, 6, 8};
    binaryInsertionSort(arr);
    for (int x : arr) System.out.print(x + " ");
    System.out.println();
  }
}`
    },
    python: {
      basic: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key


nums = [5, 2, 4, 6, 1, 3]
insertion_sort(nums)
print(nums)`,
      operations: `def insertion_sort_step(arr, i):
    key = arr[i]
    j = i - 1
    while j >= 0 and arr[j] > key:
        arr[j + 1] = arr[j]
        j -= 1
    arr[j + 1] = key


nums = [5, 2, 4, 6, 1, 3]
insertion_sort_step(nums, 1)
insertion_sort_step(nums, 2)
print(nums)`,
      advanced: `def lower_bound(arr, right, target):
    left = 0
    while left < right:
        mid = left + (right - left) // 2
        if arr[mid] <= target:
            left = mid + 1
        else:
            right = mid
    return left


def binary_insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        pos = lower_bound(arr, i, key)
        j = i
        while j > pos:
            arr[j] = arr[j - 1]
            j -= 1
        arr[pos] = key


nums = [9, 7, 5, 3, 1, 2, 4, 6, 8]
binary_insertion_sort(nums)
print(nums)`
    }
  },
    theoryLinks: [
    { title: 'Insertion Sort', url: 'https://www.geeksforgeeks.org/insertion-sort/', platform: 'GeeksforGeeks'},
    { title: 'Insertion Sort', url: 'https://oiwiki.org/basic/insertion-sort/', platform: 'OI Wiki'}
  ],
  practiceLinks: [
    { title: 'Insertion Sort', url: 'https://leetcode.cn/problems/insertion-sort-list/description/', platform: 'LeetCode'},
    { title: 'Insertion Sort', url: 'https://oiwiki.org/basic/insertion-sort/', platform: 'OI Wiki'}
  ],
  visualNodes: ['5', '2', '4', '6', '1'],
  visualCaption: 'Grow sorted prefix',
  visualForm: 'algorithm',
  visualScript: { kind: 'array', autoGenerate: true },
});

export default InsertionSortSection;
