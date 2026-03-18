import * as fs from 'fs';
import * as path from 'path';

const legacyTheoryIdMap: Record<string, string> = {
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

export interface TheorySection {
  title: string;
  content: string;
  examples: string[];
}

export interface TheoryQuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: number | boolean | string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface TheoryContent {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  content: {
    introduction: string;
    sections: TheorySection[];
    keyTakeaways: string[];
    quizQuestions?: TheoryQuizQuestion[];
  };
}

export interface CourseSection {
  id: string;
  title: string;
  description: string;
}

export interface CourseChapter {
  id: string;
  title: string;
  description: string;
  sections: CourseSection[];
}

export class DataManager {
  private dataPath: string;

  constructor() {
    this.dataPath = path.join(__dirname, '..', '..', 'data');
  }

  private resolveTheoryContentId(id: string): string {
    return legacyTheoryIdMap[id] ?? id;
  }

  // 加载课程目录
  loadCourseCatalog(): CourseChapter[] {
    try {
      const catalogPath = path.join(this.dataPath, 'course-catalog.json');
      const data = fs.readFileSync(catalogPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading course catalog:', error);
      return [];
    }
  }

  // 加载理论内容
  loadTheoryContent(id: string): TheoryContent | null {
    try {
      const normalizedId = this.resolveTheoryContentId(id);
      const contentPath = path.join(this.dataPath, 'theoretical-content', `${normalizedId}.json`);
      const backupPath = path.join(this.dataPath, 'theoretical-content', `${normalizedId}-backup.json`);
      const finalPath = fs.existsSync(contentPath)
        ? contentPath
        : (fs.existsSync(backupPath) ? backupPath : contentPath);
      const data = fs.readFileSync(finalPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading theory content for ${id}:`, error);
      return null;
    }
  }

  // 保存理论内容
  saveTheoryContent(id: string, content: TheoryContent): boolean {
    try {
      const contentPath = path.join(this.dataPath, 'theoretical-content', `${id}.json`);
      fs.writeFileSync(contentPath, JSON.stringify(content, null, 2));
      return true;
    } catch (error) {
      console.error(`Error saving theory content for ${id}:`, error);
      return false;
    }
  }

  // 获取所有理论内容ID列表
  getTheoryContentIds(): string[] {
    try {
      const contentDir = path.join(this.dataPath, 'theoretical-content');
      const files = fs.readdirSync(contentDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.error('Error getting theory content IDs:', error);
      return [];
    }
  }
}
