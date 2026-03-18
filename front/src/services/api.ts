// API service for communicating with backend
import type {
  DataStructure,
  QuizQuestion,
  SectionModuleContentResponse,
  SectionModuleName,
  SectionModulesResponse
} from '../types';
import { apiUrl } from '../config/api';

interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface AuthUser {
  userId: string;
  role: 'admin' | 'teacher' | 'student';
  name: string;
  email?: string;
  classId?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface SignupTeacherOption {
  userId: string;
  name: string;
}

export interface SignupClassOption {
  classId: string;
  teacherId: string;
  name: string;
}

export interface SignupOptionsResponse {
  teachers: SignupTeacherOption[];
  classes: SignupClassOption[];
}

export interface TeachingClass {
  classId: string;
  teacherId: string;
  name: string;
  studentIds: string[];
}

export interface MessageItem {
  _id: string;
  recipientId: string;
  senderId: string;
  senderRole: 'admin' | 'teacher' | 'system';
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface StudentClassInfo {
  classId: string | null;
  className: string | null;
  teacherId: string | null;
  teacherName: string | null;
}

export interface SectionProgressRow {
  section: string;
  theory: boolean;
  quiz: boolean;
  coding: boolean;
  ojVisited?: boolean;
  quizScore?: number | null;
  codingJudgeStatus?: string | null;
}

export interface OjProblem {
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
}

export interface OjProblemResponse {
  sectionId: string;
  classId: string | null;
  sourceMode: 'teacher-override' | 'default-source';
  source: 'leetcode' | 'zoj' | 'pta' | 'custom';
  problem: OjProblem;
}

export interface OjSubmission {
  _id: string;
  userId: string;
  sectionId: string;
  classId?: string;
  language: 'cpp' | 'java' | 'typescript' | 'python';
  compiler: string;
  code: string;
  result: {
    status: 'AC' | 'WA' | 'CE' | 'RE' | 'TLE' | 'MLE' | 'OLE' | 'PE';
    executionTimeMs: number;
    memoryUsageMb: number;
    detail: string;
  };
  createdAt: string;
}

export interface QuizSubmissionResultItem {
  questionId: string;
  question: string;
  type?: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  userAnswer: unknown;
  correctAnswer: unknown;
  isCorrect: boolean;
  explanation?: string;
  difficulty?: string;
  topic?: string;
}

export interface QuizSubmission {
  _id: string;
  userId: string;
  classId?: string;
  sectionId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  results: QuizSubmissionResultItem[];
  submittedAt: string;
  createdAt: string;
}

export interface QuizEditableQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false';
  question: string;
  options: string[];
  correctAnswer: number | boolean;
  explanation: string;
}

export interface QuizProblemResponse {
  sectionId: string;
  classId: string;
  sourceMode: 'teacher-override' | 'default-source';
  questions: QuizEditableQuestion[];
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = apiUrl(endpoint);
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorBody = await response.json();
          errorMessage = errorBody?.error || errorBody?.message || errorMessage;
        } catch {
          // ignore json parse failure and keep fallback message
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Data Structures API
  async getDataStructures(params?: {
    category?: string;
    difficulty?: string;
  }): Promise<APIResponse<DataStructure[]>> {
    const queryString = params ? 
      new URLSearchParams(params as Record<string, string>).toString() : '';
    
    return this.request<DataStructure[]>(
      `/data-structures${queryString ? `?${queryString}` : ''}`
    );
  }

  // Course Catalog API
  async getCourseCatalog(): Promise<APIResponse<unknown[]>> {
    return this.request<unknown[]>('/content/catalog');
  }

  async getDataStructure(id: string): Promise<APIResponse<DataStructure>> {
    return this.request<DataStructure>(`/data-structures/${id}`);
  }

  async getDataStructureOperations(id: string): Promise<APIResponse<unknown[]>> {
    return this.request<unknown[]>(`/data-structures/${id}/operations`);
  }

  async getDataStructureConcepts(id: string): Promise<APIResponse<unknown[]>> {
    return this.request<unknown[]>(`/data-structures/${id}/concepts`);
  }

  // Section Content API
  async getSectionModules(sectionId: string): Promise<APIResponse<SectionModulesResponse>> {
    return this.request<SectionModulesResponse>(`/content/sections/${sectionId}/modules`);
  }

  async getSectionModule(
    sectionId: string,
    moduleName: SectionModuleName
  ): Promise<APIResponse<SectionModuleContentResponse>> {
    return this.request<SectionModuleContentResponse>(
      `/content/sections/${sectionId}/modules/${moduleName}`
    );
  }

  // Progress API (reserved for future implementation)
  // async getProgress(userId: string): Promise<APIResponse<LearningProgress>> {
  //   return this.request<LearningProgress>(`/progress/${userId}`);
  // }

  // async updateProgress(progress: Partial<LearningProgress>): Promise<APIResponse<LearningProgress>> {
  //   return this.request<LearningProgress>('/progress', {
  //     method: 'POST',
  //     body: JSON.stringify(progress),
  //   });
  // }

  // Quiz API (if implemented)
  async getQuizzes(dataStructureId: string): Promise<APIResponse<QuizQuestion[]>> {
    return this.request<QuizQuestion[]>(`/quizzes/${dataStructureId}`);
  }

  async submitQuiz(submission: {
    quizId: string;
    answers: Record<string, unknown>;
    userId: string;
  }): Promise<APIResponse<unknown>> {
    return this.request<unknown>('/quizzes/submit', {
      method: 'POST',
      body: JSON.stringify(submission),
    });
  }

  async registerTeacherOrStudent(payload: {
    role: 'teacher' | 'student';
    name: string;
    email: string;
    password: string;
    verifyCode: string;
    teacherId?: string;
    classId?: string;
  }): Promise<APIResponse<AuthUser>> {
    return this.request<AuthUser>('/users/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getSignupOptions(teacherId?: string): Promise<APIResponse<SignupOptionsResponse>> {
    const query = teacherId ? `?teacherId=${encodeURIComponent(teacherId)}` : '';
    return this.request<SignupOptionsResponse>(`/users/signup-options${query}`);
  }

  async sendEmailCode(payload: {
    email: string;
    purpose: 'signup' | 'reset-password' | 'bind-email';
  }): Promise<APIResponse<null>> {
    return this.request<null>('/users/email/send-code', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async sendResetPasswordCode(payload: { email: string; userId: string }): Promise<APIResponse<null>> {
    return this.request<null>('/users/password/send-reset-code', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async resetPasswordByEmail(payload: {
    email: string;
    userId: string;
    verifyCode: string;
    newPassword: string;
  }): Promise<APIResponse<unknown>> {
    return this.request<unknown>('/users/password/reset-by-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async login(credentials: {
    userId: string;
    password: string;
  }): Promise<APIResponse<LoginResponse>> {
    return this.request<LoginResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser(): Promise<APIResponse<AuthUser>> {
    return this.request<AuthUser>('/users/me');
  }

  async updateProfile(payload: {
    name?: string;
    password?: string;
  }): Promise<APIResponse<AuthUser>> {
    return this.request<AuthUser>('/users/me/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async sendBindEmailCode(email: string): Promise<APIResponse<null>> {
    return this.request<null>('/users/me/email/send-bind-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async bindEmail(payload: { email: string; verifyCode: string }): Promise<APIResponse<AuthUser>> {
    return this.request<AuthUser>('/users/me/email/bind', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAdmins(): Promise<APIResponse<AuthUser[]>> {
    return this.request<AuthUser[]>('/users/admins');
  }

  async createAdmin(payload: { name: string; email: string; password: string }): Promise<APIResponse<AuthUser>> {
    return this.request<AuthUser>('/users/admins', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteAdmin(adminId: string): Promise<APIResponse<unknown>> {
    return this.request<unknown>(`/users/admins/${adminId}`, {
      method: 'DELETE',
    });
  }

  async getTeachers(keyword?: string): Promise<APIResponse<AuthUser[]>> {
    const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
    return this.request<AuthUser[]>(`/users/teachers${query}`);
  }

  async createTeacher(payload: {
    name: string;
    email?: string;
    password?: string;
  }): Promise<APIResponse<AuthUser>> {
    return this.request<AuthUser>('/users/teachers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async resetTeacherPassword(teacherId: string, password?: string): Promise<APIResponse<unknown>> {
    return this.request<unknown>(`/users/teachers/${teacherId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async deleteTeacher(teacherId: string): Promise<APIResponse<unknown>> {
    return this.request<unknown>(`/users/teachers/${teacherId}`, {
      method: 'DELETE',
    });
  }

  async getStudents(params?: { keyword?: string; classId?: string }): Promise<APIResponse<AuthUser[]>> {
    const query = new URLSearchParams();
    if (params?.keyword) query.set('keyword', params.keyword);
    if (params?.classId) query.set('classId', params.classId);
    const queryString = query.toString();
    return this.request<AuthUser[]>(`/users/students${queryString ? `?${queryString}` : ''}`);
  }

  async createStudent(payload: { name: string; classId: string; email?: string; password?: string }): Promise<APIResponse<AuthUser>> {
    return this.request<AuthUser>('/users/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async resetStudentPassword(studentId: string): Promise<APIResponse<unknown>> {
    return this.request<unknown>(`/users/students/${studentId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async deleteStudent(studentId: string): Promise<APIResponse<unknown>> {
    return this.request<unknown>(`/users/students/${studentId}`, {
      method: 'DELETE',
    });
  }

  async getClasses(teacherId?: string): Promise<APIResponse<TeachingClass[]>> {
    const query = teacherId ? `?teacherId=${encodeURIComponent(teacherId)}` : '';
    return this.request<TeachingClass[]>(`/users/classes${query}`);
  }

  async createClass(payload: { name: string; teacherId?: string }): Promise<APIResponse<TeachingClass>> {
    return this.request<TeachingClass>('/users/classes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateClass(classId: string, payload: { name: string }): Promise<APIResponse<TeachingClass>> {
    return this.request<TeachingClass>(`/users/classes/${classId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteClass(classId: string): Promise<APIResponse<unknown>> {
    return this.request<unknown>(`/users/classes/${classId}`, { method: 'DELETE' });
  }

  async importStudents(classId: string, names: string[]): Promise<APIResponse<AuthUser[]>> {
    return this.request<AuthUser[]>(`/users/classes/${classId}/students/import`, {
      method: 'POST',
      body: JSON.stringify({ names }),
    });
  }

  async removeStudents(classId: string, studentIds: string[]): Promise<APIResponse<unknown>> {
    return this.request<unknown>(`/users/classes/${classId}/students`, {
      method: 'DELETE',
      body: JSON.stringify({ studentIds }),
    });
  }

  async getStudentProgressInClass(
    classId: string,
    studentId: string
  ): Promise<APIResponse<{ student: AuthUser; rows: SectionProgressRow[] }>> {
    return this.request<{ student: AuthUser; rows: SectionProgressRow[] }>(`/users/classes/${classId}/students/${studentId}/progress`);
  }

  async getStudentPracticeSubmissionsInClass(
    classId: string,
    studentId: string,
    params?: { sectionId?: string; limit?: number }
  ): Promise<APIResponse<{ student: AuthUser; submissions: OjSubmission[] }>> {
    const query = new URLSearchParams();
    if (params?.sectionId) query.set('sectionId', params.sectionId);
    if (typeof params?.limit === 'number') query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ student: AuthUser; submissions: OjSubmission[] }>(
      `/users/classes/${encodeURIComponent(classId)}/students/${encodeURIComponent(studentId)}/practice-submissions${suffix}`
    );
  }

  async getStudentQuizSubmissionsInClass(
    classId: string,
    studentId: string,
    params?: { sectionId?: string; limit?: number }
  ): Promise<APIResponse<{ student: AuthUser; submissions: QuizSubmission[] }>> {
    const query = new URLSearchParams();
    if (params?.sectionId) query.set('sectionId', params.sectionId);
    if (typeof params?.limit === 'number') query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ student: AuthUser; submissions: QuizSubmission[] }>(
      `/users/classes/${encodeURIComponent(classId)}/students/${encodeURIComponent(studentId)}/quiz-submissions${suffix}`
    );
  }

  async updateStudentProgressByAdmin(
    studentId: string,
    rows: SectionProgressRow[]
  ): Promise<APIResponse<unknown>> {
    return this.request<unknown>(`/users/students/${studentId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ rows }),
    });
  }

  async getMessages(): Promise<APIResponse<MessageItem[]>> {
    return this.request<MessageItem[]>('/users/messages');
  }

  async sendMessage(payload: { recipientId: string; title: string; content: string }): Promise<APIResponse<MessageItem>> {
    return this.request<MessageItem>('/users/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getStudentProgressTable(): Promise<APIResponse<SectionProgressRow[]>> {
    return this.request<SectionProgressRow[]>('/users/student/progress-table');
  }

  async updateStudentSectionProgress(
    sectionId: string,
    payload: {
      theoryCompleted?: boolean;
      quizCompleted?: boolean;
      codingCompleted?: boolean;
      quizScore?: number;
      codingJudgeStatus?: string;
    }
  ): Promise<APIResponse<unknown>> {
    return this.request<unknown>(`/users/student/progress/${sectionId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getStudentClassInfo(): Promise<APIResponse<StudentClassInfo>> {
    return this.request<StudentClassInfo>('/users/student/class-info');
  }

  async getFavorites(): Promise<APIResponse<string[]>> {
    return this.request<string[]>('/users/student/favorites');
  }

  async toggleFavorite(sectionId: string): Promise<APIResponse<{ favoriteSections: string[]; toggledOn: boolean }>> {
    return this.request<{ favoriteSections: string[]; toggledOn: boolean }>(`/users/student/favorites/${encodeURIComponent(sectionId)}/toggle`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getOjProblem(sectionId: string, classId?: string): Promise<APIResponse<OjProblemResponse>> {
    const query = classId ? `?classId=${encodeURIComponent(classId)}` : '';
    return this.request<OjProblemResponse>(`/oj/problem/${encodeURIComponent(sectionId)}${query}`);
  }

  async saveOjClassOverride(sectionId: string, classId: string, problem: OjProblem): Promise<APIResponse<unknown>> {
    return this.request<unknown>(`/oj/problem/${encodeURIComponent(sectionId)}/class/${encodeURIComponent(classId)}`, {
      method: 'PUT',
      body: JSON.stringify({ problem }),
    });
  }

  async resetOjClassOverride(sectionId: string, classId: string): Promise<APIResponse<unknown>> {
    return this.request<unknown>(`/oj/problem/${encodeURIComponent(sectionId)}/class/${encodeURIComponent(classId)}`, {
      method: 'DELETE',
    });
  }

  async submitOj(sectionId: string, payload: {
    code: string;
    language: 'cpp' | 'java' | 'typescript' | 'python';
    compiler: string;
  }): Promise<APIResponse<OjSubmission>> {
    return this.request<OjSubmission>(`/oj/submit/${encodeURIComponent(sectionId)}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getOjSubmissions(sectionId: string, limit = 20): Promise<APIResponse<OjSubmission[]>> {
    return this.request<OjSubmission[]>(`/oj/submissions/${encodeURIComponent(sectionId)}?limit=${limit}`);
  }

  async getQuizProblem(sectionId: string, classId: string): Promise<APIResponse<QuizProblemResponse>> {
    const query = classId ? `?classId=${encodeURIComponent(classId)}` : '';
    return this.request<QuizProblemResponse>(`/quizzes/problem/${encodeURIComponent(sectionId)}${query}`);
  }

  async saveQuizClassOverride(sectionId: string, classId: string, payload: {
    questions: Array<{
      id?: string;
      type: 'multiple-choice' | 'true-false';
      question: string;
      options: string[];
      correctAnswer: number | boolean;
      explanation?: string;
    }>;
  }): Promise<APIResponse<unknown>> {
    return this.request<unknown>(`/quizzes/problem/${encodeURIComponent(sectionId)}/class/${encodeURIComponent(classId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
