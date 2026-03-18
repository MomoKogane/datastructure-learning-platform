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

const CONTENT_ID = '1.1';
const CHAPTER_NUMBER = '1.1';
const STRUCTURE_NAME = 'Basic Concepts';

const fallbackContent: TheoryContent = {
  id: '1.1',
  title: '1.1 Basic Concepts',
  subtitle: 'Data structures, abstract data types, algorithm analysis',
  type: 'theory',
  content: {
    introduction:
      'This section introduces the foundational ideas behind data structures and algorithms, focusing on how data is organized, accessed, and analyzed for performance.',
    sections: [
      {
        title: 'Data Structures',
        content:
          'A data structure is a way to organize and store data so that it can be accessed and modified efficiently. Choices include linear structures (arrays, lists) and non-linear structures (trees, graphs).',
        examples: [
          'Arrays for contiguous storage',
          'Linked lists for flexible insertions',
          'Trees for hierarchical data'
        ]
      },
      {
        title: 'Abstract Data Types (ADT)',
        content:
          'An ADT defines a data model by its operations and behavior, without specifying its implementation. The same ADT can have multiple implementations with different trade-offs.',
        examples: [
          'Stack ADT implemented with arrays or lists',
          'Queue ADT implemented with circular buffers'
        ]
      },
      {
        title: 'Algorithm Analysis',
        content:
          'Algorithm analysis estimates resource usage, typically time and space, to compare approaches and predict scalability.',
        examples: [
          'Binary search uses logarithmic time',
          'Linear search scales linearly'
        ]
      }
    ],
    keyTakeaways: [
      'Data structures impact performance and memory usage',
      'ADTs separate interface from implementation',
      'Analysis helps compare algorithms objectively'
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
    console.warn('[BasicConceptSection] Failed to load content, using fallback.', error);
  }

  return toTemplateContent(fallbackContent);
};

const BasicConceptSection: React.FC = () => (
  <TheoryTemplate
    structureId={CONTENT_ID}
    structureName={STRUCTURE_NAME}
    chapterNumber={CHAPTER_NUMBER}
    dataLoader={loadContent}
  />
);

export default BasicConceptSection;
