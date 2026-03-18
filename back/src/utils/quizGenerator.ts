import { TheoryContent, TheorySection } from './dataManager';

export interface GeneratedQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: number | boolean | string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface QuizGenerationRequest {
  content: TheoryContent;
  questionCount: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  questionTypes?: ('multiple-choice' | 'true-false' | 'short-answer')[];
}

export class IntelligentQuizGenerator {
  
  // 主要生成方法
  generateQuiz(request: QuizGenerationRequest): GeneratedQuestion[] {
    const { content, questionCount, difficulty = 'mixed', questionTypes = ['multiple-choice', 'true-false'] } = request;

    const questionBank = content.content.quizQuestions;
    if (Array.isArray(questionBank) && questionBank.length > 0) {
      return this.generateFromQuestionBank(questionBank as GeneratedQuestion[], questionCount, difficulty, questionTypes);
    }
    
    const questions: GeneratedQuestion[] = [];
    const contentSections = content.content.sections;
    
    // 计算整体的选择题和判断题分布
    let totalMultipleChoice, totalTrueFalse;
    if (questionCount === 1) {
      totalMultipleChoice = 1;
      totalTrueFalse = 0;
    } else if (questionCount === 2) {
      totalMultipleChoice = 1;
      totalTrueFalse = 1;
    } else {
      totalTrueFalse = Math.floor(questionCount / 3);
      totalMultipleChoice = questionCount - totalTrueFalse;
    }
    
    // 首先生成所有选择题
    let generatedMultipleChoice = 0;
    contentSections.forEach((section, sectionIndex) => {
      if (generatedMultipleChoice < totalMultipleChoice) {
        const neededFromThisSection = Math.min(1, totalMultipleChoice - generatedMultipleChoice);
        const sectionQuestions = this.generateQuestionsForSection(
          section, 
          neededFromThisSection,
          difficulty,
          ['multiple-choice']
        );
        questions.push(...sectionQuestions);
        generatedMultipleChoice += sectionQuestions.length;
      }
    });
    
    // 然后生成判断题
    let generatedTrueFalse = 0;
    contentSections.forEach((section, sectionIndex) => {
      if (generatedTrueFalse < totalTrueFalse) {
        const neededFromThisSection = Math.min(1, totalTrueFalse - generatedTrueFalse);
        const sectionQuestions = this.generateQuestionsForSection(
          section, 
          neededFromThisSection,
          difficulty,
          ['true-false']
        );
        questions.push(...sectionQuestions);
        generatedTrueFalse += sectionQuestions.length;
      }
    });
    
    // 如果还需要更多题目，从关键要点生成
    if (questions.length < questionCount) {
      const takeawayQuestions = this.generateTakeawayQuestions(
        content.content.keyTakeaways,
        questionCount - questions.length,
        difficulty,
        questionTypes
      );
      questions.push(...takeawayQuestions);
    }
    
    return questions.slice(0, questionCount);
  }

  private generateFromQuestionBank(
    questionBank: GeneratedQuestion[],
    questionCount: number,
    difficulty: string,
    questionTypes: ('multiple-choice' | 'true-false' | 'short-answer')[]
  ): GeneratedQuestion[] {
    const typeFiltered = questionBank.filter(question => questionTypes.includes(question.type));
    const poolByType = typeFiltered.length > 0 ? typeFiltered : questionBank;

    const difficultyFiltered = difficulty === 'mixed'
      ? poolByType
      : poolByType.filter(question => question.difficulty === difficulty);

    const finalPool = difficultyFiltered.length > 0 ? difficultyFiltered : poolByType;
    const shuffled = [...finalPool].sort(() => Math.random() - 0.5);

    return shuffled.slice(0, questionCount).map((question, index) => ({
      ...question,
      id: question.id || `q_bank_${Date.now()}_${index}`
    }));
  }
  
  // 为特定章节生成题目
  private generateQuestionsForSection(
    section: TheorySection, 
    count: number, 
    difficulty: string,
    questionTypes: string[]
  ): GeneratedQuestion[] {
    const questions: GeneratedQuestion[] = [];
    const sectionContent = section.content;
    const sectionTitle = section.title;
    
    // 提取关键概念
    const concepts = this.extractConcepts(sectionContent);
    const definitions = this.extractDefinitions(sectionContent);
    const keyPoints = this.extractKeyPoints(sectionContent);
    
    // 计算选择题和判断题的数量，保持2:1或1:1的比例
    // 确保至少有一道判断题（当总数>=2时）
    let multipleChoiceCount, trueFalseCount;
    
    if (count === 1) {
      multipleChoiceCount = 1;
      trueFalseCount = 0;
    } else if (count === 2) {
      multipleChoiceCount = 1;
      trueFalseCount = 1; // 1:1比例
    } else {
      // 对于3+题目，使用2:1比例
      trueFalseCount = Math.floor(count / 3); // 至少1/3为判断题
      multipleChoiceCount = count - trueFalseCount;
    }
    
    // 根据请求的题目类型生成
    if (questionTypes.includes('multiple-choice') && !questionTypes.includes('true-false')) {
      // 只生成选择题
      for (let i = 0; i < count && concepts.length > 0; i++) {
        questions.push(this.generateMultipleChoiceQuestion(concepts, definitions, keyPoints, sectionTitle, difficulty));
      }
    } else if (questionTypes.includes('true-false') && !questionTypes.includes('multiple-choice')) {
      // 只生成判断题
      for (let i = 0; i < count; i++) {
        if (keyPoints.length > 0) {
          questions.push(this.generateTrueFalseQuestion(keyPoints, sectionTitle, difficulty));
        } else if (concepts.length > 0) {
          // 从概念生成判断题
          const concept = concepts[i % concepts.length];
          questions.push({
            id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'true-false',
            question: `${concept} is a fundamental concept in data structures.`,
            correctAnswer: true,
            explanation: `This statement is true. ${concept} is indeed a fundamental concept covered in this section.`,
            difficulty: difficulty === 'mixed' ? this.randomDifficulty() : difficulty as 'easy' | 'medium' | 'hard',
            topic: sectionTitle
          });
        }
      }
    } else {
      // 混合生成（原有逻辑）
      // 生成选择题
      for (let i = 0; i < multipleChoiceCount && concepts.length > 0; i++) {
        questions.push(this.generateMultipleChoiceQuestion(concepts, definitions, keyPoints, sectionTitle, difficulty));
      }
      
      // 生成判断题 - 先从章节要点生成
      for (let i = 0; i < trueFalseCount && keyPoints.length > 0; i++) {
        questions.push(this.generateTrueFalseQuestion(keyPoints, sectionTitle, difficulty));
      }
      
      // 如果判断题不足，从关键概念生成简单的判断题
      const actualTrueFalseCount = questions.filter(q => q.type === 'true-false').length;
      const neededTrueFalse = trueFalseCount - actualTrueFalseCount;
      
      for (let i = 0; i < neededTrueFalse && concepts.length > 0; i++) {
        const concept = concepts[i % concepts.length];
        questions.push({
          id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'true-false',
          question: `${concept} is a fundamental concept in data structures.`,
          correctAnswer: true,
          explanation: `This statement is true. ${concept} is indeed a fundamental concept covered in this section.`,
          difficulty: difficulty === 'mixed' ? this.randomDifficulty() : difficulty as 'easy' | 'medium' | 'hard',
          topic: sectionTitle
        });
      }
    }
    
    return questions;
  }
  
  // 提取概念
  private extractConcepts(content: string): string[] {
    const concepts: string[] = [];
    
    // 查找定义模式
    const definitionMatches = content.match(/Definition: ([^.]+)/g);
    if (definitionMatches) {
      concepts.push(...definitionMatches.map(match => match.replace('Definition: ', '')));
    }
    
    // 查找关键术语
    const keyTerms = [
      'Data Structure', 'Abstract Data Type', 'ADT', 'Algorithm Analysis',
      'Time Complexity', 'Space Complexity', 'Big O', 'Linear', 'Non-linear',
      'Static', 'Dynamic', 'LIFO', 'FIFO', 'Stack', 'Queue', 'Array', 'Tree'
    ];
    
    keyTerms.forEach(term => {
      if (content.toLowerCase().includes(term.toLowerCase())) {
        concepts.push(term);
      }
    });
    
    return [...new Set(concepts)]; // 去重
  }
  
  // 提取定义
  private extractDefinitions(content: string): { [key: string]: string } {
    const definitions: { [key: string]: string } = {};
    
    const definitionPattern = /([A-Z][^:]+):\s*([^.]+\.)/g;
    let match;
    
    while ((match = definitionPattern.exec(content)) !== null) {
      const term = match[1].trim();
      const definition = match[2].trim();
      definitions[term] = definition;
    }
    
    return definitions;
  }
  
  // 提取关键点
  private extractKeyPoints(content: string): string[] {
    const points: string[] = [];
    
    // 查找编号列表
    const numberedPoints = content.match(/\d+\)\s*([^.]+[.])/g);
    if (numberedPoints) {
      points.push(...numberedPoints.map(point => point.replace(/\d+\)\s*/, '')));
    }
    
    return points;
  }
  
  // 生成选择题
  private generateMultipleChoiceQuestion(
    concepts: string[], 
    definitions: { [key: string]: string }, 
    keyPoints: string[], 
    topic: string,
    difficulty: string
  ): GeneratedQuestion {
    const concept = concepts[Math.floor(Math.random() * concepts.length)];
    
    // 基于概念生成问题模板
    const questionTemplates = [
      `Which of the following best describes ${concept}?`,
      `What is the main characteristic of ${concept}?`,
      `In the context of data structures, ${concept} refers to:`,
      `Which statement about ${concept} is correct?`
    ];
    
    const question = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
    
    // 生成选项
    const correctAnswer = this.generateCorrectAnswer(concept, keyPoints);
    const incorrectOptions = this.generateIncorrectOptions(concept, concepts);
    
    const options = [correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(correctAnswer);
    
    return {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'multiple-choice',
      question,
      options,
      correctAnswer: correctIndex,
      explanation: `The correct answer relates to the fundamental properties of ${concept} as discussed in the ${topic} section.`,
      difficulty: difficulty === 'mixed' ? this.randomDifficulty() : difficulty as 'easy' | 'medium' | 'hard',
      topic
    };
  }
  
  // 生成判断题
  private generateTrueFalseQuestion(keyPoints: string[], topic: string, difficulty: string): GeneratedQuestion {
    const point = keyPoints[Math.floor(Math.random() * keyPoints.length)];
    
    // 随机决定是正确还是错误的陈述
    const isTrue = Math.random() > 0.5;
    
    let statement = point;
    let explanation = `This statement is ${isTrue ? 'true' : 'false'} based on the concepts covered in ${topic}.`;
    
    if (!isTrue) {
      // 修改陈述使其错误
      statement = this.createFalseStatement(point);
      explanation = `This statement is false. The correct information is: ${point}`;
    }
    
    return {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'true-false',
      question: statement,
      correctAnswer: isTrue,
      explanation,
      difficulty: difficulty === 'mixed' ? this.randomDifficulty() : difficulty as 'easy' | 'medium' | 'hard',
      topic
    };
  }
  
  // 从关键要点生成题目
  private generateTakeawayQuestions(
    takeaways: string[], 
    count: number, 
    difficulty: string, 
    questionTypes: string[]
  ): GeneratedQuestion[] {
    const questions: GeneratedQuestion[] = [];
    
    for (let i = 0; i < count && i < takeaways.length; i++) {
      const takeaway = takeaways[i];
      const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)] as 'multiple-choice' | 'true-false';
      
      if (questionType === 'true-false') {
        questions.push({
          id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'true-false',
          question: takeaway,
          correctAnswer: true,
          explanation: 'This is one of the key takeaways from this learning section.',
          difficulty: difficulty === 'mixed' ? this.randomDifficulty() : difficulty as 'easy' | 'medium' | 'hard',
          topic: 'Key Takeaways'
        });
      }
    }
    
    return questions;
  }
  
  // 辅助方法
  private generateCorrectAnswer(concept: string, keyPoints: string[]): string {
    const relevantPoints = keyPoints.filter(point => 
      point.toLowerCase().includes(concept.toLowerCase())
    );
    
    if (relevantPoints.length > 0) {
      return relevantPoints[0];
    }
    
    // 回退选项
    const genericAnswers = {
      'Data Structure': 'A way of organizing and storing data efficiently',
      'ADT': 'A theoretical concept defining operations without implementation',
      'Algorithm Analysis': 'The process of determining computational complexity',
      'Time Complexity': 'How execution time grows with input size'
    };
    
    return genericAnswers[concept as keyof typeof genericAnswers] || 'A fundamental concept in computer science';
  }
  
  private generateIncorrectOptions(concept: string, concepts: string[]): string[] {
    const distractors = [
      'A programming language feature',
      'A type of computer hardware',
      'A network protocol',
      'A database management system',
      'A software development methodology',
      'A user interface design pattern'
    ];
    
    return distractors.slice(0, 3);
  }
  
  private createFalseStatement(trueStatement: string): string {
    // 简单的错误化策略
    const falsifiers = [
      (s: string) => s.replace('efficient', 'inefficient'),
      (s: string) => s.replace('linear', 'non-linear'),
      (s: string) => s.replace('static', 'dynamic'),
      (s: string) => s.replace('organize', 'disorganize'),
      (s: string) => s.replace('always', 'never'),
      (s: string) => s.replace('can', 'cannot')
    ];
    
    const falsifier = falsifiers[Math.floor(Math.random() * falsifiers.length)];
    const falseStatement = falsifier(trueStatement);
    
    return falseStatement !== trueStatement ? falseStatement : `It is not true that ${trueStatement.toLowerCase()}`;
  }
  
  private randomDifficulty(): 'easy' | 'medium' | 'hard' {
    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  }
}
