import mongoose from 'mongoose';
 

export type SectionTemplateType = 'theory' | 'data-structure';
export type SectionModuleName = 'theory' | 'visualization' | 'examples' | 'practice' | 'keyTakeaways';

type SectionModules = Partial<Record<SectionModuleName, unknown>>;

export interface ResolvedSectionContent {
  sectionId: string;
  templateType: SectionTemplateType;
  modules: SectionModules;
  quizSource: 'theory';
}

const CONTENT_SOURCE_MODE = String(process.env.CONTENT_SOURCE_MODE || 'hybrid').trim().toLowerCase();

type ResolverSource = 'split-collections' | 'none';

const resolverStats: Record<ResolverSource, number> = {
  'split-collections': 0,
  none: 0
};

const trackResolverSource = (source: ResolverSource, sectionId: string): void => {
  resolverStats[source] += 1;

  if (source === 'split-collections') {
    return;
  }

  console.warn(
    `[sectionContentResolver] fallback source='${source}' section='${sectionId}' mode='${CONTENT_SOURCE_MODE}' stats=${JSON.stringify(resolverStats)}`
  );
};

export const getSectionContentResolverStats = (): Record<ResolverSource, number> => ({
  'split-collections': resolverStats['split-collections'],
  none: resolverStats.none
});

const legacyTheoryIdMap: Record<string, string> = {
  'basic-concepts': '1.1',
  '1.1-basic-concepts': '1.1',
  'complexity-analysis': '1.2',
  arrays: '2.1',
  '2.1-arrays': '2.1',
  'linked-lists': '2.2',
  '2.2-linked-lists': '2.2',
  'string-fundamentals': '3.1',
  '3.1-string-fundamentals': '3.1',
  'pattern-matching': '3.2',
  'pattern-matching-overview': '3.2',
  heap: '4.10',
  '4.10-heap': '4.10'
};

const normalizeSectionId = (sectionId: string): string => legacyTheoryIdMap[sectionId] ?? sectionId;

type SplitCollectionDoc = {
  sectionId?: string;
  id?: string;
  aliases?: string[];
  templateType?: SectionTemplateType;
  content?: unknown;
  data?: unknown;
  module?: unknown;
  theory?: unknown;
  keyTakeaways?: unknown;
  quizTheory?: {
    keyTakeaways?: unknown;
  };
};

const warnLegacyEnvelope = (collectionName: string, requestSectionId: string, doc: SplitCollectionDoc | null): void => {
  if (!doc || doc.content !== undefined) {
    return;
  }

  if (doc.data !== undefined) {
    console.warn(`[sectionContentResolver] Legacy envelope 'data' detected in dslp.${collectionName} for section '${requestSectionId}'. Please migrate to 'content'.`);
    return;
  }

  if (doc.module !== undefined) {
    console.warn(`[sectionContentResolver] Legacy envelope 'module' detected in dslp.${collectionName} for section '${requestSectionId}'. Please migrate to 'content'.`);
  }
};

const extractModulePayload = (doc: SplitCollectionDoc | null | undefined, moduleName: SectionModuleName): unknown => {
  if (!doc) {
    return undefined;
  }

  if (doc.content !== undefined) {
    return doc.content;
  }

  if (doc.data !== undefined) {
    return doc.data;
  }

  if (doc.module !== undefined) {
    return doc.module;
  }

  if (moduleName === 'theory') {
    if (doc.theory !== undefined) {
      return doc.theory;
    }

    const hasTheoryShape = Object.prototype.hasOwnProperty.call(doc, 'introduction')
      || Object.prototype.hasOwnProperty.call(doc, 'sections');

    if (hasTheoryShape) {
      return {
        introduction: String((doc as Record<string, unknown>).introduction ?? ''),
        sections: Array.isArray((doc as Record<string, unknown>).sections)
          ? (doc as Record<string, unknown>).sections
          : []
      };
    }
  }

  if (moduleName === 'keyTakeaways') {
    if (doc.keyTakeaways !== undefined) {
      return Array.isArray(doc.keyTakeaways) ? doc.keyTakeaways : [];
    }

    const theoryPayload = extractModulePayload(doc, 'theory') as Record<string, unknown> | undefined;
    if (theoryPayload && Array.isArray(theoryPayload.keyTakeaways)) {
      return theoryPayload.keyTakeaways;
    }

    if (doc.quizTheory && Array.isArray(doc.quizTheory.keyTakeaways)) {
      return doc.quizTheory.keyTakeaways;
    }
  }

  return undefined;
};

const resolveFromSplitCollections = async (sectionId: string): Promise<ResolvedSectionContent | null> => {
  const connection = mongoose.connection;
  if (!connection.readyState) {
    return null;
  }

  const dslpDb = connection.useDb('dslp', { useCache: true });
  const normalizedId = normalizeSectionId(sectionId);
  const candidateIds = Array.from(new Set([
    sectionId,
    normalizedId,
    sectionId.replace(/-/g, ''),
    normalizedId.replace(/-/g, '')
  ]));

  const query = {
    $or: [
      { sectionId: { $in: candidateIds } },
      { id: { $in: candidateIds } },
      { aliases: { $in: candidateIds } }
    ]
  };

  const [theoryDoc, visualizationDoc, examplesDoc, practicesDoc, quizDoc] = await Promise.all([
    dslpDb.collection('theory').findOne(query) as Promise<SplitCollectionDoc | null>,
    dslpDb.collection('visualization').findOne(query) as Promise<SplitCollectionDoc | null>,
    dslpDb.collection('examples').findOne(query) as Promise<SplitCollectionDoc | null>,
    dslpDb.collection('practices').findOne(query) as Promise<SplitCollectionDoc | null>,
    dslpDb.collection('quiz').findOne(query) as Promise<SplitCollectionDoc | null>
  ]);

  warnLegacyEnvelope('theory', sectionId, theoryDoc);
  warnLegacyEnvelope('visualization', sectionId, visualizationDoc);
  warnLegacyEnvelope('examples', sectionId, examplesDoc);
  warnLegacyEnvelope('practices', sectionId, practicesDoc);
  warnLegacyEnvelope('quiz', sectionId, quizDoc);

  const hasAnySplitDoc = Boolean(theoryDoc || visualizationDoc || examplesDoc || practicesDoc || quizDoc);
  if (!hasAnySplitDoc) {
    return null;
  }

  const resolvedSectionId = String(
    theoryDoc?.sectionId
    ?? visualizationDoc?.sectionId
    ?? examplesDoc?.sectionId
    ?? practicesDoc?.sectionId
    ?? quizDoc?.sectionId
    ?? theoryDoc?.id
    ?? visualizationDoc?.id
    ?? examplesDoc?.id
    ?? practicesDoc?.id
    ?? quizDoc?.id
    ?? normalizedId
  );

  const theoryModule = extractModulePayload(theoryDoc, 'theory');
  const visualizationModule = extractModulePayload(visualizationDoc, 'visualization');
  const examplesModule = extractModulePayload(examplesDoc, 'examples');
  const practiceModule = extractModulePayload(practicesDoc, 'practice');
  const keyTakeawaysFromTheory = extractModulePayload(theoryDoc, 'keyTakeaways');
  const keyTakeawaysFromQuiz = extractModulePayload(quizDoc, 'keyTakeaways');
  const keyTakeawaysModule = keyTakeawaysFromTheory ?? keyTakeawaysFromQuiz;

  const modules: SectionModules = {};
  if (theoryModule !== undefined) {
    modules.theory = theoryModule;
  }
  if (visualizationModule !== undefined) {
    modules.visualization = visualizationModule;
  }
  if (examplesModule !== undefined) {
    modules.examples = examplesModule;
  }
  if (practiceModule !== undefined) {
    modules.practice = practiceModule;
  }
  if (keyTakeawaysModule !== undefined) {
    modules.keyTakeaways = keyTakeawaysModule;
  }

  const declaredTemplate = theoryDoc?.templateType
    ?? visualizationDoc?.templateType
    ?? examplesDoc?.templateType
    ?? practicesDoc?.templateType
    ?? quizDoc?.templateType;

  const hasDataStructureModules = Boolean(
    modules.visualization !== undefined
    || modules.examples !== undefined
    || modules.practice !== undefined
  );

  const templateType: SectionTemplateType = declaredTemplate
    ? (declaredTemplate === 'theory' ? 'theory' : 'data-structure')
    : (hasDataStructureModules ? 'data-structure' : 'theory');

  return {
    sectionId: resolvedSectionId,
    templateType,
    quizSource: 'theory',
    modules
  };
};

export const getAllowedModulesByTemplate = (templateType: SectionTemplateType): SectionModuleName[] => {
  if (templateType === 'theory') {
    return ['theory', 'keyTakeaways'];
  }

  return ['theory', 'visualization', 'examples', 'practice'];
};

export const normalizeModuleName = (moduleName: string): SectionModuleName | null => {
  const normalized = moduleName.trim().toLowerCase();

  switch (normalized) {
    case 'theory':
      return 'theory';
    case 'visualization':
      return 'visualization';
    case 'examples':
      return 'examples';
    case 'practice':
      return 'practice';
    case 'keytakeaways':
    case 'key_takeaways':
    case 'key-takeaways':
    case 'keytakeaway':
    case 'key-takeaway':
      return 'keyTakeaways';
    default:
      return null;
  }
};

export const resolveSectionContentById = async (sectionId: string): Promise<ResolvedSectionContent | null> => {
  const fromSplitCollections = await resolveFromSplitCollections(sectionId);
  if (fromSplitCollections) {
    trackResolverSource('split-collections', sectionId);
    return fromSplitCollections;
  }

  trackResolverSource('none', sectionId);
  return null;
};
