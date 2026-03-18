import dotenv from 'dotenv';
import mongoose from 'mongoose';
import QuizBank from '../models/QuizBank';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dslp';

const basicConceptQuestions = [
  {
    id: '1.1-db-q1',
    type: 'multiple-choice' as const,
    question: 'Which statement best describes an Abstract Data Type (ADT)?',
    options: [
      'A fixed memory layout for data',
      'A behavior-oriented interface independent of implementation',
      'A compiler optimization rule',
      'A hardware addressing mechanism'
    ],
    correctAnswer: 1,
    explanation: 'ADT defines data by operations/behavior, not by one concrete implementation.',
    difficulty: 'easy' as const,
    topic: '1.1.2 Abstract Data Types (ADT)'
  },
  {
    id: '1.1-db-q2',
    type: 'true-false' as const,
    question: 'Big O notation focuses on asymptotic growth and usually ignores constant factors.',
    correctAnswer: true,
    explanation: 'This is true. Big O captures upper-bound growth trends for large input sizes.',
    difficulty: 'easy' as const,
    topic: '1.1.3 Algorithm Analysis'
  },
  {
    id: '1.1-db-q3',
    type: 'multiple-choice' as const,
    question: 'Which complexity is typically associated with binary search on sorted data?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
    correctAnswer: 1,
    explanation: 'Binary search halves the search space each step, giving logarithmic complexity.',
    difficulty: 'easy' as const,
    topic: '1.1.3 Algorithm Analysis'
  },
  {
    id: '1.1-db-q4',
    type: 'multiple-choice' as const,
    question: 'Which pair is correctly classified as linear data structures?',
    options: [
      'Tree and Graph',
      'Array and Linked List',
      'Heap and Hash Table',
      'Graph and Trie'
    ],
    correctAnswer: 1,
    explanation: 'Arrays and linked lists organize elements in a sequence, so they are linear.',
    difficulty: 'medium' as const,
    topic: '1.1.1 Data Structures'
  },
  {
    id: '1.1-db-q5',
    type: 'short-answer' as const,
    question: 'In one sentence, explain why algorithm analysis matters in software design.',
    correctAnswer: 'It helps predict performance and resource usage, enabling better algorithm choices for scalability.',
    explanation: 'Analysis supports objective comparison and planning for large-scale inputs.',
    difficulty: 'medium' as const,
    topic: '1.1.3 Algorithm Analysis'
  }
];

async function seedQuizBanks() {
  await mongoose.connect(mongoUri);

  const targets = [
    {
      sectionId: '1.1',
      title: '1.1 Basic Concepts (DB Sample)',
      description: 'Database sample quiz bank seeded from 1.1 chapter baseline.'
    },
    {
      sectionId: '1.1-backup',
      title: '1.1 Basic Concepts (DB Sample Backup)',
      description: 'Compatibility backup for 1.1 chapter id usage.'
    }
  ];

  for (const target of targets) {
    await QuizBank.findOneAndUpdate(
      { sectionId: target.sectionId },
      {
        sectionId: target.sectionId,
        title: target.title,
        description: target.description,
        questions: basicConceptQuestions
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[seedQuizBankSample] Upserted quiz bank for sectionId=${target.sectionId}`);
  }
}

seedQuizBanks()
  .then(async () => {
    console.log('[seedQuizBankSample] Done.');
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('[seedQuizBankSample] Failed:', error);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  });
