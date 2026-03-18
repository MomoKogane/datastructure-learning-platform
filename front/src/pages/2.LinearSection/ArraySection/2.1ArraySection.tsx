import { createTopicSection } from '../../TopicSection/createTopicSection';

const ArraySection = createTopicSection({
  id: '2.1',
  name: 'Arrays',
  chapterNumber: '2.1',
  overview: 'An array is a container that stores objects of the same type. The objects stored in the array do not have names, but are accessed through their positions. The size of the array is fixed and cannot be changed at will.',
  concepts: [
    {
      title: 'Define an array',
      content: 'The declaration of an array is in the form a[d], where a is the name of the array and d is the number of elements in the array. At compile time, d should be known, that is to say, d should be an integer constant expression.\nAnd you cannot directly assign one array to another array.',
      examples: ['unsigned int d1 = 42;','const int d2 = 42;','int arr1[d1]; // Error: d1 is not a constant expression','int arr2[d2]; // Correct: arr2 is an array of length 42']
    },
    {
      title: 'Accessing Array Elements',
      content: 'You can access elements in an array using the subscript operator []. The index of an array (that is, the value inside the square brackets) starts from 0. Taking an array containing 10 elements as an example, its indexes range from 0 to 9, not from 1 to 10. However, in OI (Olympiad in Informatics), for convenience, we usually make the array a bit larger and do not use the first element of the array, starting to access array elements from index 1.',
      examples: ['arr[0] = 42;', 'arr[1] = 43;', 'int x = arr[0]; // x is now 42']
    },
    {
      title: 'Out-of-bounds index access',
      content: 'The index idx of an array should satisfy 0 < idx < size. If the index is not within this range, it is undefined behavior and can lead to unpredictable consequences, such as segmentation faults, or modifying variables unexpectedly, and so on.',
      examples: ['int arr[10];', 'arr[10] = 42; // Undefined behavior: out-of-bounds access', 'int x = arr[-1]; // Undefined behavior: out-of-bounds access']
    },
    {
      title:'Multidimensional Arrays',
      content: 'The essence of multidimensional arrays is an \'array of arrays,\' meaning the elements of the outer array are arrays. A two-dimensional array requires two dimensions to define: the length of the array and the length of the elements within the array. When accessing a two-dimensional array, two indices need to be written. We often use nested for loops to handle two-dimensional arrays.',
      examples: ['int arr[3][4]; // An array of length 3, whose elements are arrays of length 4 with elements of type int',
      'arr[2][1] = 1; // Accessing a two-dimensional array']
    }
  ],
  complexity: {
    time: {
      access: 'O(1)',
      search: 'O(n) / O(log n) if sorted',
      insertion: 'O(n)',
      deletion: 'O(n)'
    },
    space: 'O(n)'
  },
  operations: [
    {
      name: 'Modify',
      description: 'Update an element by index',
      steps: ['Check bounds', 'Assign new value to arr[index]', 'Return updated array'],
      script: {
        kind: 'array',
        loop: true,
        frames: [
          {
            label: 'Initial array state, target index = 3, new value = 99',
            activeIndices: [3],
            arrayState: ['10', '25', '3', '47', '18', '92', '15']
          },
          {
            label: 'Check bounds: 0 <= 3 < n',
            compareIndices: [0, 3],
            activeIndices: [3],
            arrayState: ['10', '25', '3', '47', '18', '92', '15']
          },
          {
            label: 'Set arr[3] from 47 to 99',
            activeIndices: [3],
            visitedIndices: [3],
            arrayState: ['10', '25', '3', '99', '18', '92', '15']
          }
        ]
      }
    },
    {
      name: 'Insert',
      description: 'Insert an element at a given index',
      steps: ['Check bounds', 'Shift right', 'Write new value'],
      script: {
        kind: 'array',
        loop: true,
        frames: [
          {
            label: 'Initial state, insert 99 at index 3',
            activeIndices: [3],
            arrayState: ['10', '25', '3', '47', '18', '92', '15']
          },
          {
            label: 'Shift arr[6] to arr[7]',
            swapIndices: [6, 7],
            activeIndices: [6],
            arrayState: ['10', '25', '3', '47', '18', '92', '15', '15']
          },
          {
            label: 'Shift arr[5] to arr[6]',
            swapIndices: [5, 6],
            activeIndices: [5],
            arrayState: ['10', '25', '3', '47', '18', '92', '92', '15']
          },
          {
            label: 'Shift arr[4] to arr[5]',
            swapIndices: [4, 5],
            activeIndices: [4],
            arrayState: ['10', '25', '3', '47', '18', '18', '92', '15']
          },
          {
            label: 'Shift arr[3] to arr[4]',
            swapIndices: [3, 4],
            activeIndices: [3],
            arrayState: ['10', '25', '3', '47', '47', '18', '92', '15']
          },
          {
            label: 'Write 99 into arr[3]',
            activeIndices: [3],
            visitedIndices: [3],
            arrayState: ['10', '25', '3', '99', '47', '18', '92', '15']
          }
        ]
      }
    },
    {
      name: 'Delete',
      description: 'Delete an element at a given index',
      steps: ['Check bounds', 'Shift left', 'Resize length'],
      script: {
        kind: 'array',
        loop: true,
        frames: [
          {
            label: 'Initial state, delete index 2',
            activeIndices: [2],
            arrayState: ['10', '25', '3', '47', '18', '92', '15']
          },
          {
            label: 'Shift arr[3] to arr[2]',
            swapIndices: [2, 3],
            activeIndices: [2, 3],
            arrayState: ['10', '25', '47', '47', '18', '92', '15']
          },
          {
            label: 'Shift arr[4] to arr[3]',
            swapIndices: [3, 4],
            activeIndices: [3, 4],
            arrayState: ['10', '25', '47', '18', '18', '92', '15']
          },
          {
            label: 'Shift arr[5] to arr[4]',
            swapIndices: [4, 5],
            activeIndices: [4, 5],
            arrayState: ['10', '25', '47', '18', '92', '92', '15']
          },
          {
            label: 'Shift arr[6] to arr[5], logical length -1',
            swapIndices: [5, 6],
            activeIndices: [5, 6],
            arrayState: ['10', '25', '47', '18', '92', '15']
          }
        ]
      }
    }
  ],
  exercises: [
    {
      title: 'Array Element Reversal',
      difficulty: 'Easy',
      description: 'Write a function to reverse the order of elements in an array.',
      hints: ['Use two-pointer swap from both ends', 'Handle empty and single-element arrays'],
      solutions: `#include <algorithm>
#include <vector>

std::vector<int> reverseArray(std::vector<int> arr) {
    int left = 0;
    int right = static_cast<int>(arr.size()) - 1;
    while (left < right) {
        std::swap(arr[left], arr[right]);
        ++left;
        --right;
    }
    return arr;
}`
    },
    {
      title: 'Array Rotation Strategy',
      difficulty: 'Medium',
      description: 'Compare three ways to rotate an array to the right by k steps and analyze complexity.',
      hints: ['Direct shifting', 'Extra array', 'Reverse-based method']
    }
  ],
  practiceExampleLanguage: 'cpp',
    theoryLinks: [
    {
          title: 'GeeksforGeeks - Array Data Structure',
          url: 'https://www.geeksforgeeks.org/array-data-structure/',
          platform: 'GeeksforGeeks'},
    {
          title: 'OI Wiki - Array',
          url: 'https://oiwiki.org/lang/array/',
          platform: 'OI Wiki'}
  ],
  practiceLinks: [
    {
          title: 'LeetCode - Arrays',
          url: 'https://leetcode.com/tag/array/',
          platform: 'LeetCode'},
    {
          title: 'LeetCode - Two Pointers',
          url: 'https://leetcode.com/tag/two-pointers/',
          platform: 'LeetCode'}
  ],
  visualNodes: ['10', '25', '3', '47', '18', '92', '15'],
  visualCaption: 'Array indices map to contiguous elements',
  fallbackCodeExamples: {
    cpp: {
      basic: `// Array element access - O(1)
#include <iostream>
#include <vector>
#include <stdexcept>
using namespace std;

int accessElement(const vector<int>& arr, int index) {
    if (index < 0 || index >= arr.size()) {
        throw out_of_range("Index out of bounds");
    }
    return arr[index];
}`,
      operations: `// C++ Array insertion/deletion - O(n)
#include <vector>

std::vector<int> insertElement(const std::vector<int>& arr, int index, int value) {
  std::vector<int> result = arr;
  result.insert(result.begin() + index, value);
  return result;
}

std::vector<int> deleteElement(const std::vector<int>& arr, int index) {
  std::vector<int> result = arr;
  result.erase(result.begin() + index);
  return result;
}`,
      advanced: `// C++ Array search
#include <vector>

int binarySearch(const std::vector<int>& arr, int target) {
  int left = 0;
  int right = static_cast<int>(arr.size()) - 1;
  while (left <= right) {
    int mid = left + (right - left) / 2;
    if (arr[mid] == target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`
    },
    java: {
      basic: `public class ArrayAccess {
    public static int accessElement(int[] arr, int index) {
        if (index < 0 || index >= arr.length) {
            throw new IndexOutOfBoundsException("Index out of bounds");
        }
        return arr[index];
    }
}`,
      operations: `import java.util.*;

public class ArrayOps {
  public static List<Integer> insertElement(int[] arr, int index, int value) {
    List<Integer> result = new ArrayList<>();
    for (int i = 0; i < index; i++) result.add(arr[i]);
    result.add(value);
    for (int i = index; i < arr.length; i++) result.add(arr[i]);
    return result;
  }
}`,
      advanced: `public class ArraySearch {
  public static int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left <= right) {
      int mid = left + (right - left) / 2;
      if (arr[mid] == target) return mid;
      if (arr[mid] < target) left = mid + 1;
      else right = mid - 1;
    }
    return -1;
  }
}`
    },
    python: {
      basic: `def access_element(arr, index):
    if index < 0 or index >= len(arr):
        raise IndexError("Index out of bounds")
    return arr[index]`,
      operations: `def insert_element(arr, index, value):
    new_arr = arr.copy()
    new_arr.insert(index, value)
    return new_arr

def delete_element(arr, index):
    new_arr = arr.copy()
    del new_arr[index]
    return new_arr`,
      advanced: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`
    },
    c: {
      basic: `#include <stdio.h>
#include <stdlib.h>

int accessElement(int arr[], int size, int index) {
    if (index < 0 || index >= size) {
        printf("Error: Index out of bounds\\n");
        exit(1);
    }
    return arr[index];
}`,
      operations: `#include <stdlib.h>

int* insertElement(const int arr[], int size, int index, int value, int* newSize) {
  *newSize = size + 1;
  int* result = (int*)malloc((*newSize) * sizeof(int));
  for (int i = 0; i < index; i++) result[i] = arr[i];
  result[index] = value;
  for (int i = index; i < size; i++) result[i + 1] = arr[i];
  return result;
}`,
      advanced: `int binarySearch(const int arr[], int size, int target) {
  int left = 0, right = size - 1;
  while (left <= right) {
    int mid = left + (right - left) / 2;
    if (arr[mid] == target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`
    }
  }
});

export default ArraySection;
