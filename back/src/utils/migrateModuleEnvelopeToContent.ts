import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dslp';
const targetCollections = ['theory', 'visualization', 'examples', 'practices', 'quiz'] as const;

const hasFlag = (flag: string): boolean => process.argv.slice(2).includes(flag);

async function migrateEnvelopeToContent(): Promise<void> {
  const dryRun = hasFlag('--dry-run');
  await mongoose.connect(mongoUri);

  const connection = mongoose.connection;
  const dslpDb = connection.useDb('dslp', { useCache: true });

  let totalCandidates = 0;
  let totalUpdated = 0;

  for (const name of targetCollections) {
    const collection = dslpDb.collection(name);
    const candidates = await collection.find({
      $or: [
        { content: { $exists: false }, data: { $exists: true } },
        { content: { $exists: false }, module: { $exists: true } }
      ]
    }).toArray();

    totalCandidates += candidates.length;

    let updated = 0;
    for (const doc of candidates) {
      const payload = doc.data !== undefined ? doc.data : doc.module;
      if (payload === undefined) {
        continue;
      }

      if (!dryRun) {
        await collection.updateOne(
          { _id: doc._id },
          {
            $set: { content: payload, updatedAt: new Date() },
            $unset: { data: '', module: '' }
          }
        );
      }

      updated += 1;
    }

    totalUpdated += updated;
    console.log(`[migrateModuleEnvelopeToContent] ${name}: candidates=${candidates.length}, migrated=${updated}, dryRun=${dryRun}`);
  }

  console.log(`[migrateModuleEnvelopeToContent] totalCandidates=${totalCandidates}, totalMigrated=${totalUpdated}, dryRun=${dryRun}`);

  await mongoose.disconnect();
}

migrateEnvelopeToContent().catch(async (error) => {
  console.error('[migrateModuleEnvelopeToContent] Failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect failure
  }
  process.exit(1);
});
