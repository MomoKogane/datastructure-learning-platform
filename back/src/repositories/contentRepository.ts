import mongoose from 'mongoose';
import type { CourseChapter, TheoryContent } from '../utils/dataManager';
import { type DefaultOjProblemPayload } from '../data/defaultOjProblemBank';
import {
  normalizeModuleName,
  resolveSectionContentById,
  type ResolvedSectionContent,
  type SectionModuleName
} from '../utils/sectionContentResolver';

export type ContentSourceMode = 'mongo' | 'hybrid';

export type OjDefaultProblemDoc = {
  sectionId: string;
  aliases?: string[];
  problem: DefaultOjProblemPayload;
  source: 'mongo' | 'seed';
  updatedAt?: string;
  createdAt?: string;
};

type SplitCollectionDoc = {
  sectionId?: string;
  id?: string;
  aliases?: string[];
  title?: string;
  subtitle?: string;
  type?: string;
  content?: unknown;
  data?: unknown;
  module?: unknown;
  theory?: unknown;
  keyTakeaways?: unknown;
};

const LEGACY_THEORY_ID_MAP: Record<string, string> = {
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
  '3.2-pattern-matching': '3.2',
  heap: '4.10',
  '4.10-heap': '4.10'
};

const CONTENT_SOURCE_MODE_ENV = String(process.env.CONTENT_SOURCE_MODE || 'hybrid').trim().toLowerCase();
const CONTENT_SOURCE_MODE: ContentSourceMode = CONTENT_SOURCE_MODE_ENV === 'mongo' ? 'mongo' : 'hybrid';

const normalizeSectionId = (sectionId: string): string => LEGACY_THEORY_ID_MAP[sectionId] ?? sectionId;

const extractChapterOrder = (chapter: CourseChapter): number => {
  const fromTitle = String(chapter?.title || '').trim().match(/^(\d+(?:\.\d+)*)/);
  if (fromTitle) {
    return Number.parseFloat(fromTitle[1]);
  }

  const fromId = String((chapter as unknown as { id?: string })?.id || '').trim().match(/^(\d+(?:\.\d+)*)/);
  if (fromId) {
    return Number.parseFloat(fromId[1]);
  }

  return Number.POSITIVE_INFINITY;
};

const sortCourseCatalog = (catalog: CourseChapter[]): CourseChapter[] => (
  [...catalog].sort((a, b) => {
    const orderA = extractChapterOrder(a);
    const orderB = extractChapterOrder(b);
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return String(a?.title || '').localeCompare(String(b?.title || ''), 'zh-CN');
  })
);

const buildGenericOjProblem = (sectionId: string): DefaultOjProblemPayload => ({
  title: `Section ${sectionId} - A + B`,
  description: '输入两个整数 a 和 b，输出它们的和。',
  inputDescription: '一行输入两个整数 a b。',
  outputDescription: '输出一个整数，表示 a+b。',
  sampleInput: '1 2',
  sampleOutput: '3',
  dataRange: '-10^9 <= a,b <= 10^9',
  constraints: {
    timeLimitMs: 1200,
    memoryLimitMb: 128,
    stackLimitKb: 8192
  },
  testCases: [
    { input: '1 2', output: '3' },
    { input: '100 200', output: '300' },
    { input: '-5 8', output: '3' },
    { input: '0 0', output: '0' },
    { input: '-100 -20', output: '-120' }
  ],
  source: 'custom',
  defaultLanguage: 'cpp',
  starterCode: {
    cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    long long a, b;\n    if (!(cin >> a >> b)) return 0;\n    cout << (a + b) << "\\n";\n    return 0;\n}',
    java: 'import java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String[] arr = br.readLine().trim().split("\\\\s+");\n        long a = Long.parseLong(arr[0]);\n        long b = Long.parseLong(arr[1]);\n        System.out.println(a + b);\n    }\n}',
    typescript: 'import * as fs from "fs";\n\nconst arr = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);\nif (arr.length >= 2) {\n  console.log(arr[0] + arr[1]);\n}',
    python: 'import sys\n\narr = sys.stdin.read().strip().split()\nif len(arr) >= 2:\n    a, b = int(arr[0]), int(arr[1])\n    print(a + b)\n'
  }
});

const extractModulePayload = (doc: SplitCollectionDoc | null | undefined): unknown => {
  if (!doc) return undefined;
  if (doc.content !== undefined) return doc.content;
  if (doc.data !== undefined) return doc.data;
  if (doc.module !== undefined) return doc.module;
  if (doc.theory !== undefined) return doc.theory;
  return undefined;
};

const asTheoryContent = (sectionId: string, payload: unknown, doc?: SplitCollectionDoc | null): TheoryContent | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const obj = payload as Record<string, unknown>;
  const introduction = String(obj.introduction ?? '');
  const sections = Array.isArray(obj.sections) ? obj.sections : [];
  const keyTakeaways = Array.isArray(obj.keyTakeaways)
    ? obj.keyTakeaways
    : Array.isArray(doc?.keyTakeaways)
      ? doc?.keyTakeaways
      : [];

  return {
    id: normalizeSectionId(sectionId),
    title: String(doc?.title ?? `Section ${sectionId}`),
    subtitle: String(doc?.subtitle ?? ''),
    type: String(doc?.type ?? 'theory'),
    content: {
      introduction,
      sections: sections as TheoryContent['content']['sections'],
      keyTakeaways: keyTakeaways as string[]
    }
  };
};

class ContentRepository {
  getSourceMode(): ContentSourceMode {
    return CONTENT_SOURCE_MODE;
  }

  private getDb() {
    if (!mongoose.connection.readyState || !mongoose.connection.db) {
      return null;
    }

    return mongoose.connection.useDb('dslp', { useCache: true });
  }

  async getCourseCatalog(): Promise<CourseChapter[]> {
    const db = this.getDb();

    if (db) {
      for (const collectionName of ['course_catalog', 'course-catalog', 'courseCatalog']) {
        const list = await db.collection(collectionName).find({}).toArray();
        if (list.length > 0) {
          return sortCourseCatalog(list as unknown as CourseChapter[]);
        }
      }
    }

    return [];
  }

  async getTheoryContent(sectionId: string): Promise<TheoryContent | null> {
    const db = this.getDb();
    const normalizedId = normalizeSectionId(sectionId);

    if (db) {
      const candidateIds = Array.from(new Set([sectionId, normalizedId]));
      const doc = await db.collection('theory').findOne({
        $or: [
          { sectionId: { $in: candidateIds } },
          { id: { $in: candidateIds } },
          { aliases: { $in: candidateIds } }
        ]
      }) as SplitCollectionDoc | null;

      const payload = extractModulePayload(doc);
      const fromMongo = asTheoryContent(normalizedId, payload, doc);
      if (fromMongo) {
        return fromMongo;
      }
    }

    return null;
  }

  async resolveSection(sectionId: string): Promise<ResolvedSectionContent | null> {
    return resolveSectionContentById(sectionId);
  }

  async getDefaultOjProblem(sectionId: string): Promise<DefaultOjProblemPayload> {
    const db = this.getDb();
    const normalizedId = normalizeSectionId(sectionId);

    if (db) {
      const doc = await db.collection('oj_default_problems').findOne({
        $or: [
          { sectionId: sectionId },
          { sectionId: normalizedId },
          { aliases: sectionId },
          { aliases: normalizedId }
        ]
      }) as OjDefaultProblemDoc | null;

      if (doc?.problem) {
        return doc.problem;
      }
    }

    return buildGenericOjProblem(sectionId);
  }

  async getSectionModule(sectionId: string, moduleName: string): Promise<{ module: SectionModuleName; section: ResolvedSectionContent } | null> {
    const normalizedModule = normalizeModuleName(moduleName);
    if (!normalizedModule) {
      return null;
    }

    const section = await this.resolveSection(sectionId);
    if (!section) {
      return null;
    }

    return { module: normalizedModule, section };
  }
}

export const contentRepository = new ContentRepository();
