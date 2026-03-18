import { createTopicSection } from '../TopicSection/createTopicSection';

const PatternMatchingOverviewSection = createTopicSection({
  id: '3.2.1',
  name: 'Pattern Matching: Definition and Applications',
  chapterNumber: '3.2.1',
  overview: 'Pattern matching determines whether and where a pattern appears in text. This section introduces problem models, application domains, and extension hooks for visualization, code demos, and practice tasks.',
  concepts: [
    { title: 'Problem Definition', content: 'Given text T and pattern P, find all valid occurrences under exact or constrained matching rules.', examples: ['Exact match', 'Prefix match', 'Streaming match'] },
    { title: 'Applications', content: 'Pattern matching is used in search engines, editors, DNA sequence analysis, log analysis, and intrusion detection.', examples: ['IDE find', 'Bioinformatics motifs'] }
  ],
  complexity: { time: { baseline: 'Depends on algorithm (BF/KMP/etc.)' }, space: 'Depends on preprocessing strategy' },
  operations: [
    { name: 'BF Pattern Match', description: 'Use one main string and one substring to run basic sliding pattern matching.', steps: ['Input main string T', 'Input substring P', 'Slide P to the right on mismatch', 'Report match start positions'] }
  ],
  exercises: [
    {
      title: 'Choose Matching Strategy',
      difficulty: 'Easy',
      description: 'Given three scenarios, choose suitable matching method and justify.',
      hints: ['Check text size', 'Check repeated pattern structure'],
      solutions: `#include <string>

std::string chooseStrategy(bool manyQueries, bool repeatedPattern, bool smallText) {
  if (manyQueries) return "Use preprocessing (KMP/automaton)";
  if (repeatedPattern) return "KMP or Z-algorithm";
  if (smallText) return "Brute force";
  return "KMP";
}`
    },
    {
    title: 'Network Intrusion Signature Matching',
    difficulty: 'Medium',
    description: 'Given a long network log string and a set of attack signatures, find every occurrence of each signature and return their start indices.',
    hints: ['Use KMP for a single signature or Aho-Corasick for multiple signatures', 'Be careful with overlapping matches']
    }
  ],
  practiceExampleLanguage: 'cpp',
  fallbackCodeExamples: {
    cpp: {
      basic: `// Pattern matching finds all occurrences of P in T.`,
      operations: `// Output match positions (0-based or 1-based).`,
      advanced: `// Choose BF for small inputs, KMP for repeated patterns or many queries.`
    },
    c: {
      basic: `/* Pattern matching checks occurrences of P in T. */`,
      operations: `/* Report indices where P fully matches. */`,
      advanced: `/* Pick BF or KMP based on input size and reuse. */`
    }
  },
    theoryLinks: [
    { title: 'Pattern Matching Algorithms', url: 'https://cp-algorithms.com/string/pattern_matching.html', platform: 'CP-Algorithms'},
    { title: 'Pattern Matching in OI', url: 'https://oiwiki.org/string/match/', platform: 'OI Wiki'}
  ],
  practiceLinks: [
    { title: 'Pattern Matching in OI', url: 'https://oiwiki.org/string/match/', platform: 'OI Wiki'}
  ],
  visualNodes: ['T', 'P', 'match'],
  visualCaption: 'Pattern matching finds all occurrences of P in T.',
  visualForm: 'algorithm',
  visualScript: { kind: 'generic', autoGenerate: true },
  forceLocalVisualization: true,
});

export default PatternMatchingOverviewSection;
