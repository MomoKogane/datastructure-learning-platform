import { createTopicSection } from '../TopicSection/createTopicSection';

const BFAlgorithmSection = createTopicSection({
  id: '3.2.2',
  name: 'BF Brute Force Algorithm',
  chapterNumber: '3.2.2',
  overview: 'BF compares pattern characters one by one at each possible text offset. It is simple and intuitive, making it ideal for first-stage algorithm visualization.',
  concepts: [
    { title: 'Sliding Alignment', content: 'Align pattern at position i in text and compare sequentially.', examples: ['Mismatch -> i+1', 'Full match -> record i'] },
    { title: 'Complexity', content: 'Worst-case complexity is O(nm) when many partial matches occur repeatedly.', examples: ['Text: aaaaa...', 'Pattern: aaaab'] }
  ],
  complexity: { time: { best: 'O(n)', average: 'O(nm)', worst: 'O(nm)' }, space: 'O(1)' },
  operations: [
    { name: 'BF Pattern Match', description: 'Two strings (main and substring), compare left-to-right and only move substring to the right on mismatch.', steps: ['Input main string T', 'Input substring P', 'Compare without backtracking to a previous alignment', 'Move P by one on mismatch and continue'] }
  ],
  exercises: [
    {
      title: 'Trace BF Steps',
      difficulty: 'Easy',
      description: 'Trace BF for given text/pattern and write all comparisons.',
      hints: ['Track offset i', 'Stop after last feasible alignment'],
      solutions: `#include <string>
#include <vector>

std::vector<int> bfMatch(const std::string& text, const std::string& pat) {
  std::vector<int> pos;
  int n = static_cast<int>(text.size());
  int m = static_cast<int>(pat.size());
  for (int i = 0; i + m <= n; ++i) {
    int j = 0;
    while (j < m && text[i + j] == pat[j]) ++j;
    if (j == m) pos.push_back(i);
  }
  return pos;
}`
    },
    {
      title: 'Plagiarism Snippet Detection (Brute Force)',
      difficulty: 'Easy',
      description: 'Given a document string and a short query snippet, use the BF pattern matching algorithm to find all starting positions where the snippet appears exactly.',
      hints: ['Compare characters one by one at each possible start position', 'After a mismatch, shift the pattern by one and restart comparison']
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `// BF aligns pattern at every position and compares sequentially.`,
      operations: `// On mismatch, shift by one and retry.`,
      advanced: `// Worst-case O(nm) when many partial matches occur.`
    },
    c: {
      basic: `/* BF compares pattern at each possible shift. */`,
      operations: `/* Mismatch -> shift by 1. */`,
      advanced: `/* Worst-case when text has many repeated chars. */`
    }
  },
    theoryLinks: [
    { title: 'Naive String Matching', url: 'https://www.geeksforgeeks.org/naive-algorithm-for-pattern-searching/', platform: 'GeeksforGeeks'}
  ],
  visualNodes: ['T', 'P', 'shift'],
  visualCaption: 'Pattern Matching Visualization: Brute Force Algorithm',
  visualForm: 'algorithm',
  visualScript: { kind: 'generic', autoGenerate: true },
  forceLocalVisualization: true,
});

export default BFAlgorithmSection;
