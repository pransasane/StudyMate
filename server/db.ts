import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

export interface User {
  id: string; email: string; passwordHash: string; fullName: string;
  educationLevel?: string; geminiApiKey?: string; openRouterApiKey?: string;
  preferredProvider?: 'openrouter' | 'gemini'; openRouterModel?: string; createdAt: string;
}
export interface Document {
  id: string; userId: string; title: string; originalFilename: string; mimetype: string;
  fileSize: number; wordCount: number; characterCount: number; pageCount?: number;
  extractedText: string; snippet: string; createdAt: string;
}
export interface Summary {
  id: string; userId: string; documentId?: string; title: string;
  summaryType: 'concise' | 'standard' | 'detailed' | 'very_detailed';
  content: string; keyPoints: string[]; wordCount: number; createdAt: string;
}
export interface QuizQuestion {
  id: string; question: string; type: 'multiple_choice' | 'true_false'; options: string[];
  correctAnswerIndex: number; explanation: string; topic?: string;
}
export interface Quiz {
  id: string; userId: string; documentId?: string; summaryId?: string; title: string;
  difficulty: 'easy' | 'medium' | 'hard'; questionCount: number;
  questionType: 'multiple_choice' | 'true_false' | 'mixed'; questions: QuizQuestion[]; createdAt: string;
}
export interface QuizAttempt {
  id: string; userId: string; quizId: string; quizTitle: string; score: number;
  totalQuestions: number; percentage: number; userAnswers: Record<string, number>;
  timeSpentSeconds: number; completedAt: string;
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'studymate-135bf';
if (!getApps().length) {
  initializeApp({ credential: applicationDefault(), projectId });
}
const firestore: Firestore = getFirestore();
firestore.settings({ ignoreUndefinedProperties: true });

type CollectionName = 'users' | 'documents' | 'summaries' | 'quizzes' | 'quizAttempts';
class Database {
  private collection(name: CollectionName) { return firestore.collection(name); }
  private async all<T>(name: CollectionName): Promise<T[]> {
    const snap = await this.collection(name).get();
    return snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as T);
  }
  private async findById<T>(name: CollectionName, id: string): Promise<T | undefined> {
    const snap = await this.collection(name).doc(id).get();
    return snap.exists ? ({ ...snap.data(), id: snap.id } as T) : undefined;
  }
  private async add<T extends {id:string}>(name: CollectionName, value: T): Promise<T> {
    await this.collection(name).doc(value.id).set(value);
    return value;
  }
  private async update<T extends {id:string}>(name: CollectionName, id: string, updates: Partial<T>): Promise<T | undefined> {
    const ref = this.collection(name).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return undefined;
    await ref.set(updates, { merge: true });
    return { ...snap.data(), ...updates, id } as T;
  }
  private async removeOwned(name: CollectionName, id: string, userId: string): Promise<boolean> {
    const ref = this.collection(name).doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.get('userId') !== userId) return false;
    await ref.delete();
    return true;
  }
  async getUserById(id: string) { return this.findById<User>('users', id); }
  async getUserByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    const snap = await this.collection('users').where('email', '==', normalized).limit(1).get();
    return snap.empty ? undefined : ({ ...snap.docs[0].data(), id: snap.docs[0].id } as User);
  }
  async createUser(user: Omit<User, 'id'|'createdAt'>) {
    const value: User = { id: crypto.randomUUID(), ...user, email: user.email.trim().toLowerCase(), createdAt: new Date().toISOString() };
    return this.add('users', value);
  }
  async updateUser(id: string, updates: Partial<User>) { return this.update<User>('users', id, updates); }
  async getDocuments(userId: string) { return this.sortedOwned<Document>('documents', userId, 'createdAt'); }
  async getDocumentById(id: string, userId: string) {
    const item = await this.findById<Document>('documents', id);
    return item?.userId === userId ? item : undefined;
  }
  async createDocument(value: Omit<Document, 'id'|'createdAt'>) {
    return this.add('documents', { id: crypto.randomUUID(), ...value, createdAt: new Date().toISOString() });
  }
  async deleteDocument(id: string, userId: string) { return this.removeOwned('documents', id, userId); }
  async getSummaries(userId: string) { return this.sortedOwned<Summary>('summaries', userId, 'createdAt'); }
  async getSummaryById(id: string, userId: string) {
    const item = await this.findById<Summary>('summaries', id);
    return item?.userId === userId ? item : undefined;
  }
  async createSummary(value: Omit<Summary, 'id'|'createdAt'>) {
    return this.add('summaries', { id: crypto.randomUUID(), ...value, createdAt: new Date().toISOString() });
  }
  async deleteSummary(id: string, userId: string) { return this.removeOwned('summaries', id, userId); }
  async getQuizzes(userId: string) { return this.sortedOwned<Quiz>('quizzes', userId, 'createdAt'); }
  async getQuizById(id: string, userId: string) {
    const item = await this.findById<Quiz>('quizzes', id);
    return item?.userId === userId ? item : undefined;
  }
  async createQuiz(value: Omit<Quiz, 'id'|'createdAt'>) {
    return this.add('quizzes', { id: crypto.randomUUID(), ...value, createdAt: new Date().toISOString() });
  }
  async deleteQuiz(id: string, userId: string) { return this.removeOwned('quizzes', id, userId); }
  async getQuizAttempts(userId: string) {
    return (await this.all<QuizAttempt>('quizAttempts')).filter(a => a.userId === userId)
      .sort((a,b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }
  async getAttemptsForQuiz(quizId: string, userId: string) {
    return (await this.all<QuizAttempt>('quizAttempts')).filter(a => a.quizId === quizId && a.userId === userId)
      .sort((a,b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }
  async createQuizAttempt(value: Omit<QuizAttempt, 'id'|'completedAt'>) {
    return this.add('quizAttempts', { id: crypto.randomUUID(), ...value, completedAt: new Date().toISOString() });
  }
  async getUserStats(userId: string) {
    const [docs, summaries, quizzes, attempts] = await Promise.all([
      this.getDocuments(userId), this.getSummaries(userId), this.getQuizzes(userId), this.getQuizAttempts(userId)
    ]);
    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
    const totalPossible = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);
    return {
      totalDocuments: docs.length, totalSummaries: summaries.length, totalQuizzes: quizzes.length,
      totalAttempts: attempts.length,
      averageScore: totalPossible ? Math.round((totalScore / totalPossible) * 100) : 0,
      latestAttempts: attempts.slice(0, 5),
    };
  }
  private async sortedOwned<T extends {userId:string}>(name: CollectionName, userId: string, dateKey: 'createdAt'|'completedAt'): Promise<T[]> {
    return (await this.all<T>(name)).filter(item => item.userId === userId)
      .sort((a,b) => new Date(String((b as any)[dateKey])).getTime() - new Date(String((a as any)[dateKey])).getTime());
  }
}
export const db = new Database();
