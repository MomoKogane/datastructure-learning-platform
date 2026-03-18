import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DataStructure from '../models/DataStructure';

// Load environment variables
dotenv.config();

// Sample data structures to seed the database
const sampleDataStructures = [
  {
    id: 'array',
    name: 'array',
    displayName: 'Array',
    category: 'linear',
    difficulty: 'beginner',
    description: 'A collection of elements stored at contiguous memory locations. Arrays provide constant-time access to elements by index.',
    concepts: [
      {
        id: 'array-concept-1',
        title: 'What is an Array?',
        content: 'An array is a data structure that stores multiple elements of the same type in a contiguous block of memory. Each element can be accessed using its index position.',
        order: 1,
        examples: [
          'JavaScript: [1, 2, 3, 4, 5]',
          'Python: [1, 2, 3, 4, 5]',
          'Java: int[] arr = {1, 2, 3, 4, 5};'
        ],
        keyPoints: [
          'Fixed size in most languages',
          'Constant-time random access',
          'Elements stored contiguously in memory',
          'Zero-based indexing in most languages'
        ]
      },
      {
        id: 'array-concept-2',
        title: 'Array Properties',
        content: 'Arrays have several important properties that make them useful for certain operations and less suitable for others.',
        order: 2,
        keyPoints: [
          'Random access: O(1) time complexity',
          'Sequential storage in memory',
          'Cache-friendly due to locality of reference',
          'Fixed size (in most implementations)'
        ]
      }
    ],
    operations: [
      {
        name: 'access',
        displayName: 'Access Element',
        description: 'Retrieve an element at a specific index position',
        timeComplexity: 'O(1)',
        spaceComplexity: 'O(1)',
        codeExamples: [
          {
            language: 'javascript',
            code: `// Access element at index
function accessElement(arr, index) {
  if (index >= 0 && index < arr.length) {
    return arr[index];
  }
  throw new Error('Index out of bounds');
}

// Example usage
const numbers = [1, 2, 3, 4, 5];
console.log(accessElement(numbers, 2)); // Output: 3`,
            explanation: 'Array access is O(1) because we can calculate the memory address directly using the index.'
          },
          {
            language: 'python',
            code: `# Access element at index
def access_element(arr, index):
    if 0 <= index < len(arr):
        return arr[index]
    raise IndexError("Index out of bounds")

# Example usage
numbers = [1, 2, 3, 4, 5]
print(access_element(numbers, 2))  # Output: 3`,
            explanation: 'Python lists provide O(1) access time for indexed elements.'
          }
        ],
        steps: [
          'Check if index is within bounds',
          'Calculate memory address: base_address + (index * element_size)',
          'Return the value at that memory location'
        ],
        parameters: [
          {
            name: 'array',
            type: 'Array<T>',
            description: 'The array to access',
            required: true
          },
          {
            name: 'index',
            type: 'number',
            description: 'The index position to access',
            required: true
          }
        ]
      },
      {
        name: 'insert',
        displayName: 'Insert Element',
        description: 'Add an element at a specific position in the array',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        codeExamples: [
          {
            language: 'javascript',
            code: `// Insert element at specific index
function insertElement(arr, index, element) {
  if (index < 0 || index > arr.length) {
    throw new Error('Index out of bounds');
  }
  
  // Shift elements to the right
  for (let i = arr.length; i > index; i--) {
    arr[i] = arr[i - 1];
  }
  
  // Insert new element
  arr[index] = element;
  return arr;
}

// Example usage
let numbers = [1, 2, 4, 5];
insertElement(numbers, 2, 3);
console.log(numbers); // Output: [1, 2, 3, 4, 5]`,
            explanation: 'Insertion requires shifting all elements after the insertion point, making it O(n) in the worst case.'
          }
        ],
        steps: [
          'Validate the insertion index',
          'Shift all elements from index to end one position right',
          'Insert the new element at the specified index',
          'Update array length if necessary'
        ],
        parameters: [
          {
            name: 'array',
            type: 'Array<T>',
            description: 'The array to insert into',
            required: true
          },
          {
            name: 'index',
            type: 'number',
            description: 'The position to insert at',
            required: true
          },
          {
            name: 'element',
            type: 'T',
            description: 'The element to insert',
            required: true
          }
        ]
      }
    ],
    timeComplexity: {
      best: 'O(1) for access',
      average: 'O(1) for access, O(n) for search',
      worst: 'O(n) for search, insertion, and deletion',
      description: 'Arrays excel at random access but struggle with dynamic operations.'
    },
    spaceComplexity: {
      best: 'O(n)',
      average: 'O(n)',
      worst: 'O(n)',
      description: 'Space complexity is linear with respect to the number of elements.'
    },
    visualizationConfig: {
      type: 'array',
      animationSpeed: 800,
      nodeColor: '#3B82F6',
      linkColor: '#6B7280',
      highlightColor: '#EAB308',
      dimensions: {
        width: 800,
        height: 200
      }
    }
  },
  {
    id: 'linked-list',
    name: 'linked-list',
    displayName: 'Linked List',
    category: 'linear',
    difficulty: 'beginner',
    description: 'A linear data structure where elements are stored in nodes, and each node contains data and a reference to the next node.',
    concepts: [
      {
        id: 'linked-list-concept-1',
        title: 'What is a Linked List?',
        content: 'A linked list is a linear data structure where elements are not stored in contiguous memory locations. Instead, each element (node) contains data and a pointer/reference to the next node.',
        order: 1,
        examples: [
          'Node structure: { data: value, next: pointer }',
          'List: [1] -> [2] -> [3] -> [4] -> null'
        ],
        keyPoints: [
          'Dynamic size',
          'Non-contiguous memory allocation',
          'Efficient insertion and deletion',
          'Sequential access only'
        ]
      }
    ],
    operations: [
      {
        name: 'insert',
        displayName: 'Insert Node',
        description: 'Add a new node to the linked list',
        timeComplexity: 'O(1) at head, O(n) at arbitrary position',
        spaceComplexity: 'O(1)',
        codeExamples: [
          {
            language: 'javascript',
            code: `class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
    this.size = 0;
  }
  
  // Insert at the beginning - O(1)
  insertAtHead(val) {
    const newNode = new ListNode(val, this.head);
    this.head = newNode;
    this.size++;
  }
  
  // Insert at specific index - O(n)
  insertAt(index, val) {
    if (index === 0) {
      this.insertAtHead(val);
      return;
    }
    
    let current = this.head;
    for (let i = 0; i < index - 1 && current; i++) {
      current = current.next;
    }
    
    if (current) {
      const newNode = new ListNode(val, current.next);
      current.next = newNode;
      this.size++;
    }
  }
}`,
            explanation: 'Insertion at the head is O(1) since we only need to update pointers. Insertion at arbitrary positions requires traversal.'
          }
        ],
        parameters: [
          {
            name: 'value',
            type: 'T',
            description: 'The value to insert',
            required: true
          },
          {
            name: 'position',
            type: 'number',
            description: 'The position to insert at (optional, defaults to head)',
            required: false,
            defaultValue: 0
          }
        ]
      }
    ],
    timeComplexity: {
      best: 'O(1) for insertion/deletion at head',
      average: 'O(n) for search and arbitrary position operations',
      worst: 'O(n) for search, insertion, and deletion at tail',
      description: 'Linked lists provide efficient insertion/deletion but require linear time for random access.'
    },
    spaceComplexity: {
      best: 'O(n)',
      average: 'O(n)',
      worst: 'O(n)',
      description: 'Each node requires additional memory for the pointer/reference.'
    },
    visualizationConfig: {
      type: 'linked-list',
      animationSpeed: 1000,
      nodeColor: '#10B981',
      linkColor: '#6B7280',
      highlightColor: '#F59E0B',
      dimensions: {
        width: 1000,
        height: 150
      }
    }
  }
];

// Function to seed the database
async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dslp';
    await mongoose.connect(mongoURI);
    console.log('? Connected to MongoDB');

    // Clear existing data
    await DataStructure.deleteMany({});
    console.log('??  Cleared existing data structures');

    // Insert sample data
    await DataStructure.insertMany(sampleDataStructures);
    console.log('? Seeded database with sample data structures');

    // Verify insertion
    const count = await DataStructure.countDocuments();
    console.log(`? Total data structures in database: ${count}`);

    // Display inserted data
    const dataStructures = await DataStructure.find({}, 'id displayName category');
    console.log('? Inserted data structures:');
    dataStructures.forEach(ds => {
      console.log(`  - ${ds.displayName} (${ds.category}): ${ds.id}`);
    });

  } catch (error) {
    console.error('? Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('? Disconnected from MongoDB');
  }
}

// Run the seeding function if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
