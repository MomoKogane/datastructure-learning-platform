import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dslp';
const targetCollections = ['theory', 'visualization', 'examples', 'practices', 'quiz'] as const;

async function validateModuleEnvelope(): Promise<void> {
  await mongoose.connect(mongoUri);

  const connection = mongoose.connection;
  const dslpDb = connection.useDb('dslp', { useCache: true });

  let violations = 0;

  for (const name of targetCollections) {
    const collection = dslpDb.collection(name);

    const missingContentDocs = await collection.find({ content: { $exists: false } }).limit(50).toArray();
    const legacyEnvelopeDocs = await collection.find({
      $or: [
        { data: { $exists: true } },
        { module: { $exists: true } }
      ]
    }).limit(50).toArray();

    const missingContentCount = await collection.countDocuments({ content: { $exists: false } });
    const legacyEnvelopeCount = await collection.countDocuments({
      $or: [
        { data: { $exists: true } },
        { module: { $exists: true } }
      ]
    });

    const collectionViolations = missingContentCount + legacyEnvelopeCount;
    violations += collectionViolations;

    console.log(`[validateModuleEnvelope] ${name}: missingContent=${missingContentCount}, legacyEnvelope=${legacyEnvelopeCount}`);

    if (missingContentDocs.length > 0) {
      const ids = missingContentDocs.slice(0, 10).map((doc) => String(doc.sectionId ?? doc.id ?? doc._id));
      console.log(`[validateModuleEnvelope] ${name} sample missingContent IDs: ${ids.join(', ')}`);
    }

    if (legacyEnvelopeDocs.length > 0) {
      const ids = legacyEnvelopeDocs.slice(0, 10).map((doc) => String(doc.sectionId ?? doc.id ?? doc._id));
      console.log(`[validateModuleEnvelope] ${name} sample legacyEnvelope IDs: ${ids.join(', ')}`);
    }
  }

  await mongoose.disconnect();

  if (violations > 0) {
    console.error(`[validateModuleEnvelope] FAILED: violations=${violations}`);
    process.exit(1);
  }

  console.log('[validateModuleEnvelope] PASSED: all target collections use content envelope only.');
}

validateModuleEnvelope().catch(async (error) => {
  console.error('[validateModuleEnvelope] Failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect failure
  }
  process.exit(1);
});
