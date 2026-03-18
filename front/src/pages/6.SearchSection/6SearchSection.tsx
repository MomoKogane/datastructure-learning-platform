import React from 'react';
import TheoryTemplate from '../../components/Template/TheoryTemplate';
import type { TheoryTemplateContent } from '../../components/Template/TheoryTemplate';

const CONTENT_ID = '6';
const CHAPTER_NUMBER = '6';
const STRUCTURE_NAME = 'Searching Overview';

const fallbackContent: TheoryTemplateContent = {
  id: CONTENT_ID,
  name: STRUCTURE_NAME,
  subtitle: 'Search algorithms and data structures overview',
  theory: {
    overview:
      'This chapter introduces the main searching strategies and structures, including sequential search, binary search, hash tables, B-Tree, and B+ Tree. It focuses on when to use each approach and their core performance trade-offs.',
    concepts: [
      {
        title: 'Search Strategy Selection',
        content: 'Choose linear, binary, or indexed/tree-based search based on data order and query pattern.',
        examples: ['Unsorted data ¡ú sequential search', 'Sorted data ¡ú binary search']
      },
      {
        title: 'Hash and Tree Indexing',
        content: 'Hashing targets fast average lookups, while balanced/multi-way trees support ordered and range queries.',
        examples: ['Hash table: O(1) average lookup', 'B+ Tree: efficient range scan']
      },
      {
        title: 'Complexity and Constraints',
        content: 'Performance depends on dataset size, update frequency, ordering needs, and memory/disk layout.',
        examples: ['Binary search requires sorted data', 'Hash tables require collision handling']
      }
    ]
  },
  keyTakeaways: [
    'Searching method selection should match data characteristics',
    'Hash-based lookup is fast on average but not ordered',
    'Tree-based indexes are suitable for ordered/range queries'
  ],
  quizSectionId: CONTENT_ID,
  levelTag: 'Chapter Overview'
};

const loadContent = async (): Promise<TheoryTemplateContent> => fallbackContent;

const SearchSection: React.FC = () => (
  <TheoryTemplate
    structureId={CONTENT_ID}
    structureName={STRUCTURE_NAME}
    chapterNumber={CHAPTER_NUMBER}
    dataLoader={loadContent}
  />
);

export default SearchSection;
