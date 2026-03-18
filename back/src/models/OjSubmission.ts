import mongoose, { Document, Schema } from 'mongoose';

export interface OjSubmissionDocument extends Document {
  userId: string;
  sectionId: string;
  classId?: string;
  language: 'cpp' | 'java' | 'typescript' | 'python';
  compiler: string;
  code: string;
  result: {
    status: 'AC' | 'WA' | 'CE' | 'RE' | 'TLE' | 'MLE' | 'OLE' | 'PE';
    executionTimeMs: number;
    memoryUsageMb: number;
    detail: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ojSubmissionSchema = new Schema<OjSubmissionDocument>({
  userId: { type: String, required: true, index: true },
  sectionId: { type: String, required: true, index: true },
  classId: { type: String, index: true },
  language: { type: String, enum: ['cpp', 'java', 'typescript', 'python'], required: true },
  compiler: { type: String, required: true },
  code: { type: String, required: true },
  result: {
    status: {
      type: String,
      enum: ['AC', 'WA', 'CE', 'RE', 'TLE', 'MLE', 'OLE', 'PE'],
      required: true
    },
    executionTimeMs: { type: Number, required: true },
    memoryUsageMb: { type: Number, required: true },
    detail: { type: String, default: '' }
  }
}, {
  timestamps: true,
  collection: 'ojSubmissions'
});

ojSubmissionSchema.index({ userId: 1, sectionId: 1, createdAt: -1 });

const OjSubmission = mongoose.model<OjSubmissionDocument>('OjSubmission', ojSubmissionSchema);

export default OjSubmission;
