import dotenv from 'dotenv';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import QuizBank from '../models/QuizBank';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dslp';

type TheorySection = {
  title: string;
  content: string;
  examples?: string[];
};

type TheoryQuizQuestion = {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: number | boolean | string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
};

type TheoryFile = {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  content: {
    introduction: string;
    sections: TheorySection[];
    keyTakeaways: string[];
    quizQuestions?: TheoryQuizQuestion[];
  };
};

const loadTheoryFiles = (): Array<{ sectionId: string; data: TheoryFile }> => {
  const baseDir = path.join(__dirname, '..', '..', 'data', 'theoretical-content');
  const files = fs.readdirSync(baseDir).filter((file) => file.endsWith('.json'));

  return files.map((fileName) => {
    const sectionId = fileName.replace('.json', '');
    const fullPath = path.join(baseDir, fileName);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(raw) as TheoryFile;
    return { sectionId, data };
  });
};

async function seedQuizBanksFromTheoryFiles() {
  await mongoose.connect(mongoUri);

  const theoryFiles = loadTheoryFiles();

  for (const item of theoryFiles) {
    const existing = await QuizBank.findOne({ sectionId: item.sectionId }).lean();

    const fileQuestions = Array.isArray(item.data.content.quizQuestions)
      ? item.data.content.quizQuestions
      : [];

    const existingQuestions = Array.isArray(existing?.questions)
      ? existing.questions
      : [];

    const mergedQuestions = existingQuestions.length > 0 ? existingQuestions : fileQuestions;

    await QuizBank.findOneAndUpdate(
      { sectionId: item.sectionId },
      {
        sectionId: item.sectionId,
        title: item.data.title,
        description: item.data.subtitle,
        theoryContent: {
          introduction: item.data.content.introduction,
          sections: item.data.content.sections,
          keyTakeaways: item.data.content.keyTakeaways,
          quizQuestions: fileQuestions.length > 0 ? fileQuestions : undefined
        },
        questions: mergedQuestions
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[seedQuizBankFromTheoryFiles] Upserted sectionId=${item.sectionId}`);
  }
}

seedQuizBanksFromTheoryFiles()
  .then(async () => {
    console.log('[seedQuizBankFromTheoryFiles] Done.');
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('[seedQuizBankFromTheoryFiles] Failed:', error);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  });
