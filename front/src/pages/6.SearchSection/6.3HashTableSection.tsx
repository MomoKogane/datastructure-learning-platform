import { createTopicSection } from '../TopicSection/createTopicSection';

const HashTableSection = createTopicSection({
  id: '6.3',
  name: 'Hash Table',
  chapterNumber: '6.3',
  overview: 'Hash tables map keys to buckets using hash functions, enabling average O(1) insert/search/delete.',
  concepts: [
    { title: 'Hash Function', content: 'Converts key to index.', examples: ['Modulo table size'] },
    { title: 'Collision Handling', content: 'Use chaining or open addressing.', examples: ['Linear probing', 'Separate chaining'] }
  ],
  complexity: { time: { insert: 'O(1) avg, O(n) worst', search: 'O(1) avg, O(n) worst', delete: 'O(1) avg, O(n) worst' }, space: 'O(n)' },
  operations: [
    {
      name: 'Query/Insert',
      description: 'Input value, query its chain by modulo bucket; if absent, append to chain tail.',
      steps: ['Compute hash index by modulo', 'Scan bucket chain for value', 'Insert at tail if not found']
    },
    {
      name: 'Query/Delete',
      description: 'Input value, query its chain and delete the matched node if it exists.',
      steps: ['Compute hash index by modulo', 'Scan bucket chain for value', 'Delete node when matched']
    }
  ],
  exercises: [{
    title: 'Two Sum with Hash Map',
    difficulty: 'Easy',
    description: 'Find pair adding to target.',
    hints: ['Store complement map'],
    solutions: `#include <iostream>
#include <unordered_map>
#include <vector>

std::pair<int, int> twoSum(const std::vector<int>& nums, int target) {
  std::unordered_map<int, int> pos;
  for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
    int need = target - nums[i];
    if (pos.count(need)) return {pos[need], i};
    pos[nums[i]] = i;
  }
  return {-1, -1};
}

int main() {
  std::vector<int> nums = {2, 7, 11, 15};
  auto ans = twoSum(nums, 9);
  std::cout << ans.first << " " << ans.second << std::endl;
  return 0;
}`
  },
    {
      title: 'Concept Check: Hash Table',
      difficulty: 'Easy',
      description: 'Summarize the core idea of Hash Table and analyze the time complexity of its key operations.',
      hints: ['Use the definition and operation steps from this section.'],
      solutions: ''
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `#include <list>
#include <vector>

class HashTable {
 public:
  explicit HashTable(int cap) : buckets(cap) {}

  void insert(int key) {
    int idx = hash(key);
    for (int x : buckets[idx]) if (x == key) return;
    buckets[idx].push_back(key);
  }

  bool contains(int key) const {
    int idx = hash(key);
    for (int x : buckets[idx]) if (x == key) return true;
    return false;
  }

 private:
  std::vector<std::list<int>> buckets;
  int hash(int key) const { return key % static_cast<int>(buckets.size()); }
};`,
      operations: `int hashIndex(int key, int capacity) {
  int idx = key % capacity;
  return idx < 0 ? idx + capacity : idx;
}`,
      advanced: `// Advanced: dynamic rehash when load factor exceeds threshold.`
    },
    c: {
      basic: `typedef struct Node {
  int key;
  struct Node* next;
} Node;

int hash_index(int key, int cap) {
  int idx = key % cap;
  return idx < 0 ? idx + cap : idx;
}

void insert_key(Node* table[], int cap, int key) {
  int idx = hash_index(key, cap);
  Node* cur = table[idx];
  while (cur) { if (cur->key == key) return; cur = cur->next; }
  Node* node = (Node*)malloc(sizeof(Node));
  node->key = key;
  node->next = table[idx];
  table[idx] = node;
}`,
      operations: `int contains_key(Node* table[], int cap, int key) {
  int idx = hash_index(key, cap);
  Node* cur = table[idx];
  while (cur) { if (cur->key == key) return 1; cur = cur->next; }
  return 0;
}`,
      advanced: `/* Advanced: resize table and rehash all keys when load factor is high. */`
    }
  },
    theoryLinks: [
    { title: 'Hash Table', url: 'https://www.geeksforgeeks.org/hashing-data-structure/', platform: 'GeeksforGeeks'},
    { title: 'Hash Table', url: 'https://oiwiki.org/ds/hash/', platform: 'OI Wiki'}
  ],
  practiceLinks: [
    { title: 'Hash Table', url: 'https://leetcode.cn/problems/design-hashmap/description/', platform: 'LeetCode'},
    { title: 'Hash Table', url: 'https://oiwiki.org/ds/hash/', platform: 'OI Wiki'}
  ],
  visualNodes: ['12', '7', '19', '26', '31', '9', '14', '22'],
  visualCaption: 'Buckets and collisions',
  visualForm: 'hash',
  visualScript: { kind: 'array', autoGenerate: true },
});

export default HashTableSection;
