import mongoose, { Document, Schema } from 'mongoose';

export interface TeachingClassDocument extends Document {
  classId: string;
  teacherId: string;
  name: string;
  studentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const teachingClassSchema = new Schema<TeachingClassDocument>({
  classId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  teacherId: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  studentIds: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  collection: 'teachingClasses'
});

teachingClassSchema.index({ teacherId: 1, classId: 1 });

const TeachingClass = mongoose.model<TeachingClassDocument>('TeachingClass', teachingClassSchema);

export default TeachingClass;
