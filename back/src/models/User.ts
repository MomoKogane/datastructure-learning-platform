import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface SectionProgress {
  sectionId: string;
  theoryCompleted: boolean;
  quizCompleted: boolean;
  codingCompleted: boolean;
  ojVisited?: boolean;
  quizScore?: number;
  codingJudgeStatus?: string;
}

export interface UserDocument extends Document {
  userId: string;
  role: UserRole;
  name: string;
  email?: string;
  password: string;
  classId?: string;
  favoriteSections: string[];
  sectionProgress: SectionProgress[];
  createdAt: Date;
  updatedAt: Date;
}

const sectionProgressSchema = new Schema<SectionProgress>({
  sectionId: { type: String, required: true, trim: true },
  theoryCompleted: { type: Boolean, default: false },
  quizCompleted: { type: Boolean, default: false },
  codingCompleted: { type: Boolean, default: false },
  ojVisited: { type: Boolean, default: false },
  quizScore: { type: Number, required: false, min: 0 },
  codingJudgeStatus: { type: String, required: false, trim: true }
}, { _id: false });

const userSchema = new Schema<UserDocument>({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  classId: {
    type: String,
    trim: true,
    index: true
  },
  favoriteSections: {
    type: [String],
    default: []
  },
  sectionProgress: {
    type: [sectionProgressSchema],
    default: []
  }
}, {
  timestamps: true,
  collection: 'users'
});

userSchema.index({ role: 1, userId: 1 });

const User = mongoose.model<UserDocument>('User', userSchema);

export default User;
