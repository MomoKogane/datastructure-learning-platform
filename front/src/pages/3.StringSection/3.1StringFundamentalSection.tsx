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

const CONTENT_ID = '3.1';
const CHAPTER_NUMBER = '3.1';
const STRUCTURE_NAME = 'String Fundamentals';

const fallbackContent: TheoryContent = {
  id: '3.1',
  title: '3.1 String Fundamentals',
  subtitle: 'String definition, storage, and basic operations',
  type: 'theory',
  content: {
    introduction:
      'This chapter introduces string fundamentals, including definition, storage models, and basic operations in algorithmic practice.',
    sections: [
      {
        title: 'String Definition',
        content:
          'A string is a linear sequence of characters with ordered positions and finite length.',
        examples: ['"hello"', '"data structure"']
      },
      {
        title: 'Storage and Encoding',
        content:
          'Strings are commonly stored in contiguous memory (arrays), with practical encodings such as UTF-8 and UTF-16.',
        examples: ['ASCII vs UTF-8', 'Fixed buffer vs dynamic buffer']
      },
      {
        title: 'Basic Operations',
        content:
          'Core operations include indexing, traversal, comparison, concatenation, and substring extraction.',
        examples: ['Index access O(1)', 'Traversal O(n)']
      }
    ],
    keyTakeaways: [
      'String is a linear structure',
      'Storage model affects performance',
      'Basic operations have clear complexity patterns'
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
  levelTag: 'Intermediate'
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
    console.warn('[StringFundamentalSection] Failed to load content, using fallback.', error);
  }

  return toTemplateContent(fallbackContent);
};

const StringFundamentalSection: React.FC = () => (
  <TheoryTemplate
    structureId={CONTENT_ID}
    structureName={STRUCTURE_NAME}
    chapterNumber={CHAPTER_NUMBER}
    dataLoader={loadContent}
  />
);

export default StringFundamentalSection;
