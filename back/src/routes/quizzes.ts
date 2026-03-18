import express from 'express';
import jwt from 'jsonwebtoken';
import type { APIResponse } from '../types';
import type { TheoryContent } from '../utils/dataManager';
import { IntelligentQuizGenerator, QuizGenerationRequest, GeneratedQuestion } from '../utils/quizGenerator';
import QuizBank from '../models/QuizBank';
import User from '../models/User';
import TeachingClass from '../models/TeachingClass';
import QuizClassOverride from '../models/QuizClassOverride';
import QuizSubmission from '../models/QuizSubmission';
import { resolveSectionContentById } from '../utils/sectionContentResolver';
import * as https from 'https';

const router = express.Router();
const quizGenerator = new IntelligentQuizGenerator();

type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';
type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer';
type OnlineProvider = 'mock' | 'llm' | 'zhipu';
type Role = 'admin' | 'teacher' | 'student';

interface AuthRequest extends express.Request {
  authUser?: {
    userId: string;
    role: Role;
    name: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'dslp-dev-secret';

const chapterSectionIdMap: Record<string, string> = {
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
  '3.2-pattern-matching': '3.2'
};

const normalizeSectionId = (sectionId: string): string => chapterSectionIdMap[sectionId] ?? sectionId;

const getFirstEnv = (...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
};

const quizTemplate = {
  version: 'quiz-template-v1.1',
  description: 'Aligned with current 1.1 theory quiz format used by frontend TheoryContent page.',
  questionFormat: {
    id: 'q_001',
    type: 'multiple-choice',
    question: 'Which of the following best describes an Abstract Data Type (ADT)?',
    options: [
      'A fixed implementation of a data structure',
      'A behavior-first specification independent of implementation',
      'A hardware-level memory model',
      'A compiler optimization technique'
    ],
    correctAnswer: 1,
    explanation: 'ADT defines operations and behavior without binding to one concrete implementation.',
    difficulty: 'easy',
    topic: '1.1.2 Abstract Data Types (ADT)'
  },
  rules: {
    multipleChoice: 'correctAnswer must be a zero-based option index',
    trueFalse: 'correctAnswer must be boolean',
    shortAnswer: 'correctAnswer must be string',
    requiredFields: ['id', 'type', 'question', 'correctAnswer', 'explanation', 'difficulty', 'topic']
  }
};

// Placeholder routes - will be implemented later
router.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message: 'Quizzes API - Ready'
  } as APIResponse);
});

router.get('/template', (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    data: quizTemplate
  } as APIResponse);
});

const parseGenerationParams = (req: express.Request): {
  questionCount: number;
  difficulty: Difficulty;
  questionTypes: QuestionType[];
} => {
  const {
    questionCount = 8,
    difficulty = 'mixed',
    questionTypes = ['multiple-choice', 'true-false']
  } = req.body ?? {};

  return {
    questionCount: Number(questionCount) || 8,
    difficulty: difficulty as Difficulty,
    questionTypes: Array.isArray(questionTypes) ? questionTypes as QuestionType[] : ['multiple-choice', 'true-false']
  };
};

const authMiddleware = (req: AuthRequest, res: express.Response, next: express.NextFunction): void => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;

  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized: missing token' } as APIResponse);
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: Role; name: string };
    req.authUser = payload;
    next();
  } catch (_error) {
    res.status(401).json({ success: false, error: 'Unauthorized: invalid token' } as APIResponse);
  }
};

const requireRoles = (...roles: Role[]) => (
  (req: AuthRequest, res: express.Response, next: express.NextFunction): void => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      res.status(403).json({ success: false, error: 'Forbidden' } as APIResponse);
      return;
    }
    next();
  }
);

const parseAuthUserFromHeader = (req: express.Request): { userId: string; role: Role; name: string } | null => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: Role; name: string };
  } catch (_error) {
    return null;
  }
};

const resolveClassIdForCurrentUser = async (
  currentUser: { userId: string; role: Role },
  requestedClassId?: string
): Promise<string | undefined> => {
  if (currentUser.role === 'student') {
    const student = await User.findOne({ userId: currentUser.userId, role: 'student' }).lean();
    return student?.classId;
  }

  if (!requestedClassId) {
    return undefined;
  }

  if (currentUser.role === 'teacher') {
    const classDoc = await TeachingClass.findOne({ classId: requestedClassId, teacherId: currentUser.userId }).lean();
    return classDoc ? requestedClassId : undefined;
  }

  return requestedClassId;
};

type EditableQuizQuestionInput = {
  id?: string;
  type: 'multiple-choice' | 'true-false';
  question: string;
  options?: string[];
  correctAnswer: number | boolean | string;
  explanation?: string;
};

type NormalizedEditableQuizQuestion = {
  id: string;
  type: 'multiple-choice' | 'true-false';
  question: string;
  options: string[];
  correctAnswer: number | boolean;
  explanation: string;
};

const normalizeTrueFalseAnswer = (raw: unknown): boolean | null => {
  if (typeof raw === 'boolean') {
    return raw;
  }

  if (typeof raw === 'number') {
    if (raw === 0) return true;
    if (raw === 1) return false;
    return null;
  }

  const normalized = String(raw || '').trim().toLowerCase();
  if (['yes', 'true', '1'].includes(normalized)) return true;
  if (['no', 'false', '0'].includes(normalized)) return false;
  return null;
};

const normalizeEditableQuestion = (input: EditableQuizQuestionInput, index: number): NormalizedEditableQuizQuestion | null => {
  const type = input?.type;
  if (!['multiple-choice', 'true-false'].includes(type)) {
    return null;
  }

  const question = String(input?.question || '').trim();
  if (!question) {
    return null;
  }

  if (type === 'true-false') {
    const normalizedAnswer = normalizeTrueFalseAnswer(input.correctAnswer);
    if (normalizedAnswer === null) {
      return null;
    }

    return {
      id: String(input.id || `q_override_${Date.now()}_${index}`),
      type,
      question,
      options: ['yes', 'no'],
      correctAnswer: normalizedAnswer,
      explanation: String(input.explanation || '').trim()
    };
  }

  const options = Array.isArray(input.options)
    ? input.options.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  if (options.length < 2) {
    return null;
  }

  const answerIndex = Number(input.correctAnswer);
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) {
    return null;
  }

  return {
    id: String(input.id || `q_override_${Date.now()}_${index}`),
    type,
    question,
    options,
    correctAnswer: answerIndex,
    explanation: String(input.explanation || '').trim()
  };
};

const mapGeneratedQuestionToEditable = (input: GeneratedQuestion, index: number): NormalizedEditableQuizQuestion | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  if (input.type === 'true-false') {
    const answer = normalizeTrueFalseAnswer(input.correctAnswer);
    if (answer === null) {
      return null;
    }

    return {
      id: String(input.id || `q_default_${Date.now()}_${index}`),
      type: 'true-false',
      question: String(input.question || '').trim(),
      options: ['yes', 'no'],
      correctAnswer: answer,
      explanation: String(input.explanation || '').trim()
    };
  }

  if (input.type !== 'multiple-choice') {
    return null;
  }

  const options = Array.isArray(input.options)
    ? input.options.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  if (options.length < 2) {
    return null;
  }

  const answerIndex = Number(input.correctAnswer);
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) {
    return null;
  }

  return {
    id: String(input.id || `q_default_${Date.now()}_${index}`),
    type: 'multiple-choice',
    question: String(input.question || '').trim(),
    options,
    correctAnswer: answerIndex,
    explanation: String(input.explanation || '').trim()
  };
};

const toGeneratedQuestion = (input: NormalizedEditableQuizQuestion, index: number): GeneratedQuestion => ({
  id: input.id || `q_class_override_${Date.now()}_${index}`,
  type: input.type,
  question: input.question,
  options: input.type === 'multiple-choice' ? input.options : ['yes', 'no'],
  correctAnswer: input.correctAnswer,
  explanation: input.explanation || 'Teacher custom quiz question.',
  difficulty: 'medium',
  topic: 'Teacher Custom Quiz'
});

const ensureMinimumEditableQuestions = (questions: NormalizedEditableQuizQuestion[]): NormalizedEditableQuizQuestion[] => {
  const result = [...questions];
  while (result.length < 5) {
    const seq = result.length + 1;
    result.push({
      id: `q_placeholder_${Date.now()}_${seq}`,
      type: 'multiple-choice',
      question: `示例题目 ${seq}`,
      options: ['选项A', '选项B'],
      correctAnswer: 0,
      explanation: ''
    });
  }

  return result;
};

const resolveQuizOverrideForContext = async (
  sectionId: string,
  currentUser: { userId: string; role: Role },
  requestedClassId?: string
): Promise<{ classId?: string; questions: GeneratedQuestion[] } | null> => {
  const classId = await resolveClassIdForCurrentUser(currentUser, requestedClassId);
  if (!classId) {
    return null;
  }

  const override = await QuizClassOverride.findOne({ sectionId, classId }).lean();
  if (!override || !Array.isArray(override.questions) || override.questions.length === 0) {
    return null;
  }

  const normalizedQuestions = override.questions
    .map((item, index) => normalizeEditableQuestion(item as EditableQuizQuestionInput, index))
    .filter((item): item is NormalizedEditableQuizQuestion => Boolean(item))
    .map((item, index) => toGeneratedQuestion(item, index));

  if (!normalizedQuestions.length) {
    return null;
  }

  return {
    classId,
    questions: normalizedQuestions
  };
};

const QUIZ_DB_CONTENT_NOT_FOUND = 'QUIZ_DB_CONTENT_NOT_FOUND';

const isQuizDbContentNotFoundError = (error: unknown): boolean =>
  error instanceof Error && error.message === QUIZ_DB_CONTENT_NOT_FOUND;

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const toTheoryContentFromModule = (sectionId: string, theoryModule: unknown, keyTakeawaysModule?: unknown): TheoryContent => {
  const defaultResult: TheoryContent = {
    id: sectionId,
    title: `Section ${sectionId}`,
    subtitle: 'Quiz Content',
    type: 'theory',
    content: {
      introduction: '',
      sections: [],
      keyTakeaways: [],
      quizQuestions: []
    }
  };

  if (!isObject(theoryModule)) {
    return defaultResult;
  }

  const introduction = String(theoryModule.introduction ?? theoryModule.description ?? '');

  const sectionsSource = Array.isArray(theoryModule.sections)
    ? theoryModule.sections
    : (Array.isArray(theoryModule.concepts) ? theoryModule.concepts : []);

  const sections = sectionsSource.map((item, index) => {
    if (typeof item === 'string') {
      return {
        title: `Concept ${index + 1}`,
        content: item,
        examples: []
      };
    }

    if (isObject(item)) {
      return {
        title: String(item.title ?? `Concept ${index + 1}`),
        content: String(item.content ?? item.description ?? ''),
        examples: Array.isArray(item.examples) ? item.examples.map((example) => String(example)) : []
      };
    }

    return {
      title: `Concept ${index + 1}`,
      content: String(item ?? ''),
      examples: []
    };
  });

  const keyTakeaways = Array.isArray(keyTakeawaysModule)
    ? keyTakeawaysModule.map((item) => String(item))
    : [];

  return {
    id: sectionId,
    title: String(theoryModule.title ?? `Section ${sectionId}`),
    subtitle: String(theoryModule.subtitle ?? 'Quiz Content'),
    type: 'theory',
    content: {
      introduction,
      sections,
      keyTakeaways,
      quizQuestions: []
    }
  };
};

const buildContentFromDbBank = (sectionId: string, dbBank: any): TheoryContent => {
  const questions = (dbBank?.questions ?? []) as GeneratedQuestion[];
  const storedTheoryContent = dbBank?.theoryContent;

  if (storedTheoryContent) {
    const existingQuizQuestions = Array.isArray(storedTheoryContent.quizQuestions)
      ? storedTheoryContent.quizQuestions as GeneratedQuestion[]
      : undefined;

    return {
      id: sectionId,
      title: dbBank.title || `Section ${sectionId}`,
      subtitle: dbBank.description || 'Quiz Content',
      type: 'theory',
      content: {
        introduction: String(storedTheoryContent.introduction || ''),
        sections: Array.isArray(storedTheoryContent.sections) ? storedTheoryContent.sections : [],
        keyTakeaways: Array.isArray(storedTheoryContent.keyTakeaways) ? storedTheoryContent.keyTakeaways : [],
        quizQuestions: questions.length > 0 ? questions : existingQuizQuestions
      }
    };
  }

  return {
    id: sectionId,
    title: dbBank?.title || `Section ${sectionId}`,
    subtitle: dbBank?.description || 'Quiz Content',
    type: 'theory',
    content: {
      introduction: '',
      sections: [],
      keyTakeaways: [],
      quizQuestions: questions
    }
  };
};

const loadQuizContentFromDatabase = async (sectionId: string): Promise<{
  content: TheoryContent;
  dataSource: 'database';
}> => {
  try {
    const dbBank = await QuizBank.findOne({ sectionId }).lean()
      || await QuizBank.findOne({ sectionId: `${sectionId}-backup` }).lean();
    if (dbBank) {
      return {
        content: buildContentFromDbBank(sectionId, dbBank),
        dataSource: 'database'
      };
    }
  } catch (error) {
    console.error(`Database quiz bank lookup failed for ${sectionId}:`, error);
    throw error;
  }

  const sectionContent = await resolveSectionContentById(sectionId);
  if (sectionContent?.modules.theory) {
    return {
      content: toTheoryContentFromModule(
        sectionContent.sectionId,
        sectionContent.modules.theory,
        sectionContent.modules.keyTakeaways
      ),
      dataSource: 'database'
    };
  }

  throw new Error(QUIZ_DB_CONTENT_NOT_FOUND);
};

const generateLocalQuiz = (
  content: TheoryContent,
  questionCount: number,
  difficulty: Difficulty,
  questionTypes: QuestionType[]
) => {
  const request: QuizGenerationRequest = {
    content,
    questionCount,
    difficulty,
    questionTypes
  };

  return quizGenerator.generateQuiz(request);
};

const normalizeQuestion = (input: any, index: number): GeneratedQuestion | null => {
  if (!input || typeof input !== 'object') return null;

  const type = input.type as QuestionType;
  if (!['multiple-choice', 'true-false', 'short-answer'].includes(type)) {
    return null;
  }

  const difficulty = (['easy', 'medium', 'hard'].includes(input.difficulty)
    ? input.difficulty
    : 'medium') as 'easy' | 'medium' | 'hard';

  return {
    id: input.id || `q_online_${Date.now()}_${index}`,
    type,
    question: String(input.question || '').trim(),
    options: Array.isArray(input.options) ? input.options.map((item: any) => String(item)) : undefined,
    correctAnswer: input.correctAnswer,
    explanation: String(input.explanation || 'Generated by online mode'),
    difficulty,
    topic: String(input.topic || 'General')
  };
};

const llmPostJson = (urlString: string, headers: Record<string, string>, body: unknown): Promise<any> => {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const requestBody = JSON.stringify(body);

    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
          ...headers
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`Invalid JSON response from LLM service: ${raw.slice(0, 200)}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
};

const llmPostJsonWithTimeout = (
  urlString: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs: number
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const requestBody = JSON.stringify(body);

    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
          ...headers
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`Invalid JSON response from LLM service: ${raw.slice(0, 200)}`));
          }
        });
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`LLM request timed out after ${timeoutMs}ms`));
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
};

const extractJsonObjectText = (rawText: string): string => {
  const trimmed = rawText.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

let llmRateLimitBlockedUntil = 0;

const isRateLimitError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const msg = error.message.toLowerCase();
  return msg.includes('1302') || msg.includes('rate limit') || msg.includes('速率限制');
};

const generateOnlineQuiz = async (
  content: TheoryContent,
  sectionId: string,
  questionCount: number,
  difficulty: Difficulty,
  questionTypes: QuestionType[]
): Promise<{
  questions: GeneratedQuestion[];
  provider: OnlineProvider;
  fallbackToLocal: boolean;
  notice?: string;
  fallbackReason?: 'llm-unavailable' | 'llm-error' | 'llm-timeout';
  retryCount: number;
}> => {
  const placeholderQuestion: GeneratedQuestion = {
    id: `q_online_placeholder_${Date.now()}`,
    type: 'multiple-choice',
    question: 'Unable to connect to the large language model to generate exercises. Please try again later or switch to local generation mode.',
    options: ['Retry online generation later', 'Switch to local generation mode'],
    correctAnswer: 1,
    explanation: 'The online generation is currently unavailable. You can try again later or switch to local generation mode to continue learning.',
    difficulty: 'easy',
    topic: 'Online Generation Status'
  };

  const inferredApiKey = getFirstEnv('ZHIPU_API_KEY', 'LLM_API_KEY', 'AI_API_KEY', 'BIGMODEL_API_KEY', 'GLM_API_KEY');
  const provider = (
    process.env.QUIZ_ONLINE_PROVIDER ||
    process.env.LLM_PROVIDER ||
    (inferredApiKey ? 'zhipu' : 'mock')
  ).toLowerCase() as OnlineProvider;

  if (provider === 'mock') {
    return {
      questions: [placeholderQuestion],
      provider: 'mock',
      fallbackToLocal: false,
      notice: 'Unable to connect to the large language model to generate exercises',
      fallbackReason: 'llm-unavailable',
      retryCount: 0
    };
  }

  const configuredUrl = getFirstEnv('ZHIPU_API_URL', 'LLM_API_URL', 'AI_API_URL');
  const llmApiUrl = configuredUrl && !configuredUrl.includes('your-ai-service.com')
    ? configuredUrl
    : 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  const llmApiKey = inferredApiKey;
  const llmModel = process.env.ZHIPU_MODEL || process.env.LLM_MODEL || 'glm-4-flash';

  const maxDurationMs = Math.max(5000, Number(process.env.QUIZ_ONLINE_MAX_DURATION_MS ?? 45000));
  const requestTimeoutMs = Math.max(2000, Number(process.env.QUIZ_ONLINE_REQUEST_TIMEOUT_MS ?? 20000));
  const baseDelayMs = Math.max(200, Number(process.env.QUIZ_ONLINE_RETRY_DELAY_MS ?? 600));
  const rateLimitCooldownMs = Math.max(5000, Number(process.env.QUIZ_ONLINE_RATE_LIMIT_COOLDOWN_MS ?? 60000));

  if (Date.now() < llmRateLimitBlockedUntil) {
    const waitSeconds = Math.ceil((llmRateLimitBlockedUntil - Date.now()) / 1000);
    return {
      questions: [placeholderQuestion],
      provider: provider === 'zhipu' ? 'zhipu' : 'llm',
      fallbackToLocal: true,
      notice: `Online generation is temporarily rate-limited. Please wait ${waitSeconds}s and retry, or switch to local mode.`,
      fallbackReason: 'llm-error',
      retryCount: 0
    };
  }

  if (!llmApiUrl || !llmApiKey) {
    return {
      questions: [placeholderQuestion],
      provider: provider === 'zhipu' ? 'zhipu' : 'llm',
      fallbackToLocal: true,
      notice: 'Unable to connect to the large language model to generate exercises',
      fallbackReason: 'llm-unavailable',
      retryCount: 0
    };
  }

  const promptPayload = {
    sectionId,
    title: content.title,
    subtitle: content.subtitle,
    introduction: content.content.introduction,
    sections: content.content.sections.map(section => ({
      title: section.title,
      content: section.content
    })),
    keyTakeaways: content.content.keyTakeaways,
    questionCount,
    difficulty,
    questionTypes,
    outputFormat: {
      questions: [
        {
          id: 'q_xxx',
          type: 'multiple-choice',
          question: '...?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: '...',
          difficulty: 'easy',
          topic: '...'
        }
      ]
    }
  };

  let lastError: unknown;
  const startedAt = Date.now();
  let attempt = 0;

  while ((Date.now() - startedAt) < maxDurationMs) {
    try {
      const elapsed = Date.now() - startedAt;
      const remainingMs = maxDurationMs - elapsed;
      const attemptTimeoutMs = Math.min(requestTimeoutMs, Math.max(1000, remainingMs));

      const llmResponse = await llmPostJsonWithTimeout(
        llmApiUrl,
        { Authorization: `Bearer ${llmApiKey}` },
        {
          model: llmModel,
          messages: [
            {
              role: 'system',
              content: 'You are a quiz generator. Output strict JSON only with a top-level questions array. No markdown.'
            },
            {
              role: 'user',
              content: JSON.stringify(promptPayload)
            }
          ],
          temperature: 0.3
        },
        attemptTimeoutMs
      );

      if (llmResponse?.error) {
        const errorCode = llmResponse.error.code || llmResponse.error.type || 'LLM_API_ERROR';
        const errorMessage = llmResponse.error.message || 'Unknown LLM API error';
        throw new Error(`LLM API error (${errorCode}): ${errorMessage}`);
      }

      const messageContent = llmResponse?.choices?.[0]?.message?.content;
      const messageText = typeof messageContent === 'string'
        ? messageContent
        : Array.isArray(messageContent)
          ? messageContent.map((item: any) => (typeof item?.text === 'string' ? item.text : '')).join('')
          : '';

      if (!messageText) {
        throw new Error('LLM response does not contain message content');
      }

      const parsed = JSON.parse(extractJsonObjectText(messageText));
      const questionsRaw = Array.isArray(parsed?.questions) ? parsed.questions : [];
      const normalized = questionsRaw
        .map((item: any, index: number) => normalizeQuestion(item, index))
        .filter((item: GeneratedQuestion | null): item is GeneratedQuestion => Boolean(item));

      if (!normalized.length) {
        throw new Error('No valid questions parsed from LLM response');
      }

      return {
        questions: normalized.slice(0, questionCount),
        provider: provider === 'zhipu' ? 'zhipu' : 'llm',
        fallbackToLocal: false,
        retryCount: attempt
      };
    } catch (error) {
      lastError = error;

      if (isRateLimitError(error)) {
        llmRateLimitBlockedUntil = Date.now() + rateLimitCooldownMs;
        break;
      }

      const elapsed = Date.now() - startedAt;
      const remainingMs = maxDurationMs - elapsed;
      if (remainingMs <= 0) {
        break;
      }

      const waitMs = Math.min(baseDelayMs, Math.max(100, remainingMs));
      await delay(waitMs);
      attempt += 1;
    }
  }

  const spentMs = Date.now() - startedAt;
  const isTimeoutFailure = lastError instanceof Error
    && /timed out|timeout/i.test(lastError.message);
  console.error('LLM generation failed before timeout window, returning placeholder question:', lastError);
  return {
    questions: [placeholderQuestion],
    provider: provider === 'zhipu' ? 'zhipu' : 'llm',
    fallbackToLocal: true,
    notice: isTimeoutFailure
      ? `Online generation did not return within ${Math.round(spentMs / 1000)}s. Please switch to local generation mode.`
      : `Online generation failed: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`,
    fallbackReason: isTimeoutFailure ? 'llm-timeout' : 'llm-error',
    retryCount: attempt + 1
  };
};

router.get('/problem/:sectionId', authMiddleware, requireRoles('teacher', 'admin'), async (req: AuthRequest, res: express.Response) => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const sectionId = normalizeSectionId(req.params.sectionId);
  const requestedClassId = String(req.query.classId || '').trim();
  const classId = await resolveClassIdForCurrentUser(currentUser, requestedClassId || undefined);

  if (!classId) {
    res.status(400).json({ success: false, error: 'classId 无效或无权限' } as APIResponse);
    return;
  }

  const override = await QuizClassOverride.findOne({ sectionId, classId }).lean();
  if (override?.questions?.length) {
    const normalized = ensureMinimumEditableQuestions(
      override.questions
        .map((item, index) => normalizeEditableQuestion(item as EditableQuizQuestionInput, index))
        .filter((item): item is NormalizedEditableQuizQuestion => Boolean(item))
    );

    res.json({
      success: true,
      data: {
        sectionId,
        classId,
        sourceMode: 'teacher-override',
        questions: normalized
      }
    } as APIResponse);
    return;
  }

  try {
    const { content } = await loadQuizContentFromDatabase(sectionId);
    const generated = generateLocalQuiz(content, 8, 'mixed', ['multiple-choice', 'true-false']);
    const normalized = ensureMinimumEditableQuestions(
      generated
        .map((item, index) => mapGeneratedQuestionToEditable(item, index))
        .filter((item): item is NormalizedEditableQuizQuestion => Boolean(item))
    );

    res.json({
      success: true,
      data: {
        sectionId,
        classId,
        sourceMode: 'default-source',
        questions: normalized
      }
    } as APIResponse);
  } catch (error) {
    console.error('Quiz editable problem load error:', error);
    if (isQuizDbContentNotFoundError(error)) {
      res.status(404).json({ success: false, error: 'Quiz content not found in database' } as APIResponse);
      return;
    }

    res.status(500).json({ success: false, error: 'Failed to load quiz editable content' } as APIResponse);
  }
});

router.put('/problem/:sectionId/class/:classId', authMiddleware, requireRoles('teacher', 'admin'), async (req: AuthRequest, res: express.Response) => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const sectionId = normalizeSectionId(req.params.sectionId);
  const { classId } = req.params;
  const payloadQuestions = Array.isArray(req.body?.questions) ? req.body.questions : [];

  if (payloadQuestions.length < 5) {
    res.status(400).json({ success: false, error: 'questions 至少提供5道题目' } as APIResponse);
    return;
  }

  if (currentUser.role === 'teacher') {
    const classDoc = await TeachingClass.findOne({ classId, teacherId: currentUser.userId }).lean();
    if (!classDoc) {
      res.status(403).json({ success: false, error: '无权修改该教学班题目' } as APIResponse);
      return;
    }
  }

  const normalized = payloadQuestions
    .map((item: EditableQuizQuestionInput, index: number) => normalizeEditableQuestion(item, index))
    .filter((item: NormalizedEditableQuizQuestion | null): item is NormalizedEditableQuizQuestion => Boolean(item));

  if (normalized.length < 5) {
    res.status(400).json({ success: false, error: '题目格式不合法：需至少5道有效题（判断题固定yes/no，选择题至少2个选项）' } as APIResponse);
    return;
  }

  const teacherId = currentUser.role === 'teacher'
    ? currentUser.userId
    : String(req.body?.teacherId || 'admin');

  const saved = await QuizClassOverride.findOneAndUpdate(
    { sectionId, classId },
    {
      $set: {
        sectionId,
        classId,
        teacherId,
        questions: normalized
      }
    },
    { upsert: true, new: true }
  ).lean();

  res.json({ success: true, data: saved } as APIResponse);
});

router.post('/generate/:sectionId', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const sectionId = normalizeSectionId(req.params.sectionId);
  const { questionCount, difficulty, questionTypes } = parseGenerationParams(req);
  const requestedClassId = String(req.query.classId || '').trim() || undefined;

  try {
    const override = await resolveQuizOverrideForContext(sectionId, currentUser, requestedClassId);
    if (override) {
      const selected = override.questions.slice(0, Math.max(5, Number(questionCount) || 8));
      res.json({
        success: true,
        data: {
          sectionId,
          classId: override.classId || null,
          questions: selected,
          metadata: {
            questionCount: selected.length,
            generationMode: 'local',
            generationSummary: 'Teacher class override questions.',
            dataSource: 'database',
            sourceMode: 'teacher-override',
            difficulty,
            questionTypes,
            generatedAt: new Date().toISOString()
          }
        }
      } as APIResponse);
      return;
    }

    const { content, dataSource } = await loadQuizContentFromDatabase(sectionId);
    const quiz = generateLocalQuiz(content, questionCount, difficulty, questionTypes);

    res.json({
      success: true,
      data: {
        sectionId,
        classId: null,
        questions: quiz,
        metadata: {
          questionCount: quiz.length,
          generationMode: 'local',
          generationSummary: 'Rule-based local generation from structured content/question bank.',
          dataSource,
          sourceMode: 'default-source',
          difficulty,
          questionTypes,
          generatedAt: new Date().toISOString()
        }
      }
    } as APIResponse);
  } catch (error) {
    console.error('Quiz generation error:', error);
    if (isQuizDbContentNotFoundError(error)) {
      res.status(404).json({
        success: false,
        error: 'Quiz content not found in database'
      } as APIResponse);
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Failed to generate quiz'
    } as APIResponse);
  }
});

router.post('/generate-online/:sectionId', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const sectionId = normalizeSectionId(req.params.sectionId);
  const { questionCount, difficulty, questionTypes } = parseGenerationParams(req);
  const requestedClassId = String(req.query.classId || '').trim() || undefined;

  try {
    const override = await resolveQuizOverrideForContext(sectionId, currentUser, requestedClassId);
    if (override) {
      const selected = override.questions.slice(0, Math.max(5, Number(questionCount) || 8));
      res.json({
        success: true,
        data: {
          sectionId,
          classId: override.classId || null,
          questions: selected,
          metadata: {
            questionCount: selected.length,
            generationMode: 'online',
            generationSummary: 'Teacher class override questions.',
            provider: 'mock',
            fallbackToLocal: false,
            sourceMode: 'teacher-override',
            dataSource: 'database',
            difficulty,
            questionTypes,
            generatedAt: new Date().toISOString()
          }
        }
      } as APIResponse);
      return;
    }

    const { content, dataSource } = await loadQuizContentFromDatabase(sectionId);
    const { questions, provider, fallbackToLocal, notice, fallbackReason, retryCount } = await generateOnlineQuiz(
      content,
      sectionId,
      questionCount,
      difficulty,
      questionTypes
    );

    res.json({
      success: true,
      data: {
        sectionId,
        questions,
        metadata: {
          questionCount: questions.length,
          generationMode: 'online',
          generationSummary: provider === 'mock'
            ? 'Online mode placeholder: LLM provider is not enabled.'
            : provider === 'zhipu'
              ? 'Online Zhipu GLM generation mode: generated by remote model service.'
              : 'Online LLM generation mode: generated by remote model service.',
          provider,
          fallbackToLocal,
          notice,
          fallbackReason,
          retryCount,
          sourceMode: 'default-source',
          dataSource,
          difficulty,
          questionTypes,
          generatedAt: new Date().toISOString()
        }
      }
    } as APIResponse);
  } catch (error) {
    console.error('Online quiz generation error:', error);
    if (isQuizDbContentNotFoundError(error)) {
      res.status(404).json({
        success: false,
        error: 'Quiz content not found in database'
      } as APIResponse);
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Failed to generate online quiz'
    } as APIResponse);
  }
});

router.post('/submission/:sectionId', async (req: express.Request, res: express.Response) => {
  const { sectionId } = req.params;
  const { answers, questions } = req.body;

  if (!questions || !Array.isArray(questions)) {
    res.status(400).json({
      success: false,
      error: 'Quiz questions are required for evaluation'
    } as APIResponse);
    return;
  }

  try {
    const authUser = parseAuthUserFromHeader(req);
    const results = questions.map((question: any) => {
      const userAnswer = answers?.[question.id];
      const isCorrect = userAnswer === question.correctAnswer;

      return {
        questionId: question.id,
        question: question.question,
        type: question.type,
        options: Array.isArray(question.options) ? question.options : undefined,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
        difficulty: question.difficulty,
        topic: question.topic
      };
    });

    const totalQuestions = questions.length;
    const correctAnswers = results.filter((result: any) => result.isCorrect).length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const submittedAt = new Date();

    if (authUser?.role === 'student') {
      const student = await User.findOne({ userId: authUser.userId, role: 'student' }).lean();
      if (student) {
        await QuizSubmission.create({
          userId: student.userId,
          classId: student.classId,
          sectionId,
          score,
          totalQuestions,
          correctAnswers,
          results,
          submittedAt
        });
      }
    }

    res.json({
      success: true,
      data: {
        score,
        totalQuestions,
        correctAnswers,
        results,
        submittedAt: submittedAt.toISOString()
      }
    } as APIResponse);
  } catch (error) {
    console.error('Quiz submission evaluation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to evaluate quiz submission'
    } as APIResponse);
  }
});

export default router;
