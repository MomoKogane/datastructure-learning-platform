import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { EJSON } from 'bson';

dotenv.config();

type CliOptions = {
  outPath?: string;
  dbName?: string;
  collections?: string[];
  batchSize: number;
  dropTarget: boolean;
};

type CollectionCreateOptions = {
  validator?: unknown;
  validationLevel?: 'off' | 'strict' | 'moderate';
  validationAction?: 'error' | 'warn';
  capped?: boolean;
  size?: number;
  max?: number;
  collation?: Record<string, unknown>;
  timeseries?: Record<string, unknown>;
  expireAfterSeconds?: number;
  clusteredIndex?: Record<string, unknown>;
  changeStreamPreAndPostImages?: Record<string, unknown>;
};

const DEFAULT_BATCH_SIZE = 500;

const printHelp = (): void => {
  console.log('Usage: ts-node src/utils/exportMongoSnapshotScript.ts [options]');
  console.log('');
  console.log('Options:');
  console.log('  --out=<path>              Output mongosh script path');
  console.log('  --db=<name>               Override database name (default from env/uri)');
  console.log('  --collections=a,b,c       Export only specific collections');
  console.log(`  --batchSize=<number>      Insert batch size in generated script (default ${DEFAULT_BATCH_SIZE})`);
  console.log('  --dropTarget=true|false   Drop target collection before import (default true)');
  console.log('  --help                    Show help');
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }
  return fallback;
};

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const options: CliOptions = {
    batchSize: DEFAULT_BATCH_SIZE,
    dropTarget: true
  };

  for (const arg of args) {
    if (arg.startsWith('--out=')) {
      options.outPath = arg.slice('--out='.length).trim();
      continue;
    }

    if (arg.startsWith('--db=')) {
      options.dbName = arg.slice('--db='.length).trim();
      continue;
    }

    if (arg.startsWith('--collections=')) {
      const raw = arg.slice('--collections='.length);
      const list = raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      options.collections = list.length > 0 ? list : undefined;
      continue;
    }

    if (arg.startsWith('--batchSize=')) {
      const raw = Number(arg.slice('--batchSize='.length));
      if (Number.isFinite(raw) && raw > 0) {
        options.batchSize = Math.floor(raw);
      }
      continue;
    }

    if (arg.startsWith('--dropTarget=')) {
      options.dropTarget = parseBoolean(arg.slice('--dropTarget='.length), true);
    }
  }

  return options;
};

const resolveDbNameFromUri = (uri: string): string => {
  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname.replace(/^\//, '').trim();
    return pathname || 'dslp';
  } catch {
    return 'dslp';
  }
};

const toLiteralEjson = (value: unknown): string => {
  return JSON.stringify(EJSON.stringify(value, { relaxed: false }));
};

const sanitizeCollectionOptions = (options: Record<string, unknown> | undefined): CollectionCreateOptions => {
  if (!options) {
    return {};
  }

  const allowedKeys: Array<keyof CollectionCreateOptions> = [
    'validator',
    'validationLevel',
    'validationAction',
    'capped',
    'size',
    'max',
    'collation',
    'timeseries',
    'expireAfterSeconds',
    'clusteredIndex',
    'changeStreamPreAndPostImages'
  ];

  const result: CollectionCreateOptions = {};
  for (const key of allowedKeys) {
    const value = options[key];
    if (value !== undefined) {
      result[key] = value as never;
    }
  }

  return result;
};

const sanitizeIndexOptions = (index: Record<string, unknown>): Record<string, unknown> => {
  const allowedKeys = new Set<string>([
    'name',
    'unique',
    'sparse',
    'expireAfterSeconds',
    'partialFilterExpression',
    'collation',
    'weights',
    'default_language',
    'language_override',
    'textIndexVersion',
    '2dsphereIndexVersion',
    'bits',
    'min',
    'max',
    'bucketSize',
    'wildcardProjection',
    'hidden'
  ]);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(index)) {
    if (allowedKeys.has(key) && value !== undefined) {
      result[key] = value;
    }
  }

  return result;
};

async function exportMongoSnapshot(): Promise<void> {
  const options = parseArgs();
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dslp';
  const dbName = (options.dbName || process.env.CONTENT_DB_NAME || resolveDbNameFromUri(mongoUri)).trim() || 'dslp';
  const selectedCollections = options.collections ? new Set(options.collections) : null;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultOut = path.resolve(process.cwd(), 'exports', `mongo-snapshot-${dbName}-${timestamp}.mongosh.js`);
  const outputPath = path.resolve(process.cwd(), options.outPath || defaultOut);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  await mongoose.connect(mongoUri);

  const dbConnection = mongoose.connection.useDb(dbName, { useCache: true });
  const db = dbConnection.db;

  if (!db) {
    throw new Error('MongoDB database handle is not ready.');
  }

  const allCollections = await db.listCollections({}, { nameOnly: false }).toArray();
  const collections = allCollections
    .filter((item) => item.type === 'collection' && !item.name.startsWith('system.'))
    .filter((item) => (selectedCollections ? selectedCollections.has(item.name) : true));

  const stream = fs.createWriteStream(outputPath, { encoding: 'utf8' });

  const writeLine = (line = ''): void => {
    stream.write(`${line}\n`);
  };

  writeLine('// Auto-generated by exportMongoSnapshotScript.ts');
  writeLine(`// Generated at: ${new Date().toISOString()}`);
  writeLine(`// Source URI: ${mongoUri}`);
  writeLine(`// Source DB: ${dbName}`);
  writeLine(`// Collections: ${collections.length}`);
  writeLine('');
  writeLine(`const __snapshot = ${toLiteralEjson({ database: dbName, generatedAt: new Date().toISOString(), dropTarget: options.dropTarget })};`);
  writeLine('const __meta = EJSON.parse(__snapshot);');
  writeLine('const __db = db.getSiblingDB(__meta.database);');
  writeLine('print(`[restore] DB=${__meta.database}`);');
  writeLine('print(`[restore] GeneratedAt=${__meta.generatedAt}`);');
  writeLine('');
  writeLine('function __ensureCollection(name, options) {');
  writeLine('  const exists = __db.getCollectionInfos({ name }).length > 0;');
  writeLine('  if (!exists) {');
  writeLine('    __db.createCollection(name, options || {});');
  writeLine('  }');
  writeLine('}');
  writeLine('');
  writeLine('function __ensureIndexes(coll, indexes) {');
  writeLine('  const existing = new Set(coll.getIndexes().map((item) => item.name));');
  writeLine('  for (const index of indexes) {');
  writeLine('    if (!index || index.name === "_id_" || existing.has(index.name)) continue;');
  writeLine('    coll.createIndex(index.key, index.options || {});');
  writeLine('  }');
  writeLine('}');
  writeLine('');

  for (const collectionInfo of collections) {
    const collectionName = collectionInfo.name;
    const collection = db.collection(collectionName);
    const collectionOptions = sanitizeCollectionOptions((collectionInfo.options || {}) as Record<string, unknown>);
    const indexesRaw = await collection.indexes();
    const indexes = indexesRaw
      .filter((index) => index.name !== '_id_')
      .map((index) => ({
        name: index.name,
        key: index.key,
        options: sanitizeIndexOptions(index as Record<string, unknown>)
      }));

    writeLine(`print('\\n[restore] collection=${collectionName}');`);
    writeLine(`(function __restore_${collectionName.replace(/[^A-Za-z0-9_]/g, '_')}() {`);
    writeLine(`  const __name = ${JSON.stringify(collectionName)};`);
    writeLine(`  const __opts = EJSON.parse(${toLiteralEjson(collectionOptions)});`);
    writeLine('  __ensureCollection(__name, __opts);');
    writeLine('  const __coll = __db.getCollection(__name);');
    writeLine('  if (__meta.dropTarget) { __coll.deleteMany({}); }');

    const cursor = collection.find({});
    let chunk: unknown[] = [];
    let chunkIndex = 0;
    let totalDocs = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) {
        continue;
      }

      chunk.push(doc);

      if (chunk.length >= options.batchSize) {
        const chunkLiteral = toLiteralEjson(chunk);
        writeLine(`  const __docs_${chunkIndex} = EJSON.parse(${chunkLiteral});`);
        writeLine(`  if (__docs_${chunkIndex}.length) __coll.insertMany(__docs_${chunkIndex}, { ordered: false });`);
        totalDocs += chunk.length;
        chunk = [];
        chunkIndex += 1;
      }
    }

    if (chunk.length > 0) {
      const chunkLiteral = toLiteralEjson(chunk);
      writeLine(`  const __docs_${chunkIndex} = EJSON.parse(${chunkLiteral});`);
      writeLine(`  if (__docs_${chunkIndex}.length) __coll.insertMany(__docs_${chunkIndex}, { ordered: false });`);
      totalDocs += chunk.length;
    }

    writeLine(`  const __indexes = EJSON.parse(${toLiteralEjson(indexes)});`);
    writeLine('  __ensureIndexes(__coll, __indexes);');
    writeLine(`  print('[restore] collection=' + __name + ' docs=${totalDocs} indexes=' + __indexes.length);`);
    writeLine('})();');
    writeLine('');
  }

  writeLine("print('\\n[restore] Done.');");

  await new Promise<void>((resolve, reject) => {
    stream.end(() => resolve());
    stream.on('error', reject);
  });

  console.log(`[exportMongoSnapshot] DB=${dbName}`);
  console.log(`[exportMongoSnapshot] Collections=${collections.length}`);
  console.log(`[exportMongoSnapshot] Output=${outputPath}`);

  await mongoose.disconnect();
}

exportMongoSnapshot().catch(async (error) => {
  console.error('[exportMongoSnapshot] Failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
