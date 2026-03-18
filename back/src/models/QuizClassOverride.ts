import mongoose, { Document, Schema } from 'mongoose';

export type EditableQuizQuestionType = 'multiple-choice' | 'true-false';

export interface QuizOverrideQuestion {
  id: string;
  type: EditableQuizQuestionType;
  question: string;
  options: string[];
  correctAnswer: number | boolean;
  explanation: string;
}

export interface QuizClassOverrideDocument extends Document {
  sectionId: string;
  classId: string;
  teacherId: string;
  questions: QuizOverrideQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const quizOverrideQuestionSchema = new Schema<QuizOverrideQuestion>({
  id: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false'],
    required: true
  },
  question: { type: String, required: true, trim: true },
  options: {
    type: [String],
    default: []
  },
  correctAnswer: { type: Schema.Types.Mixed, required: true },
  explanation: { type: String, default: '' }
}, { _id: false });

const quizClassOverrideSchema = new Schema<QuizClassOverrideDocument>({
  sectionId: { type: String, required: true, trim: true, index: true },
  classId: { type: String, required: true, trim: true, index: true },
  teacherId: { type: String, required: true, trim: true, index: true },
  questions: {
    type: [quizOverrideQuestionSchema],
    default: []
  }
}, {
  timestamps: true,
  collection: 'quizClassOverrides'
});

quizClassOverrideSchema.index({ sectionId: 1, classId: 1 }, { unique: true });

const QuizClassOverride = mongoose.model<QuizClassOverrideDocument>('QuizClassOverride', quizClassOverrideSchema);

export default QuizClassOverride;
