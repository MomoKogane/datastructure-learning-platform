import mongoose, { Document, Schema } from 'mongoose';

export type SectionTemplateType = 'theory' | 'data-structure';
export type SectionModuleName = 'theory' | 'visualization' | 'examples' | 'practice' | 'keyTakeaways';

export interface SectionContentDocument extends Document {
  sectionId: string;
  aliases: string[];
  chapterId?: string;
  chapterTitle?: string;
  sectionTitle?: string;
  templateType: SectionTemplateType;
  allowedModules: SectionModuleName[];
  quizSource: 'theory';
  modules: Partial<Record<SectionModuleName, unknown>>;
  quizTheory?: {
    introduction: string;
    sections: Array<{
      title: string;
      content: string;
      examples?: string[];
    }>;
    keyTakeaways: string[];
    quizQuestions?: unknown[];
  };
  dataSources?: {
    frontendFile?: string;
    backendTheoryFile?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const sectionContentSchema = new Schema<SectionContentDocument>({
  sectionId: { type: String, required: true, unique: true, index: true },
  aliases: { type: [String], default: [] },
  chapterId: { type: String },
  chapterTitle: { type: String },
  sectionTitle: { type: String },
  templateType: {
    type: String,
    enum: ['theory', 'data-structure'],
    required: true
  },
  allowedModules: {
    type: [String],
    default: [],
    validate: {
      validator: (items: string[]) => items.every((item) => ['theory', 'visualization', 'examples', 'practice', 'keyTakeaways'].includes(item)),
      message: 'allowedModules contains invalid module name'
    }
  },
  quizSource: {
    type: String,
    enum: ['theory'],
    default: 'theory',
    required: true
  },
  modules: { type: Schema.Types.Mixed, default: {} },
  quizTheory: {
    introduction: { type: String },
    sections: {
      type: [
        {
          title: { type: String, required: true },
          content: { type: String, required: true },
          examples: { type: [String], default: [] }
        }
      ],
      default: []
    },
    keyTakeaways: { type: [String], default: [] },
    quizQuestions: { type: [Schema.Types.Mixed], required: false }
  },
  dataSources: {
    frontendFile: { type: String },
    backendTheoryFile: { type: String }
  }
}, { timestamps: true });

sectionContentSchema.index({ aliases: 1 });

const SectionContent = mongoose.model<SectionContentDocument>('SectionContent', sectionContentSchema);

export default SectionContent;
