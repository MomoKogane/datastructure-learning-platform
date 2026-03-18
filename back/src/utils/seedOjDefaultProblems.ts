import mongoose from 'mongoose';
import dotenv from 'dotenv';
import defaultOjProblemBank, { type DefaultOjProblemPayload } from '../data/defaultOjProblemBank';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dslp';
const dbName = String(process.env.CONTENT_DB_NAME || 'dslp').trim() || 'dslp';

const buildAliases = (sectionId: string): string[] => {
  const aliases = new Set<string>([sectionId]);
  if (sectionId === '1.1') aliases.add('basic-concepts');
  if (sectionId === '1.2') aliases.add('complexity-analysis');
  if (sectionId === '3.1') aliases.add('string-fundamentals');
  if (sectionId === '3.2') aliases.add('pattern-matching');
  if (sectionId === '4.10') aliases.add('heap');
  return Array.from(aliases);
};

async function seedOjDefaultProblems(): Promise<void> {
  await mongoose.connect(mongoUri);
  const dbConnection = mongoose.connection.useDb(dbName, { useCache: true });
  const db = dbConnection.db;

  if (!db) {
    throw new Error('MongoDB database handle is not ready.');
  }

  const collection = db.collection('oj_default_problems');
  const now = new Date().toISOString();
  const entries = Object.entries(defaultOjProblemBank as Record<string, DefaultOjProblemPayload>);

  const operations = entries.map(([sectionId, problem]) => ({
    updateOne: {
      filter: { sectionId },
      update: {
        $set: {
          sectionId,
          aliases: buildAliases(sectionId),
          problem,
          source: 'seed',
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      upsert: true
    }
  }));

  if (operations.length > 0) {
    await collection.bulkWrite(operations, { ordered: false });
  }

  await collection.createIndex({ sectionId: 1 }, { unique: true, name: 'uniq_sectionId' });
  await collection.createIndex({ aliases: 1 }, { name: 'idx_aliases' });

  console.log(`[seedOjDefaultProblems] db=${dbName}`);
  console.log(`[seedOjDefaultProblems] upserted=${operations.length}`);

  await mongoose.disconnect();
}

seedOjDefaultProblems().catch(async (error) => {
  console.error('[seedOjDefaultProblems] Failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
