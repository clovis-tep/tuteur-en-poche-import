import * as dotenv from 'dotenv';
dotenv.config();

import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const processExcelFile = async (filePath: string) => {
  const workbook = XLSX.readFile(filePath);

  const situations = XLSX.utils.sheet_to_json(workbook.Sheets['situations']);
  const chapitres = XLSX.utils.sheet_to_json(workbook.Sheets['chapitres']);
  const resumes = XLSX.utils.sheet_to_json(workbook.Sheets['resumes']);
  const flashcards = XLSX.utils.sheet_to_json(workbook.Sheets['flashcards']);
  const quizzes = XLSX.utils.sheet_to_json(workbook.Sheets['quizzes']);
  const quiz_questions = XLSX.utils.sheet_to_json(workbook.Sheets['quiz_questions']);

  const errors = validate({ situations, chapitres, resumes, flashcards, quizzes, quiz_questions });
  if (errors.length > 0) return { success: false, errors };

  const stats = await insertData({ situations, chapitres, resumes, flashcards, quizzes, quiz_questions });
  return { success: true, stats };
};

const validate = (data: any) => {
  const errors: any[] = [];

  data.situations.forEach((row: any, index: number) => {
    if (!row.local_id) errors.push({ sheet: 'situations', line: index + 2, message: 'local_id obligatoire' });
    if (!row.title) errors.push({ sheet: 'situations', line: index + 2, message: 'title obligatoire' });
    if (!row.subject) errors.push({ sheet: 'situations', line: index + 2, message: 'subject obligatoire' });
    if (!['EASY','MEDIUM','HARD'].includes(row.difficulty)) errors.push({ sheet: 'situations', line: index + 2, message: 'difficulty invalide' });
  });

  data.chapitres.forEach((row: any, index: number) => {
    if (!row.local_id) errors.push({ sheet: 'chapitres', line: index + 2, message: 'local_id obligatoire' });
    if (!row.sa_local_id) errors.push({ sheet: 'chapitres', line: index + 2, message: 'sa_local_id obligatoire' });
    if (!row.title) errors.push({ sheet: 'chapitres', line: index + 2, message: 'title obligatoire' });
    const saExists = data.situations.find((s: any) => s.local_id === row.sa_local_id);
    if (!saExists) errors.push({ sheet: 'chapitres', line: index + 2, message: `sa_local_id ${row.sa_local_id} introuvable` });
  });

  data.flashcards.forEach((row: any, index: number) => {
    if (!row.question) errors.push({ sheet: 'flashcards', line: index + 2, message: 'question obligatoire' });
    if (!row.answer) errors.push({ sheet: 'flashcards', line: index + 2, message: 'answer obligatoire' });
    if (!row.chapitre_local_id) errors.push({ sheet: 'flashcards', line: index + 2, message: 'chapitre_local_id obligatoire' });
  });

  data.quizzes.forEach((row: any, index: number) => {
    if (!row.local_id) errors.push({ sheet: 'quizzes', line: index + 2, message: 'local_id obligatoire' });
    if (!['MCQ','TRUE_FALSE','MATCHING','OPEN_ANSWER'].includes(row.type)) errors.push({ sheet: 'quizzes', line: index + 2, message: 'type invalide' });
  });

  return errors;
};

const insertData = async (data: any) => {
  const stats = { situations: 0, chapitres: 0, resumes: 0, flashcards: 0, quizzes: 0, quiz_questions: 0 };

  await prisma.$transaction(async (tx) => {
    const saMap: Record<string, string> = {};
    const chapitreMap: Record<string, string> = {};
    const quizMap: Record<string, string> = {};

    for (const row of data.situations as any[]) {
      const sa = await tx.learningSituation.create({
        data: {
          title: row.title, subject: row.subject, description: row.description || '',
          difficulty: row.difficulty, estimatedHours: Number(row.estimatedHours) || 1,
          order: Number(row.order) || 1, status: row.status || 'DRAFT', gradeId: row.gradeId,
        }
      });
      saMap[row.local_id] = sa.id;
      stats.situations++;
    }

    for (const row of data.chapitres as any[]) {
      const ch = await tx.learningChapter.create({
        data: {
          title: row.title, description: row.description || '', difficulty: row.difficulty || 'EASY',
          estimatedHours: Number(row.estimatedHours) || 1, order: Number(row.order) || 1,
          status: row.status || 'DRAFT', learningSituationId: saMap[row.sa_local_id],
        }
      });
      chapitreMap[row.local_id] = ch.id;
      stats.chapitres++;
    }

    for (const row of data.resumes as any[]) {
      await tx.courseSummary.create({
        data: {
          title: row.title, content: row.content,
          estimatedMinutes: Number(row.estimatedMinutes) || 10,
          status: row.status || 'DRAFT', chapterId: chapitreMap[row.chapitre_local_id],
        }
      });
      stats.resumes++;
    }

    for (const row of data.flashcards as any[]) {
      await tx.flashcard.create({
        data: {
          question: row.question, answer: row.answer, order: Number(row.order) || 1,
          status: row.status || 'DRAFT', chapterId: chapitreMap[row.chapitre_local_id],
        }
      });
      stats.flashcards++;
    }

    for (const row of data.quizzes as any[]) {
      const quiz = await tx.quiz.create({
        data: {
          title: row.title, type: row.type, difficulty: row.difficulty || 'EASY',
          feedbackCorrect: row.feedbackCorrect || '', feedbackIncorrect: row.feedbackIncorrect || '',
          feedbackPartial: row.feedbackPartial || '', status: row.status || 'DRAFT',
          chapterId: chapitreMap[row.chapitre_local_id],
        }
      });
      quizMap[row.local_id] = quiz.id;
      stats.quizzes++;
    }

    for (const row of data.quiz_questions as any[]) {
      await tx.quizQuestion.create({
        data: {
          question: row.question, quizId: quizMap[row.quiz_local_id],
          ...(row.type === 'MCQ' && { options: row.options.split('|'), correctOptionIndex: Number(row.correctOptionIndex) }),
          ...(row.type === 'TRUE_FALSE' && { correctAnswer: row.correctAnswer === 'TRUE' }),
          ...(row.type === 'OPEN_ANSWER' && { expectedAnswer: row.expectedAnswer }),
        }
      });
      stats.quiz_questions++;
    }
  });

  return stats;
};