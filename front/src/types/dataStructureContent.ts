// Data structure content types for JSON-based storage
export interface TheoryContent {
  title: string;
  description: string;
  sections: TheorySection[];
}

export interface TheorySection {
  title: string;
  type: 'card' | 'comparison' | 'comparison_table';
  content?: TheoryItem[];
  advantages?: TheoryItem[];
  disadvantages?: TheoryItem[];
  comparisons?: ComparisonItem[];
}

export interface TheoryItem {
  feature?: string;
  operation?: string;
  use?: string;
  concept?: string;
  type?: string;
  title?: string;
  description: string;
  complexity?: string;
  formula?: string;
}

export interface ComparisonItem {
  structure: string;
  access: string;
  search: string;
  insertion: string;
  deletion: string;
  memory: string;
  use_case: string;
}

export interface VisualizationConfig {
  title: string;
  config: {
    defaultArray: number[];
    maxSize: number;
    minValue: number;
    maxValue: number;
    animationDuration: number;
    highlightColor: string;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
  };
  operations: VisualizationOperation[];
  visualization: {
    showIndices: boolean;
    showValues: boolean;
    showOperation: boolean;
    animateChanges: boolean;
    enableInteraction: boolean;
  };
}

export interface VisualizationOperation {
  id: string;
  name: string;
  description: string;
  parameters: OperationParameter[];
  timeComplexity: string;
  explanation: string;
}

export interface OperationParameter {
  name: string;
  type: 'number' | 'string' | 'boolean';
  label: string;
  min: number | string;
  max: number | string;
  default: number | string;
}

export interface CodeExamples {
  title: string;
  description: string;
  categories: CodeCategory[];
}

export interface CodeCategory {
  id: string;
  name: string;
  description: string;
  timeComplexity: string;
  examples: {
    typescript: string;
    cpp: string;
    java: string;
    c: string;
  };
}

export interface PracticeProblems {
  title: string;
  description: string;
  quickPractice: {
    title: string;
    description: string;
    templates: {
      cpp: string;
      java: string;
      typescript: string;
      c: string;
    };
  };
  problems: PracticeProblem[];
  externalLinks: ExternalLink[];
}

export interface PracticeProblem {
  id: number;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeComplexity: string;
  spaceComplexity: string;
  hints: string[];
  templates: {
    typescript: string;
    cpp: string;
    java: string;
    c: string;
  };
  solutions: {
    typescript: string;
    cpp: string;
    java: string;
    c: string;
  };
}

export interface ExternalLink {
  title: string;
  url: string;
  description: string;
  difficulty: string;
  platform: string;
}

// Aggregated data structure content
export interface DataStructureContent {
  id: string;
  name: string;
  theory: TheoryContent;
  visualization: VisualizationConfig;
  examples: CodeExamples;
  practice: PracticeProblems;
}

// Language type for code examples and practice
export type ProgrammingLanguage = 'cpp' | 'java' | 'typescript' | 'c';
