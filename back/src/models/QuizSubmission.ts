import mongoose, { Document, Schema } from 'mongoose';

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

export interface QuizSubmissionDocument extends Document {
  userId: string;
  classId?: string;
  sectionId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  results: QuizSubmissionResultItem[];
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const quizSubmissionResultSchema = new Schema<QuizSubmissionResultItem>({
  questionId: { type: String, required: true },
  question: { type: String, required: true },
  type: { type: String, enum: ['multiple-choice', 'true-false', 'short-answer'] },
  options: [{ type: String }],
  userAnswer: { type: Schema.Types.Mixed },
  correctAnswer: { type: Schema.Types.Mixed },
  isCorrect: { type: Boolean, required: true },
  explanation: { type: String },
  difficulty: { type: String },
  topic: { type: String }
}, { _id: false });

const quizSubmissionSchema = new Schema<QuizSubmissionDocument>({
  userId: { type: String, required: true, index: true },
  classId: { type: String, index: true },
  sectionId: { type: String, required: true, index: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  results: { type: [quizSubmissionResultSchema], default: [] },
  submittedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'quizSubmissions'
});

quizSubmissionSchema.index({ userId: 1, sectionId: 1, createdAt: -1 });
quizSubmissionSchema.index({ classId: 1, userId: 1, createdAt: -1 });

const QuizSubmission = mongoose.model<QuizSubmissionDocument>('QuizSubmission', quizSubmissionSchema);

export default QuizSubmission;
