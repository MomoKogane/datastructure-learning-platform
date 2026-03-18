import React from 'react';
import TheoryTemplate from '../../components/Template/TheoryTemplate';
import type { TheoryTemplateContent } from '../../components/Template/TheoryTemplate';
import { apiService } from '../../services/api';

interface TheorySection {
  title: string;
  content: string;
  examples: string[];
}

interface TheoryContent {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  content: {
    introduction: string;
    sections: TheorySection[];
    keyTakeaways: string[];
  };
}

const CONTENT_ID = '1.2';
const CHAPTER_NUMBER = '1.2';
const STRUCTURE_NAME = 'Complexity Analysis';

const fallbackContent: TheoryContent = {
  id: '1.2',
  title: '1.2 Complexity Analysis',
  subtitle: 'Time and space complexity, Big O notation',
  type: 'theory',
  content: {
    introduction:
      'Complexity analysis helps estimate how algorithm performance scales with input size using time and space measures.',
    sections: [
      {
        title: 'Time Complexity',
        content:
          'Time complexity describes how runtime grows with input size. Common classes include O(1), O(log n), O(n), O(n log n), and O(n^2).',
        examples: [
          'Array access is O(1)',
          'Binary search is O(log n)',
          'Merge sort is O(n log n)'
        ]
      },
      {
        title: 'Space Complexity',
        content:
          'Space complexity measures additional memory required. Some algorithms trade extra memory for speed.',
        examples: [
          'In-place sorts use O(1) extra space',
          'Merge sort requires O(n) extra space'
        ]
      },
      {
        title: 'Big O Notation',
        content:
          'Big O gives an upper bound on growth rate, focusing on large inputs and ignoring constants.',
        examples: [
          'O(n^2) dominates O(n)',
          'O(n log n) grows slower than O(n^2)'
        ]
      }
    ],
    keyTakeaways: [
      'Complexity helps compare algorithm scalability',
      'Time and space are the main resources considered',
      'Big O focuses on asymptotic behavior'
    ]
  }
};

const toTemplateContent = (content: TheoryContent): TheoryTemplateContent => ({
  id: content.id,
  name: STRUCTURE_NAME,
  subtitle: content.subtitle,
  theory: {
    overview: content.content.introduction,
    concepts: content.content.sections.map(section => ({
      title: section.title,
      content: section.content,
      examples: section.examples
    }))
  },
  keyTakeaways: content.content.keyTakeaways,
  quizSectionId: CONTENT_ID,
  levelTag: 'Beginner'
});

const loadContent = async (): Promise<TheoryTemplateContent> => {
  try {
    const result = await apiService.getSectionModules(CONTENT_ID);
    if (result.success && result.data?.templateType === 'theory') {
      const theoryModule = (result.data.modules.theory ?? {}) as { introduction?: string; sections?: TheorySection[] };
      const sectionContent: TheoryContent = {
        id: CONTENT_ID,
        title: fallbackContent.title,
        subtitle: fallbackContent.subtitle,
        type: 'theory',
        content: {
          introduction: theoryModule.introduction ?? fallbackContent.content.introduction,
          sections: Array.isArray(theoryModule.sections) ? theoryModule.sections : fallbackContent.content.sections,
          keyTakeaways: Array.isArray(result.data.modules.keyTakeaways)
            ? (result.data.modules.keyTakeaways as string[])
            : fallbackContent.content.keyTakeaways
        }
      };

      return toTemplateContent(sectionContent);
    }
  } catch (error) {
    console.warn('[ComplexityAnalysisSection] Failed to load content, using fallback.', error);
  }

  return toTemplateContent(fallbackContent);
};

const ComplexityAnalysisSection: React.FC = () => (
  <TheoryTemplate
    structureId={CONTENT_ID}
    structureName={STRUCTURE_NAME}
    chapterNumber={CHAPTER_NUMBER}
    dataLoader={loadContent}
  />
);

export default ComplexityAnalysisSection;
