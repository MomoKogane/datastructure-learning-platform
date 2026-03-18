import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { buildSectionAggregates } from './syncHardcodedContentToMongo';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dslp';

type ChapterRange = {
  start: number;
  end: number;
};

const parseChapterRange = (): ChapterRange => {
  const args = process.argv.slice(2);
  const rangeArg = args.find((item) => item.startsWith('--chapters='));
  const startArg = args.find((item) => item.startsWith('--start='));
  const endArg = args.find((item) => item.startsWith('--end='));

  if (rangeArg) {
    const raw = rangeArg.split('=')[1] ?? '';
    const [rawStart, rawEnd] = raw.split('-');
    const start = Number(rawStart);
    const end = Number(rawEnd);

    if (Number.isFinite(start) && Number.isFinite(end) && start > 0 && end >= start) {
      return { start, end };
    }
  }

  if (startArg || endArg) {
    const start = Number(startArg?.split('=')[1] ?? '1');
    const end = Number(endArg?.split('=')[1] ?? String(start));

    if (Number.isFinite(start) && Number.isFinite(end) && start > 0 && end >= start) {
      return { start, end };
    }
  }

  return { start: 1, end: 3 };
};

const toNumericChapter = (sectionId: string): number => {
  const match = String(sectionId).match(/^(\d+)\./);
  return match ? Number(match[1]) : Number.NaN;
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

const hasNonEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

async function importHardcodedToSplitCollections(): Promise<void> {
  const chapterRange = parseChapterRange();
  const repoRoot = path.join(__dirname, '..', '..', '..');
  const allSections = buildSectionAggregates(repoRoot);

  const sections = allSections.filter((section) => {
    const chapterNum = toNumericChapter(section.sectionId);
    return Number.isFinite(chapterNum) && chapterNum >= chapterRange.start && chapterNum <= chapterRange.end;
  });

  if (sections.length === 0) {
    throw new Error(`No section aggregates matched chapter ${chapterRange.start}~${chapterRange.end}.`);
  }

  await mongoose.connect(mongoUri);
  const dslpDb = mongoose.connection.useDb('dslp', { useCache: true });

  const theoryCollection = dslpDb.collection('theory');
  const visualizationCollection = dslpDb.collection('visualization');
  const examplesCollection = dslpDb.collection('examples');
  const practicesCollection = dslpDb.collection('practices');
  const quizCollection = dslpDb.collection('quiz');

  let theoryCount = 0;
  let visualizationCount = 0;
  let examplesCount = 0;
  let practicesCount = 0;
  let quizCount = 0;

  for (const section of sections) {
    const baseMeta = {
      sectionId: section.sectionId,
      aliases: section.aliases,
      chapterId: section.chapterId,
      chapterTitle: section.chapterTitle,
      sectionTitle: section.sectionTitle,
      templateType: section.templateType,
      updatedAt: new Date()
    };

    const normalizedTheory = normalizeTheoryContent(section.modules.theory);
    const theoryContent = {
      introduction: normalizedTheory.introduction,
      sections: normalizedTheory.sections,
      ...(Array.isArray(normalizedTheory.keyTakeaways) ? { keyTakeaways: normalizedTheory.keyTakeaways } : {})
    };

    await theoryCollection.updateOne(
      { sectionId: section.sectionId },
      {
        $set: {
          ...baseMeta,
          content: theoryContent
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    theoryCount += 1;

    if (section.templateType === 'data-structure') {
      const visualization = section.modules.visualization ?? {};
      const examples = section.modules.examples ?? {};
      const practices = section.modules.practice ?? {};

      if (hasNonEmptyValue(visualization)) {
        await visualizationCollection.updateOne(
          { sectionId: section.sectionId },
          {
            $set: {
              ...baseMeta,
              content: visualization
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          { upsert: true }
        );
        visualizationCount += 1;
      }

      if (hasNonEmptyValue(examples)) {
        await examplesCollection.updateOne(
          { sectionId: section.sectionId },
          {
            $set: {
              ...baseMeta,
              content: examples
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          { upsert: true }
        );
        examplesCount += 1;
      }

      if (hasNonEmptyValue(practices)) {
        await practicesCollection.updateOne(
          { sectionId: section.sectionId },
          {
            $set: {
              ...baseMeta,
              content: practices
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          { upsert: true }
        );
        practicesCount += 1;
      }
    }

    if (section.quizTheory) {
      await quizCollection.updateOne(
        { sectionId: section.sectionId },
        {
          $set: {
            ...baseMeta,
            content: {
              questions: Array.isArray(section.quizTheory.quizQuestions) ? section.quizTheory.quizQuestions : []
            },
            quizTheory: section.quizTheory
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
      quizCount += 1;
    }
  }

  console.log(`[importHardcodedToSplitCollections] chapterRange=${chapterRange.start}-${chapterRange.end}`);
  console.log(`[importHardcodedToSplitCollections] sections=${sections.length}`);
  console.log(`[importHardcodedToSplitCollections] theory=${theoryCount}, visualization=${visualizationCount}, examples=${examplesCount}, practices=${practicesCount}, quiz=${quizCount}`);

  await mongoose.disconnect();
}

importHardcodedToSplitCollections().catch(async (error) => {
  console.error('[importHardcodedToSplitCollections] Failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect failure
  }
  process.exit(1);
});
