import express from 'express';

const router = express.Router();

// Mock code execution endpoint
router.post('/execute', async (req, res) => {
  try {
    const { code, language, sectionId } = req.body;
    
    // Simulate code execution delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock execution results based on section
    const executionResult = getExecutionResult(sectionId, code);
    
    res.json({
      success: true,
      result: executionResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Code execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get mock execution results
function getExecutionResult(sectionId: string, code: string) {
  const baseResult = {
    status: 'success',
    compilationTime: Math.floor(Math.random() * 50) + 10, // 10-60ms
    executionTime: Math.floor(Math.random() * 20) + 5,    // 5-25ms
    memoryUsage: Math.floor(Math.random() * 5) + 1,       // 1-6MB
    testsPassed: true,
    totalTests: 3,
    passedTests: 3
  };

  // Section-specific outputs
  let output = '';
  
  switch (sectionId) {
    case '2.1': // Arrays
      output = `Original array: [1, 3, 5, 7, 9]
Insert 4 at index 2: [1, 3, 4, 5, 7, 9]
Remove element at index 1: [1, 5, 7, 9]
Find index of 7: 3
Binary search for 7: 3
Find pair with sum 10: [3, 7]`;
      break;
    case '2.2': // Linked Lists
      output = `Linked list length: 3
Inserted element at head: [0, 1, 2, 3]
Removed element at index 2: [0, 1, 3]`;
      break;
    default:
      output = 'Hello, Data Structures!';
  }

  return {
    ...baseResult,
    output,
    logs: [
      '[INFO] Starting code execution...',
      '[COMPILE] TypeScript compilation successful',
      '[TEST] Running test cases...',
      '[RESULT] All tests passed'
    ]
  };
}

// Get practice templates
router.get('/template/:sectionId', (req, res) => {
  const { sectionId } = req.params;
  const { language = 'typescript' } = req.query;
  const template = getPracticeTemplate(sectionId, language as string);
  
  res.json({
    success: true,
    template
  });
});

function getPracticeTemplate(sectionId: string, language: string = 'typescript'): string {
  switch (sectionId) {
    case '2.1':
      switch (language) {
        case 'cpp':
          return `// Arrays and Sequential Lists Practice - C++
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    // Exercise 1: Basic Array Operations
    vector<int> numbers = {1, 3, 5, 7, 9};
    
    cout << "Original array: ";
    for (int num : numbers) cout << num << " ";
    cout << endl;
    
    // TODO: Implement array operations
    // Insert 4 at index 2
    vector<int> temp1 = numbers;
    temp1.insert(temp1.begin() + 2, 4);
    cout << "Insert 4 at index 2: ";
    for (int num : temp1) cout << num << " ";
    cout << endl;
    
    // Remove element at index 1
    vector<int> temp2 = numbers;
    temp2.erase(temp2.begin() + 1);
    cout << "Remove element at index 1: ";
    for (int num : temp2) cout << num << " ";
    cout << endl;
    
    // Find index of 7
    auto it = find(numbers.begin(), numbers.end(), 7);
    int index = (it != numbers.end()) ? distance(numbers.begin(), it) : -1;
    cout << "Find index of 7: " << index << endl;
    
    // Binary search example
    vector<int> sortedArray = {1, 3, 5, 7, 9, 11, 13};
    int target = 7;
    int left = 0, right = sortedArray.size() - 1;
    int result = -1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (sortedArray[mid] == target) {
            result = mid;
            break;
        } else if (sortedArray[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    cout << "Binary search for 7: " << result << endl;
    
    return 0;
}`;

        case 'java':
          return `// Arrays and Sequential Lists Practice - Java
import java.util.*;

public class ArrayPractice {
    public static void main(String[] args) {
        // Exercise 1: Basic Array Operations
        ArrayList<Integer> numbers = new ArrayList<>(Arrays.asList(1, 3, 5, 7, 9));
        
        System.out.println("Original array: " + numbers);
        
        // TODO: Implement array operations
        // Insert 4 at index 2
        ArrayList<Integer> temp1 = new ArrayList<>(numbers);
        temp1.add(2, 4);
        System.out.println("Insert 4 at index 2: " + temp1);
        
        // Remove element at index 1
        ArrayList<Integer> temp2 = new ArrayList<>(numbers);
        temp2.remove(1);
        System.out.println("Remove element at index 1: " + temp2);
        
        // Find index of 7
        int index = numbers.indexOf(7);
        System.out.println("Find index of 7: " + index);
        
        // Binary search example
        ArrayList<Integer> sortedArray = new ArrayList<>(Arrays.asList(1, 3, 5, 7, 9, 11, 13));
        int target = 7;
        int left = 0, right = sortedArray.size() - 1;
        int result = -1;
        
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (sortedArray.get(mid) == target) {
                result = mid;
                break;
            } else if (sortedArray.get(mid) < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        System.out.println("Binary search for 7: " + result);
    }
}`;

        default: // typescript
          return `// Arrays and Sequential Lists Practice
// This section contains exercises for working with arrays and sequential data structures

// Exercise 1: Basic Array Operations
const numbers: number[] = [1, 3, 5, 7, 9];
console.log('Original array:', numbers);

// TODO: Implement a function to insert an element at a specific position
function insertAt(arr: number[], index: number, value: number): number[] {
  // Implement your solution here
  // Hint: Create a new array or use splice method
  const result = [...arr];
  result.splice(index, 0, value);
  return result;
}

// TODO: Implement a function to remove an element at a specific position
function removeAt(arr: number[], index: number): number[] {
  // Implement your solution here
  const result = [...arr];
  result.splice(index, 1);
  return result;
}

// TODO: Implement a function to find the index of an element
function findIndex(arr: number[], value: number): number {
  // Implement your solution here
  // Return -1 if not found
  return arr.indexOf(value);
}

// Test your implementations
console.log('Insert 4 at index 2:', insertAt([...numbers], 2, 4));
console.log('Remove element at index 1:', removeAt([...numbers], 1));
console.log('Find index of 7:', findIndex(numbers, 7));

// Exercise 2: Array Algorithms
// TODO: Implement binary search (for sorted arrays)
function binarySearch(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1;
}

// TODO: Implement two-pointer technique to find pair sum
function findPairSum(arr: number[], targetSum: number): [number, number] | null {
  let left = 0;
  let right = arr.length - 1;
  
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === targetSum) {
      return [arr[left], arr[right]];
    } else if (sum < targetSum) {
      left++;
    } else {
      right--;
    }
  }
  
  return null;
}

// Test advanced algorithms
const sortedArray = [1, 3, 5, 7, 9, 11, 13];
console.log('Binary search for 7:', binarySearch(sortedArray, 7));
console.log('Find pair with sum 10:', findPairSum(sortedArray, 10));`;
      }
      break;
    
    case '2.2':
      return `// Linked Lists Practice
// This section contains exercises for working with linked lists

class ListNode {
  val: number;
  next: ListNode | null;
  
  constructor(val: number) {
    this.val = val;
    this.next = null;
  }
}

// TODO: Implement a function to create a linked list from an array
function createLinkedList(arr: number[]): ListNode | null {
  // Implement your solution here
  if (arr.length === 0) return null;
  
  const head = new ListNode(arr[0]);
  let current = head;
  
  for (let i = 1; i < arr.length; i++) {
    current.next = new ListNode(arr[i]);
    current = current.next;
  }
  
  return head;
}

// TODO: Implement a function to calculate linked list length
function getLength(head: ListNode | null): number {
  let count = 0;
  let current = head;
  
  while (current) {
    count++;
    current = current.next;
  }
  
  return count;
}

// Test your implementations
const testArray = [1, 2, 3];
const linkedList = createLinkedList(testArray);
console.log('Linked list length:', getLength(linkedList));`;
    
    default:
      return `// Start coding here
console.log("Hello, Data Structures!");`;
  }
}

export default router;
