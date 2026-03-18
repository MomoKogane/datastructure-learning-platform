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

const CONTENT_ID = '3.2';
const CHAPTER_NUMBER = '3.2';
const STRUCTURE_NAME = 'Pattern Matching';

const fallbackContent: TheoryContent = {
  id: '3.2',
  title: '3.2 Pattern Matching',
  subtitle: 'BF algorithm, KMP algorithm, and applications',
  type: 'theory',
  content: {
    introduction:
      'Pattern matching focuses on finding a pattern in text efficiently. BF and KMP are two foundational exact matching algorithms.',
    sections: [
      {
        title: 'BF Algorithm',
        content:
          'Brute Force compares pattern at each text position and restarts from next position on mismatch.',
        examples: ['Worst-case O(n*m)', 'Simple and intuitive implementation']
      },
      {
        title: 'KMP Algorithm',
        content:
          'KMP uses prefix-suffix preprocessing (LPS/next array) to skip unnecessary comparisons.',
        examples: ['Preprocess O(m), match O(n)', 'Total O(n+m)']
      },
      {
        title: 'Applications',
        content:
          'Used in text editors, log analysis, compiler tools, security scanning, and bioinformatics.',
        examples: ['Keyword search', 'Signature detection']
      }
    ],
    keyTakeaways: [
      'Pattern matching is core in text processing',
      'BF is simple but can be slow',
      'KMP provides linear-time matching'
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
    console.warn('[PatternMatchingSection] Failed to load content, using fallback.', error);
  }

  return toTemplateContent(fallbackContent);
};

const PatternMatchingSection: React.FC = () => (
  <TheoryTemplate
    structureId={CONTENT_ID}
    structureName={STRUCTURE_NAME}
    chapterNumber={CHAPTER_NUMBER}
    dataLoader={loadContent}
  />
);

export default PatternMatchingSection;
