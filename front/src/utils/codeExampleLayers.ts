export type ExampleLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'c';

export type ThreeLayerCode = {
  basic: string;
  operations: string;
  advanced: string;
};

export type ThreeLayerCodeExamples<Language extends string> = Record<Language, ThreeLayerCode>;

type CodeExampleEntry = {
  language?: string;
  code?: string;
};

type OperationWithCodeExamples = {
  codeExamples?: CodeExampleEntry[];
};

export const normalizeExampleLanguage = (language: string): ExampleLanguage | null => {
  const normalized = language.trim().toLowerCase();

  const languageMap: Record<string, ExampleLanguage> = {
    js: 'javascript',
    javascript: 'javascript',
    ts: 'typescript',
    typescript: 'typescript',
    py: 'python',
    python: 'python',
    java: 'java',
    cpp: 'cpp',
    'c++': 'cpp',
    c: 'c'
  };

  return languageMap[normalized] ?? null;
};

export const mapCodeExamplesFromOperations = <Language extends string>(
  operations: unknown,
  fallbackExamples: ThreeLayerCodeExamples<Language>,
  normalizeLanguage: (language: string) => Language | null,
  options?: { returnNullIfNoMatch?: boolean }
): ThreeLayerCodeExamples<Language> | null => {
  if (!Array.isArray(operations)) {
    return options?.returnNullIfNoMatch ? null : fallbackExamples;
  }

  const languageKeys = Object.keys(fallbackExamples) as Language[];
  const snippetsByLanguage = languageKeys.reduce((acc, language) => {
    acc[language] = [];
    return acc;
  }, {} as Record<Language, string[]>);

  for (const operation of operations as OperationWithCodeExamples[]) {
    if (!Array.isArray(operation.codeExamples)) {
      continue;
    }

    for (const example of operation.codeExamples) {
      if (!example?.language || typeof example?.code !== 'string' || !example.code.trim()) {
        continue;
      }

      const language = normalizeLanguage(example.language);
      if (!language) {
        continue;
      }

      snippetsByLanguage[language].push(example.code);
    }
  }

  const hasAnySnippet = languageKeys.some((language) => snippetsByLanguage[language].length > 0);
  if (!hasAnySnippet && options?.returnNullIfNoMatch) {
    return null;
  }

  const result = {} as ThreeLayerCodeExamples<Language>;

  for (const language of languageKeys) {
    const snippets = snippetsByLanguage[language];
    const fallback = fallbackExamples[language];

    result[language] = {
      basic: snippets[0] ?? fallback.basic,
      operations: snippets[1] ?? snippets[0] ?? fallback.operations,
      advanced: snippets[2] ?? snippets[snippets.length - 1] ?? fallback.advanced
    };
  }

  return result;
};

export const loadThreeLayerExamplesFromApi = async <Language extends string>(params: {
  candidateIds: string[];
  fallbackExamples: ThreeLayerCodeExamples<Language>;
  normalizeLanguage: (language: string) => Language | null;
  fetchModuleData: (id: string) => Promise<unknown>;
}): Promise<ThreeLayerCodeExamples<Language>> => {
  const { candidateIds, fallbackExamples, normalizeLanguage, fetchModuleData } = params;

  for (const id of candidateIds) {
    try {
      const response = await fetchModuleData(id);
      const responseRecord = response && typeof response === 'object'
        ? (response as { data?: unknown })
        : {};
      const payload = responseRecord.data ?? response;
      const payloadRecord = payload && typeof payload === 'object'
        ? (payload as { content?: unknown; operations?: unknown })
        : {};
      const operationsPayload = Array.isArray(payload)
        ? payload
        : (Array.isArray(payloadRecord.content) ? payloadRecord.content : payloadRecord.operations);
      const mapped = mapCodeExamplesFromOperations(
        operationsPayload,
        fallbackExamples,
        normalizeLanguage,
        { returnNullIfNoMatch: true }
      );

      if (mapped) {
        return mapped;
      }
    } catch (error) {
      console.warn(`[codeExampleLayers] Failed to load code examples for ${id}.`, error);
    }
  }

  return fallbackExamples;
};
