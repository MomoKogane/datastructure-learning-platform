// 数据结构类型定义
export interface DataStructure {
  id: string;
  name: string;
  description: string;
  category: 'linear' | 'tree' | 'graph' | 'hash';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  concepts: string[];
  operations: Operation[];
}

export interface Operation {
  name: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  code: string;
}

// 学习进度接口
export interface LearningProgress {
  userId: string;
  completedStructures: string[];
  currentStructure?: string;
  quizScores: Record<string, number>;
  totalTimeSpent: number;
}

// 可视化节点接口
export interface VisualNode {
  id: string;
  value: unknown;
  x: number;
  y: number;
  highlighted?: boolean;
  color?: string;
}

// 可视化边接口
export interface VisualEdge {
  source: string;
  target: string;
  weight?: number;
  highlighted?: boolean;
}

// AI问答接口
export interface QuizQuestion {
  id: string;
  structureId: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export type SectionTemplateType = 'theory' | 'data-structure';

export type SectionModuleName =
  | 'theory'
  | 'visualization'
  | 'examples'
  | 'practice'
  | 'keyTakeaways';

export interface SectionModuleContentResponse {
  sectionId: string;
  templateType: SectionTemplateType;
  quizSource: 'theory';
  module: SectionModuleName;
  content: unknown;
}

export interface SectionModulesResponse {
  sectionId: string;
  templateType: SectionTemplateType;
  quizSource: 'theory';
  allowedModules: SectionModuleName[];
  modules: Partial<Record<SectionModuleName, unknown>>;
}

// 学习状态
export interface LearningState {
  currentStructure: DataStructure | null;
  progress: LearningProgress;
  isVisualizationActive: boolean;
  selectedOperation: Operation | null;
}
