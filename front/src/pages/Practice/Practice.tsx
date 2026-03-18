import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Card, Button, Typography, message, Select } from 'antd';
import { PlayCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { dataStructures } from '../../data/structures';
import CodeEditor from '../../components/CodeEditor/CodeEditor';
import { apiUrl } from '../../config/api';
import type { DataStructure } from '../../types';
import './Practice.css';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const Practice: React.FC = () => {
  const navigate = useNavigate();
  const { id, chapterId, sectionId } = useParams<{ 
    id?: string; 
    chapterId?: string; 
    sectionId?: string; 
  }>();
  const [structure, setStructure] = useState<DataStructure | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadPracticeTemplate = useCallback(async (targetSectionId: string, language: string = 'typescript') => {
    try {
      setIsLoading(true);
      const response = await fetch(apiUrl(`/code/template/${targetSectionId}?language=${language}`));
      const data = await response.json();

      if (data.success) {
        setCode(data.template);
      } else {
        setCode(getArraysPracticeCode(language));
      }
    } catch (error) {
      console.error('Failed to load practice template:', error);
      setCode(getArraysPracticeCode(language));
      message.warning('Using offline template due to connection issue');
    } finally {
      setIsLoading(false);
    }
  }, []);
  const [selectedLanguage, setSelectedLanguage] = useState<'typescript' | 'cpp' | 'java'>('typescript');

  const getOjSectionId = (): string => {
    if (sectionId) {
      return sectionId;
    }

    if (id && /^\d+(\.\d+)*$/.test(id)) {
      return id;
    }

    return '4.3';
  };

  useEffect(() => {
    // Handle both old and new routing formats
    if (sectionId) {
      // New format: /structure/:chapterId/section/:sectionId/practice
      if (sectionId === '2.1') {
        // Arrays section
        const arrayStructure: DataStructure = {
          id: 'array',
          name: 'Arrays and Sequential Lists',
          description: 'Practice array operations and sequential list implementations',
          category: 'linear',
          difficulty: 'beginner',
          concepts: ['Array indexing', 'Dynamic resizing', 'Memory allocation', 'Sequential access'],
          operations: [
            { 
              name: 'Access', 
              description: 'Get element by index',
              timeComplexity: 'O(1)',
              spaceComplexity: 'O(1)',
              code: 'arr[index]'
            },
            { 
              name: 'Insert', 
              description: 'Add element at specific position',
              timeComplexity: 'O(n)',
              spaceComplexity: 'O(1)',
              code: 'arr.splice(index, 0, element)'
            },
            { 
              name: 'Delete', 
              description: 'Remove element from specific position',
              timeComplexity: 'O(n)',
              spaceComplexity: 'O(1)',
              code: 'arr.splice(index, 1)'
            },
            { 
              name: 'Search', 
              description: 'Find element in array',
              timeComplexity: 'O(n)',
              spaceComplexity: 'O(1)',
              code: 'arr.indexOf(element)'
            }
          ]
        };
        setStructure(arrayStructure);
        // Load practice template from API
        loadPracticeTemplate(sectionId, selectedLanguage);
      }
    } else if (id) {
      // Old format: /practice or /practice/:id
      const found = dataStructures.find(s => s.id === id);
      if (found) {
        setStructure(found);
        setCode(getInitialCode(found));
      }
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [id, chapterId, sectionId, selectedLanguage, loadPracticeTemplate]);

  const getArraysPracticeCode = (language: string = 'typescript'): string => {
    switch (language) {
      case 'cpp':
        return `// Arrays and Sequential Lists Practice - C++
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

// Exercise 1: Basic Array Operations
vector<int> numbers = {1, 3, 5, 7, 9};

// Exercise: Implement a function to insert an element at a specific position
vector<int> insertAt(vector<int> arr, int index, int value) {
    // Implement your solution here
    // Hint: Use vector.insert() method
    arr.insert(arr.begin() + index, value);
    return arr;
}

// Exercise: Implement a function to remove an element at a specific position
vector<int> removeAt(vector<int> arr, int index) {
    // Implement your solution here
    arr.erase(arr.begin() + index);
    return arr;
}

// Exercise: Implement a function to find the index of an element
int findIndex(const vector<int>& arr, int value) {
    // Implement your solution here
    // Return -1 if not found
    auto it = find(arr.begin(), arr.end(), value);
    return (it != arr.end()) ? distance(arr.begin(), it) : -1;
}

// Exercise: Implement binary search (for sorted arrays)
int binarySearch(const vector<int>& arr, int target) {
    int left = 0;
    int right = arr.size() - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}

int main() {
    cout << "Original array: ";
    for (int num : numbers) cout << num << " ";
    cout << endl;
    
    // Test your implementations
    vector<int> temp = numbers;
    vector<int> result1 = insertAt(temp, 2, 4);
    cout << "Insert 4 at index 2: ";
    for (int num : result1) cout << num << " ";
    cout << endl;
    
    temp = numbers;
    vector<int> result2 = removeAt(temp, 1);
    cout << "Remove element at index 1: ";
    for (int num : result2) cout << num << " ";
    cout << endl;
    
    cout << "Find index of 7: " << findIndex(numbers, 7) << endl;
    
    vector<int> sortedArray = {1, 3, 5, 7, 9, 11, 13};
    cout << "Binary search for 7: " << binarySearch(sortedArray, 7) << endl;
    
    return 0;
}`;

      case 'java':
        return `// Arrays and Sequential Lists Practice - Java
import java.util.*;

public class ArrayPractice {
    
    // Exercise 1: Basic Array Operations
    static int[] numbers = {1, 3, 5, 7, 9};
    
    // Exercise: Implement a function to insert an element at a specific position
    public static ArrayList<Integer> insertAt(ArrayList<Integer> arr, int index, int value) {
        // Implement your solution here
        // Hint: Use ArrayList.add(index, element) method
        ArrayList<Integer> result = new ArrayList<>(arr);
        result.add(index, value);
        return result;
    }
    
    // Exercise: Implement a function to remove an element at a specific position
    public static ArrayList<Integer> removeAt(ArrayList<Integer> arr, int index) {
        // Implement your solution here
        ArrayList<Integer> result = new ArrayList<>(arr);
        result.remove(index);
        return result;
    }
    
    // Exercise: Implement a function to find the index of an element
    public static int findIndex(ArrayList<Integer> arr, int value) {
        // Implement your solution here
        // Return -1 if not found
        return arr.indexOf(value);
    }
    
    // Exercise: Implement binary search (for sorted arrays)
    public static int binarySearch(ArrayList<Integer> arr, int target) {
        int left = 0;
        int right = arr.size() - 1;
        
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (arr.get(mid) == target) {
                return mid;
            } else if (arr.get(mid) < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        return -1;
    }
    
    public static void main(String[] args) {
        ArrayList<Integer> numbersList = new ArrayList<>();
        for (int num : numbers) {
            numbersList.add(num);
        }
        
        System.out.println("Original array: " + numbersList);
        
        // Test your implementations
        ArrayList<Integer> result1 = insertAt(new ArrayList<>(numbersList), 2, 4);
        System.out.println("Insert 4 at index 2: " + result1);
        
        ArrayList<Integer> result2 = removeAt(new ArrayList<>(numbersList), 1);
        System.out.println("Remove element at index 1: " + result2);
        
        System.out.println("Find index of 7: " + findIndex(numbersList, 7));
        
        ArrayList<Integer> sortedArray = new ArrayList<>(Arrays.asList(1, 3, 5, 7, 9, 11, 13));
        System.out.println("Binary search for 7: " + binarySearch(sortedArray, 7));
    }
}`;

      default: // typescript
        return `// Arrays and Sequential Lists Practice
// This section contains exercises for working with arrays and sequential data structures

// Exercise 1: Basic Array Operations
const numbers: number[] = [1, 3, 5, 7, 9];
console.log('Original array:', numbers);

// Exercise: Implement a function to insert an element at a specific position
function insertAt(arr: number[], index: number, value: number): number[] {
  // Implement your solution here
  // Hint: Create a new array or use splice method
  const result = [...arr];
  result.splice(index, 0, value);
  return result;
}

// Exercise: Implement a function to remove an element at a specific position
function removeAt(arr: number[], index: number): number[] {
  // Implement your solution here
  const result = [...arr];
  result.splice(index, 1);
  return result;
}

// Exercise: Implement a function to find the index of an element
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
// Exercise: Implement binary search (for sorted arrays)
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

// Exercise: Implement two-pointer technique to find pair sum
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
  };

  const getInitialCode = (structure: DataStructure): string => {
    switch (structure.id) {
      case 'array':
        return `// Array Operation Practice
const arr: number[] = [1, 2, 3, 4, 5];

// Implement a function to find the maximum value in the array
function findMax(array: number[]): number {
  // Implement your code here
  let max = array[0];
  for (let i = 1; i < array.length; i++) {
    if (array[i] > max) {
      max = array[i];
    }
  }
  return max;
}

// Test your code
console.log('Array:', arr);
console.log('最大值:', findMax(arr));`;

      case 'linkedlist':
        return `// 链表操作练习
class ListNode {
  val: number;
  next: ListNode | null;
  
  constructor(val: number) {
    this.val = val;
    this.next = null;
  }
}

// 创建一个简单的链表
const head = new ListNode(1);
head.next = new ListNode(2);
head.next.next = new ListNode(3);

// 实现一个函数来计算链表长度
function getLength(head: ListNode | null): number {
  // 在这里实现你的代码
  let count = 0;
  let current = head;
  while (current) {
    count++;
    current = current.next;
  }
  return count;
}

// 测试你的代码
console.log('链表长度:', getLength(head));`;

      case 'binarytree':
        return `// 二叉树操作练习
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  
  constructor(val: number) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

// 创建一个简单的二叉树
const root = new TreeNode(1);
root.left = new TreeNode(2);
root.right = new TreeNode(3);
root.left.left = new TreeNode(4);
root.left.right = new TreeNode(5);

// 实现前序遍历
function preorderTraversal(root: TreeNode | null): number[] {
  // 在这里实现你的代码
  if (!root) return [];
  
  const result: number[] = [];
  const stack: TreeNode[] = [root];
  
  while (stack.length > 0) {
    const node = stack.pop()!;
    result.push(node.val);
    
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
  
  return result;
}

// 测试你的代码
console.log('前序遍历:', preorderTraversal(root));`;

      default:
        return '// 开始编写你的代码\nconsole.log("Hello, 数据结构!");';
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    try {
      const response = await fetch(apiUrl('/code/execute'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language: selectedLanguage,
          sectionId: sectionId || structure?.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const result = data.result;
        const formattedOutput = `Execution Result:
[SUCCESS] Code compiled successfully
[COMPILE] Compilation time: ${result.compilationTime}ms
[EXECUTE] Execution time: ${result.executionTime}ms
[MEMORY] Memory usage: ${result.memoryUsage}MB
[TESTS] Passed ${result.passedTests}/${result.totalTests} tests

Logs:
${result.logs.join('\n')}

Output:
${result.output}`;
        
        setOutput(formattedOutput);
        message.success('Code executed successfully!');
      } else {
        setOutput(`[ERROR] ${data.error}\n${data.details || ''}`);
        message.error('Code execution failed');
      }
    } catch (error) {
      setOutput('[ERROR] Failed to connect to execution service: ' + error);
      message.error('Connection failed');
    } finally {
      setIsRunning(false);
    }
  };

  const saveCode = () => {
    // 保存代码到本地存储
    if (structure) {
      localStorage.setItem(`practice_${structure.id}`, code);
      message.success('Code saved successfully');
    }
  };

  if (!structure) {
    return (
      <div className="practice-empty-state">
        <Typography.Text>Data structure not found</Typography.Text>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="practice-empty-state">
        <Typography.Text>Loading practice content...</Typography.Text>
      </div>
    );
  }

  return (
    <div className="practice-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card style={{ marginBottom: '24px' }}>
          <div className="practice-header-row">
            <Title level={2} className="practice-header-title">{structure.name} - Code Practice</Title>
            <Button type="primary" onClick={() => navigate(`/oj/${getOjSectionId()}`)}>
              进入OJ模块
            </Button>
          </div>
          <Paragraph>
            Practice {structure.name} operations in the code editor below.
            You can modify the code, run tests, and view execution results.
          </Paragraph>
        </Card>

        <Row gutter={24} style={{ height: 'calc(100vh - 160px)' }}>
          <Col span={18}>
            <Card
              title={
                <div className="practice-editor-title-row">
                  <span>Code Editor</span>
                  <div className="practice-editor-toolbar">
                    <Select
                      value={selectedLanguage}
                      onChange={setSelectedLanguage}
                      style={{ width: 140 }}
                      size="small"
                    >
                      <Option value="typescript">TypeScript</Option>
                      <Option value="cpp">C++</Option>
                      <Option value="java">Java</Option>
                    </Select>
                    <div className="btn-group">
                      <Button
                        icon={<SaveOutlined />}
                        onClick={saveCode}
                        className="btn-secondary btn-with-icon"
                        size="small"
                      >
                        Save
                      </Button>
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        loading={isRunning}
                        onClick={runCode}
                        className="practice-btn btn-with-icon"
                        size="small"
                      >
                        Run Code
                      </Button>
                    </div>
                  </div>
                </div>
              }
              style={{ height: '100%' }}
            >
              <CodeEditor
                value={code}
                onChange={(value) => setCode(value || '')}
                height="calc(100vh - 260px)"
                language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage === 'java' ? 'java' : 'typescript'}
              />
            </Card>
          </Col>

          <Col span={6}>
            <div className="practice-side-column">
              <Card title="Execution Results" style={{ flex: '1 1 60%', minHeight: 0 }}>
                <div className="output-container output-container-full">
                  <pre className="output-text">{output || 'Click "Run Code" to see execution results'}</pre>
                </div>
              </Card>

              <Card title="Hints" style={{ flex: '1 1 40%', minHeight: 0 }}>
                <div className="hints hints-full">
                  <h4>Practice Points:</h4>
                  <ul>
                    {structure.concepts.map((concept, index) => (
                      <li key={index}>{concept}</li>
                    ))}
                  </ul>
                  
                  <h4>Common Operations:</h4>
                  <ul>
                    {structure.operations.map((op, index) => (
                      <li key={index}>
                        <strong>{op.name}</strong>: {op.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </div>
          </Col>
        </Row>
      </motion.div>
    </div>
  );
};

export default Practice;
