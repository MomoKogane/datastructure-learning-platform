// Custom hook for managing course catalog data
import { useCourseCatalog, useOnlineStatus } from './useApi';
import { useLearningStore } from '../store/learningStore';
import { catalogData as fallbackCatalogData } from '../data/catalog';
import { isLocalContentFallbackEnabled } from '../config/contentSource';

// Local fallback data - keep same chapter/section shape as catalog page
const localCatalogData = fallbackCatalogData;

type CatalogSectionLike = {
  id: string;
  title: string;
  description?: string;
};

type CatalogChapterLike = {
  id: string;
  sections?: CatalogSectionLike[];
};

type DisplayCard = {
  id: string;
  name: string;
  description?: string;
  category: string;
  difficulty: string;
  sections: never[];
  introduction: null;
  isLocalData: boolean;
  isTheoryTemplate: boolean;
  chapterId: string;
  sectionId: string;
};

export const useCourseCatalogManager = () => {
  const isOnline = useOnlineStatus();
  const { data: apiData, loading, error, refetch } = useCourseCatalog();
  const fallbackEnabled = isLocalContentFallbackEnabled();
  
  const {
    useApiData,
    setUseApiData
  } = useLearningStore();

  // Determine which data to use
  const catalogData = useApiData && apiData
    ? apiData
    : (fallbackEnabled ? localCatalogData : []);

  // Transform catalog data into display cards format
  const getDisplayCards = () => {
    if (!catalogData) return [];
    
    if (useApiData && apiData) {
      // API data - flatten sections from all chapters into individual cards
      const sectionCards: DisplayCard[] = [];
      
      (catalogData as CatalogChapterLike[]).forEach((chapter) => {
        if (chapter.sections && chapter.sections.length > 0) {
          chapter.sections.forEach((section) => {
            sectionCards.push({
              id: section.id,
              name: stripSectionTitlePrefix(section.title),
              description: section.description,
              category: getCategoryFromSection(section.id),
              difficulty: getDifficultyFromSection(section.id),
              sections: [], // Sections are now individual cards
              introduction: null,
              isLocalData: false,
              isTheoryTemplate: isTheoryTemplateSection(section.id),
              chapterId: chapter.id,
              sectionId: section.id
            });
          });
        }
      });
      
      return sectionCards;
    } else if (fallbackEnabled) {
      // Local data - use same flattened section-card format as API mode
      const sectionCards: DisplayCard[] = [];

      (catalogData as CatalogChapterLike[]).forEach((chapter) => {
        if (chapter.sections && chapter.sections.length > 0) {
          chapter.sections.forEach((section) => {
            sectionCards.push({
              id: section.id,
              name: stripSectionTitlePrefix(section.title),
              description: section.description,
              category: getCategoryFromSection(section.id),
              difficulty: getDifficultyFromSection(section.id),
              sections: [],
              introduction: null,
              isLocalData: true,
              isTheoryTemplate: isTheoryTemplateSection(section.id),
              chapterId: chapter.id,
              sectionId: section.id
            });
          });
        }
      });

      return sectionCards;
    }

    return [];
  };

  return {
    catalogData,
    displayCards: getDisplayCards(),
    loading,
    error,
    refetch,
    useApiData,
    setUseApiData,
    isOnline
  };
};

const stripSectionTitlePrefix = (title: string): string => {
  if (typeof title !== 'string') {
    return '';
  }

  return title.replace(/^\s*\d+(?:\.\d+)*\.?\s*/, '').trim();
};

const theoryTemplateSectionIds = new Set([
  '1.1',
  '1.2',
  '3.1',
  '3.2',
  '6',
  '7',
  '7.11',
  'basic-concepts',
  'complexity-analysis',
  'string-basics',
  'string-fundamentals',
  'pattern-matching',
  'sorting-analysis'
]);

const isTheoryTemplateSection = (sectionId: string): boolean => {
  if (!sectionId) {
    return false;
  }

  return theoryTemplateSectionIds.has(sectionId);
};

// Helper functions for sections
const getDifficultyFromSection = (sectionId: string): string => {
  // Basic concepts and complexity analysis
  if (sectionId.includes('basic-concepts') || sectionId.includes('complexity-analysis')) {
    return 'beginner';
  }
  
  // Arrays, linked lists, simple sorts, basic operations
  if (sectionId.includes('arrays') || sectionId.includes('linked-lists') || 
      sectionId.includes('stacks') || sectionId.includes('queues') ||
      sectionId.includes('linear-search') || sectionId.includes('simple-sorts')) {
    return 'beginner';
  }
  
  // Strings, binary trees, binary search, advanced sorts
  if (sectionId.includes('string') || sectionId.includes('binary-trees') ||
      sectionId.includes('binary-search') || sectionId.includes('advanced-sorts') ||
      sectionId.includes('tree-basics')) {
    return 'intermediate';
  }
  
  // Graphs, advanced algorithms, complex structures
  if (sectionId.includes('graph') || sectionId.includes('hash-tables') ||
      sectionId.includes('search-trees') || sectionId.includes('shortest-paths') ||
      sectionId.includes('spanning-trees') || sectionId.includes('special-sorts') ||
      sectionId.includes('advanced-search')) {
    return 'advanced';
  }
  
  return 'intermediate';
};

const getCategoryFromSection = (sectionId: string): string => {
  // Theory sections
  if (sectionId.includes('basic-concepts') || sectionId.includes('complexity-analysis') ||
      sectionId.includes('fundamentals') || sectionId.includes('analysis')) {
    return 'theory';
  }
  
  // Linear structures
  if (sectionId.includes('arrays') || sectionId.includes('linked-lists') ||
      sectionId.includes('stacks') || sectionId.includes('queues') ||
      sectionId.includes('string')) {
    return 'linear';
  }
  
  // Tree structures
  if (sectionId.includes('tree') || sectionId.includes('binary-trees') ||
      sectionId.includes('search-trees') || sectionId.includes('huffman') ||
      sectionId.includes('heap')) {
    return 'tree';
  }
  
  // Graph structures
  if (sectionId.includes('graph') || sectionId.includes('traversal') ||
      sectionId.includes('shortest-paths') || sectionId.includes('spanning-trees')) {
    return 'graph';
  }
  
  // Algorithm sections
  if (sectionId.includes('search') || sectionId.includes('sort') ||
      sectionId.includes('hash') || sectionId.includes('pattern-matching')) {
    return 'algorithm';
  }
  
  return 'theory';
};

