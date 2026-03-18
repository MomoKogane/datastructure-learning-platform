import { createTopicSection } from '../TopicSection/createTopicSection';

const KMPAlgorithmSection = createTopicSection({
  id: '3.2.3',
  name: 'KMP Algorithm',
  chapterNumber: '3.2.3',
  overview: 'KMP improves matching by preprocessing the pattern (prefix function / next table), avoiding repeated backtracking in text. This section reserves full expansion for visualization, code demonstration, and programming practice.',
  concepts: [
    { title: 'Prefix Function (LPS/Next)', content: 'For each pattern position, store longest proper prefix that is also suffix.', examples: ['ababaca -> LPS sequence'] },
    { title: 'State Transition', content: 'On mismatch, jump using prefix table instead of restarting from scratch.', examples: ['j fallback by LPS[j-1]'] }
  ],
  complexity: { time: { preprocess: 'O(m)', match: 'O(n)', total: 'O(n+m)' }, space: 'O(m)' },
  operations: [
    { name: 'KMP Pattern Match', description: 'Two strings plus next array visualization, then run KMP matching with fallback by next.', steps: ['Input main string T', 'Input substring P', 'Build next array', 'Match with i/j pointers and next fallback'] }
  ],
  exercises: [
    {
      title: 'Construct LPS',
      difficulty: 'Medium',
      description: 'Construct LPS array for several patterns and verify transitions.',
      hints: ['Re-use prefix knowledge', 'Watch fallback chain'],
      solutions: `#include <string>
#include <vector>

std::vector<int> buildLps(const std::string& pat) {
  int m = static_cast<int>(pat.size());
  std::vector<int> lps(m, 0);
  for (int i = 1, len = 0; i < m; ) {
    if (pat[i] == pat[len]) {
      lps[i++] = ++len;
    } else if (len > 0) {
      len = lps[len - 1];
    } else {
      lps[i++] = 0;
    }
  }
  return lps;
}`
    },
    {
      title: 'KMP Match Example',
      difficulty: 'Medium',
      description: 'Given a text and pattern, trace KMP matching using the LPS table.',
      hints: ['Use LPS table to avoid backtracking', 'On mismatch, jump j to LPS[j-1]']
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `// KMP preprocesses pattern to avoid rechecking text characters.`,
      operations: `// Use LPS table to jump j on mismatch.`,
      advanced: `// Overall complexity O(n+m) with linear preprocessing.`
    },
    c: {
      basic: `/* KMP uses prefix table to skip redundant comparisons. */`,
      operations: `/* On mismatch, j = lps[j-1] without moving i back. */`,
      advanced: `/* Preprocessing is linear in pattern length. */`
    }
  },
    theoryLinks: [
    { title: 'KMP Algorithm', url: 'https://oiwiki.org/string/kmp/', platform: 'OI Wiki'},
    { title: 'KMP Algorithm', url: 'https://www.geeksforgeeks.org/kmp-algorithm-for-pattern-searching/', platform: 'GeeksforGeeks'},
    { title: 'Knuth-Morris-Pratt', url: 'https://cp-algorithms.com/string/prefix-function.html', platform: 'CP-Algorithms'}
  ],
  practiceLinks: [
    { title: 'KMP Algorithm', url: 'https://oiwiki.org/string/kmp/', platform: 'OI Wiki'}
  ],
  visualNodes: ['T', 'P', 'next'],
  visualCaption: 'Pattern Matching Visualization with KMP Algorithm',
  visualForm: 'algorithm',
  visualScript: { kind: 'generic', autoGenerate: true },
  forceLocalVisualization: true,
});

export default KMPAlgorithmSection;
