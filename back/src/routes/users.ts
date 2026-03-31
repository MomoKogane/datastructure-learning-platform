import express from 'express';
// 邮箱服务模拟状态（全局，仅开发/测试用）
let mailServiceMock: { enabled: boolean; Error?: boolean } = { enabled: true };

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User';
import TeachingClass from '../models/TeachingClass';
import Message from '../models/Message';
import OjSubmission from '../models/OjSubmission';
import QuizSubmission from '../models/QuizSubmission';
import type { APIResponse } from '../types';

const router = express.Router();

type Role = 'admin' | 'teacher' | 'student';
type EmailPurpose = 'signup' | 'reset-password' | 'bind-email';

interface AuthRequest extends express.Request {
  authUser?: {
    userId: string;
    role: Role;
    name: string;
  };
}

interface EmailCodeRecord {
  code: string;
  expiresAt: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dslp-dev-secret';
const DEFAULT_STUDENT_PASSWORD = '123456';
const SEED_ADMIN_PASSWORD = '123456';
const EMAIL_CODE_TTL_MS = 10 * 60 * 1000;
const emailCodeStore = new Map<string, EmailCodeRecord>();

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

const getSmtpConfig = (): SmtpConfig => {
  const host = String(process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  const from = String(process.env.SMTP_FROM || user || 'noreply@dslp.local').trim();
  return { host, port, secure, user, pass, from };
};

const hasSmtpConfig = (config: SmtpConfig): boolean => (
  Boolean(config.host && config.port && config.user && config.pass)
);

const getMailTransporter = (config: SmtpConfig): nodemailer.Transporter => (
  nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  })
);

const SECTION_IDS = [
  '1.1', '1.2', '2.1', '2.2', '2.3', '2.4', '3.1', '3.2', '3.2.1', '3.2.2', '3.2.3',
  '4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9', '4.10',
  '5.1', '5.2.1', '5.2.2', '5.2.3', '5.3.1', '5.3.2', '5.3.3', '5.3.4', '5.4.1', '5.4.2', '5.4.3',
  '6.1', '6.2', '6.3', '6.4', '6.5',
  '7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '7.7', '7.8', '7.9', '7.10', '7.11'
];

const normalizeOjJudgeStatus = (rawStatus?: string): string | null => {
  const normalized = String(rawStatus || '').trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  if (['AC', 'WA', 'CE', 'RE', 'TLE', 'MLE', 'OLE', 'PE', 'N'].includes(normalized)) {
    return normalized;
  }

  if (normalized === 'ACCEPTED') return 'AC';
  if (normalized === 'WRONG ANSWER') return 'WA';
  if (normalized === 'COMPILE ERROR') return 'CE';
  if (normalized === 'RUNTIME ERROR') return 'RE';

  return normalized;
};

const resolveCodingProgress = (item?: {
  codingCompleted?: boolean;
  codingJudgeStatus?: string;
  ojVisited?: boolean;
}): {
  coding: boolean;
  codingJudgeStatus: string | null;
  ojVisited: boolean;
} => {
  const judgeStatus = normalizeOjJudgeStatus(item?.codingJudgeStatus);

  if (judgeStatus && judgeStatus !== 'N') {
    return {
      coding: judgeStatus === 'AC',
      codingJudgeStatus: judgeStatus,
      ojVisited: true
    };
  }

  if (item?.ojVisited) {
    return {
      coding: false,
      codingJudgeStatus: 'n',
      ojVisited: true
    };
  }

  return {
    coding: Boolean(item?.codingCompleted),
    codingJudgeStatus: null,
    ojVisited: false
  };
};

const toSafeUser = (user: {
  userId: string;
  role: Role;
  name: string;
  email?: string;
  classId?: string;
}) => ({
  userId: user.userId,
  role: user.role,
  name: user.name,
  email: user.email,
  classId: user.classId
});

const signToken = (user: { userId: string; role: Role; name: string }): string => (
  jwt.sign(
    { userId: user.userId, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
);

const authMiddleware = async (req: AuthRequest, res: express.Response, next: express.NextFunction): Promise<void> => {
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

const getYearString = (): string => String(new Date().getFullYear());
const pad3 = (value: number): string => String(value).padStart(3, '0');
const pad2 = (value: number): string => String(value).padStart(2, '0');
const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const normalizeCodeScope = (scope?: string): string => String(scope || '').trim();
const buildCodeKey = (email: string, purpose: EmailPurpose, scope?: string): string => (
  `${normalizeEmail(email)}::${purpose}::${normalizeCodeScope(scope)}`
);
const generateSixDigitCode = (): string => String(Math.floor(Math.random() * 1000000)).padStart(6, '0');

const issueEmailCode = (email: string, purpose: EmailPurpose, scope?: string): string => {
  const code = generateSixDigitCode();
  emailCodeStore.set(buildCodeKey(email, purpose, scope), {
    code,
    expiresAt: Date.now() + EMAIL_CODE_TTL_MS
  });
  return code;
};

const deleteEmailCode = (email: string, purpose: EmailPurpose, scope?: string): void => {
  emailCodeStore.delete(buildCodeKey(email, purpose, scope));
};

const getEmailPurposeLabel = (purpose: EmailPurpose): string => {
  if (purpose === 'signup') return '注册';
  if (purpose === 'reset-password') return '重置密码';
  return '绑定邮箱';
};

const sendVerificationCodeEmail = async (email: string, purpose: EmailPurpose, code: string): Promise<void> => {
  // 邮箱服务模拟逻辑
  if (!mailServiceMock.enabled) {
    const err: any = new Error('邮件服务已关闭（模拟）'); 
    err.__mockType = 'disabled'; 
    throw err; 
  }
  if (mailServiceMock.Error) {
    const err: any = new Error('邮件服务异常（模拟）'); 
    err.__mockType = 'error'; 
    throw err; 
  }
  const smtpConfig = getSmtpConfig();
  if (!hasSmtpConfig(smtpConfig)) {
    const err: any = new Error('邮件服务未配置，请设置 SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM');
    err.__mockType = 'disabled';
    throw err;
  }
  const purposeLabel = getEmailPurposeLabel(purpose);
  const transporter = getMailTransporter(smtpConfig);
  await transporter.sendMail({
    from: smtpConfig.from,
    to: email,
    subject: `DSLP ${purposeLabel}验证码`,
    text: `您的${purposeLabel}验证码是 ${code}，10分钟内有效。若非本人操作请忽略。`,
    html: `<p>您的<strong>${purposeLabel}</strong>验证码是：</p><p style="font-size:24px;font-weight:700;letter-spacing:3px;">${code}</p><p>该验证码 10 分钟内有效。若非本人操作请忽略。</p>`
  });
};

const verifyEmailCode = (
  email: string,
  purpose: EmailPurpose,
  code: string,
  consume = true,
  scope?: string
): boolean => {
  const key = buildCodeKey(email, purpose, scope);
  const record = emailCodeStore.get(key);
  if (!record) {
    return false;
  }

  if (Date.now() > record.expiresAt) {
    emailCodeStore.delete(key);
    return false;
  }

  if (record.code !== code) {
    return false;
  }

  if (consume) {
    emailCodeStore.delete(key);
  }

  return true;
};

const nextAdminId = async (): Promise<string> => {
  const latest = await User.findOne({ role: 'admin' }).sort({ userId: -1 }).lean();
  const nextNumber = latest?.userId ? Number.parseInt(latest.userId, 10) + 1 : 0;
  if (nextNumber > 999) {
    throw new Error('管理员ID已用尽');
  }
  return pad3(nextNumber);
};

const nextTeacherId = async (year: string): Promise<string> => {
  const teacherList = await User.find({
    role: 'teacher',
    userId: new RegExp(`^${year}\\d{3}$`)
  }).select({ userId: 1, _id: 0 }).lean();

  const occupied = new Set<number>();
  for (const item of teacherList) {
    const suffix = Number.parseInt(String(item.userId || '').slice(-3), 10);
    if (Number.isInteger(suffix) && suffix >= 0 && suffix <= 999) {
      occupied.add(suffix);
    }
  }

  // Reuse the first available suffix so deleted teacher IDs can be recycled.
  for (let candidate = 0; candidate <= 999; candidate += 1) {
    if (!occupied.has(candidate)) {
      return `${year}${pad3(candidate)}`;
    }
  }

  throw new Error(`教师ID在${year}年度已用尽`);
};

const nextClassId = async (teacherId: string): Promise<string> => {
  const classList = await TeachingClass.find({ teacherId }).select({ classId: 1, _id: 0 }).lean();
  const occupied = new Set<number>();

  for (const item of classList) {
    const suffix = Number.parseInt(String(item.classId || '').slice(-2), 10);
    if (Number.isInteger(suffix) && suffix >= 0 && suffix <= 99) {
      occupied.add(suffix);
    }
  }

  for (let candidate = 0; candidate <= 99; candidate += 1) {
    if (!occupied.has(candidate)) {
      return `${teacherId}${pad2(candidate)}`;
    }
  }

  throw new Error('每位教师最多创建100个教学班');
};

const nextStudentId = async (classId: string): Promise<string> => {
  const latest = await User.findOne({
    role: 'student',
    userId: new RegExp(`^${classId}\\d{3}$`)
  }).sort({ userId: -1 }).lean();
  const nextNumber = latest?.userId
    ? Number.parseInt(latest.userId.slice(-3), 10) + 1
    : 0;

  if (nextNumber > 999) {
    throw new Error('班内学生ID已满');
  }

  return `${classId}${pad3(nextNumber)}`;
};

const ensureSeedAdmin = async (): Promise<void> => {
  const existing = await User.findOne({ userId: '000', role: 'admin' }).lean();
  if (!existing) {
    const hashedPassword = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);
    await User.create({
      userId: '000',
      role: 'admin',
      name: 'System Admin',
      email: 'admin@dslp.local',
      password: hashedPassword,
      favoriteSections: [],
      sectionProgress: []
    });
  }
};

// 权限中间件：仅管理员可访问
function adminOnly(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未授权' });
    return void 0;
  }
  try {
    const token = auth.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === 'object' && payload.role === 'admin') {
      return next();
    }
    res.status(403).json({ success: false, error: '无权限' });
    return void 0;
  } catch {
    res.status(401).json({ success: false, error: '无效token' });
    return void 0;
  }
}

// 用户列表接口（仅管理员可见，不泄露敏感信息）
router.get('/', adminOnly, async (_req: express.Request, res: express.Response) => {
  // 可返回用户数量等非敏感信息，或实际用户列表（如有需求）
  const count = await User.countDocuments();
  res.json({ success: true, count });
  return void 0;
});

router.post('/email/send-code', async (req: express.Request, res: express.Response): Promise<void> => {
  const { email, purpose, userId } = req.body as { email?: string; purpose?: EmailPurpose; userId?: string };

  if (!email || !purpose || !['signup', 'reset-password', 'bind-email'].includes(purpose)) {
    res.status(400).json({ success: false, error: 'email/purpose 参数无效' } as APIResponse);
    return;
  }

  const normalizedEmail = normalizeEmail(email);

  let codeScope: string | undefined;

  if (purpose === 'reset-password') {
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId) {
      res.status(400).json({ success: false, error: 'reset-password 需要 userId 参数' } as APIResponse);
      return;
    }

    const user = await User.findOne({ email: normalizedEmail, userId: normalizedUserId }).lean();
    if (!user) {
      res.status(404).json({ success: false, error: '未找到该邮箱与用户ID的账号组合' } as APIResponse);
      return;
    }

    codeScope = normalizedUserId;
  }

  try {
    const code = issueEmailCode(normalizedEmail, purpose, codeScope);
    await sendVerificationCodeEmail(normalizedEmail, purpose, code);
    res.json({ success: true, message: '验证码已发送至邮箱' } as APIResponse);
  } catch (error: any) {
    deleteEmailCode(normalizedEmail, purpose, codeScope);
    if (error && error.__mockType === 'disabled') {
      res.status(503).json({ success: false, error: error.message || '邮件服务不可用' } as APIResponse);
    } else if (error && error.__mockType === 'error') {
      res.status(500).json({ success: false, error: error.message || '邮件服务异常' } as APIResponse);
    } else {
      res.status(500).json({ success: false, error: `验证码发送失败：${(error as Error).message}` } as APIResponse);
    }
  }
});

router.get('/signup-options', async (req: express.Request, res: express.Response): Promise<void> => {
  const teacherId = String(req.query.teacherId ?? '').trim();
  const teachers = await User.find({ role: 'teacher' }).sort({ userId: 1 }).lean();
  const classQuery = teacherId ? { teacherId } : {};
  const classes = await TeachingClass.find(classQuery).sort({ classId: 1 }).lean();

  res.json({
    success: true,
    data: {
      teachers: teachers.map((teacher) => ({ userId: teacher.userId, name: teacher.name })),
      classes: classes.map((item) => ({ classId: item.classId, teacherId: item.teacherId, name: item.name }))
    }
  } as APIResponse);
});

router.post('/register', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { role, name, email, password, verifyCode, teacherId, classId } = req.body as {
      role: Role;
      name?: string;
      email?: string;
      password?: string;
      verifyCode?: string;
      teacherId?: string;
      classId?: string;
    };

    if (!role || !name || !password || !email || !verifyCode) {
      res.status(400).json({ success: false, error: 'role/name/email/password/verifyCode 必填' } as APIResponse);
      return;
    }

    if (!['teacher', 'student'].includes(role)) {
      res.status(400).json({ success: false, error: '仅教师和学生可通过注册页面注册' } as APIResponse);
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    if (!verifyEmailCode(normalizedEmail, 'signup', verifyCode)) {
      res.status(400).json({ success: false, error: '邮箱验证码错误或已过期' } as APIResponse);
      return;
    }

    let userId: string;
    let targetClassId: string | undefined;

    if (role === 'teacher') {
      userId = await nextTeacherId(getYearString());
    } else {
      if (!teacherId || !classId) {
        res.status(400).json({ success: false, error: '学生注册必须选择教师和教学班' } as APIResponse);
        return;
      }

      const classDoc = await TeachingClass.findOne({ classId }).lean();
      if (!classDoc || classDoc.teacherId !== teacherId) {
        res.status(400).json({ success: false, error: '教师与教学班不匹配或不存在' } as APIResponse);
        return;
      }

      userId = await nextStudentId(classId);
      targetClassId = classId;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      userId,
      role,
      name,
      email: normalizedEmail,
      password: hashedPassword,
      classId: targetClassId,
      favoriteSections: [],
      sectionProgress: []
    });

    if (role === 'student' && targetClassId) {
      await TeachingClass.updateOne({ classId: targetClassId }, { $addToSet: { studentIds: user.userId } });
    }

    res.status(201).json({
      success: true,
      data: toSafeUser({
        userId: user.userId,
        role: user.role,
        name: user.name,
        email: user.email,
        classId: user.classId
      })
    } as APIResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as APIResponse);
  }
});

router.post('/password/send-reset-code', async (req: express.Request, res: express.Response): Promise<void> => {
  const { email, userId } = req.body as { email?: string; userId?: string };
  if (!email || !userId) {
    res.status(400).json({ success: false, error: 'email/userId 必填' } as APIResponse);
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedUserId = String(userId).trim();
  const user = await User.findOne({ email: normalizedEmail, userId: normalizedUserId }).lean();
  if (!user) {
    res.status(404).json({ success: false, error: '未找到该邮箱与用户ID的账号组合' } as APIResponse);
    return;
  }

  try {
    const code = issueEmailCode(normalizedEmail, 'reset-password', normalizedUserId);
    await sendVerificationCodeEmail(normalizedEmail, 'reset-password', code);
    res.json({ success: true, message: '重置密码验证码已发送至邮箱' } as APIResponse);
  } catch (error: any) {
    deleteEmailCode(normalizedEmail, 'reset-password', normalizedUserId);
    if (error && error.__mockType === 'disabled') {
      res.status(503).json({ success: false, error: error.message || '邮件服务不可用' } as APIResponse);
    } else if (error && error.__mockType === 'error') {
      res.status(500).json({ success: false, error: error.message || '邮件服务异常' } as APIResponse);
    } else {
      res.status(500).json({ success: false, error: `验证码发送失败：${(error as Error).message}` } as APIResponse);
    }
  }

});
// 邮箱服务模拟接口
router.post('/admin/mail-service-mock', (req: express.Request, res: express.Response) => {
  const { enabled, Error: Error } = req.body || {};
  if (typeof enabled === 'boolean') mailServiceMock.enabled = enabled;
  if (typeof Error === 'boolean') mailServiceMock.Error = Error;
  res.json({ success: true, mailServiceMock });
});
router.post('/admin/mail-service-mock', (req: express.Request, res: express.Response) => {
  const { enabled, Error: Error } = req.body || {};
  if (typeof enabled === 'boolean') mailServiceMock.enabled = enabled;
  if (typeof Error === 'boolean') mailServiceMock.Error = Error;
  res.json({ success: true, mailServiceMock });
});

router.post('/password/reset-by-email', async (req: express.Request, res: express.Response): Promise<void> => {
  const {
    email,
    userId,
    verifyCode,
    newPassword
  } = req.body as { email?: string; userId?: string; verifyCode?: string; newPassword?: string };
  if (!email || !userId || !verifyCode || !newPassword) {
    res.status(400).json({ success: false, error: 'email/userId/verifyCode/newPassword 必填' } as APIResponse);
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedUserId = String(userId).trim();
  const user = await User.findOne({ email: normalizedEmail, userId: normalizedUserId });
  if (!user) {
    res.status(404).json({ success: false, error: '未找到该邮箱与用户ID的账号组合' } as APIResponse);
    return;
  }

  if (!verifyEmailCode(normalizedEmail, 'reset-password', verifyCode, true, normalizedUserId)) {
    res.status(400).json({ success: false, error: '邮箱验证码错误或已过期' } as APIResponse);
    return;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ success: true, message: '密码重置成功' } as APIResponse);
});

router.post('/login', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    let { userId, password } = req.body as { userId: unknown; password: unknown };
    // 类型校验，防止注入
    if (typeof userId !== 'string' || typeof password !== 'string') {
      res.status(400).json({ success: false, error: 'userId 和 password 必须为字符串' });
      return;
    }
    userId = userId.trim();
    password = password.trim();
    if (!userId || !password) {
      res.status(400).json({ success: false, error: 'userId 和 password 必填' });
      return;
    }

    const user = await User.findOne({ userId });
    if (!user) {
      res.status(401).json({ success: false, error: '账号或密码错误' });
      return;
    }
    
    const matched = await bcrypt.compare(password as string, user.password);
    if (!matched) {
      res.status(401).json({ success: false, error: '账号或密码错误' });
      return;
    }

    const token = signToken({ userId: user.userId, role: user.role, name: user.name });
    res.json({
      success: true,
      data: {
        token,
        user: toSafeUser({
          userId: user.userId,
          role: user.role,
          name: user.name,
          email: user.email,
          classId: user.classId
        })
      }
    } as APIResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as APIResponse);
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: express.Response): Promise<void> => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const user = await User.findOne({ userId: currentUser.userId }).lean();
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' } as APIResponse);
    return;
  }

  res.json({
    success: true,
    data: toSafeUser({
      userId: user.userId,
      role: user.role,
      name: user.name,
      email: user.email,
      classId: user.classId
    })
  } as APIResponse);
});

router.put('/me/profile', authMiddleware, async (req: AuthRequest, res: express.Response): Promise<void> => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const { name, password } = req.body as { name?: string; password?: string };
  const updates: Record<string, unknown> = {};

  if (name && name.trim()) {
    updates.name = name.trim();
  }
  if (password && password.trim()) {
    updates.password = await bcrypt.hash(password, 10);
  }

  await User.updateOne({ userId: currentUser.userId }, { $set: updates });
  const user = await User.findOne({ userId: currentUser.userId }).lean();

  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' } as APIResponse);
    return;
  }

  res.json({
    success: true,
    data: toSafeUser({
      userId: user.userId,
      role: user.role,
      name: user.name,
      email: user.email,
      classId: user.classId
    })
  } as APIResponse);
});

router.post('/me/email/send-bind-code', authMiddleware, async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ success: false, error: 'email 必填' } as APIResponse);
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  const duplicated = await User.findOne({ email: normalizedEmail }).lean();
  if (duplicated && duplicated.userId !== req.authUser?.userId) {
    res.status(409).json({ success: false, error: '邮箱已被其他账号使用' } as APIResponse);
    return;
  }

  try {
    const code = issueEmailCode(normalizedEmail, 'bind-email');
    await sendVerificationCodeEmail(normalizedEmail, 'bind-email', code);
    res.json({ success: true, message: '邮箱绑定验证码已发送至邮箱' } as APIResponse);
  } catch (error) {
    deleteEmailCode(normalizedEmail, 'bind-email');
    res.status(500).json({ success: false, error: `验证码发送失败：${(error as Error).message}` } as APIResponse);
  }
});

router.post('/me/email/bind', authMiddleware, async (req: AuthRequest, res: express.Response): Promise<void> => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const { email, verifyCode } = req.body as { email?: string; verifyCode?: string };
  if (!email || !verifyCode) {
    res.status(400).json({ success: false, error: 'email/verifyCode 必填' } as APIResponse);
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  if (!verifyEmailCode(normalizedEmail, 'bind-email', verifyCode)) {
    res.status(400).json({ success: false, error: '邮箱验证码错误或已过期' } as APIResponse);
    return;
  }

  const duplicated = await User.findOne({ email: normalizedEmail }).lean();
  if (duplicated && duplicated.userId !== currentUser.userId) {
    res.status(409).json({ success: false, error: '邮箱已被其他账号使用' } as APIResponse);
    return;
  }

  await User.updateOne({ userId: currentUser.userId }, { $set: { email: normalizedEmail } });
  const user = await User.findOne({ userId: currentUser.userId }).lean();
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' } as APIResponse);
    return;
  }

  res.json({
    success: true,
    data: toSafeUser({ userId: user.userId, role: user.role, name: user.name, email: user.email, classId: user.classId })
  } as APIResponse);
});

router.get('/admins', authMiddleware, requireRoles('admin'), async (_req: AuthRequest, res: express.Response): Promise<void> => {
  const admins = await User.find({ role: 'admin' }).sort({ userId: 1 }).lean();
  res.json({
    success: true,
    data: admins.map((item) => toSafeUser({ userId: item.userId, role: item.role, name: item.name, email: item.email }))
  } as APIResponse);
});

router.post('/admins', authMiddleware, requireRoles('admin'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
  if (!name || !email || !password) {
    res.status(400).json({ success: false, error: 'name/email/password 必填' } as APIResponse);
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  const duplicated = await User.findOne({ email: normalizedEmail }).lean();
  if (duplicated) {
    res.status(409).json({ success: false, error: '邮箱已被使用' } as APIResponse);
    return;
  }

  const userId = await nextAdminId();
  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await User.create({
    userId,
    role: 'admin',
    name,
    email: normalizedEmail,
    password: hashedPassword,
    favoriteSections: [],
    sectionProgress: []
  });

  res.status(201).json({
    success: true,
    data: toSafeUser({ userId: admin.userId, role: admin.role, name: admin.name, email: admin.email })
  } as APIResponse);
});

router.delete('/admins/:userId', authMiddleware, requireRoles('admin'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { userId } = req.params;
  if (req.authUser?.userId === userId) {
    res.status(400).json({ success: false, error: '不能删除当前登录管理员' } as APIResponse);
    return;
  }

  const deleted = await User.deleteOne({ userId, role: 'admin' });
  if (!deleted.deletedCount) {
    res.status(404).json({ success: false, error: '管理员不存在' } as APIResponse);
    return;
  }

  res.json({ success: true, message: '管理员已删除' } as APIResponse);
});

router.get('/teachers', authMiddleware, requireRoles('admin'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const keyword = String(req.query.keyword ?? '').trim();
  const query = keyword
    ? {
      role: 'teacher',
      $or: [
        { userId: new RegExp(keyword, 'i') },
        { name: new RegExp(keyword, 'i') }
      ]
    }
    : { role: 'teacher' };

  const teachers = await User.find(query).sort({ userId: 1 }).lean();
  res.json({
    success: true,
    data: teachers.map((item) => toSafeUser({
      userId: item.userId,
      role: item.role,
      name: item.name,
      email: item.email
    }))
  } as APIResponse);
});

router.post('/teachers', authMiddleware, requireRoles('admin'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name) {
    res.status(400).json({ success: false, error: 'name 必填' } as APIResponse);
    return;
  }

  let normalizedEmail: string | undefined;
  if (email && email.trim()) {
    normalizedEmail = normalizeEmail(email);
    const duplicated = await User.findOne({ email: normalizedEmail }).lean();
    if (duplicated) {
      res.status(409).json({ success: false, error: '邮箱已被使用' } as APIResponse);
      return;
    }
  }

  const userId = await nextTeacherId(getYearString());
  const hashedPassword = await bcrypt.hash(password || DEFAULT_STUDENT_PASSWORD, 10);

  const teacher = await User.create({
    userId,
    role: 'teacher',
    name,
    email: normalizedEmail,
    password: hashedPassword,
    favoriteSections: [],
    sectionProgress: []
  });

  res.status(201).json({
    success: true,
    data: toSafeUser({ userId: teacher.userId, role: teacher.role, name: teacher.name, email: teacher.email })
  } as APIResponse);
});

router.put('/teachers/:userId', authMiddleware, requireRoles('admin'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { userId } = req.params;
  const { name, email } = req.body as { name?: string; email?: string };

  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (email) updates.email = normalizeEmail(email);

  await User.updateOne({ userId, role: 'teacher' }, { $set: updates });
  const teacher = await User.findOne({ userId, role: 'teacher' }).lean();
  if (!teacher) {
    res.status(404).json({ success: false, error: '教师不存在' } as APIResponse);
    return;
  }

  res.json({
    success: true,
    data: toSafeUser({ userId: teacher.userId, role: teacher.role, name: teacher.name, email: teacher.email })
  } as APIResponse);
});

router.post('/teachers/:userId/reset-password', authMiddleware, requireRoles('admin'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { userId } = req.params;
  const password = String(req.body?.password || DEFAULT_STUDENT_PASSWORD);
  const hashed = await bcrypt.hash(password, 10);
  await User.updateOne({ userId, role: 'teacher' }, { $set: { password: hashed } });
  res.json({ success: true, message: '教师密码已重置' } as APIResponse);
});

router.delete('/teachers/:userId', authMiddleware, requireRoles('admin'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { userId } = req.params;
  await User.deleteOne({ userId, role: 'teacher' });
  await TeachingClass.deleteMany({ teacherId: userId });
  res.json({ success: true, message: '教师已删除' } as APIResponse);
});

router.get('/students', authMiddleware, requireRoles('admin', 'teacher'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const keyword = String(req.query.keyword ?? '').trim();
  const classId = String(req.query.classId ?? '').trim();

  const baseQuery: Record<string, unknown> = { role: 'student' };
  if (keyword) {
    baseQuery.$or = [
      { userId: new RegExp(keyword, 'i') },
      { name: new RegExp(keyword, 'i') }
    ];
  }
  if (classId) {
    baseQuery.classId = classId;
  }

  if (req.authUser?.role === 'teacher') {
    const teacherClasses = await TeachingClass.find({ teacherId: req.authUser.userId }).lean();
    const teacherClassIds = teacherClasses.map((item) => item.classId);

    if (classId) {
      baseQuery.classId = teacherClassIds.includes(classId) ? classId : { $in: [] };
    } else {
      baseQuery.classId = { $in: teacherClassIds };
    }
  }

  const students = await User.find(baseQuery).sort({ userId: 1 }).lean();
  res.json({
    success: true,
    data: students.map((item) => toSafeUser({
      userId: item.userId,
      role: item.role,
      name: item.name,
      email: item.email,
      classId: item.classId
    }))
  } as APIResponse);
});

router.post('/students', authMiddleware, requireRoles('admin', 'teacher'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { name, classId, email, password } = req.body as { name?: string; classId?: string; email?: string; password?: string };

  if (!name || !classId) {
    res.status(400).json({ success: false, error: 'name/classId 必填' } as APIResponse);
    return;
  }

  const teachingClass = await TeachingClass.findOne({ classId }).lean();
  if (!teachingClass) {
    res.status(404).json({ success: false, error: '教学班不存在' } as APIResponse);
    return;
  }

  if (req.authUser?.role === 'teacher' && teachingClass.teacherId !== req.authUser.userId) {
    res.status(403).json({ success: false, error: '无权向该教学班添加学生' } as APIResponse);
    return;
  }

  let normalizedEmail: string | undefined;
  if (email && email.trim()) {
    normalizedEmail = normalizeEmail(email);
    const duplicated = await User.findOne({ email: normalizedEmail }).lean();
    if (duplicated) {
      res.status(409).json({ success: false, error: '邮箱已被使用' } as APIResponse);
      return;
    }
  }

  const userId = await nextStudentId(classId);
  const hashedPassword = await bcrypt.hash(password || DEFAULT_STUDENT_PASSWORD, 10);

  const student = await User.create({
    userId,
    role: 'student',
    name,
    email: normalizedEmail,
    password: hashedPassword,
    classId,
    favoriteSections: [],
    sectionProgress: []
  });

  await TeachingClass.updateOne({ classId }, { $addToSet: { studentIds: userId } });

  res.status(201).json({
    success: true,
    data: toSafeUser({
      userId: student.userId,
      role: student.role,
      name: student.name,
      email: student.email,
      classId: student.classId
    })
  } as APIResponse);
});

router.put('/students/:userId', authMiddleware, requireRoles('admin', 'teacher'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { userId } = req.params;
  const { name } = req.body as { name?: string };

  await User.updateOne({ userId, role: 'student' }, { $set: { name } });
  const student = await User.findOne({ userId, role: 'student' }).lean();

  if (!student) {
    res.status(404).json({ success: false, error: '学生不存在' } as APIResponse);
    return;
  }

  if (req.authUser?.role === 'teacher') {
    const teachingClass = await TeachingClass.findOne({ classId: student.classId, teacherId: req.authUser.userId }).lean();
    if (!teachingClass) {
      res.status(403).json({ success: false, error: '无权修改该学生' } as APIResponse);
      return;
    }
  }

  res.json({
    success: true,
    data: toSafeUser({ userId: student.userId, role: student.role, name: student.name, email: student.email, classId: student.classId })
  } as APIResponse);
});

router.post('/students/:userId/reset-password', authMiddleware, requireRoles('admin', 'teacher'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { userId } = req.params;
  const student = await User.findOne({ userId, role: 'student' }).lean();

  if (!student) {
    res.status(404).json({ success: false, error: '学生不存在' } as APIResponse);
    return;
  }

  if (req.authUser?.role === 'teacher') {
    const teachingClass = await TeachingClass.findOne({ classId: student.classId, teacherId: req.authUser.userId }).lean();
    if (!teachingClass) {
      res.status(403).json({ success: false, error: '无权重置该学生密码' } as APIResponse);
      return;
    }
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10);
  await User.updateOne({ userId, role: 'student' }, { $set: { password: hashedPassword } });
  res.json({ success: true, message: '学生密码已重置为123456' } as APIResponse);
});

router.delete('/students/:userId', authMiddleware, requireRoles('admin', 'teacher'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { userId } = req.params;
  const student = await User.findOne({ userId, role: 'student' }).lean();
  if (!student) {
    res.status(404).json({ success: false, error: '学生不存在' } as APIResponse);
    return;
  }

  if (req.authUser?.role === 'teacher') {
    const classOwned = await TeachingClass.findOne({ classId: student.classId, teacherId: req.authUser.userId }).lean();
    if (!classOwned) {
      res.status(403).json({ success: false, error: '无权删除该学生' } as APIResponse);
      return;
    }
  }

  await User.deleteOne({ userId, role: 'student' });
  if (student.classId) {
    await TeachingClass.updateOne({ classId: student.classId }, { $pull: { studentIds: userId } });
  }

  res.json({ success: true, message: '学生已删除' } as APIResponse);
});

router.get('/classes', authMiddleware, requireRoles('admin', 'teacher'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const teacherId = String(req.query.teacherId ?? '').trim();
  const query = req.authUser?.role === 'teacher'
    ? { teacherId: req.authUser.userId }
    : (teacherId ? { teacherId } : {});

  const classList = await TeachingClass.find(query).sort({ classId: 1 }).lean();
  res.json({ success: true, data: classList } as APIResponse);
});

router.post('/classes', authMiddleware, requireRoles('admin', 'teacher'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { name, teacherId } = req.body as { name: string; teacherId?: string };
  const actualTeacherId = req.authUser?.role === 'teacher' ? req.authUser.userId : teacherId;

  if (!name || !actualTeacherId) {
    res.status(400).json({ success: false, error: 'name/teacherId 必填' } as APIResponse);
    return;
  }

  const teacher = await User.findOne({ userId: actualTeacherId, role: 'teacher' }).lean();
  if (!teacher) {
    res.status(404).json({ success: false, error: '教师不存在' } as APIResponse);
    return;
  }

  const classId = await nextClassId(actualTeacherId);
  const classDoc = await TeachingClass.create({
    classId,
    teacherId: actualTeacherId,
    name,
    studentIds: []
  });

  res.status(201).json({ success: true, data: classDoc } as APIResponse);
});

router.put('/classes/:classId', authMiddleware, requireRoles('admin', 'teacher'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { classId } = req.params;
  const { name } = req.body as { name?: string };

  const nextName = String(name ?? '').trim();
  if (!nextName) {
    res.status(400).json({ success: false, error: 'name 必填' } as APIResponse);
    return;
  }

  const classDoc = await TeachingClass.findOne({ classId }).lean();
  if (!classDoc) {
    res.status(404).json({ success: false, error: '教学班不存在' } as APIResponse);
    return;
  }

  if (req.authUser?.role === 'teacher' && classDoc.teacherId !== req.authUser.userId) {
    res.status(403).json({ success: false, error: '无权修改该教学班' } as APIResponse);
    return;
  }

  await TeachingClass.updateOne({ classId }, { $set: { name: nextName } });
  const updated = await TeachingClass.findOne({ classId }).lean();
  res.json({ success: true, data: updated } as APIResponse);
});

router.delete('/classes/:classId', authMiddleware, requireRoles('admin', 'teacher'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { classId } = req.params;
  const classDoc = await TeachingClass.findOne({ classId }).lean();

  if (!classDoc) {
    res.status(404).json({ success: false, error: '教学班不存在' } as APIResponse);
    return;
  }

  if (req.authUser?.role === 'teacher' && classDoc.teacherId !== req.authUser.userId) {
    res.status(403).json({ success: false, error: '无权删除该教学班' } as APIResponse);
    return;
  }

  await TeachingClass.deleteOne({ classId });
  await User.updateMany({ classId, role: 'student' }, { $unset: { classId: '' } });
  res.json({ success: true, message: '教学班已删除' } as APIResponse);
});

router.post('/classes/:classId/students/import', authMiddleware, requireRoles('admin', 'teacher'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { classId } = req.params;
  const { names } = req.body as { names: string[] };

  if (!Array.isArray(names) || names.length === 0) {
    res.status(400).json({ success: false, error: 'names 必须是非空数组' } as APIResponse);
    return;
  }

  const classDoc = await TeachingClass.findOne({ classId }).lean();
  if (!classDoc) {
    res.status(404).json({ success: false, error: '教学班不存在' } as APIResponse);
    return;
  }

  if (req.authUser?.role === 'teacher' && classDoc.teacherId !== req.authUser.userId) {
    res.status(403).json({ success: false, error: '无权导入到该教学班' } as APIResponse);
    return;
  }

  const createdStudents: Array<{ userId: string; name: string; classId: string }> = [];
  for (const rawName of names) {
    const name = String(rawName || '').trim();
    if (!name) {
      continue;
    }

    const studentId = await nextStudentId(classId);
    const hashedPassword = await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10);
    await User.create({
      userId: studentId,
      role: 'student',
      name,
      password: hashedPassword,
      classId,
      favoriteSections: [],
      sectionProgress: []
    });
    createdStudents.push({ userId: studentId, name, classId });
    await TeachingClass.updateOne({ classId }, { $addToSet: { studentIds: studentId } });
  }

  res.status(201).json({ success: true, data: createdStudents } as APIResponse);
});

router.delete('/classes/:classId/students', authMiddleware, requireRoles('admin', 'teacher'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { classId } = req.params;
  const { studentIds } = req.body as { studentIds: string[] };

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    res.status(400).json({ success: false, error: 'studentIds 必须是非空数组' } as APIResponse);
    return;
  }

  const classDoc = await TeachingClass.findOne({ classId }).lean();
  if (!classDoc) {
    res.status(404).json({ success: false, error: '教学班不存在' } as APIResponse);
    return;
  }

  if (req.authUser?.role === 'teacher' && classDoc.teacherId !== req.authUser.userId) {
    res.status(403).json({ success: false, error: '无权移除该教学班学生' } as APIResponse);
    return;
  }

  await User.deleteMany({ role: 'student', classId, userId: { $in: studentIds } });
  await TeachingClass.updateOne({ classId }, { $pull: { studentIds: { $in: studentIds } } });

  res.json({ success: true, message: '学生移除成功' } as APIResponse);
});

router.get('/classes/:classId/students/:studentId/progress', authMiddleware, requireRoles('admin', 'teacher'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { classId, studentId } = req.params;
  const classDoc = await TeachingClass.findOne({ classId }).lean();
  if (!classDoc) {
    res.status(404).json({ success: false, error: '教学班不存在' } as APIResponse);
    return;
  }

  if (req.authUser?.role === 'teacher' && classDoc.teacherId !== req.authUser.userId) {
    res.status(403).json({ success: false, error: '无权查看该教学班学生' } as APIResponse);
    return;
  }

  const student = await User.findOne({ userId: studentId, role: 'student', classId }).lean();
  if (!student) {
    res.status(404).json({ success: false, error: '学生不存在' } as APIResponse);
    return;
  }

  const progressMap = new Map((student.sectionProgress || []).map((item) => [item.sectionId, item]));
  const rows = SECTION_IDS.map((sectionId) => {
    const item = progressMap.get(sectionId);
    const codingProgress = resolveCodingProgress(item);
    return {
      section: sectionId,
      theory: Boolean(item?.theoryCompleted),
      quiz: Boolean(item?.quizCompleted),
      coding: codingProgress.coding,
      ojVisited: codingProgress.ojVisited,
      quizScore: typeof item?.quizScore === 'number' ? item.quizScore : null,
      codingJudgeStatus: codingProgress.codingJudgeStatus
    };
  });

  res.json({
    success: true,
    data: {
      student: toSafeUser({
        userId: student.userId,
        role: student.role,
        name: student.name,
        email: student.email,
        classId: student.classId
      }),
      rows
    }
  } as APIResponse);
});

router.get('/classes/:classId/students/:studentId/practice-submissions', authMiddleware, requireRoles('admin', 'teacher'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { classId, studentId } = req.params;
  const sectionId = String(req.query.sectionId ?? '').trim();
  const rawLimit = Number(req.query.limit || 20);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;

  const classDoc = await TeachingClass.findOne({ classId }).lean();
  if (!classDoc) {
    res.status(404).json({ success: false, error: '教学班不存在' } as APIResponse);
    return;
  }

  if (req.authUser?.role === 'teacher' && classDoc.teacherId !== req.authUser.userId) {
    res.status(403).json({ success: false, error: '无权查看该教学班学生' } as APIResponse);
    return;
  }

  const student = await User.findOne({ userId: studentId, role: 'student', classId }).lean();
  if (!student) {
    res.status(404).json({ success: false, error: '学生不存在' } as APIResponse);
    return;
  }

  const query: Record<string, unknown> = { userId: studentId, classId };
  if (sectionId) {
    query.sectionId = sectionId;
  }

  const list = await OjSubmission.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const data = list.map((item) => ({
    ...item,
    result: {
      ...item.result,
      status: normalizeOjJudgeStatus(item.result?.status) || item.result?.status || 'N'
    }
  }));

  res.json({
    success: true,
    data: {
      student: toSafeUser({
        userId: student.userId,
        role: student.role,
        name: student.name,
        email: student.email,
        classId: student.classId
      }),
      submissions: data
    }
  } as APIResponse);
});

router.get('/classes/:classId/students/:studentId/quiz-submissions', authMiddleware, requireRoles('admin', 'teacher'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { classId, studentId } = req.params;
  const sectionId = String(req.query.sectionId ?? '').trim();
  const rawLimit = Number(req.query.limit || 20);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;

  const classDoc = await TeachingClass.findOne({ classId }).lean();
  if (!classDoc) {
    res.status(404).json({ success: false, error: '教学班不存在' } as APIResponse);
    return;
  }

  if (req.authUser?.role === 'teacher' && classDoc.teacherId !== req.authUser.userId) {
    res.status(403).json({ success: false, error: '无权查看该教学班学生' } as APIResponse);
    return;
  }

  const student = await User.findOne({ userId: studentId, role: 'student', classId }).lean();
  if (!student) {
    res.status(404).json({ success: false, error: '学生不存在' } as APIResponse);
    return;
  }

  const query: Record<string, unknown> = { userId: studentId, classId };
  if (sectionId) {
    query.sectionId = sectionId;
  }

  const submissions = await QuizSubmission.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json({
    success: true,
    data: {
      student: toSafeUser({
        userId: student.userId,
        role: student.role,
        name: student.name,
        email: student.email,
        classId: student.classId
      }),
      submissions
    }
  } as APIResponse);
});

router.get('/messages', authMiddleware, async (req: AuthRequest, res: express.Response): Promise<void> => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const list = await Message.find({ recipientId: currentUser.userId }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: list } as APIResponse);
});

router.post('/messages', authMiddleware, requireRoles('admin', 'teacher'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const { recipientId, title, content } = req.body as {
    recipientId: string;
    title: string;
    content: string;
  };

  if (!recipientId || !title || !content) {
    res.status(400).json({ success: false, error: 'recipientId/title/content 必填' } as APIResponse);
    return;
  }

  if (currentUser.role === 'teacher') {
    const recipient = await User.findOne({ userId: recipientId, role: 'student' }).lean();
    if (!recipient || !recipient.classId) {
      res.status(403).json({ success: false, error: '教师只能给本班学生发消息' } as APIResponse);
      return;
    }

    const teachingClass = await TeachingClass.findOne({ classId: recipient.classId, teacherId: currentUser.userId }).lean();
    if (!teachingClass) {
      res.status(403).json({ success: false, error: '教师只能给本班学生发消息' } as APIResponse);
      return;
    }
  }

  const message = await Message.create({
    recipientId,
    senderId: currentUser.userId,
    senderRole: currentUser.role,
    title,
    content,
    read: false
  });

  res.status(201).json({ success: true, data: message } as APIResponse);
});

router.get('/student/progress-table', authMiddleware, requireRoles('student'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const student = await User.findOne({ userId: currentUser.userId, role: 'student' }).lean();
  if (!student) {
    res.status(404).json({ success: false, error: '学生不存在' } as APIResponse);
    return;
  }

  const progressMap = new Map((student.sectionProgress || []).map((item) => [item.sectionId, item]));
  const rows = SECTION_IDS.map((sectionId) => {
    const item = progressMap.get(sectionId);
    const codingProgress = resolveCodingProgress(item);
    return {
      section: sectionId,
      theory: Boolean(item?.theoryCompleted),
      quiz: Boolean(item?.quizCompleted),
      coding: codingProgress.coding,
      ojVisited: codingProgress.ojVisited,
      quizScore: typeof item?.quizScore === 'number' ? item.quizScore : null,
      codingJudgeStatus: codingProgress.codingJudgeStatus
    };
  });

  res.json({ success: true, data: rows } as APIResponse);
});

router.post('/student/progress/:sectionId', authMiddleware, requireRoles('student'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const { sectionId } = req.params;
  const { theoryCompleted, quizCompleted, codingCompleted, ojVisited, quizScore, codingJudgeStatus } = req.body as {
    theoryCompleted?: boolean;
    quizCompleted?: boolean;
    codingCompleted?: boolean;
    ojVisited?: boolean;
    quizScore?: number;
    codingJudgeStatus?: string;
  };

  const student = await User.findOne({ userId: currentUser.userId, role: 'student' });
  if (!student) {
    res.status(404).json({ success: false, error: '学生不存在' } as APIResponse);
    return;
  }

  const found = student.sectionProgress.find((item) => item.sectionId === sectionId);
  if (found) {
    if (theoryCompleted !== undefined) found.theoryCompleted = theoryCompleted;
    if (quizCompleted !== undefined) found.quizCompleted = quizCompleted;
    if (codingCompleted !== undefined) found.codingCompleted = codingCompleted;
    if (ojVisited !== undefined) found.ojVisited = Boolean(ojVisited);
    if (quizScore !== undefined) found.quizScore = Number(quizScore);
    if (codingJudgeStatus !== undefined) {
      const normalizedStatus = normalizeOjJudgeStatus(codingJudgeStatus);
      found.codingJudgeStatus = normalizedStatus || undefined;
      if (normalizedStatus && normalizedStatus !== 'N') {
        found.codingCompleted = normalizedStatus === 'AC';
        found.ojVisited = true;
      }
      if (normalizedStatus === 'N') {
        found.codingCompleted = false;
        found.ojVisited = true;
      }
    }
  } else {
    const normalizedStatus = normalizeOjJudgeStatus(codingJudgeStatus);
    student.sectionProgress.push({
      sectionId,
      theoryCompleted: Boolean(theoryCompleted),
      quizCompleted: Boolean(quizCompleted),
      codingCompleted: normalizedStatus && normalizedStatus !== 'N' ? normalizedStatus === 'AC' : Boolean(codingCompleted),
      ojVisited: normalizedStatus ? true : Boolean(ojVisited),
      quizScore: quizScore !== undefined ? Number(quizScore) : undefined,
      codingJudgeStatus: normalizedStatus || undefined
    });
  }

  await student.save();
  res.json({ success: true, message: '学习进度已更新' } as APIResponse);
});

router.put('/students/:userId/progress', authMiddleware, requireRoles('admin'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const { userId } = req.params;
  const { rows } = req.body as {
    rows?: Array<{
      section: string;
      theory: boolean;
      quiz: boolean;
      coding: boolean;
      ojVisited?: boolean;
      quizScore?: number | null;
      codingJudgeStatus?: string | null;
    }>;
  };

  if (!Array.isArray(rows)) {
    res.status(400).json({ success: false, error: 'rows 必须是数组' } as APIResponse);
    return;
  }

  const student = await User.findOne({ userId, role: 'student' });
  if (!student) {
    res.status(404).json({ success: false, error: '学生不存在' } as APIResponse);
    return;
  }

  const rowMap = new Map<string, {
    theory: boolean;
    quiz: boolean;
    coding: boolean;
    ojVisited?: boolean;
    quizScore?: number | null;
    codingJudgeStatus?: string | null;
  }>();
  for (const row of rows) {
    const section = String(row?.section || '').trim();
    if (!section || !SECTION_IDS.includes(section)) {
      continue;
    }

    const normalizedStatus = normalizeOjJudgeStatus(String(row.codingJudgeStatus || ''));

    rowMap.set(section, {
      theory: Boolean(row.theory),
      quiz: Boolean(row.quiz),
      coding: Boolean(row.coding),
      ojVisited: row.ojVisited !== undefined ? Boolean(row.ojVisited) : undefined,
      quizScore: typeof row.quizScore === 'number' ? row.quizScore : null,
      codingJudgeStatus: normalizedStatus || null
    });
  }

  const currentProgressMap = new Map((student.sectionProgress || []).map((item) => [item.sectionId, item]));
  student.sectionProgress = SECTION_IDS.map((sectionId) => {
    const item = rowMap.get(sectionId);
    const oldItem = currentProgressMap.get(sectionId);
    return {
      sectionId,
      theoryCompleted: Boolean(item?.theory),
      quizCompleted: Boolean(item?.quiz),
      codingCompleted: item?.codingJudgeStatus && item.codingJudgeStatus !== 'N'
        ? String(item.codingJudgeStatus).toUpperCase() === 'AC'
        : Boolean(item?.coding),
      ojVisited: item?.ojVisited !== undefined
        ? Boolean(item.ojVisited)
        : item?.codingJudgeStatus !== undefined && item.codingJudgeStatus !== null
        ? true
        : Boolean(oldItem?.ojVisited),
      quizScore: item?.quizScore !== undefined && item?.quizScore !== null
        ? Number(item.quizScore)
        : oldItem?.quizScore,
      codingJudgeStatus: item?.codingJudgeStatus !== undefined && item?.codingJudgeStatus !== null
        ? String(item.codingJudgeStatus)
        : oldItem?.codingJudgeStatus
    };
  });

  await student.save();
  res.json({ success: true, message: '学生学习进度已更新' } as APIResponse);
});

router.get('/student/class-info', authMiddleware, requireRoles('student'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const student = await User.findOne({ userId: currentUser.userId, role: 'student' }).lean();
  if (!student) {
    res.status(404).json({ success: false, error: '学生不存在' } as APIResponse);
    return;
  }

  if (!student.classId) {
    res.json({
      success: true,
      data: {
        classId: null,
        className: null,
        teacherId: null,
        teacherName: null
      }
    } as APIResponse);
    return;
  }

  const classDoc = await TeachingClass.findOne({ classId: student.classId }).lean();
  if (!classDoc) {
    res.json({
      success: true,
      data: {
        classId: student.classId,
        className: null,
        teacherId: null,
        teacherName: null
      }
    } as APIResponse);
    return;
  }

  const teacher = await User.findOne({ userId: classDoc.teacherId, role: 'teacher' }).lean();
  res.json({
    success: true,
    data: {
      classId: classDoc.classId,
      className: classDoc.name,
      teacherId: classDoc.teacherId,
      teacherName: teacher?.name || null
    }
  } as APIResponse);
});

router.get('/student/favorites', authMiddleware, requireRoles('student'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const student = await User.findOne({ userId: currentUser.userId, role: 'student' }).lean();
  if (!student) {
    res.status(404).json({ success: false, error: '学生不存在' } as APIResponse);
    return;
  }

  res.json({ success: true, data: student.favoriteSections || [] } as APIResponse);
});

router.post('/student/favorites/:sectionId/toggle', authMiddleware, requireRoles('student'), async (req: AuthRequest, res: express.Response): Promise<void> => {
  const currentUser = req.authUser;
  if (!currentUser) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as APIResponse);
    return;
  }

  const { sectionId } = req.params;
  const student = await User.findOne({ userId: currentUser.userId, role: 'student' });
  if (!student) {
    res.status(404).json({ success: false, error: '学生不存在' } as APIResponse);
    return;
  }

  const existed = student.favoriteSections.includes(sectionId);
  if (existed) {
    student.favoriteSections = student.favoriteSections.filter((item) => item !== sectionId);
  } else {
    student.favoriteSections.push(sectionId);
  }

  await student.save();
  res.json({ success: true, data: { favoriteSections: student.favoriteSections, toggledOn: !existed } } as APIResponse);
});

export default router;
