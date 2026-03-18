import React, { useCallback, useEffect, useState } from 'react';
import DataStructureTemplate, {
  type DataStructureContent,
  type ProgrammingLanguage
} from '../../components/Template/DataStructureTemplate';
import SectionVisualizationModule from '../../components/Visualization/SectionVisualizationModule';
//import SectionVisualizationModule from '../../components/Visualization/SectionVisualization';
import { apiService } from '../../services/api';
import { loadThreeLayerExamplesFromApi, normalizeExampleLanguage } from '../../utils/codeExampleLayers';
import { getDataStructureCandidateIds } from '../../config/chapterStructureCandidates';
import {
  buildHardcodedVisualizationModule,
  resolveVisualizationModuleData,
  type VisualizationAlgorithmScript,
  type VisualizationForm,
  type VisualizationModuleData
} from '../../utils/visualizationModuleResolver';
import './TopicSection.css';

type TopicLink = { title: string; url: string; platform: string };

export interface TopicSectionConfig {
  id: string;
  name: string;
  chapterNumber: string;
  overview: string;
  concepts: Array<{ title: string; content: string; examples?: string[] }>;
  complexity: { time: Record<string, string>; space: string };
  operations: Array<{ name: string; description: string; steps: string[]; script?: VisualizationAlgorithmScript }>;
  exercises: Array<{ title: string; difficulty: string; description: string; hints: string[]; solution?: string; solutions?: string }>;
  theoryLinks?: TopicLink[];
  practiceLinks?: TopicLink[];
  practiceSections?: {
    example: { title: string; difficulty: string; description: string; hints: string[]; solution?: string; solutions?: string };
    thinking: Array<{ title: string; difficulty: string; description: string; hints: string[] }>;
    programming: TopicLink[];
  };
  practiceExampleLanguage?: ProgrammingLanguage;
  visualNodes: string[];
  visualCaption: string;
  visualForm?: VisualizationForm;
  visualScript?: Pick<VisualizationAlgorithmScript, 'kind' | 'loop' | 'autoGenerate'>;
  fallbackCodeExamples?: Partial<Record<ProgrammingLanguage, { basic: string; operations: string; advanced: string }>>;
  forceLocalVisualization?: boolean;
}

type PracticeExercise = { title: string; difficulty: string; description: string; hints: string[]; solution?: string; solutions?: string };
type PracticeExample = PracticeExercise & { solutionLanguage?: ProgrammingLanguage };
type PracticeLink = TopicLink;
type PracticeSections = {
  example: PracticeExample;
  thinking: PracticeExercise[];
  programming: PracticeLink[];
};

type ResolvedPracticePayload = {
  sections: PracticeSections;
  theoryLinks: PracticeLink[];
};

const getExamples = (): Record<ProgrammingLanguage, { basic: string; operations: string; advanced: string }> => {
  const placeholderExample = {
    basic: 'This is placeholder text of basic part',
    operations: 'This is placeholder text of operation part',
    advanced: 'This is placeholder text of adnavced part'
  };

  return {
    javascript: { ...placeholderExample },
    typescript: { ...placeholderExample },
    python: { ...placeholderExample },
    java: { ...placeholderExample },
    cpp: { ...placeholderExample },
    c: { ...placeholderExample }
  };
};

const resolveFallbackExamples = (
  fallbackCodeExamples?: Partial<Record<ProgrammingLanguage, { basic: string; operations: string; advanced: string }>>
): Record<ProgrammingLanguage, { basic: string; operations: string; advanced: string }> => {
  const defaults = getExamples();

  return {
    javascript: fallbackCodeExamples?.javascript ?? defaults.javascript,
    typescript: fallbackCodeExamples?.typescript ?? defaults.typescript,
    python: fallbackCodeExamples?.python ?? defaults.python,
    java: fallbackCodeExamples?.java ?? defaults.java,
    cpp: fallbackCodeExamples?.cpp ?? defaults.cpp,
    c: fallbackCodeExamples?.c ?? defaults.c
  };
};

const normalizeDifficulty = (value: unknown): string => {
  if (typeof value !== 'string') {
    return 'Medium';
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'easy' || normalized === 'medium' || normalized === 'hard') {
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  return 'Medium';
};

const normalizeExercise = (item: PracticeExercise): PracticeExercise => {
  const resolvedSolution = typeof item.solution === 'string' && item.solution.trim().length > 0
    ? item.solution
    : (typeof item.solutions === 'string' && item.solutions.trim().length > 0 ? item.solutions : undefined);

  return {
    ...item,
    solution: resolvedSolution,
    solutions: resolvedSolution
  };
};

const normalizeLink = (item: unknown): PracticeLink | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const link = item as { title?: unknown; url?: unknown; platform?: unknown };

  const title = typeof link.title === 'string' ? link.title.trim() : '';
  const url = typeof link.url === 'string' ? link.url.trim() : '';

  if (!title || !url) {
    return null;
  }

  return {
    title,
    url,
    platform: typeof link.platform === 'string' && link.platform.trim().length > 0 ? link.platform : 'LeetCode'
  };
};

const buildPracticeFromBackend = (
  data: unknown,
  fallbackSections: PracticeSections,
  fallbackExampleLanguage: ProgrammingLanguage,
  fallbackTheoryLinks: PracticeLink[]
): ResolvedPracticePayload => {
  const source = (data ?? {}) as {
    practice?: {
      sections?: {
        example?: unknown;
        thinking?: unknown[];
        programming?: unknown[];
        theoryLinks?: unknown[];
      };
      exercises?: unknown[];
      externalLinks?: unknown[];
    };
    exercises?: unknown[];
    practiceLinks?: unknown[];
    theory?: { relatedLinks?: unknown[] };
    theoryLinks?: unknown[];
  };

  const rawPractice = source.practice as unknown;
  const practiceObject = rawPractice && typeof rawPractice === 'object' && !Array.isArray(rawPractice)
    ? (rawPractice as {
      sections?: {
        example?: unknown;
        thinking?: unknown[];
        programming?: unknown[];
        theoryLinks?: unknown[];
      };
      exercises?: unknown[];
      externalLinks?: unknown[];
    })
    : undefined;

  const sourceSections = practiceObject?.sections;

  if (sourceSections && typeof sourceSections === 'object') {
    const sectionExampleRaw = sourceSections.example;
    const sectionExampleCandidate = (sectionExampleRaw ?? {}) as { solutionLanguage?: unknown };
    const sectionExample: PracticeExample = {
      ...normalizeExercise((sectionExampleRaw ?? fallbackSections.example) as PracticeExercise),
      solutionLanguage: (normalizeExampleLanguage(String(sectionExampleCandidate.solutionLanguage ?? '')) as ProgrammingLanguage | null) ?? fallbackExampleLanguage
    };

    const sectionThinking = Array.isArray(sourceSections.thinking)
      ? (sourceSections.thinking.slice(0, 2) as PracticeExercise[])
      : fallbackSections.thinking;

    const sectionProgramming = Array.isArray(sourceSections.programming)
      ? sourceSections.programming.map(normalizeLink).filter((item: PracticeLink | null): item is PracticeLink => item !== null)
      : fallbackSections.programming;

    const sectionTheoryLinks = Array.isArray(sourceSections.theoryLinks)
      ? sourceSections.theoryLinks.map(normalizeLink).filter((item: PracticeLink | null): item is PracticeLink => item !== null)
      : [];

    const practiceLinks = sectionProgramming;
    const theoryLinks = sectionTheoryLinks.length > 0 ? sectionTheoryLinks : fallbackTheoryLinks;

    return {
      sections: {
        example: sectionExample,
        thinking: sectionThinking,
        programming: practiceLinks.slice(0, 3)
      },
      theoryLinks
    };
  }

  const sourceExercises = [
    ...(Array.isArray(rawPractice) ? rawPractice : []),
    ...(Array.isArray(practiceObject?.exercises) ? practiceObject.exercises : []),
    ...(Array.isArray(source.exercises) ? source.exercises : [])
  ];

  const sourcePracticeLinks = [
    ...(Array.isArray(practiceObject?.externalLinks) ? practiceObject.externalLinks : []),
    ...(Array.isArray(source.practiceLinks) ? source.practiceLinks : [])
  ];
  const sourceTheoryLinks = [
    ...(Array.isArray(source.theory?.relatedLinks) ? source.theory.relatedLinks : []),
    ...(Array.isArray(source.theoryLinks) ? source.theoryLinks : [])
  ];

  const exercises = sourceExercises
    .map((item: unknown): PracticeExercise | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const exercise = item as {
        title?: unknown;
        description?: unknown;
        hints?: unknown;
        solution?: unknown;
        solutions?: unknown;
        difficulty?: unknown;
      };

      const title = typeof exercise.title === 'string' ? exercise.title.trim() : '';
      const description = typeof exercise.description === 'string' ? exercise.description.trim() : '';
      const hints = Array.isArray(exercise.hints)
        ? exercise.hints.filter((hint: unknown): hint is string => typeof hint === 'string' && hint.trim().length > 0)
        : [];
      const solution = typeof exercise.solution === 'string' && exercise.solution.trim().length > 0
        ? exercise.solution
        : (typeof exercise.solutions === 'string' && exercise.solutions.trim().length > 0 ? exercise.solutions : undefined);

      if (!title || !description) {
        return null;
      }

      return normalizeExercise({
        title,
        difficulty: normalizeDifficulty(exercise.difficulty),
        description,
        hints,
        solution
      });
    })
    .filter((item: PracticeExercise | null): item is PracticeExercise => item !== null);

  const practiceLinks = sourcePracticeLinks
    .map((item: unknown): PracticeLink | null => normalizeLink(item))
    .filter((item: PracticeLink | null): item is PracticeLink => item !== null);
  const theoryLinks = sourceTheoryLinks
    .map((item: unknown): PracticeLink | null => normalizeLink(item))
    .filter((item: PracticeLink | null): item is PracticeLink => item !== null);
  const resolvedPracticeLinks = practiceLinks;
  const resolvedTheoryLinks = theoryLinks;

  if (exercises.length === 0 && resolvedPracticeLinks.length === 0 && resolvedTheoryLinks.length === 0) {
    return {
      sections: fallbackSections,
      theoryLinks: fallbackTheoryLinks
    };
  }

  const exampleBase = exercises[0] ?? fallbackSections.example;

  return {
    sections: {
      example: {
        ...exampleBase,
        solutionLanguage: fallbackExampleLanguage
      },
      thinking: (exercises.slice(1, 3).length > 0 ? exercises.slice(1, 3) : fallbackSections.thinking),
      programming: (resolvedPracticeLinks.slice(0, 3).length > 0 ? resolvedPracticeLinks.slice(0, 3) : fallbackSections.programming)
    },
    theoryLinks: (resolvedTheoryLinks.length > 0 ? resolvedTheoryLinks : fallbackTheoryLinks)
  };
};

const buildFallbackPracticeSections = (config: TopicSectionConfig): ResolvedPracticePayload => {
  const fallbackExampleLanguage = config.practiceExampleLanguage ?? 'cpp';
  const source = config.practiceSections;
  const explicitTheoryLinks = Array.isArray(config.theoryLinks)
    ? config.theoryLinks.map(normalizeLink).filter((item: PracticeLink | null): item is PracticeLink => item !== null)
    : [];
  const explicitPracticeLinks = Array.isArray(config.practiceLinks)
    ? config.practiceLinks.map(normalizeLink).filter((item: PracticeLink | null): item is PracticeLink => item !== null)
    : [];

  const fallbackTheoryLinks = explicitTheoryLinks;
  const fallbackPracticeLinks = explicitPracticeLinks.slice(0, 3);

  if (source) {
    const sourceProgramming = source.programming.map(normalizeLink).filter((item: PracticeLink | null): item is PracticeLink => item !== null);
    const sourcePracticeLinks = sourceProgramming;

    return {
      sections: {
        example: {
          ...source.example,
          solutionLanguage: fallbackExampleLanguage
        },
        thinking: source.thinking.slice(0, 2),
        programming: (sourcePracticeLinks.length > 0 ? sourcePracticeLinks.slice(0, 3) : fallbackPracticeLinks)
      },
      theoryLinks: fallbackTheoryLinks
    };
  }

  const defaultExample: PracticeExample = {
    ...normalizeExercise(config.exercises[0] ?? {
      title: `${config.name} Example Problem`,
      difficulty: 'Easy',
      description: `Practice one core ${config.name} operation.`,
      hints: ['Clarify input/output', 'Handle edge cases first']
    }),
    solutionLanguage: fallbackExampleLanguage
  };

  return {
    sections: {
      example: defaultExample,
      thinking: config.exercises.slice(1, 3).map(normalizeExercise),
      programming: fallbackPracticeLinks
    },
    theoryLinks: fallbackTheoryLinks
  };
};

export const createTopicSection = (config: TopicSectionConfig): React.FC => {
  const operationsWithVisualScript = config.operations.map((operation) => (
    operation.script
      ? operation
      : {
        ...operation,
        script: config.visualScript
          ? {
            ...config.visualScript,
            frames: []
          }
          : undefined
      }
  ));
  const fallbackExamples = resolveFallbackExamples(config.fallbackCodeExamples);
  const fallbackExampleLanguage = config.practiceExampleLanguage ?? 'cpp';
  const fallbackPracticePayload = buildFallbackPracticeSections(config);
  const candidateIds = getDataStructureCandidateIds(config.id, [config.id]);

  const TopicSection: React.FC = () => {
    const [resolvedExamples, setResolvedExamples] = useState(fallbackExamples);
    const [resolvedVisualization, setResolvedVisualization] = useState<VisualizationModuleData>(
      buildHardcodedVisualizationModule({
        sectionId: config.id,
        sectionName: config.name,
        form: config.visualForm,
        caption: config.visualCaption,
        nodes: config.visualNodes,
        operations: operationsWithVisualScript
      })
    );

    const loadContent = useCallback(async (): Promise<DataStructureContent> => {
      let resolvedPracticeSections: PracticeSections = fallbackPracticePayload.sections;
      let resolvedTheoryLinks: PracticeLink[] = fallbackPracticePayload.theoryLinks;

      try {
        for (const candidateId of candidateIds) {
          try {
            const response = await apiService.getSectionModule(candidateId, 'practice');
            const resolvedPractice = buildPracticeFromBackend(
              { practice: response?.data?.content },
              fallbackPracticePayload.sections,
              fallbackExampleLanguage,
              fallbackPracticePayload.theoryLinks
            );

            resolvedPracticeSections = resolvedPractice.sections;
            resolvedTheoryLinks = resolvedPractice.theoryLinks;
            break;
          } catch {
            // try next candidate id
          }
        }
      } catch (error) {
        console.warn(`[TopicSection] Failed to load practice data for ${config.id}, using fallback practice data.`, error);
      }

      return {
        id: config.id,
        name: config.name,
        theory: {
          overview: config.overview,
          concepts: config.concepts,
          complexity: {
            timeComplexity: config.complexity.time,
            spaceComplexity: config.complexity.space
          },
          relatedLinks: resolvedTheoryLinks
        },
        visualization: {
          operations: resolvedVisualization.operations.length > 0
            ? resolvedVisualization.operations.map((operation) => ({
              name: operation.name,
              description: operation.description,
              steps: operation.steps
            }))
            : operationsWithVisualScript
        },
        examples: {
          javascript: {},
          typescript: {},
          python: {},
          java: {},
          cpp: {},
          c: {}
        },
        practice: {
          exercises: [resolvedPracticeSections.example, ...resolvedPracticeSections.thinking],
          externalLinks: resolvedPracticeSections.programming,
          sections: resolvedPracticeSections
        }
      };
    }, [resolvedVisualization]);

    const VisualizationComponent: React.FC = () => (
      <SectionVisualizationModule data={resolvedVisualization} />
    );

    useEffect(() => {
      let isActive = true;

      const loadDbExamples = async () => {
        try {
          const dbExamples = await loadThreeLayerExamplesFromApi<ProgrammingLanguage>({
            candidateIds,
            fallbackExamples,
            normalizeLanguage: (language) => normalizeExampleLanguage(language) as ProgrammingLanguage | null,
            fetchModuleData: (id) => apiService.getSectionModule(id, 'examples')
          });

          if (isActive) {
            setResolvedExamples(dbExamples);
          }
        } catch (error) {
          console.warn(`[TopicSection] Failed to load code examples for ${config.id}, using fallback examples.`, error);
        }
      };

      loadDbExamples();

      const loadVisualizationData = async () => {
        try {
          const hardcodedSeed = {
            sectionId: config.id,
            sectionName: config.name,
            form: config.visualForm,
            caption: config.visualCaption,
            nodes: config.visualNodes,
            operations: operationsWithVisualScript
          };

          let visualizationData = resolveVisualizationModuleData({
            hardcoded: hardcodedSeed
          });

          if (config.forceLocalVisualization) {
            if (isActive) {
              setResolvedVisualization(visualizationData);
            }
            return;
          }

          for (const candidateId of candidateIds) {
            try {
              const response = await apiService.getSectionModule(candidateId, 'visualization');
              if (!response.success || !response.data) {
                continue;
              }

              const resolved = resolveVisualizationModuleData({
                hardcoded: hardcodedSeed,
                databaseContent: response.data.content,
                databaseSectionId: candidateId
              });

              if (resolved.source === 'database') {
                visualizationData = resolved;
                break;
              }
            } catch {
              // try next candidate id
            }
          }

          if (isActive) {
            setResolvedVisualization(visualizationData);
          }
        } catch (error) {
          console.warn(`[TopicSection] Failed to resolve visualization data for ${config.id}.`, error);
        }
      };

      loadVisualizationData();

      return () => {
        isActive = false;
      };
    }, []);

    return (
      <DataStructureTemplate
        structureId={config.id}
        structureName={config.name}
        chapterNumber={config.chapterNumber}
        dataLoader={loadContent}
        VisualizationComponent={VisualizationComponent}
        hideDefaultVisualizationSteps
        codeExamples={resolvedExamples}
      />
    );
  };

  return TopicSection;
};
