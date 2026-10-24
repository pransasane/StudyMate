import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, Document, Summary, Quiz, QuizAttempt, UserStats } from '../types/index.js';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: getFirestore with custom firestoreDatabaseId from firebase-applet-config.json
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling according to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL CONSTRAINT: Validate Connection to Firestore on startup
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// --- Firestore Database Data Access Service ---

export const firestoreService = {
  // User Profile
  async getUserProfile(userId: string): Promise<User | null> {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) return null;
      return snap.data() as User;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return null;
    }
  },

  async saveUserProfile(user: User): Promise<void> {
    const path = `users/${user.id}`;
    try {
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Documents
  async saveDocument(userId: string, document: Document): Promise<Document> {
    const path = `users/${userId}/documents/${document.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'documents', document.id), document);
      return document;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      throw err;
    }
  },

  async deleteDocument(userId: string, documentId: string): Promise<void> {
    const path = `users/${userId}/documents/${documentId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'documents', documentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  subscribeDocuments(
    userId: string,
    onSuccess: (docs: Document[]) => void,
    onError?: (err: Error) => void
  ) {
    const path = `users/${userId}/documents`;
    try {
      const q = query(collection(db, 'users', userId, 'documents'), orderBy('createdAt', 'desc'));
      return onSnapshot(
        q,
        (snap) => {
          const docs: Document[] = [];
          snap.forEach((d) => docs.push(d.data() as Document));
          onSuccess(docs);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, path);
          if (onError) onError(error);
        }
      );
    } catch (err: any) {
      handleFirestoreError(err, OperationType.LIST, path);
      return () => {};
    }
  },

  // Summaries
  async saveSummary(userId: string, summary: Summary): Promise<Summary> {
    const path = `users/${userId}/summaries/${summary.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'summaries', summary.id), summary);
      return summary;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      throw err;
    }
  },

  async deleteSummary(userId: string, summaryId: string): Promise<void> {
    const path = `users/${userId}/summaries/${summaryId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'summaries', summaryId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  subscribeSummaries(
    userId: string,
    onSuccess: (summaries: Summary[]) => void,
    onError?: (err: Error) => void
  ) {
    const path = `users/${userId}/summaries`;
    try {
      const q = query(collection(db, 'users', userId, 'summaries'), orderBy('createdAt', 'desc'));
      return onSnapshot(
        q,
        (snap) => {
          const list: Summary[] = [];
          snap.forEach((d) => list.push(d.data() as Summary));
          onSuccess(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, path);
          if (onError) onError(error);
        }
      );
    } catch (err: any) {
      handleFirestoreError(err, OperationType.LIST, path);
      return () => {};
    }
  },

  // Quizzes
  async saveQuiz(userId: string, quiz: Quiz): Promise<Quiz> {
    const path = `users/${userId}/quizzes/${quiz.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'quizzes', quiz.id), quiz);
      return quiz;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      throw err;
    }
  },

  async deleteQuiz(userId: string, quizId: string): Promise<void> {
    const path = `users/${userId}/quizzes/${quizId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'quizzes', quizId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  subscribeQuizzes(
    userId: string,
    onSuccess: (quizzes: Quiz[]) => void,
    onError?: (err: Error) => void
  ) {
    const path = `users/${userId}/quizzes`;
    try {
      const q = query(collection(db, 'users', userId, 'quizzes'), orderBy('createdAt', 'desc'));
      return onSnapshot(
        q,
        (snap) => {
          const list: Quiz[] = [];
          snap.forEach((d) => list.push(d.data() as Quiz));
          onSuccess(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, path);
          if (onError) onError(error);
        }
      );
    } catch (err: any) {
      handleFirestoreError(err, OperationType.LIST, path);
      return () => {};
    }
  },

  // Quiz Attempts
  async saveQuizAttempt(userId: string, attempt: QuizAttempt): Promise<QuizAttempt> {
    const path = `users/${userId}/quizAttempts/${attempt.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'quizAttempts', attempt.id), attempt);
      return attempt;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      throw err;
    }
  },

  subscribeAttempts(
    userId: string,
    onSuccess: (attempts: QuizAttempt[]) => void,
    onError?: (err: Error) => void
  ) {
    const path = `users/${userId}/quizAttempts`;
    try {
      const q = query(collection(db, 'users', userId, 'quizAttempts'), orderBy('completedAt', 'desc'));
      return onSnapshot(
        q,
        (snap) => {
          const list: QuizAttempt[] = [];
          snap.forEach((d) => list.push(d.data() as QuizAttempt));
          onSuccess(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, path);
          if (onError) onError(error);
        }
      );
    } catch (err: any) {
      handleFirestoreError(err, OperationType.LIST, path);
      return () => {};
    }
  },

  calculateStats(
    docs: Document[],
    summaries: Summary[],
    quizzes: Quiz[],
    attempts: QuizAttempt[]
  ): UserStats {
    const totalScore = attempts.reduce((acc, a) => acc + a.score, 0);
    const totalPossible = attempts.reduce((acc, a) => acc + a.totalQuestions, 0);
    const avgScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

    return {
      totalDocuments: docs.length,
      totalSummaries: summaries.length,
      totalQuizzes: quizzes.length,
      totalAttempts: attempts.length,
      averageScore: avgScore,
      latestAttempts: attempts.slice(0, 5),
    };
  },
};
