// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Data Structure Types
export interface DataStructure {
  _id?: string;
  id: string;
  name: string;
  displayName: string;
  category: 'linear' | 'tree' | 'graph' | 'hash';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  concepts: LearningConcept[];
  operations: Operation[];
  timeComplexity: ComplexityAnalysis;
  spaceComplexity: ComplexityAnalysis;
  visualizationConfig: VisualizationConfig;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LearningConcept {
  id: string;
  title: string;
  content: string;
  order: number;
  examples?: string[];
  keyPoints?: string[];
}

export interface Operation {
  name: string;
  displayName: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  codeExamples: CodeExample[];
  steps?: string[];
  parameters: Parameter[];
}

export interface CodeExample {
  language: 'javascript' | 'python' | 'java' | 'cpp';
  code: string;
  explanation: string;
}

export interface Parameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: any;
}

export interface ComplexityAnalysis {
  best: string;
  average: string;
  worst: string;
  description: string;
}

export interface VisualizationConfig {
  type: 'array' | 'linked-list' | 'tree' | 'graph';
  animationSpeed: number;
  nodeColor: string;
  linkColor: string;
  highlightColor: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

// User Types
export interface User {
  _id?: string;
  username: string;
  email: string;
  password: string;
  profile: UserProfile;
  progress: UserProgress[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  preferredLanguage: 'en' | 'zh';
  learningGoals: string[];
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface UserProgress {
  dataStructureId: string;
  completedSections: string[];
  quizScores: Record<string, number>;
  timeSpent: number; // in minutes
  lastAccessed: Date;
  currentSection?: string;
  completionPercentage: number;
}

// Quiz Types
export interface Quiz {
  _id?: string;
  dataStructureId: string;
  title: string;
  description: string;
  questions: Question[];
  timeLimit?: number; // in minutes
  passingScore: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: number | boolean | string;
  explanation: string;
  points: number;
  tags: string[];
}

export interface QuizAttempt {
  _id?: string;
  userId: string;
  quizId: string;
  answers: Record<string, any>;
  score: number;
  totalPoints: number;
  timeSpent: number; // in seconds
  startedAt: Date;
  completedAt?: Date;
  passed: boolean;
}

// Knowledge Graph Types
export interface KnowledgeGraph {
  _id?: string;
  dataStructureId: string;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  metadata: {
    version: string;
    lastUpdated: Date;
    generatedBy: 'ai' | 'manual';
  };
}

export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'concept' | 'operation' | 'property' | 'application';
  description: string;
  importance: number; // 1-10 scale
  prerequisites: string[];
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  relationship: 'requires' | 'uses' | 'extends' | 'implements';
  weight: number;
}

// Learning Analytics Types
export interface LearningAnalytics {
  _id?: string;
  userId: string;
  sessionId: string;
  dataStructureId: string;
  actions: LearningAction[];
  sessionDuration: number;
  startTime: Date;
  endTime?: Date;
}

export interface LearningAction {
  timestamp: Date;
  type: 'view' | 'interact' | 'complete' | 'quiz_attempt' | 'code_run';
  target: string; // section, quiz, visualization, etc.
  details?: Record<string, any>;
}

// AI Service Types
export interface AIQuestionGenerationRequest {
  dataStructureId: string;
  knowledgeGraph: KnowledgeGraph;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionTypes: ('multiple-choice' | 'true-false' | 'short-answer')[];
  count: number;
}

export interface AIQuestionGenerationResponse {
  questions: Question[];
  confidence: number;
  generationMetadata: {
    model: string;
    timestamp: Date;
    processingTime: number;
  };
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface APIError extends Error {
  statusCode: number;
  isOperational: boolean;
  validationErrors?: ValidationError[];
}

// Request Types
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

// Environment Variables
export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  FRONTEND_URL: string;
  AI_API_KEY?: string;
  AI_API_URL?: string;
}
