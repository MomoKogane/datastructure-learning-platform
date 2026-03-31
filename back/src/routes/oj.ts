import express from 'express';
import jwt from 'jsonwebtoken';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { runProcessInDocker } from '../utils/sandbox';
import type { APIResponse } from '../types';
import User from '../models/User';
import TeachingClass from '../models/TeachingClass';
import OjClassProblemOverride from '../models/OjClassProblemOverride';
import OjSubmission from '../models/OjSubmission';
import { contentRepository } from '../repositories/contentRepository';

const router = express.Router();

type Role = 'admin' | 'teacher' | 'student';

interface AuthRequest extends express.Request {
  authUser?: {
    userId: string;
    role: Role;
    name: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'dslp-dev-secret';

type JudgeStatus = 'AC' | 'WA' | 'CE' | 'RE' | 'TLE' | 'MLE' | 'OLE' | 'PE';

type OjProblemPayload = {
  title: string;
  description: string;
  inputDescription: string;
  outputDescription: string;
  sampleInput: string;
  sampleOutput: string;
  dataRange: string;
  constraints: {
    timeLimitMs: number;
    memoryLimitMb: number;
    stackLimitKb: number;
  };
  testCases: Array<{
    input: string;
    output: string;
  }>;
  source: 'leetcode' | 'zoj' | 'pta' | 'custom';
  defaultLanguage: 'cpp' | 'java' | 'typescript' | 'python';
  starterCode: {
    cpp: string;
    java: string;
    typescript: string;
    python?: string;
  };
};

const normalizeJudgeStatus = (rawStatus?: string): JudgeStatus => {
  const normalized = String(rawStatus || '').trim().toUpperCase();
  if (['AC', 'WA', 'CE', 'RE', 'TLE', 'MLE', 'OLE', 'PE'].includes(normalized)) {
    return normalized as JudgeStatus;
  }

  if (normalized === 'ACCEPTED') return 'AC';
  if (normalized === 'WRONG ANSWER') return 'WA';
  if (normalized === 'COMPILE ERROR') return 'CE';
  if (normalized === 'RUNTIME ERROR') return 'RE';

  return 'WA';
};

const ensureStudentProgress = async (
  userId: string,
  sectionId: string,
  updater: (row: {
    sectionId: string;
    theoryCompleted: boolean;
    quizCompleted: boolean;
    codingCompleted: boolean;
    ojVisited?: boolean;
    quizScore?: number;
    codingJudgeStatus?: string;
  }) => void
): Promise<void> => {
  const student = await User.findOne({ userId, role: 'student' });
  if (!student) {
    // student 不存在时直接返回或抛出异常
	return;
  }
}

const validateProblemPayload = (problem: Partial<OjProblemPayload>): string | null => {
  const requiredTextFields: Array<keyof OjProblemPayload> = [
    'title',
    'description',
    'inputDescription',
    'outputDescription',
    'sampleInput',
    'sampleOutput',
    'dataRange'
  ];

  for (const field of requiredTextFields) {
    const value = problem[field];
    if (typeof value !== 'string' || !value.trim()) {
      return `problem.${String(field)} 必填`;
    }
  }

  if (!problem.constraints) {
    return 'problem.constraints 必填';
  }

  const { timeLimitMs, memoryLimitMb, stackLimitKb } = problem.constraints;
  if (!Number.isFinite(Number(timeLimitMs)) || Number(timeLimitMs) <= 0) {
    return 'problem.constraints.timeLimitMs 必须为正数';
  }
  if (!Number.isFinite(Number(memoryLimitMb)) || Number(memoryLimitMb) <= 0) {
    return 'problem.constraints.memoryLimitMb 必须为正数';
  }
  if (!Number.isFinite(Number(stackLimitKb)) || Number(stackLimitKb) <= 0) {
    return 'problem.constraints.stackLimitKb 必须为正数';
  }

  if (!problem.starterCode || typeof problem.starterCode !== 'object') {
    return 'problem.starterCode 必填';
  }

  const starterCode = problem.starterCode;
  if (!starterCode.cpp?.trim() || !starterCode.java?.trim() || !starterCode.typescript?.trim()) {
    return 'problem.starterCode.cpp/java/typescript 均必填';
  }

  if (!Array.isArray(problem.testCases) || problem.testCases.length < 5) {
    return 'problem.testCases 至少提供5组输入输出';
  }

  const invalidCase = problem.testCases.find((item) => !item || !String(item.input || '').trim() || !String(item.output || '').trim());
  if (invalidCase) {
    return 'problem.testCases 的每组 input/output 均不能为空';
  }

  return null;
};

const normalizeOutput = (raw: string): string => {
  const normalizedNewline = String(raw || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const normalizedLines = normalizedNewline
    .split('\n')
    .map((line) => line.replace(/[\t ]+$/g, ''));

  while (normalizedLines.length > 0 && normalizedLines[normalizedLines.length - 1] === '') {
    normalizedLines.pop();
  }

  return normalizedLines.join('\n');
};

const resolveCompilerProfile = (compilerRaw: string): {
  command: string;
  sourceExt: '.c' | '.cpp';
  compileArgs: string[];
} => {
  const compiler = String(compilerRaw || '').trim().toLowerCase();

  if (compiler.includes('clang++')) {
    return {
      command: 'clang++',
      sourceExt: '.cpp',
      compileArgs: ['-O2', '-std=c++17']
    };
  }
  if (compiler.includes('g++')) {
    return {
      command: 'g++',
      sourceExt: '.cpp',
      compileArgs: ['-O2', '-std=c++17']
    };
  }
  if (compiler.includes('clang')) {
    return {
      command: 'clang',
      sourceExt: '.c',
      compileArgs: ['-O2', '-std=c11']
    };
  }
  if (compiler.includes('gcc')) {
    return {
      command: 'gcc',
      sourceExt: '.c',
      compileArgs: ['-O2', '-std=c11']
    };
  }
  // 默认 C++ 用 g++
  return {
    command: 'g++',
    sourceExt: '.cpp',
    compileArgs: ['-O2', '-std=c++17']
  };
};

const runProcess = (
  command: string,
  args: string[],
  options?: {
    cwd?: string;
    stdin?: string;
    timeoutMs?: number;
  }
): Promise<{
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}> => (
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options?.cwd,
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';
    let resolved = false;
    let timedOut = false;

    const timeoutMs = Math.max(100, Number(options?.timeoutMs || 0));
    const timer = timeoutMs > 0
      ? setTimeout(() => {
        if (resolved) {
          return;
        }
        timedOut = true;
        child.kill();
      }, timeoutMs)
      : null;

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', (error) => {
      if (timer) clearTimeout(timer);
      if (resolved) {
        return;
      }
      resolved = true;
      reject(error);
    });

    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      if (resolved) {
        return;
      }
      resolved = true;
      resolve({
        exitCode: code,
        stdout,
        stderr,
        timedOut
      });
    });

    if (typeof options?.stdin === 'string') {
      child.stdin?.write(options.stdin);
    }
    child.stdin?.end();
  })
);

const judgeCppSubmission = async (
  code: string,
  compilerRaw: string,
  problem: OjProblemPayload
): Promise<{
  status: JudgeStatus;
  executionTimeMs: number;
  memoryUsageMb: number;
  detail: string;
}> => {
  const compilerProfile = resolveCompilerProfile(compilerRaw);
  const workDir = await mkdtemp(path.join(tmpdir(), 'dslp-oj-'));
  try {
    const sourcePath = path.join(workDir, `main${compilerProfile.sourceExt}`);
    const executablePath = path.join(workDir, 'main');
    await writeFile(sourcePath, code, 'utf8');
    // 编译
    const compileResult = await runProcessInDocker({
      image: 'dslp-oj-cpp',
      command: [compilerProfile.command, ...compilerProfile.compileArgs, `main${compilerProfile.sourceExt}`, '-o', 'main'],
      workDir,
      timeoutMs: 30000
    });
    if (compileResult.timedOut) {
      return { status: 'CE', executionTimeMs: 0, memoryUsageMb: 0, detail: `Compile timeout with ${compilerProfile.command}` };
    }
    if (compileResult.exitCode !== 0) {
      return { status: 'CE', executionTimeMs: 0, memoryUsageMb: 0, detail: compileResult.stderr?.trim() || 'Compilation failed' };
    }
    // 评测
    const testCases = Array.isArray(problem.testCases) ? problem.testCases : [];
    const perCaseTimeLimitMs = Math.max(100, Number(problem.constraints?.timeLimitMs || 1000));
    let accumulatedTimeMs = 0;
    for (let index = 0; index < testCases.length; index += 1) {
      const currentCase = testCases[index];
      const caseInputRaw = String(currentCase?.input || '');
      const caseInput = caseInputRaw.trim() === '无' ? '' : caseInputRaw;
      const expectedOutput = normalizeOutput(String(currentCase?.output || ''));
      const startedAt = Date.now();
      const executeResult = await runProcessInDocker({
        image: 'dslp-oj-cpp',
        command: ['./main'],
        workDir,
        stdin: caseInput,
        timeoutMs: perCaseTimeLimitMs
      });
      accumulatedTimeMs += Date.now() - startedAt;
      if (executeResult.timedOut) {
        return { status: 'TLE', executionTimeMs: accumulatedTimeMs, memoryUsageMb: 0, detail: `Time limit exceeded on test case #${index + 1}` };
      }
      if (executeResult.exitCode !== 0) {
        return { status: 'RE', executionTimeMs: accumulatedTimeMs, memoryUsageMb: 0, detail: `Runtime error on test case #${index + 1}: ${(executeResult.stderr || '').trim() || `exit code ${executeResult.exitCode}`}` };
      }
      const actualOutput = normalizeOutput(executeResult.stdout || '');
      if (actualOutput !== expectedOutput) {
        return { status: 'WA', executionTimeMs: accumulatedTimeMs, memoryUsageMb: 0, detail: `Wrong answer on test case #${index + 1}. Expected: ${expectedOutput.slice(0, 120)} | Got: ${actualOutput.slice(0, 120)}` };
      }
    }
    return { status: 'AC', executionTimeMs: accumulatedTimeMs, memoryUsageMb: 0, detail: `All ${testCases.length} test cases passed.` };
  } catch (error) {
    return { status: 'RE', executionTimeMs: 0, memoryUsageMb: 0, detail: `Judge runtime failure: ${error instanceof Error ? error.message : 'Unknown error'}` };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
};

const resolveAvailableJavaRunner = async (): Promise<{ javac: string; java: string } | null> => {
  const javacCandidates = ['javac'];
  const javaCandidates = ['java'];

  let resolvedJavac: string | null = null;
  let resolvedJava: string | null = null;

  for (const candidate of javacCandidates) {
    try {
      const versionCheck = await runProcess(candidate, ['-version'], { timeoutMs: 3000 });
      if (!versionCheck.timedOut && versionCheck.exitCode === 0) {
        resolvedJavac = candidate;
        break;
      }
    } catch (_error) {
      // ignore and try next candidate
    }
  }

  for (const candidate of javaCandidates) {
    try {
      const versionCheck = await runProcess(candidate, ['-version'], { timeoutMs: 3000 });
      if (!versionCheck.timedOut && versionCheck.exitCode === 0) {
        resolvedJava = candidate;
        break;
      }
    } catch (_error) {
      // ignore and try next candidate
    }
  }

  if (!resolvedJavac || !resolvedJava) {
    return null;
  }

  return { javac: resolvedJavac, java: resolvedJava };
};

const judgeJavaSubmission = async (
  code: string,
  problem: OjProblemPayload
): Promise<{
  status: JudgeStatus;
  executionTimeMs: number;
  memoryUsageMb: number;
  detail: string;
}> => {
  const workDir = await mkdtemp(path.join(tmpdir(), 'dslp-oj-java-'));
  try {
    const sourcePath = path.join(workDir, 'Main.java');
    await writeFile(sourcePath, code, 'utf8');
    // 编译
    const compileResult = await runProcessInDocker({
      image: 'dslp-oj-java',
      command: ['javac', 'Main.java'],
      workDir,
      timeoutMs: 30000
    });
    if (compileResult.timedOut) {
      return { status: 'CE', executionTimeMs: 0, memoryUsageMb: 0, detail: 'Compile timeout with javac' };
    }
    if (compileResult.exitCode !== 0) {
      return { status: 'CE', executionTimeMs: 0, memoryUsageMb: 0, detail: compileResult.stderr?.trim() || 'Java compilation failed' };
    }
    // 评测
    const testCases = Array.isArray(problem.testCases) ? problem.testCases : [];
    const perCaseTimeLimitMs = Math.max(100, Number(problem.constraints?.timeLimitMs || 1000));
    let accumulatedTimeMs = 0;
    for (let index = 0; index < testCases.length; index += 1) {
      const currentCase = testCases[index];
      const caseInputRaw = String(currentCase?.input || '');
      const caseInput = caseInputRaw.trim() === '无' ? '' : caseInputRaw;
      const expectedOutput = normalizeOutput(String(currentCase?.output || ''));
      const startedAt = Date.now();
      const executeResult = await runProcessInDocker({
        image: 'dslp-oj-java',
        command: ['java', 'Main'],
        workDir,
        stdin: caseInput,
        timeoutMs: perCaseTimeLimitMs
      });
      accumulatedTimeMs += Date.now() - startedAt;
      if (executeResult.timedOut) {
        return { status: 'TLE', executionTimeMs: accumulatedTimeMs, memoryUsageMb: 0, detail: `Time limit exceeded on test case #${index + 1}` };
      }
      if (executeResult.exitCode !== 0) {
        return { status: 'RE', executionTimeMs: accumulatedTimeMs, memoryUsageMb: 0, detail: `Runtime error on test case #${index + 1}: ${(executeResult.stderr || '').trim() || `exit code ${executeResult.exitCode}`}` };
      }
      const actualOutput = normalizeOutput(executeResult.stdout || '');
      if (actualOutput !== expectedOutput) {
        return { status: 'WA', executionTimeMs: accumulatedTimeMs, memoryUsageMb: 0, detail: `Wrong answer on test case #${index + 1}. Expected: ${expectedOutput.slice(0, 120)} | Got: ${actualOutput.slice(0, 120)}` };
      }
    }
    return { status: 'AC', executionTimeMs: accumulatedTimeMs, memoryUsageMb: 0, detail: `All ${testCases.length} test cases passed.` };
  } catch (error) {
    return { status: 'RE', executionTimeMs: 0, memoryUsageMb: 0, detail: `Judge runtime failure: ${error instanceof Error ? error.message : 'Unknown error'}` };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
};

const resolvePythonCommand = (compilerRaw: string): string => {
  const compiler = String(compilerRaw || '').trim().toLowerCase();
  if (compiler.includes('python3')) {
    return 'python3';
  }
  if (compiler.includes('python')) {
    return 'python';
  }

  return process.platform === 'win32' ? 'python' : 'python3';
};

const resolveAvailablePythonRunner = async (compilerRaw: string): Promise<{ command: string; baseArgs: string[] } | null> => {
  const preferred = resolvePythonCommand(compilerRaw);
  const candidates: Array<{ command: string; baseArgs: string[] }> = [];

  if (preferred === 'python3') {
    candidates.push({ command: 'python3', baseArgs: [] });
    candidates.push({ command: 'python', baseArgs: [] });
    candidates.push({ command: 'py', baseArgs: ['-3'] });
  } else if (preferred === 'python') {
    candidates.push({ command: 'python', baseArgs: [] });
    candidates.push({ command: 'python3', baseArgs: [] });
    candidates.push({ command: 'py', baseArgs: ['-3'] });
  } else {
    candidates.push({ command: preferred, baseArgs: [] });
    candidates.push({ command: 'python', baseArgs: [] });
    candidates.push({ command: 'python3', baseArgs: [] });
    candidates.push({ command: 'py', baseArgs: ['-3'] });
  }

  for (const candidate of candidates) {
    try {
      const versionCheck = await runProcess(candidate.command, [...candidate.baseArgs, '--version'], { timeoutMs: 3000 });
      if (!versionCheck.timedOut && versionCheck.exitCode === 0) {
        return candidate;
      }
    } catch (_error) {
      // ignore and try next runner
    }
  }

  return null;
};

const judgePythonSubmission = async (
  code: string,
  compilerRaw: string,
  problem: OjProblemPayload
): Promise<{
  status: JudgeStatus;
  executionTimeMs: number;
  memoryUsageMb: number;
  detail: string;
}> => {
  const workDir = await mkdtemp(path.join(tmpdir(), 'dslp-oj-py-'));
  try {
    const scriptPath = path.join(workDir, 'main.py');
    await writeFile(scriptPath, code, 'utf8');
    const testCases = Array.isArray(problem.testCases) ? problem.testCases : [];
    const perCaseTimeLimitMs = Math.max(100, Number(problem.constraints?.timeLimitMs || 1000));
    let accumulatedTimeMs = 0;
    for (let index = 0; index < testCases.length; index += 1) {
      const currentCase = testCases[index];
      const caseInputRaw = String(currentCase?.input || '');
      const caseInput = caseInputRaw.trim() === '无' ? '' : caseInputRaw;
      const expectedOutput = normalizeOutput(String(currentCase?.output || ''));
      const startedAt = Date.now();
      const executeResult = await runProcessInDocker({
        image: 'dslp-oj-python',
        command: ['python3', 'main.py'],
        workDir,
        stdin: caseInput,
        timeoutMs: perCaseTimeLimitMs
      });
      accumulatedTimeMs += Date.now() - startedAt;
      if (executeResult.timedOut) {
        return { status: 'TLE', executionTimeMs: accumulatedTimeMs, memoryUsageMb: 0, detail: `Time limit exceeded on test case #${index + 1}` };
      }
      if (executeResult.exitCode !== 0) {
        // 详细记录stderr内容，便于排查
        return {
          status: 'RE',
          executionTimeMs: accumulatedTimeMs,
          memoryUsageMb: 0,
          detail: `Runtime error on test case #${index + 1}:\nSTDERR:\n${(executeResult.stderr || '').trim()}\nSTDOUT:\n${(executeResult.stdout || '').trim()}\nINPUT:\n${caseInput}`
        };
      }
      const actualOutput = normalizeOutput(executeResult.stdout || '');
      if (actualOutput !== expectedOutput) {
        return { status: 'WA', executionTimeMs: accumulatedTimeMs, memoryUsageMb: 0, detail: `Wrong answer on test case #${index + 1}. Expected: ${expectedOutput.slice(0, 120)} | Got: ${actualOutput.slice(0, 120)}` };
      }
    }
    return { status: 'AC', executionTimeMs: accumulatedTimeMs, memoryUsageMb: 0, detail: `All ${testCases.length} test cases passed.` };
  } catch (error) {
    return { status: 'RE', executionTimeMs: 0, memoryUsageMb: 0, detail: `Judge runtime failure: ${error instanceof Error ? error.message : 'Unknown error'}` };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
};

// TypeScript 沙箱评测
const judgeTypeScriptSubmission = async (
  code: string,
  problem: OjProblemPayload
): Promise<{
  status: JudgeStatus;
  executionTimeMs: number;
  memoryUsageMb: number;
  detail: string;
}> => {
  const workDir = await mkdtemp(path.join(tmpdir(), 'dslp-oj-ts-'));
  try {
    const scriptPath = path.join(workDir, 'main.ts');
    await writeFile(scriptPath, code, 'utf8');
    const testCases = Array.isArray(problem.testCases) ? problem.testCases : [];
    const perCaseTimeLimitMs = Math.max(100, Number(problem.constraints?.timeLimitMs || 1000));
    let accumulatedTimeMs = 0;
    for (let index = 0; index < testCases.length; index += 1) {
      const currentCase = testCases[index];
      const caseInputRaw = String(currentCase?.input || '');
      const caseInput = caseInputRaw.trim() === '无' ? '' : caseInputRaw;
      const expectedOutput = normalizeOutput(String(currentCase?.output || ''));
      const startedAt = Date.now();
      const executeResult = await runProcessInDocker({
        image: 'dslp-oj-ts',
        command: ['ts-node', 'main.ts'],
        workDir,
        stdin: caseInput,
        timeoutMs: perCaseTimeLimitMs
      });
      accumulatedTimeMs += Date.now() - startedAt;
      if (executeResult.timedOut) {
        return { status: 'TLE', executionTimeMs: accumulatedTimeMs, memoryUsageMb: 0, detail: `Time limit exceeded on test case #${index + 1}` };
      }
      if (executeResult.exitCode !== 0) {
        return { status: 'RE', executionTimeMs: accumulatedTimeMs, memoryUsageMb: 0, detail: `Runtime error on test case #${index + 1}: ${(executeResult.stderr || '').trim() || `exit code ${executeResult.exitCode}`}` };
      }
      const actualOutput = normalizeOutput(executeResult.stdout || '');
      if (actualOutput !== expectedOutput) {
        return { status: 'WA', executionTimeMs: accumulatedTimeMs, memoryUsageMb: 0, detail: `Wrong answer on test case #${index + 1}. Expected: ${expectedOutput.slice(0, 120)} | Got: ${actualOutput.slice(0, 120)}` };
      }
    }
    return { status: 'AC', executionTimeMs: accumulatedTimeMs, memoryUsageMb: 0, detail: `All ${testCases.length} test cases passed.` };
  } catch (error) {
    return { status: 'RE', executionTimeMs: 0, memoryUsageMb: 0, detail: `Judge runtime failure: ${error instanceof Error ? error.message : 'Unknown error'}` };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
};

const authMiddleware = (req: AuthRequest, res: express.Response, next: express.NextFunction): void => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;

  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized: missing token' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'userId' in payload &&
      'role' in payload &&
      'name' in payload
    ) {
      req.authUser = payload as { userId: string; role: Role; name: string };
      return next();
    } else {
      res.status(401).json({ success: false, error: 'Unauthorized: invalid token payload' });
      return;
    }
  } catch (_error) {
    res.status(401).json({ success: false, error: 'Unauthorized: invalid token' });
    return;
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

const resolveClassIdForCurrentUser = async (currentUser: { userId: string; role: Role }, requestedClassId?: string): Promise<string | undefined> => {
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

router.get('/problem/:sectionId', authMiddleware, async (req: AuthRequest, res: express.Response): Promise<void> => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const { sectionId } = req.params;
  const requestedClassId = String(req.query.classId || '').trim() || undefined;
  const classId = await resolveClassIdForCurrentUser(currentUser, requestedClassId);

  let override = null;
  if (classId) {
    override = await OjClassProblemOverride.findOne({ sectionId, classId }).lean();
  }

  const defaultProblem = await contentRepository.getDefaultOjProblem(sectionId) as OjProblemPayload;
  const effectiveProblem = override?.problem || defaultProblem;

  if (currentUser.role === 'student') {
    await ensureStudentProgress(currentUser.userId, sectionId, (row) => {
      row.ojVisited = true;
      if (!row.codingJudgeStatus) {
        row.codingJudgeStatus = 'n';
      }
      if (!row.codingCompleted) {
        row.codingCompleted = false;
      }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      sectionId,
      classId: classId || null,
      sourceMode: override ? 'teacher-override' : 'default-source',
      source: effectiveProblem.source,
      problem: effectiveProblem
    }
  } as APIResponse);
});

router.put('/problem/:sectionId/class/:classId', authMiddleware, requireRoles('teacher', 'admin'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const { sectionId, classId } = req.params;
  const { problem } = req.body as { problem: OjProblemPayload };

  const validateError = validateProblemPayload(problem);
  if (validateError) {
    res.status(400).json({ success: false, error: validateError } as APIResponse);
    return;
  }

  if (currentUser.role === 'teacher') {
    const classDoc = await TeachingClass.findOne({ classId, teacherId: currentUser.userId }).lean();
    if (!classDoc) {
      res.status(403).json({ success: false, error: '无权修改该教学班题目' } as APIResponse);
      return;
    }
  }

  const teacherId = currentUser.role === 'teacher'
    ? currentUser.userId
    : String(req.body?.teacherId || 'admin');

  const saved = await OjClassProblemOverride.findOneAndUpdate(
    { sectionId, classId },
    {
      $set: {
        sectionId,
        classId,
        teacherId,
        problem: {
          ...problem,
          source: 'custom'
        }
      }
    },
    { upsert: true, new: true }
  ).lean();

  res.json({ success: true, data: saved } as APIResponse);
});

router.delete('/problem/:sectionId/class/:classId', authMiddleware, requireRoles('teacher', 'admin'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const { sectionId, classId } = req.params;

  if (currentUser.role === 'teacher') {
    const classDoc = await TeachingClass.findOne({ classId, teacherId: currentUser.userId }).lean();
    if (!classDoc) {
      res.status(403).json({ success: false, error: '无权重置该教学班题目' } as APIResponse);
      return;
    }
  }

  await OjClassProblemOverride.deleteOne({ sectionId, classId });
  res.json({ success: true, message: '已恢复默认题目' } as APIResponse);
});

router.post('/submit/:sectionId', authMiddleware, async (req: AuthRequest, res: express.Response): Promise<void> => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const { sectionId } = req.params;
  const { code, language, compiler } = req.body as {
    code: string;
    language: 'cpp' | 'java' | 'typescript' | 'python';
    compiler: string;
  };

  if (!code || !language || !compiler) {
    res.status(400).json({ success: false, error: 'code/language/compiler 必填' } as APIResponse);
    return;
  }

  const requestedClassId = String(req.query.classId || '').trim() || undefined;
  const classId = await resolveClassIdForCurrentUser(currentUser, requestedClassId);

  let override = null;
  if (classId) {
    override = await OjClassProblemOverride.findOne({ sectionId, classId }).lean();
  }
  const defaultProblem = await contentRepository.getDefaultOjProblem(sectionId) as OjProblemPayload;
  const effectiveProblem = override?.problem || defaultProblem;

  let result;
  if (language === 'cpp') {
    result = await judgeCppSubmission(code, compiler, effectiveProblem);
  } else if (language === 'java') {
    result = await judgeJavaSubmission(code, effectiveProblem);
  } else if (language === 'python') {
    result = await judgePythonSubmission(code, compiler, effectiveProblem);
  } else if (language === 'typescript') {
    result = await judgeTypeScriptSubmission(code, effectiveProblem);
  } else {
    result = {
      status: 'CE' as JudgeStatus,
      executionTimeMs: 0,
      memoryUsageMb: 0,
      detail: '当前仅支持 C/C++、Python、Java、TypeScript 评测通路。'
    };
  }

  const submission = await OjSubmission.create({
    userId: currentUser.userId,
    sectionId,
    classId,
    language,
    compiler,
    code,
    result
  });

  if (currentUser.role === 'student') {
    await ensureStudentProgress(currentUser.userId, sectionId, (row) => {
      row.ojVisited = true;
      row.codingJudgeStatus = result.status;
      row.codingCompleted = result.status === 'AC';
    });
  }

  res.json({ success: true, data: submission } as APIResponse);
});

router.get('/submissions/:sectionId', authMiddleware, async (req: AuthRequest, res: express.Response): Promise<void> => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const { sectionId } = req.params;
  const limit = Number(req.query.limit || 20);

  const list = await OjSubmission.find({ userId: currentUser.userId, sectionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const normalizedList = list.map((item) => ({
    ...item,
    result: {
      ...item.result,
      status: normalizeJudgeStatus(item.result?.status)
    }
  }));

  res.status(200).json({ success: true, data: normalizedList } as APIResponse);
});

module.exports = router;
