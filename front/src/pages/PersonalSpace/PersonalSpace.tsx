import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Layout,
  Menu,
  Card,
  Typography,
  Form,
  Input,
  Button,
  message,
  Table,
  Space,
  Modal,
  List,
  Tag,
  Checkbox,
  Row,
  Col,
  AutoComplete,
  Select
} from 'antd';
import { StarFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService, { type AuthUser, type TeachingClass, type MessageItem, type StudentClassInfo, type SectionProgressRow } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { isPracticeNotApplicableSection, isTrackableSectionId, renderCodingProgressDisplay, renderQuizProgressDisplay } from '../../utils/progressDisplay';
import './PersonalSpace.css';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

type CatalogSection = {
  id: string;
  title: string;
};

type CatalogChapter = {
  id: string;
  sections: CatalogSection[];
};

const parseFavoriteKey = (key: string): { chapterId: string; sectionId: string } | null => {
  const match = String(key).match(/^([^:]+):(.+)$/);
  if (!match) {
    return null;
  }

  return {
    chapterId: match[1],
    sectionId: match[2]
  };
};

const resolveTrackableSectionId = (rawSectionId: string, title: string): string | null => {
  const normalizedRaw = String(rawSectionId || '').trim();
  if (isTrackableSectionId(normalizedRaw)) {
    return normalizedRaw;
  }

  const fromRawMatch = normalizedRaw.match(/\d+(?:\.\d+)+/);
  if (fromRawMatch && isTrackableSectionId(fromRawMatch[0])) {
    return fromRawMatch[0];
  }

  const normalizedTitle = String(title || '').trim();
  const fromTitleMatch = normalizedTitle.match(/\d+(?:\.\d+)+/);
  if (fromTitleMatch && isTrackableSectionId(fromTitleMatch[0])) {
    return fromTitleMatch[0];
  }

  return null;
};

type EditableTestCase = {
  input: string;
  output: string;
};

type PracticeEditFormValues = {
  classId: string;
  sectionId: string;
  title: string;
  description: string;
  inputDescription: string;
  outputDescription: string;
  sampleInput: string;
  sampleOutput: string;
  dataRange: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  stackLimitKb: number;
  testCases: EditableTestCase[];
};

type QuizEditableQuestion = {
  id?: string;
  type: 'multiple-choice' | 'true-false';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

type QuizEditFormValues = {
  classId: string;
  sectionId: string;
  questions: QuizEditableQuestion[];
};

type QuizEditableQuestionSource = {
  id?: string;
  type?: 'multiple-choice' | 'true-false';
  question?: string;
  options?: unknown;
  correctAnswer?: unknown;
  explanation?: string;
};

const PersonalSpace: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [selectedKey, setSelectedKey] = useState('profile');
  const [savingProfile, setSavingProfile] = useState(false);

  const [teachers, setTeachers] = useState<AuthUser[]>([]);
  const [admins, setAdmins] = useState<AuthUser[]>([]);
  const [students, setStudents] = useState<AuthUser[]>([]);
  const [classes, setClasses] = useState<TeachingClass[]>([]);
  const [messagesData, setMessagesData] = useState<MessageItem[]>([]);
  const [progressRows, setProgressRows] = useState<SectionProgressRow[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [studentClassInfo, setStudentClassInfo] = useState<StudentClassInfo | null>(null);
  const [catalog, setCatalog] = useState<CatalogChapter[]>([]);

  const [teacherKeyword, setTeacherKeyword] = useState('');
  const [studentKeyword, setStudentKeyword] = useState('');

  const [viewProgressOpen, setViewProgressOpen] = useState(false);
  const [viewProgressData, setViewProgressData] = useState<{ student?: AuthUser; rows: SectionProgressRow[] }>({ rows: [] });
  const [savingStudentProgress, setSavingStudentProgress] = useState(false);
  const [practiceEditOpen, setPracticeEditOpen] = useState(false);
  const [practiceEditLoading, setPracticeEditLoading] = useState(false);
  const [practiceEditSaving, setPracticeEditSaving] = useState(false);
  const [practiceEditClassId, setPracticeEditClassId] = useState('');
  const [practiceEditSectionId, setPracticeEditSectionId] = useState('');
  const [practiceEditStarterCode, setPracticeEditStarterCode] = useState<{ cpp: string; java: string; typescript: string }>({ cpp: '', java: '', typescript: '' });
  const [practiceEditDefaultLanguage, setPracticeEditDefaultLanguage] = useState<'cpp' | 'java' | 'typescript'>('cpp');
  const [quizEditOpen, setQuizEditOpen] = useState(false);
  const [quizEditLoading, setQuizEditLoading] = useState(false);
  const [quizEditSaving, setQuizEditSaving] = useState(false);
  const [quizEditClassId, setQuizEditClassId] = useState('');
  const [quizEditSectionId, setQuizEditSectionId] = useState('');

  const [addTeacherForm] = Form.useForm();
  const [addAdminForm] = Form.useForm();
  const [adminCreateClassForm] = Form.useForm();
  const [addStudentForm] = Form.useForm();
  const [createClassForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [bindEmailForm] = Form.useForm();
  const [practiceEditForm] = Form.useForm<PracticeEditFormValues>();
  const [quizEditForm] = Form.useForm<QuizEditFormValues>();

  const sectionTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const chapter of catalog) {
      for (const section of chapter.sections) {
        map.set(`${chapter.id}:${section.id}`, `${section.id} ${section.title}`);
      }
    }
    return map;
  }, [catalog]);

  const sectionCards = useMemo(() => (
    catalog.flatMap((chapter) => chapter.sections.map((section) => {
      const rawSectionId = section.id;
      const resolvedSectionId = resolveTrackableSectionId(rawSectionId, section.title);
      return {
        rawSectionId,
        resolvedSectionId,
        title: section.title,
        hasQuiz: Boolean(resolvedSectionId),
        hasPractice: resolvedSectionId ? !isPracticeNotApplicableSection(resolvedSectionId) : false
      };
    }))
  ), [catalog]);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const result = await apiService.getCourseCatalog();
        if (result.success && result.data) {
          setCatalog(result.data as CatalogChapter[]);
        }
      } catch {
        // keep empty catalog on failure, personal space still works
      }
    };

    void loadCatalog();
  }, []);

  const menuItems = useMemo(() => {
    if (user?.role === 'admin') {
      return [
        { key: 'profile', label: '个人信息' },
        { key: 'admin', label: '管理员管理' },
        { key: 'teacher', label: '教师管理' },
        { key: 'student', label: '学生管理' },
        { key: 'teaching-settings', label: '教学设置' }
      ];
    }

    if (user?.role === 'teacher') {
      return [
        { key: 'profile', label: '个人信息' },
        { key: 'class', label: '教学管理' },
        { key: 'teaching-settings', label: '教学设置' },
        { key: 'message', label: '信息接收' }
      ];
    }

    return [
      { key: 'profile', label: '个人信息' },
      { key: 'progress', label: '学习进度' },
      { key: 'message', label: '信息接收' },
      { key: 'favorite', label: '收藏列表' }
    ];
  }, [user?.role]);

  const refreshBasicData = useCallback(async () => {
    if (!user) return;

    try {
      if (user.role === 'admin') {
        const [adminResult, teacherResult, studentResult, classResult] = await Promise.all([
          apiService.getAdmins(),
          apiService.getTeachers(teacherKeyword || undefined),
          apiService.getStudents({ keyword: studentKeyword || undefined }),
          apiService.getClasses()
        ]);

        setAdmins(adminResult.data || []);
        setTeachers(teacherResult.data || []);
        setStudents(studentResult.data || []);
        setClasses(classResult.data || []);
      }

      if (user.role === 'teacher') {
        const [classResult, messageResult] = await Promise.all([
          apiService.getClasses(),
          apiService.getMessages()
        ]);
        setClasses(classResult.data || []);
        setMessagesData(messageResult.data || []);
      }

      if (user.role === 'student') {
        const [messageResult, progressResult, favoriteResult, classInfoResult] = await Promise.all([
          apiService.getMessages(),
          apiService.getStudentProgressTable(),
          apiService.getFavorites(),
          apiService.getStudentClassInfo()
        ]);
        setMessagesData(messageResult.data || []);
        setProgressRows(progressResult.data || []);
        setFavorites(favoriteResult.data || []);
        setStudentClassInfo(classInfoResult.data || null);
      }
    } catch {
      message.error('加载个人空间数据失败');
    }
  }, [user, teacherKeyword, studentKeyword]);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({ name: user.name, email: user.email || '' });
      void refreshBasicData();
    }
  }, [user, profileForm, refreshBasicData]);

  const handleSaveProfile = async (values: { name?: string; password?: string }) => {
    try {
      setSavingProfile(true);
      const result = await apiService.updateProfile(values);
      if (result.success && result.data) {
        message.success('个人信息已更新');
        useAuthStore.setState({ user: result.data });
        profileForm.setFieldsValue({ name: result.data.name, email: result.data.email || '' });
      } else {
        message.error(result.error || '更新失败');
      }
    } catch {
      message.error('更新失败');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendBindEmailCode = async () => {
    const email = String(bindEmailForm.getFieldValue('email') || '').trim();
    if (!email) {
      message.warning('请先输入邮箱');
      return;
    }

    const result = await apiService.sendBindEmailCode(email);
    if (result.success) {
        message.success('验证码已发送至邮箱，请查收');
    } else {
      message.error(result.error || '发送失败');
    }
  };

  const handleBindEmail = async (values: { email: string; verifyCode: string }) => {
    const result = await apiService.bindEmail(values);
    if (result.success && result.data) {
      useAuthStore.setState({ user: result.data });
      profileForm.setFieldsValue({ email: result.data.email || '' });
      bindEmailForm.resetFields();
      message.success('邮箱绑定成功');
    } else {
      message.error(result.error || '绑定失败');
    }
  };

  const handleAddAdmin = async (values: { name: string; email: string; password: string }) => {
    const result = await apiService.createAdmin(values);
    if (result.success) {
      message.success(`管理员创建成功：${result.data?.userId}`);
      addAdminForm.resetFields();
      await refreshBasicData();
    } else {
      message.error(result.error || '创建管理员失败');
    }
  };

  const handleAddTeacher = async (values: { name: string; email: string; password?: string }) => {
    try {
      const result = await apiService.createTeacher(values);
      if (result.success) {
        message.success(`教师创建成功：${result.data?.userId}`);
        addTeacherForm.resetFields();
        await refreshBasicData();
      } else {
        message.error(result.error || '创建教师失败');
      }
    } catch {
      message.error('创建教师失败');
    }
  };

  const handleAddStudent = async (values: { name: string; classId: string; email?: string; password?: string }) => {
    try {
      const result = await apiService.createStudent(values);
      if (result.success) {
        message.success(`学生创建成功：${result.data?.userId}`);
        addStudentForm.resetFields();
        await refreshBasicData();
      } else {
        message.error(result.error || '创建学生失败');
      }
    } catch {
      message.error('创建学生失败');
    }
  };

  const handleCreateClass = async (values: { name: string }) => {
    try {
      const result = await apiService.createClass({ name: values.name });
      if (result.success && result.data) {
        message.success(`教学班创建成功：${result.data.classId}`);
        createClassForm.resetFields();
        await refreshBasicData();
      } else {
        message.error(result.error || '创建教学班失败');
      }
    } catch {
      message.error('创建教学班失败');
    }
  };

  const openStudentProgressModal = async (student: AuthUser) => {
    if (!student.classId) {
      message.warning('该学生没有关联教学班');
      return;
    }

    try {
      const result = await apiService.getStudentProgressInClass(student.classId, student.userId);
      if (result.success && result.data) {
        setViewProgressData({ student: result.data.student, rows: result.data.rows || [] });
        setViewProgressOpen(true);
      } else {
        message.error(result.error || '查询学习进度失败');
      }
    } catch {
      message.error('查询学习进度失败');
    }
  };

  const updateStudentProgressCell = (section: string, field: 'theory' | 'quiz' | 'coding', checked: boolean) => {
    setViewProgressData((prev) => ({
      ...prev,
      rows: prev.rows.map((item) => {
        if (item.section !== section) {
          return item;
        }
        return { ...item, [field]: checked };
      })
    }));
  };

  const handleSaveStudentProgress = async () => {
    const studentId = viewProgressData.student?.userId;
    if (!studentId) {
      message.warning('未选择学生');
      return;
    }

    try {
      setSavingStudentProgress(true);
      const result = await apiService.updateStudentProgressByAdmin(studentId, viewProgressData.rows);
      if (result.success) {
        message.success('学习进度修改已保存');
        setViewProgressOpen(false);
      } else {
        message.error(result.error || '保存失败');
      }
    } catch {
      message.error('保存失败');
    } finally {
      setSavingStudentProgress(false);
    }
  };

  const ensureAtLeastFiveTestCases = (rawCases: Array<{ input: string; output: string }>): Array<{ input: string; output: string }> => {
    const trimmed = rawCases
      .map((item) => ({ input: String(item?.input || ''), output: String(item?.output || '') }))
      .filter((item) => item.input.trim() || item.output.trim());

    while (trimmed.length < 5) {
      trimmed.push({ input: '', output: '' });
    }

    return trimmed;
  };

  const normalizeQuizQuestionForForm = (raw: QuizEditableQuestionSource, index: number): QuizEditableQuestion => {
    const rawType = raw.type === 'true-false' ? 'true-false' : 'multiple-choice';
    const question = String(raw.question || '').trim();
    const explanation = String(raw.explanation || '').trim();

    if (rawType === 'true-false') {
      const normalizedAnswer = typeof raw.correctAnswer === 'boolean'
        ? (raw.correctAnswer ? 'yes' : 'no')
        : String(raw.correctAnswer || '').trim().toLowerCase() === 'no' || String(raw.correctAnswer || '').trim() === '1'
          ? 'no'
          : 'yes';
      return {
        id: raw.id || `q_edit_${Date.now()}_${index}`,
        type: 'true-false',
        question,
        options: ['yes', 'no'],
        correctAnswer: normalizedAnswer,
        explanation
      };
    }

    const options = Array.isArray(raw.options)
      ? raw.options.map((item) => String(item || '').trim()).filter(Boolean)
      : [];
    const normalizedOptions = options.length >= 2 ? options : ['选项A', '选项B'];
    const answerIndex = Number(raw.correctAnswer);
    const normalizedAnswer = Number.isInteger(answerIndex) && answerIndex >= 0 && answerIndex < normalizedOptions.length
      ? normalizedOptions[answerIndex]
      : String(raw.correctAnswer || normalizedOptions[0] || '').trim();

    return {
      id: raw.id || `q_edit_${Date.now()}_${index}`,
      type: 'multiple-choice',
      question,
      options: normalizedOptions,
      correctAnswer: normalizedAnswer,
      explanation
    };
  };

  const ensureAtLeastFiveQuizQuestions = (rawQuestions: QuizEditableQuestionSource[]): QuizEditableQuestion[] => {
    const normalized = rawQuestions.map((item, index) => normalizeQuizQuestionForForm(item, index));

    while (normalized.length < 5) {
      const seq = normalized.length + 1;
      normalized.push({
        id: `q_new_${Date.now()}_${seq}`,
        type: 'multiple-choice',
        question: '',
        options: ['选项A', '选项B'],
        correctAnswer: '选项A',
        explanation: ''
      });
    }

    return normalized;
  };

  const loadPracticeEditProblem = async (sectionId: string, classId: string) => {
    setPracticeEditLoading(true);
    try {
      const result = await apiService.getOjProblem(sectionId, classId);
      if (!result.success || !result.data) {
        message.error(result.error || '加载题目失败');
        return;
      }

      const payload = result.data.problem;
      setPracticeEditStarterCode(payload.starterCode);
      setPracticeEditDefaultLanguage(payload.defaultLanguage === 'python' ? 'cpp' : payload.defaultLanguage);
      practiceEditForm.setFieldsValue({
        classId,
        sectionId,
        title: payload.title,
        description: payload.description,
        inputDescription: payload.inputDescription,
        outputDescription: payload.outputDescription,
        sampleInput: payload.sampleInput,
        sampleOutput: payload.sampleOutput,
        dataRange: payload.dataRange,
        timeLimitMs: payload.constraints.timeLimitMs,
        memoryLimitMb: payload.constraints.memoryLimitMb,
        stackLimitKb: payload.constraints.stackLimitKb,
        testCases: ensureAtLeastFiveTestCases(payload.testCases || [])
      });
    } finally {
      setPracticeEditLoading(false);
    }
  };

  const openPracticeEditModal = async (sectionId: string) => {
    if (!classes.length) {
      message.warning('请先创建或选择教学班');
      return;
    }

    const initialClassId = practiceEditClassId || classes[0].classId;
    setPracticeEditSectionId(sectionId);
    setPracticeEditClassId(initialClassId);
    setPracticeEditOpen(true);
    await loadPracticeEditProblem(sectionId, initialClassId);
  };

  const handlePracticeEditClassChange = async (value: string) => {
    const nextClassId = String(value || '').trim();
    setPracticeEditClassId(nextClassId);
    practiceEditForm.setFieldValue('classId', nextClassId);
    if (nextClassId && practiceEditSectionId) {
      await loadPracticeEditProblem(practiceEditSectionId, nextClassId);
    }
  };

  const handlePracticeEditSectionChange = async (value: string) => {
    const nextSectionId = String(value || '').trim();
    setPracticeEditSectionId(nextSectionId);
    practiceEditForm.setFieldValue('sectionId', nextSectionId);
    if (practiceEditClassId && nextSectionId) {
      await loadPracticeEditProblem(nextSectionId, practiceEditClassId);
    }
  };

  const handleSavePracticeEdit = async (values: PracticeEditFormValues) => {
    const classId = String(values.classId || '').trim();
    const sectionId = String(values.sectionId || '').trim();
    if (!classId || !sectionId) {
      message.warning('请先选择教学班和小节');
      return;
    }

    const testCases = ensureAtLeastFiveTestCases(values.testCases || []);
    const completedCases = testCases.filter((item) => item.input.trim() && item.output.trim());
    if (completedCases.length < 5) {
      message.warning('至少填写5组有效输入输出测试数据');
      return;
    }

    setPracticeEditSaving(true);
    try {
      const result = await apiService.saveOjClassOverride(sectionId, classId, {
        title: values.title,
        description: values.description,
        inputDescription: values.inputDescription,
        outputDescription: values.outputDescription,
        sampleInput: values.sampleInput,
        sampleOutput: values.sampleOutput,
        dataRange: values.dataRange,
        constraints: {
          timeLimitMs: Number(values.timeLimitMs),
          memoryLimitMb: Number(values.memoryLimitMb),
          stackLimitKb: Number(values.stackLimitKb)
        },
        testCases: completedCases,
        source: 'custom',
        defaultLanguage: practiceEditDefaultLanguage,
        starterCode: practiceEditStarterCode
      });

      if (result.success) {
        message.success('practice题目修改已保存');
        setPracticeEditOpen(false);
      } else {
        message.error(result.error || '保存失败');
      }
    } finally {
      setPracticeEditSaving(false);
    }
  };

  const loadQuizEditProblem = async (sectionId: string, classId: string) => {
    setQuizEditLoading(true);
    try {
      const result = await apiService.getQuizProblem(sectionId, classId);
      if (!result.success || !result.data) {
        message.error(result.error || '加载quiz题目失败');
        return;
      }

      const nextQuestions = ensureAtLeastFiveQuizQuestions(result.data.questions || []);
      quizEditForm.setFieldsValue({
        classId,
        sectionId,
        questions: nextQuestions
      });
    } finally {
      setQuizEditLoading(false);
    }
  };

  const openQuizEditModal = async (sectionId: string) => {
    if (!classes.length) {
      message.warning('请先创建或选择教学班');
      return;
    }

    const initialClassId = quizEditClassId || classes[0].classId;
    setQuizEditSectionId(sectionId);
    setQuizEditClassId(initialClassId);
    setQuizEditOpen(true);
    await loadQuizEditProblem(sectionId, initialClassId);
  };

  const handleQuizEditClassChange = async (value: string) => {
    const nextClassId = String(value || '').trim();
    setQuizEditClassId(nextClassId);
    quizEditForm.setFieldValue('classId', nextClassId);
    if (nextClassId && quizEditSectionId) {
      await loadQuizEditProblem(quizEditSectionId, nextClassId);
    }
  };

  const handleQuizEditSectionChange = async (value: string) => {
    const nextSectionId = String(value || '').trim();
    setQuizEditSectionId(nextSectionId);
    quizEditForm.setFieldValue('sectionId', nextSectionId);
    if (quizEditClassId && nextSectionId) {
      await loadQuizEditProblem(nextSectionId, quizEditClassId);
    }
  };

  const handleQuizQuestionTypeChange = (index: number, nextType: 'multiple-choice' | 'true-false') => {
    const currentQuestions = quizEditForm.getFieldValue('questions') as QuizEditableQuestion[] || [];
    const nextQuestions = currentQuestions.map((item, itemIndex) => {
      if (itemIndex !== index) {
        return item;
      }

      if (nextType === 'true-false') {
        return {
          ...item,
          type: 'true-false' as const,
          options: ['yes', 'no'],
          correctAnswer: 'yes'
        };
      }

      const options = Array.isArray(item.options)
        ? item.options.map((option) => String(option || '').trim()).filter(Boolean)
        : [];
      const normalizedOptions = options.length >= 2 ? options : ['选项A', '选项B'];
      const answerText = String(item.correctAnswer || '').trim();
      return {
        ...item,
        type: 'multiple-choice' as const,
        options: normalizedOptions,
        correctAnswer: answerText || normalizedOptions[0]
      };
    });

    quizEditForm.setFieldValue('questions', nextQuestions);
  };

  const parseTrueFalseAnswerFromText = (raw: string): boolean | null => {
    const value = String(raw || '').trim().toLowerCase();
    if (['yes', 'y', 'true', '1', '是', '对', '正确'].includes(value)) {
      return true;
    }
    if (['no', 'n', 'false', '0', '否', '错', '错误'].includes(value)) {
      return false;
    }
    return null;
  };

  const resolveChoiceAnswerIndexFromText = (answerText: string, options: string[]): number => {
    const normalizedAnswer = String(answerText || '').trim();
    if (!normalizedAnswer) {
      return -1;
    }

    const directIndex = options.findIndex((option) => option === normalizedAnswer);
    if (directIndex >= 0) {
      return directIndex;
    }

    const caseInsensitiveIndex = options.findIndex((option) => option.toLowerCase() === normalizedAnswer.toLowerCase());
    if (caseInsensitiveIndex >= 0) {
      return caseInsensitiveIndex;
    }

    const normalizedCompact = normalizedAnswer.replace(/^\s*[A-Za-z]\s*[.|、:：-]?\s*/, '').trim();
    if (normalizedCompact && normalizedCompact !== normalizedAnswer) {
      const compactIndex = options.findIndex((option) => option.toLowerCase() === normalizedCompact.toLowerCase());
      if (compactIndex >= 0) {
        return compactIndex;
      }
    }

    const numberedTextMatch = normalizedAnswer.match(/^\s*(\d+)\s*[.|、:：-]\s*(.+)$/);
    if (numberedTextMatch) {
      const idx = Number(numberedTextMatch[1]) - 1;
      if (Number.isInteger(idx) && idx >= 0 && idx < options.length) {
        return idx;
      }
      const trailing = String(numberedTextMatch[2] || '').trim();
      if (trailing) {
        const trailingIndex = options.findIndex((option) => option.toLowerCase() === trailing.toLowerCase());
        if (trailingIndex >= 0) {
          return trailingIndex;
        }
      }
    }

    const pureNumberMatch = normalizedAnswer.match(/^\d+$/);
    if (pureNumberMatch) {
      const idx = Number(normalizedAnswer) - 1;
      if (Number.isInteger(idx) && idx >= 0 && idx < options.length) {
        return idx;
      }
    }

    const letterMatch = normalizedAnswer.match(/^[A-Za-z]$/);
    if (letterMatch) {
      const idx = normalizedAnswer.toUpperCase().charCodeAt(0) - 65;
      if (idx >= 0 && idx < options.length) {
        return idx;
      }
    }

    return -1;
  };

  const handleSaveQuizEdit = async (values: QuizEditFormValues) => {
    const classId = String(values.classId || '').trim();
    const sectionId = String(values.sectionId || '').trim();
    if (!classId || !sectionId) {
      message.warning('请先选择教学班和小节');
      return;
    }

    const rawQuestions = Array.isArray(values.questions) ? values.questions : [];
    if (rawQuestions.length < 5) {
      message.warning('至少提供5道题目');
      return;
    }

    const normalizedPayload: Array<{
      id: string;
      type: 'multiple-choice' | 'true-false';
      question: string;
      options: string[];
      correctAnswer: number | boolean;
      explanation: string;
    }> = [];

    for (let index = 0; index < rawQuestions.length; index += 1) {
      const item = rawQuestions[index];
      const questionText = String(item?.question || '').trim();
      if (!questionText) {
        message.warning(`第${index + 1}题缺少题目描述`);
        return;
      }

      if (item.type === 'true-false') {
        const answerText = String(item.correctAnswer || '').trim();
        const parsedTrueFalse = parseTrueFalseAnswerFromText(answerText);
        if (parsedTrueFalse === null) {
          message.warning(`第${index + 1}题为判断题时，答案请输入 yes/no（也支持 是/否、true/false）`);
          return;
        }

        normalizedPayload.push({
          id: String(item.id || `q_save_${Date.now()}_${index}`),
          type: 'true-false',
          question: questionText,
          options: ['yes', 'no'],
          correctAnswer: parsedTrueFalse,
          explanation: String(item.explanation || '').trim()
        });
        continue;
      }

      const options = Array.isArray(item.options)
        ? item.options.map((option) => String(option || '').trim()).filter(Boolean)
        : [];
      if (options.length < 2) {
        message.warning(`第${index + 1}题为选择题时，选项至少2个`);
        return;
      }

      const answerText = String(item.correctAnswer || '').trim();
      if (!answerText) {
        message.warning(`第${index + 1}题缺少正确答案文本`);
        return;
      }

      const answerIndex = resolveChoiceAnswerIndexFromText(answerText, options);
      if (answerIndex < 0) {
        message.warning(`第${index + 1}题正确答案无法识别，请输入选项文本、序号(1/2...)或字母(A/B...)`);
        return;
      }

      normalizedPayload.push({
        id: String(item.id || `q_save_${Date.now()}_${index}`),
        type: 'multiple-choice',
        question: questionText,
        options,
        correctAnswer: answerIndex,
        explanation: String(item.explanation || '').trim()
      });
    }

    if (normalizedPayload.length < 5) {
      message.warning('至少提供5道有效题目');
      return;
    }

    setQuizEditSaving(true);
    try {
      const result = await apiService.saveQuizClassOverride(sectionId, classId, {
        questions: normalizedPayload
      });
      if (result.success) {
        message.success('quiz题目修改已保存');
        setQuizEditOpen(false);
      } else {
        message.error(result.error || '保存失败');
      }
    } finally {
      setQuizEditSaving(false);
    }
  };

  const renderProfilePanel = () => (
    <Card title="个人信息">
      <Form layout="vertical" form={profileForm} onFinish={handleSaveProfile}>
        <Form.Item label="用户ID">
          <Input value={user?.userId} disabled />
        </Form.Item>
        <Form.Item label="角色">
          <Input value={user?.role} disabled />
        </Form.Item>
        {user?.role === 'student' && (
          <>
            <Form.Item label="所属教学班ID">
              <Input value={studentClassInfo?.classId || user.classId || '未分配'} disabled />
            </Form.Item>
            <Form.Item label="教师昵称">
              <Input value={studentClassInfo?.teacherName || '暂无'} disabled />
            </Form.Item>
          </>
        )}
        <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}> 
          <Input />
        </Form.Item>
        <Form.Item name="email" label="当前绑定邮箱"> 
          <Input disabled />
        </Form.Item>
        <Form.Item name="password" label="新密码（可选）"> 
          <Input.Password placeholder="不修改可留空" />
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={savingProfile}>保存</Button>
          <Button danger onClick={logout}>退出登录</Button>
        </Space>
      </Form>

      <Card type="inner" title="邮箱绑定 / 修改" style={{ marginTop: 16 }}>
        <Form layout="vertical" form={bindEmailForm} onFinish={handleBindEmail}>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式错误' }]}> 
            <Input />
          </Form.Item>
          <Form.Item label="验证码" required>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="verifyCode" noStyle rules={[{ required: true, message: '请输入验证码' }]}> 
                <Input placeholder="6位验证码" />
              </Form.Item>
              <Button onClick={() => void handleSendBindEmailCode()}>发送验证码</Button>
            </Space.Compact>
          </Form.Item>
          <Button type="primary" htmlType="submit">绑定邮箱</Button>
        </Form>
      </Card>
    </Card>
  );

  const renderAdminPanel = () => (
    <Card title="管理员管理">
      <Form layout="inline" form={addAdminForm} onFinish={handleAddAdmin} style={{ marginBottom: 16 }}>
        <Form.Item name="name" rules={[{ required: true, message: '请输入管理员昵称' }]}> 
          <Input placeholder="管理员昵称" />
        </Form.Item>
        <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式错误' }]}> 
          <Input placeholder="管理员邮箱" />
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true, message: '请输入初始密码' }, { min: 6, message: '至少6位' }]}> 
          <Input.Password placeholder="初始密码" />
        </Form.Item>
        <Button type="primary" htmlType="submit">新增管理员</Button>
      </Form>

      <Table
        rowKey="userId"
        dataSource={admins}
        pagination={false}
        columns={[
          { title: '管理员ID', dataIndex: 'userId' },
          { title: '昵称', dataIndex: 'name' },
          { title: '邮箱', dataIndex: 'email' },
          {
            title: '操作',
            render: (_, record) => (
              <Button
                danger
                disabled={record.userId === user?.userId}
                onClick={async () => {
                  const result = await apiService.deleteAdmin(record.userId);
                  if (result.success) {
                    message.success('管理员已删除');
                    await refreshBasicData();
                  } else {
                    message.error(result.error || '删除失败');
                  }
                }}
              >删除</Button>
            )
          }
        ]}
      />
    </Card>
  );

  const renderAdminTeacherPanel = () => (
    <Card title="教师管理">
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="按姓名或用户编号搜索"
          value={teacherKeyword}
          onChange={(event) => setTeacherKeyword(event.target.value)}
        />
        <Button onClick={() => void refreshBasicData()}>查询</Button>
      </Space>

      <Form layout="inline" form={addTeacherForm} onFinish={handleAddTeacher} style={{ marginBottom: 16 }}>
        <Form.Item name="name" rules={[{ required: true, message: '请输入教师姓名' }]}> 
          <Input placeholder="教师姓名" />
        </Form.Item>
        <Form.Item name="email"> 
          <Input placeholder="教师邮箱（可选）" />
        </Form.Item>
        <Form.Item name="password"> 
          <Input.Password placeholder="初始密码，默认123456" />
        </Form.Item>
        <Button type="primary" htmlType="submit">新增教师</Button>
      </Form>

      <Form
        layout="inline"
        form={adminCreateClassForm}
        onFinish={async (values: { teacherId: string; name: string }) => {
          const result = await apiService.createClass(values);
          if (result.success) {
            message.success(`教学班创建成功：${result.data?.classId}`);
            adminCreateClassForm.resetFields();
            await refreshBasicData();
          } else {
            message.error(result.error || '教学班创建失败');
          }
        }}
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="teacherId" rules={[{ required: true, message: '请输入教师ID' }]}>
          <Input placeholder="教师ID（7位）" />
        </Form.Item>
        <Form.Item name="name" rules={[{ required: true, message: '请输入教学班名称' }]}>
          <Input placeholder="教学班名称" />
        </Form.Item>
        <Button type="default" htmlType="submit">为教师新建教学班</Button>
      </Form>

      <Table
        rowKey="classId"
        dataSource={classes}
        size="small"
        pagination={{ pageSize: 5 }}
        style={{ marginBottom: 20 }}
        columns={[
          { title: '教学班ID', dataIndex: 'classId' },
          { title: '教师ID', dataIndex: 'teacherId' },
          { title: '班级名称', dataIndex: 'name' },
          { title: '人数', render: (_, record) => record.studentIds?.length || 0 }
        ]}
      />

      <Table
        rowKey="userId"
        dataSource={teachers}
        pagination={false}
        columns={[
          { title: '教师ID', dataIndex: 'userId' },
          { title: '姓名', dataIndex: 'name' },
          { title: '邮箱', dataIndex: 'email' },
          {
            title: '操作',
            render: (_, record) => (
              <Space>
                <Button
                  onClick={async () => {
                    const result = await apiService.resetTeacherPassword(record.userId);
                    if (result.success) {
                      message.success('教师密码已重置为123456');
                    } else {
                      message.error(result.error || '重置失败');
                    }
                  }}
                >重置密码</Button>
                <Button
                  danger
                  onClick={async () => {
                    const result = await apiService.deleteTeacher(record.userId);
                    if (result.success) {
                      message.success('已删除教师');
                      await refreshBasicData();
                    } else {
                      message.error(result.error || '删除失败');
                    }
                  }}
                >删除</Button>
              </Space>
            )
          }
        ]}
      />
    </Card>
  );

  const renderStudentPanel = () => (
    <Card title="学生管理">
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="按姓名或用户编号搜索"
          value={studentKeyword}
          onChange={(event) => setStudentKeyword(event.target.value)}
        />
        <Button onClick={() => void refreshBasicData()}>查询</Button>
      </Space>

      <Form layout="inline" form={addStudentForm} onFinish={handleAddStudent} style={{ marginBottom: 16 }}>
        <Form.Item name="name" rules={[{ required: true, message: '请输入学生姓名' }]}> 
          <Input placeholder="学生姓名" />
        </Form.Item>
        <Form.Item name="classId" rules={[{ required: true, message: '请输入教学班ID' }]}> 
          <Input placeholder="教学班ID" />
        </Form.Item>
        <Form.Item name="email"> 
          <Input placeholder="学生邮箱（可选）" />
        </Form.Item>
        <Form.Item name="password"> 
          <Input.Password placeholder="初始密码（默认123456）" />
        </Form.Item>
        <Button type="primary" htmlType="submit">新增学生</Button>
      </Form>

      <Table
        rowKey="userId"
        dataSource={students}
        pagination={false}
        columns={[
          { title: '学生ID', dataIndex: 'userId' },
          { title: '姓名', dataIndex: 'name' },
          { title: '教学班', dataIndex: 'classId' },
          {
            title: '操作',
            render: (_, record) => (
              <Space>
                <Button onClick={() => void openStudentProgressModal(record)}>查看信息</Button>
                <Button onClick={async () => {
                  await apiService.resetStudentPassword(record.userId);
                  message.success('已重置为123456');
                }}>重置密码</Button>
                <Button danger onClick={async () => {
                  const result = await apiService.deleteStudent(record.userId);
                  if (result.success) {
                    message.success('学生已删除');
                    await refreshBasicData();
                  } else {
                    message.error(result.error || '删除失败');
                  }
                }}>删除</Button>
              </Space>
            )
          }
        ]}
      />
    </Card>
  );

  const renderClassPanel = () => (
    <Layout className="class-layout">
      <Sider width={280} className="class-sider">
        <Card title="教学班列表" size="small">
          <Form layout="vertical" form={createClassForm} onFinish={handleCreateClass}>
            <Form.Item name="name" rules={[{ required: true, message: '请输入教学班名称' }]}> 
              <Input placeholder="教学班名称" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>新建教学班</Button>
          </Form>

          <List
            style={{ marginTop: 16 }}
            dataSource={classes}
            renderItem={(item) => (
              <List.Item
                onClick={() => navigate(`/teaching-class/${item.classId}`)}
              >
                <div>
                  <div>{item.name}</div>
                  <Text type="secondary">{item.classId}</Text>
                </div>
              </List.Item>
            )}
          />
        </Card>
      </Sider>
      <Content>
        <Card title="教学管理">
          <Text type="secondary">请选择左侧某个教学班，点击后进入独立教学班管理页面。</Text>
        </Card>
      </Content>
    </Layout>
  );

  const renderTeachingSettingsPanel = () => (
    <Card title="教学设置">
      <Row gutter={[16, 16]}>
        {sectionCards.map((item) => (
          <Col xs={24} md={12} xl={8} key={`${item.rawSectionId}-${item.resolvedSectionId || 'na'}`}>
            <Card
              size="small"
              className="teaching-setting-card"
              title={`${item.rawSectionId} ${item.title}`}
            >
              <Space>
                {item.hasQuiz && (
                  <Button
                    onClick={() => void openQuizEditModal(item.resolvedSectionId || item.rawSectionId)}
                  >
                    修改quiz
                  </Button>
                )}
                {item.hasPractice && (
                  <Button
                    type="primary"
                    onClick={() => void openPracticeEditModal(item.resolvedSectionId || item.rawSectionId)}
                  >
                    修改practice
                  </Button>
                )}
                {!item.hasQuiz && !item.hasPractice && <Text type="secondary">该小节暂无可配置项</Text>}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );

  const renderMessagePanel = () => (
    <Card title="信息接收">
      <List
        dataSource={messagesData}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={<Space><span>{item.title}</span>{!item.read && <Tag color="blue">新消息</Tag>}</Space>}
              description={
                <div>
                  <div>{item.content}</div>
                  <Text type="secondary">发送者：{item.senderId}（{item.senderRole}）</Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );

  const renderProgressPanel = () => (
    <Card title="学习进度">
      <Table
        rowKey="section"
        dataSource={progressRows}
        pagination={false}
        scroll={{ y: 580 }}
        columns={[
          { title: '小节', dataIndex: 'section' },
          { title: '理论', render: (_, record) => (record.theory ? 'y' : '') },
          { title: '测验', render: (_, record) => renderQuizProgressDisplay(record.quiz, record.quizScore) },
          { title: '编程', render: (_, record) => renderCodingProgressDisplay(record.section, record.coding, record.codingJudgeStatus, record.ojVisited) }
        ]}
      />
    </Card>
  );

  const renderFavoritePanel = () => (
    <Card title="收藏列表">
      <List
        dataSource={favorites}
        locale={{ emptyText: '暂无收藏' }}
        renderItem={(item) => (
          <List.Item>
            <Space>
              <StarFilled style={{ color: '#faad14' }} />
              <Button
                type="link"
                onClick={() => {
                  const parsed = parseFavoriteKey(item);
                  if (!parsed) {
                    message.warning('收藏项格式无法跳转');
                    return;
                  }
                  navigate(`/structure/${parsed.chapterId}/section/${parsed.sectionId}`);
                }}
              >
                {sectionTitleMap.get(item) || item}
              </Button>
            </Space>
            <Button
              type="default"
              className="favorite-cancel-btn"
              onClick={async () => {
                try {
                  const result = await apiService.toggleFavorite(item);
                  if (result.success && result.data) {
                    setFavorites(result.data.favoriteSections || []);
                    message.success('已取消收藏');
                  } else {
                    message.error(result.error || '取消收藏失败');
                  }
                } catch {
                  message.error('取消收藏失败');
                }
              }}
            >
              取消收藏
            </Button>
          </List.Item>
        )}
      />
    </Card>
  );

  const renderContent = () => {
    switch (selectedKey) {
      case 'profile':
        return renderProfilePanel();
      case 'admin':
        return renderAdminPanel();
      case 'teacher':
        return renderAdminTeacherPanel();
      case 'student':
        return renderStudentPanel();
      case 'class':
        return renderClassPanel();
      case 'teaching-settings':
        return renderTeachingSettingsPanel();
      case 'message':
        return renderMessagePanel();
      case 'progress':
        return renderProgressPanel();
      case 'favorite':
        return renderFavoritePanel();
      default:
        return renderProfilePanel();
    }
  };

  const canEditStudentProgress = user?.role === 'admin';

  return (
    <div className="personal-space-container">
      <Title level={2}>个人空间</Title>
      <Layout className="personal-space-layout">
        <Sider width={260} className="personal-space-sider">
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => setSelectedKey(key)}
          />
        </Sider>
        <Content className="personal-space-content">{renderContent()}</Content>
      </Layout>

      <Modal
        open={viewProgressOpen}
        title={`学生信息：${viewProgressData.student?.name || ''} (${viewProgressData.student?.userId || ''})`}
        onCancel={() => setViewProgressOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setViewProgressOpen(false)}>关闭</Button>
            {canEditStudentProgress && (
              <Button type="primary" loading={savingStudentProgress} onClick={() => void handleSaveStudentProgress()}>
                保存修改
              </Button>
            )}
          </Space>
        }
        width={820}
      >
        <Table
          rowKey="section"
          dataSource={viewProgressData.rows}
          pagination={false}
          scroll={{ y: 580 }}
          columns={[
            { title: '小节', dataIndex: 'section' },
            {
              title: '理论',
              render: (_, record) => (
                canEditStudentProgress
                  ? <Checkbox checked={record.theory} onChange={(event) => updateStudentProgressCell(record.section, 'theory', event.target.checked)} />
                  : (record.theory ? 'y' : '')
              )
            },
            {
              title: '测验',
              render: (_, record) => (
                canEditStudentProgress
                  ? <Checkbox checked={record.quiz} onChange={(event) => updateStudentProgressCell(record.section, 'quiz', event.target.checked)} />
                  : renderQuizProgressDisplay(record.quiz, record.quizScore)
              )
            },
            {
              title: '编程',
              render: (_, record) => {
                if (isPracticeNotApplicableSection(record.section)) {
                  return '/';
                }

                if (!canEditStudentProgress) {
                  return renderCodingProgressDisplay(record.section, record.coding, record.codingJudgeStatus, record.ojVisited);
                }

                return <Checkbox checked={record.coding} onChange={(event) => updateStudentProgressCell(record.section, 'coding', event.target.checked)} />;
              }
            }
          ]}
        />
      </Modal>

      <Modal
        open={quizEditOpen}
        title="修改quiz题目"
        onCancel={() => setQuizEditOpen(false)}
        onOk={() => void quizEditForm.submit()}
        okText="保存修改"
        cancelText="取消"
        confirmLoading={quizEditSaving}
        width={980}
      >
        <Form
          layout="vertical"
          form={quizEditForm}
          onFinish={(values) => void handleSaveQuizEdit(values)}
        >
          <Row gutter={16} className="teaching-setting-modal-header-row">
            <Col span={12}>
              <Form.Item name="classId" label="教学班（可选可输）" rules={[{ required: true, message: '请输入教学班ID' }]}>
                <AutoComplete
                  options={classes.map((item) => ({ value: item.classId, label: `${item.classId} - ${item.name}` }))}
                  value={quizEditClassId}
                  onChange={(value) => setQuizEditClassId(String(value || ''))}
                  onSelect={(value) => void handleQuizEditClassChange(String(value || ''))}
                  onBlur={() => {
                    void handleQuizEditClassChange(quizEditClassId);
                  }}
                  placeholder="输入或选择教学班ID"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sectionId" label="小节（可选可输）" rules={[{ required: true, message: '请输入小节ID' }]}>
                <AutoComplete
                  options={sectionCards.map((item) => ({ value: item.resolvedSectionId || item.rawSectionId, label: `${item.rawSectionId} ${item.title}` }))}
                  value={quizEditSectionId}
                  onChange={(value) => setQuizEditSectionId(String(value || ''))}
                  onSelect={(value) => void handleQuizEditSectionChange(String(value || ''))}
                  onBlur={() => {
                    void handleQuizEditSectionChange(quizEditSectionId);
                  }}
                  placeholder="输入或选择小节ID"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.List name="questions">
            {(fields, { add, remove }) => (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {fields.map((field, index) => {
                  const currentType = quizEditForm.getFieldValue(['questions', field.name, 'type']) as 'multiple-choice' | 'true-false' | undefined;
                  const isTrueFalse = currentType === 'true-false';

                  return (
                    <Card key={field.key} size="small" title={`题目 ${index + 1}`}>
                      <Form.Item name={[field.name, 'id']} hidden>
                        <Input />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name={[field.name, 'question']}
                            label="题目描述"
                            rules={[{ required: true, message: '请输入题目描述' }]}
                          >
                            <Input.TextArea rows={2} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name={[field.name, 'type']}
                            label="题目类型"
                            rules={[{ required: true, message: '请选择题目类型' }]}
                          >
                            <Select
                              options={[
                                { label: '选择题', value: 'multiple-choice' },
                                { label: '判断题', value: 'true-false' }
                              ]}
                              onChange={(value) => handleQuizQuestionTypeChange(index, value as 'multiple-choice' | 'true-false')}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      {isTrueFalse ? (
                        <>
                          <Form.Item label="选项（固定）">
                            <Space>
                              <Tag color="blue">yes</Tag>
                              <Tag color="blue">no</Tag>
                            </Space>
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'correctAnswer']}
                            label="正确答案"
                            rules={[{ required: true, message: '请输入正确答案（yes 或 no）' }]}
                          >
                            <Input placeholder="请输入 yes 或 no" />
                          </Form.Item>
                        </>
                      ) : (
                        <>
                          <Form.Item label="选项">
                            <Form.List name={[field.name, 'options']}>
                              {(optionFields, optionOps) => (
                                <Space direction="vertical" style={{ width: '100%' }}>
                                  {optionFields.map((optionField) => (
                                    <Space key={optionField.key} align="start" style={{ width: '100%' }}>
                                      <Form.Item
                                        name={optionField.name}
                                        rules={[{ required: true, message: '请输入选项内容' }]}
                                        style={{ flex: 1, marginBottom: 0 }}
                                      >
                                        <Input placeholder="选项内容" />
                                      </Form.Item>
                                      <Button
                                        danger
                                        onClick={() => {
                                          if (optionFields.length <= 2) {
                                            message.warning('选择题至少保留2个选项');
                                            return;
                                          }
                                          optionOps.remove(optionField.name);
                                        }}
                                      >
                                        删除选项
                                      </Button>
                                    </Space>
                                  ))}
                                  <Button type="dashed" onClick={() => optionOps.add('')}>新增选项</Button>
                                </Space>
                              )}
                            </Form.List>
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'correctAnswer']}
                            label="正确答案（输入选项文本）"
                            rules={[{ required: true, message: '请输入正确答案文本' }]}
                          >
                            <Input placeholder="请输入与某个选项一致的文本" />
                          </Form.Item>
                        </>
                      )}

                      <Form.Item name={[field.name, 'explanation']} label="解析（可选）">
                        <Input.TextArea rows={2} />
                      </Form.Item>

                      <Space>
                        <Button
                          danger
                          onClick={() => {
                            if (fields.length <= 5) {
                              message.warning('至少保留5道题目');
                              return;
                            }
                            remove(field.name);
                          }}
                        >
                          删除题目
                        </Button>
                      </Space>
                    </Card>
                  );
                })}
                <Button
                  type="dashed"
                  onClick={() => add({
                    id: `q_new_${Date.now()}`,
                    type: 'multiple-choice',
                    question: '',
                    options: ['选项A', '选项B'],
                    correctAnswer: '选项A',
                    explanation: ''
                  })}
                >
                  新增题目
                </Button>
              </Space>
            )}
          </Form.List>

          {quizEditLoading && <Text type="secondary">加载中...</Text>}
        </Form>
      </Modal>

      <Modal
        open={practiceEditOpen}
        title="修改practice题目"
        onCancel={() => setPracticeEditOpen(false)}
        onOk={() => void practiceEditForm.submit()}
        okText="保存修改"
        cancelText="取消"
        confirmLoading={practiceEditSaving}
        width={980}
      >
        <Form
          layout="vertical"
          form={practiceEditForm}
          onFinish={(values) => void handleSavePracticeEdit(values)}
        >
          <Row gutter={16} className="teaching-setting-modal-header-row">
            <Col span={12}>
              <Form.Item name="classId" label="教学班（可选可输）" rules={[{ required: true, message: '请输入教学班ID' }]}>
                <AutoComplete
                  options={classes.map((item) => ({ value: item.classId, label: `${item.classId} - ${item.name}` }))}
                  value={practiceEditClassId}
                  onChange={(value) => setPracticeEditClassId(String(value || ''))}
                  onSelect={(value) => void handlePracticeEditClassChange(String(value || ''))}
                  onBlur={() => {
                    void handlePracticeEditClassChange(practiceEditClassId);
                  }}
                  placeholder="输入或选择教学班ID"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sectionId" label="小节（可选可输）" rules={[{ required: true, message: '请输入小节ID' }]}>
                <AutoComplete
                  options={sectionCards.map((item) => ({ value: item.resolvedSectionId || item.rawSectionId, label: `${item.rawSectionId} ${item.title}` }))}
                  value={practiceEditSectionId}
                  onChange={(value) => setPracticeEditSectionId(String(value || ''))}
                  onSelect={(value) => void handlePracticeEditSectionChange(String(value || ''))}
                  onBlur={() => {
                    void handlePracticeEditSectionChange(practiceEditSectionId);
                  }}
                  placeholder="输入或选择小节ID"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="title" label="题目标题" rules={[{ required: true, message: '请输入题目标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="题目描述" rules={[{ required: true, message: '请输入题目描述' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="inputDescription" label="输入描述" rules={[{ required: true, message: '请输入输入描述' }]}>
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="outputDescription" label="输出描述" rules={[{ required: true, message: '请输入输出描述' }]}>
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="sampleInput" label="输入样例" rules={[{ required: true, message: '请输入输入样例' }]}>
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sampleOutput" label="输出样例" rules={[{ required: true, message: '请输入输出样例' }]}>
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="dataRange" label="题目数据范围" rules={[{ required: true, message: '请输入题目数据范围' }]}>
            <Input.TextArea rows={2} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="timeLimitMs" label="时间限制(ms)" rules={[{ required: true, message: '请输入时间限制' }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="memoryLimitMb" label="空间限制(MB)" rules={[{ required: true, message: '请输入空间限制' }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="stackLimitKb" label="栈限制(KB)" rules={[{ required: true, message: '请输入栈限制' }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Card size="small" title="测试数据（至少5组输入输出）" loading={practiceEditLoading}>
            <Form.List name="testCases">
              {(fields, { add, remove }) => (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {fields.map((field) => (
                    <Row gutter={8} key={field.key} align="middle">
                      <Col span={11}>
                        <Form.Item
                          name={[field.name, 'input']}
                          label={`输入 #${field.name + 1}`}
                          rules={[{ required: true, message: '请输入测试输入' }]}
                        >
                          <Input.TextArea rows={2} />
                        </Form.Item>
                      </Col>
                      <Col span={11}>
                        <Form.Item
                          name={[field.name, 'output']}
                          label={`输出 #${field.name + 1}`}
                          rules={[{ required: true, message: '请输入测试输出' }]}
                        >
                          <Input.TextArea rows={2} />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button
                          danger
                          onClick={() => remove(field.name)}
                          disabled={fields.length <= 5}
                        >
                          删除
                        </Button>
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" onClick={() => add({ input: '', output: '' })}>
                    新增一组测试数据
                  </Button>
                </Space>
              )}
            </Form.List>
          </Card>
        </Form>
      </Modal>
    </div>
  );
};

export default PersonalSpace;
