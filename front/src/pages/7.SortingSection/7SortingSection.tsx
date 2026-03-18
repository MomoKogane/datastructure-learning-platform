import React from 'react';
import TheoryTemplate from '../../components/Template/TheoryTemplate';
import type { TheoryTemplateContent } from '../../components/Template/TheoryTemplate';

const CONTENT_ID = '7';
const CHAPTER_NUMBER = '7';
const STRUCTURE_NAME = 'Sorting Overview';

const fallbackContent: TheoryTemplateContent = {
  id: CONTENT_ID,
  name: STRUCTURE_NAME,
  subtitle: 'Sorting algorithms and analysis overview',
  theory: {
    overview:
      'This chapter introduces classical sorting families and compares them by complexity, stability, space usage, and practical scenarios. It covers insertion/bubble/selection, shell, quick/merge/heap, radix/bucket, and external sorting.',
    concepts: [
      {
        title: 'Comparison-Based Sorts',
        content: 'Algorithms such as insertion, quick, merge, and heap sort rely on element comparison.',
        examples: ['Quick sort average O(n log n)', 'Merge sort stable with extra memory']
      },
      {
        title: 'Non-Comparison Sorts',
        content: 'Radix and bucket sort can be near-linear when input constraints are suitable.',
        examples: ['Radix sort by digits', 'Bucket sort for value ranges']
      },
      {
        title: 'Engineering Trade-offs',
        content: 'Real-world selection depends on input distribution, stability requirement, and memory model.',
        examples: ['Stable sort for records', 'External sort for disk-scale datasets']
      }
    ]
  },
  keyTakeaways: [
    'No single sorting algorithm is best for all scenarios',
    'Complexity, stability, and memory are core decision factors',
    'Input characteristics should drive sorting strategy'
  ],
  quizSectionId: CONTENT_ID,
  levelTag: 'Chapter Overview'
};

const loadContent = async (): Promise<TheoryTemplateContent> => fallbackContent;

const SortingSection: React.FC = () => (
  <TheoryTemplate
    structureId={CONTENT_ID}
    structureName={STRUCTURE_NAME}
    chapterNumber={CHAPTER_NUMBER}
    dataLoader={loadContent}
  />
);

export default SortingSection;
