import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { buildSectionAggregates, type SectionAggregate } from './syncHardcodedContentToMongo';

dotenv.config();

type SectionTemplateType = 'theory' | 'data-structure';

type UnifiedContentDoc = {
  sectionId: string;
  aliases: string[];
  chapterId?: string;
  chapterTitle?: string;
  sectionTitle?: string;
  templateType: SectionTemplateType;
  content: unknown;
  createdAt: string;
  updatedAt: string;
};

type UnifiedQuizDoc = UnifiedContentDoc & {
  quizTheory?: unknown;
};

type UnifiedSourceFile = {
  meta: {
    schemaVersion: string;
    generatedAt: string;
    source: 'hardcoded-front-back';
    sectionCount: number;
  };
  collections: {
    theory: UnifiedContentDoc[];
    visualization: UnifiedContentDoc[];
    examples: UnifiedContentDoc[];
    practices: UnifiedContentDoc[];
    quiz: UnifiedQuizDoc[];
  };
};

const toNumericChapter = (sectionId: string): number => {
  const match = String(sectionId).match(/^(\d+)\./);
  return match ? Number(match[1]) : Number.NaN;
};

const hasNonEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

const normalizeTheoryContent = (theoryModule: unknown): { introduction: string; sections: unknown[]; keyTakeaways?: unknown[] } => {
  if (!theoryModule || typeof theoryModule !== 'object') {
    return { introduction: '', sections: [] };
  }

  const moduleObj = theoryModule as Record<string, unknown>;
  const introduction = String(moduleObj.introduction ?? moduleObj.overview ?? moduleObj.description ?? '');

  const sections = Array.isArray(moduleObj.sections)
    ? moduleObj.sections
    : (Array.isArray(moduleObj.concepts) ? moduleObj.concepts : []);

  const keyTakeaways = Array.isArray(moduleObj.keyTakeaways)
    ? moduleObj.keyTakeaways
    : undefined;

  return { introduction, sections, keyTakeaways };
};

const toBaseDoc = (section: SectionAggregate, content: unknown): UnifiedContentDoc => {
  const now = new Date().toISOString();
  return {
    sectionId: section.sectionId,
    aliases: section.aliases,
    chapterId: section.chapterId,
    chapterTitle: section.chapterTitle,
    sectionTitle: section.sectionTitle,
    templateType: section.templateType,
    content,
    createdAt: now,
    updatedAt: now
  };
};

const buildSourceData = (sections: SectionAggregate[]): UnifiedSourceFile => {
  const theory: UnifiedContentDoc[] = [];
  const visualization: UnifiedContentDoc[] = [];
  const examples: UnifiedContentDoc[] = [];
  const practices: UnifiedContentDoc[] = [];
  const quiz: UnifiedQuizDoc[] = [];

  for (const section of sections) {
    const normalizedTheory = normalizeTheoryContent(section.modules.theory);

    theory.push(
      toBaseDoc(section, {
        introduction: normalizedTheory.introduction,
        sections: normalizedTheory.sections,
        ...(Array.isArray(normalizedTheory.keyTakeaways) ? { keyTakeaways: normalizedTheory.keyTakeaways } : {})
      })
    );

    if (section.templateType === 'data-structure') {
      const visualizationContent = section.modules.visualization ?? {};
      const examplesContent = section.modules.examples ?? {};
      const practicesContent = section.modules.practice ?? {};

      if (hasNonEmptyValue(visualizationContent)) {
        visualization.push(toBaseDoc(section, visualizationContent));
      }
      if (hasNonEmptyValue(examplesContent)) {
        examples.push(toBaseDoc(section, examplesContent));
      }
      if (hasNonEmptyValue(practicesContent)) {
        practices.push(toBaseDoc(section, practicesContent));
      }
    }

    if (section.quizTheory) {
      const quizQuestions = Array.isArray(section.quizTheory.quizQuestions) ? section.quizTheory.quizQuestions : [];
      quiz.push({
        ...toBaseDoc(section, {
          questions: quizQuestions
        }),
        quizTheory: section.quizTheory
      });
    }
  }

  return {
    meta: {
      schemaVersion: 'dslp-source-v1',
      generatedAt: new Date().toISOString(),
      source: 'hardcoded-front-back',
      sectionCount: sections.length
    },
    collections: {
      theory,
      visualization,
      examples,
      practices,
      quiz
    }
  };
};

const parseOutputPath = (): string | null => {
  const arg = process.argv.slice(2).find((item) => item.startsWith('--output='));
  if (!arg) return null;
  const output = arg.split('=')[1]?.trim();
  return output && output.length > 0 ? output : null;
};

const parseChapterRange = (): { start: number; end: number } | null => {
  const arg = process.argv.slice(2).find((item) => item.startsWith('--chapters='));
  if (!arg) return null;

  const raw = arg.split('=')[1] ?? '';
  const [rawStart, rawEnd] = raw.split('-');
  const start = Number(rawStart);
  const end = Number(rawEnd);

  if (Number.isFinite(start) && Number.isFinite(end) && start > 0 && end >= start) {
    return { start, end };
  }

  return null;
};

async function buildUnifiedHardcodedSource(): Promise<void> {
  const repoRoot = path.join(__dirname, '..', '..', '..');
  const outputPath = parseOutputPath() ?? path.join(repoRoot, 'back', 'data', 'unified-hardcoded-source.json');
  const chapterRange = parseChapterRange();

  const allSections = buildSectionAggregates(repoRoot);
  const sections = chapterRange
    ? allSections.filter((section) => {
      const chapterNum = toNumericChapter(section.sectionId);
      return Number.isFinite(chapterNum) && chapterNum >= chapterRange.start && chapterNum <= chapterRange.end;
    })
    : allSections;

  const source = buildSourceData(sections);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(source, null, 2)}\n`, 'utf-8');

  console.log(`[buildUnifiedHardcodedSource] output=${outputPath}`);
  console.log(`[buildUnifiedHardcodedSource] sections=${source.meta.sectionCount}`);
  console.log(`[buildUnifiedHardcodedSource] theory=${source.collections.theory.length}, visualization=${source.collections.visualization.length}, examples=${source.collections.examples.length}, practices=${source.collections.practices.length}, quiz=${source.collections.quiz.length}`);
}

buildUnifiedHardcodedSource().catch((error) => {
  console.error('[buildUnifiedHardcodedSource] Failed:', error);
  process.exit(1);
});
