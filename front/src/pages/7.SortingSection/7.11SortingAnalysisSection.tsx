import React from 'react';
import TheoryTemplate from '../../components/Template/TheoryTemplate';
import type { TheoryTemplateContent } from '../../components/Template/TheoryTemplate';
import { apiService } from '../../services/api';

interface TheorySection {
  title: string;
  content: string;
  examples: string[];
}

const CONTENT_ID = '7.11';
const CHAPTER_NUMBER = '7.11';
const STRUCTURE_NAME = 'Sorting Algorithm Analysis';

const fallbackContent: TheoryTemplateContent = {
  id: CONTENT_ID,
  name: STRUCTURE_NAME,
  subtitle: 'Compare sorting algorithms by complexity and practical constraints',
  theory: {
    overview:
      'This section summarizes sorting algorithm analysis from both theoretical and practical perspectives, including time/space complexity, stability, adaptiveness, and scenario-driven selection.',
    concepts: [
      {
        title: 'Theoretical Metrics',
        content: 'Compare algorithms by best/average/worst-case time and auxiliary space complexity.',
        examples: ['O(n log n) vs O(n?)', 'In-place vs extra buffer']
      },
      {
        title: 'Practical Selection Factors',
        content: 'Input pattern, stability requirements, memory constraints, and execution environment all affect selection.',
        examples: ['Nearly sorted data favors insertion-like strategies', 'Stable sorting for records with equal keys']
      }
    ]
  },
  keyTakeaways: [
    'Algorithm analysis should combine asymptotic and practical factors',
    'Stability and space overhead can be as important as runtime',
    'Choose sorting strategy based on real workload characteristics'
  ],
  quizSectionId: CONTENT_ID,
  levelTag: 'Theory'
};

const loadContent = async (): Promise<TheoryTemplateContent> => {
  try {
    const result = await apiService.getSectionModules(CONTENT_ID);
    if (result.success && result.data?.templateType === 'theory') {
      const theoryModule = (result.data.modules.theory ?? {}) as { introduction?: string; sections?: TheorySection[] };
      return {
        ...fallbackContent,
        theory: {
          overview: theoryModule.introduction ?? fallbackContent.theory.overview,
          concepts: Array.isArray(theoryModule.sections)
            ? theoryModule.sections.map((section) => ({
                title: section.title,
                content: section.content,
                examples: section.examples
              }))
            : fallbackContent.theory.concepts
        },
        keyTakeaways: Array.isArray(result.data.modules.keyTakeaways)
          ? (result.data.modules.keyTakeaways as string[])
          : fallbackContent.keyTakeaways
      };
    }
  } catch (error) {
    console.warn('[SortingAnalysisSection] Failed to load theory content, using fallback.', error);
  }

  return fallbackContent;
};

const SortingAnalysisSection: React.FC = () => (
  <TheoryTemplate
    structureId={CONTENT_ID}
    structureName={STRUCTURE_NAME}
    chapterNumber={CHAPTER_NUMBER}
    dataLoader={loadContent}
  />
);

export default SortingAnalysisSection;
