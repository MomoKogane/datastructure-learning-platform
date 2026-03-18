import mongoose, { Document, Schema } from 'mongoose';

export interface OjProblemPayload {
  title: string;
  description: string;
  inputDescription: string;
  outputDescription: string;
  sampleInput: string;
  sampleOutput: string;
  dataRange: string;
  constraints: {
    timeLimitMs: number;
    memoryLimitMb: number;
    stackLimitKb: number;
  };
  testCases: Array<{
    input: string;
    output: string;
  }>;
  source: 'leetcode' | 'zoj' | 'pta' | 'custom';
  defaultLanguage: 'cpp' | 'java' | 'typescript' | 'python';
  starterCode: {
    cpp: string;
    java: string;
    typescript: string;
    python?: string;
  };
}

export interface OjClassProblemOverrideDocument extends Document {
  sectionId: string;
  classId: string;
  teacherId: string;
  problem: OjProblemPayload;
  createdAt: Date;
  updatedAt: Date;
}

const ojClassProblemOverrideSchema = new Schema<OjClassProblemOverrideDocument>({
  sectionId: { type: String, required: true, trim: true, index: true },
  classId: { type: String, required: true, trim: true, index: true },
  teacherId: { type: String, required: true, trim: true, index: true },
  problem: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    inputDescription: { type: String, default: '' },
    outputDescription: { type: String, default: '' },
    sampleInput: { type: String, default: '' },
    sampleOutput: { type: String, default: '' },
    dataRange: { type: String, default: '' },
    constraints: {
      timeLimitMs: { type: Number, required: true },
      memoryLimitMb: { type: Number, required: true },
      stackLimitKb: { type: Number, required: true }
    },
    testCases: {
      type: [{
        input: { type: String, required: true },
        output: { type: String, required: true }
      }],
      default: []
    },
    source: { type: String, enum: ['leetcode', 'zoj', 'pta', 'custom'], default: 'custom' },
    defaultLanguage: { type: String, enum: ['cpp', 'java', 'typescript', 'python'], default: 'cpp' },
    starterCode: {
      cpp: { type: String, default: '' },
      java: { type: String, default: '' },
      typescript: { type: String, default: '' },
      python: { type: String, default: '' }
    }
  }
}, {
  timestamps: true,
  collection: 'ojClassProblemOverrides'
});

ojClassProblemOverrideSchema.index({ sectionId: 1, classId: 1 }, { unique: true });

const OjClassProblemOverride = mongoose.model<OjClassProblemOverrideDocument>('OjClassProblemOverride', ojClassProblemOverrideSchema);

export default OjClassProblemOverride;
