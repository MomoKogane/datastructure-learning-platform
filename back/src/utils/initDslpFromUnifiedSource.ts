import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

type UnifiedContentDoc = {
  sectionId: string;
  aliases?: string[];
  chapterId?: string;
  chapterTitle?: string;
  sectionTitle?: string;
  templateType?: 'theory' | 'data-structure';
  content: unknown;
  createdAt?: string;
  updatedAt?: string;
};

type UnifiedQuizDoc = UnifiedContentDoc & {
  quizTheory?: unknown;
};

type UnifiedSourceFile = {
  meta?: {
    schemaVersion?: string;
    generatedAt?: string;
    source?: string;
    sectionCount?: number;
  };
  collections: {
    theory: UnifiedContentDoc[];
    visualization: UnifiedContentDoc[];
    examples: UnifiedContentDoc[];
    practices: UnifiedContentDoc[];
    quiz: UnifiedQuizDoc[];
  };
};

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dslp';

const parseArgValue = (key: string): string | null => {
  const hit = process.argv.slice(2).find((item) => item.startsWith(`--${key}=`));
  if (!hit) return null;
  const value = hit.split('=')[1]?.trim();
  return value && value.length > 0 ? value : null;
};

const parseMode = (): 'replace' | 'upsert' => {
  const mode = parseArgValue('mode');
  return mode === 'upsert' ? 'upsert' : 'replace';
};

const resolveSourcePath = (): string => {
  const specified = parseArgValue('source');
  if (specified) {
    return path.isAbsolute(specified) ? specified : path.resolve(process.cwd(), specified);
  }

  const repoRoot = path.join(__dirname, '..', '..', '..');
  return path.join(repoRoot, 'back', 'data', 'unified-hardcoded-source.json');
};

const resolveDbName = (): string => parseArgValue('db') ?? 'dslp';

const readSourceFile = (sourcePath: string): UnifiedSourceFile => {
  const raw = fs.readFileSync(sourcePath, 'utf-8');
  const parsed = JSON.parse(raw) as UnifiedSourceFile;

  if (!parsed || !parsed.collections) {
    throw new Error('Invalid source file: missing collections.');
  }

  return parsed;
};

const ensureCollections = async (db: mongoose.mongo.Db, names: string[]): Promise<void> => {
  const existing = await db.listCollections({}, { nameOnly: true }).toArray();
  const existingSet = new Set(existing.map((item) => item.name));

  for (const name of names) {
    if (!existingSet.has(name)) {
      await db.createCollection(name);
      console.log(`[initDslpFromUnifiedSource] created collection: ${name}`);
    }
  }
};

const upsertBySectionId = async (
  db: mongoose.mongo.Db,
  collectionName: string,
  docs: UnifiedContentDoc[]
): Promise<number> => {
  if (docs.length === 0) return 0;

  const collection = db.collection(collectionName);
  const operations = docs.map((doc) => ({
    updateOne: {
      filter: { sectionId: doc.sectionId },
      update: {
        $set: {
          ...doc,
          updatedAt: new Date().toISOString()
        },
        $setOnInsert: {
          createdAt: doc.createdAt ?? new Date().toISOString()
        }
      },
      upsert: true
    }
  }));

  const result = await collection.bulkWrite(operations, { ordered: false });
  return (result.upsertedCount ?? 0) + (result.modifiedCount ?? 0);
};

const replaceCollection = async (
  db: mongoose.mongo.Db,
  collectionName: string,
  docs: UnifiedContentDoc[]
): Promise<number> => {
  const collection = db.collection(collectionName);
  await collection.deleteMany({});

  if (docs.length > 0) {
    await collection.insertMany(docs);
  }

  return docs.length;
};

const ensureIndexes = async (db: mongoose.mongo.Db): Promise<void> => {
  for (const name of ['theory', 'visualization', 'examples', 'practices', 'quiz']) {
    const collection = db.collection(name);

    try {
      await collection.createIndex({ sectionId: 1 }, { unique: true, name: 'uniq_sectionId' });
    } catch (error) {
      const mongoError = error as { code?: number; message?: string };
      if (mongoError.code !== 85) {
        throw error;
      }
      console.warn(`[initDslpFromUnifiedSource] ${name}: skip sectionId index conflict (${mongoError.message ?? 'code=85'}).`);
    }

    try {
      await collection.createIndex({ aliases: 1 }, { name: 'idx_aliases' });
    } catch (error) {
      const mongoError = error as { code?: number; message?: string };
      if (mongoError.code !== 85) {
        throw error;
      }
      console.warn(`[initDslpFromUnifiedSource] ${name}: skip aliases index conflict (${mongoError.message ?? 'code=85'}).`);
    }
  }
};

async function initDslpFromUnifiedSource(): Promise<void> {
  const sourcePath = resolveSourcePath();
  const dbName = resolveDbName();
  const mode = parseMode();
  const source = readSourceFile(sourcePath);

  await mongoose.connect(mongoUri);
  const dbConnection = mongoose.connection.useDb(dbName, { useCache: true });
  const db = dbConnection.db;

  if (!db) {
    throw new Error('MongoDB database handle is not ready.');
  }

  await ensureCollections(db, ['theory', 'visualization', 'examples', 'practices', 'quiz']);

  const collectionMap: Array<{ name: 'theory' | 'visualization' | 'examples' | 'practices' | 'quiz'; docs: UnifiedContentDoc[] }> = [
    { name: 'theory', docs: source.collections.theory },
    { name: 'visualization', docs: source.collections.visualization },
    { name: 'examples', docs: source.collections.examples },
    { name: 'practices', docs: source.collections.practices },
    { name: 'quiz', docs: source.collections.quiz }
  ];

  for (const entry of collectionMap) {
    const affected = mode === 'replace'
      ? await replaceCollection(db, entry.name, entry.docs)
      : await upsertBySectionId(db, entry.name, entry.docs);

    console.log(`[initDslpFromUnifiedSource] ${entry.name}: mode=${mode}, docs=${entry.docs.length}, affected=${affected}`);
  }

  await ensureIndexes(db);

  console.log(`[initDslpFromUnifiedSource] source=${sourcePath}`);
  console.log(`[initDslpFromUnifiedSource] db=${dbName}`);
  console.log(`[initDslpFromUnifiedSource] completed.`);

  await mongoose.disconnect();
}

initDslpFromUnifiedSource().catch(async (error) => {
  console.error('[initDslpFromUnifiedSource] Failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect failure
  }
  process.exit(1);
});
