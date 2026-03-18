import mongoose, { Document, Schema } from 'mongoose';

export interface QuizBankQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: number | boolean | string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface QuizBankTheorySection {
  title: string;
  content: string;
  examples?: string[];
}

export interface QuizBankTheoryContent {
  introduction: string;
  sections: QuizBankTheorySection[];
  keyTakeaways: string[];
  quizQuestions?: QuizBankQuestion[];
}

export interface QuizBankDocument extends Document {
  sectionId: string;
  title?: string;
  description?: string;
  questions: QuizBankQuestion[];
  theoryContent?: QuizBankTheoryContent;
  createdAt: Date;
  updatedAt: Date;
}

const quizBankQuestionSchema = new Schema<QuizBankQuestion>({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'short-answer'],
    required: true
  },
  question: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: Schema.Types.Mixed, required: true },
  explanation: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  topic: { type: String, required: true }
}, { _id: false });

const quizBankTheorySectionSchema = new Schema<QuizBankTheorySection>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  examples: [{ type: String }]
}, { _id: false });

const quizBankTheoryContentSchema = new Schema<QuizBankTheoryContent>({
  introduction: { type: String, default: '' },
  sections: {
    type: [quizBankTheorySectionSchema],
    default: []
  },
  keyTakeaways: {
    type: [String],
    default: []
  },
  quizQuestions: {
    type: [quizBankQuestionSchema],
    default: undefined
  }
}, { _id: false });

const quizBankSchema = new Schema<QuizBankDocument>({
  sectionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  title: { type: String },
  description: { type: String },
  questions: {
    type: [quizBankQuestionSchema],
    default: []
  },
  theoryContent: {
    type: quizBankTheoryContentSchema,
    default: undefined
  }
}, {
  timestamps: true,
  collection: 'quizbanks'
});

const QuizBank = mongoose.model<QuizBankDocument>('QuizBank', quizBankSchema);

export default QuizBank;
