import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage, ref, uploadBytes, deleteObject, getDownloadURL } from 'firebase/storage';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, Document, Summary, Quiz, QuizAttempt, UserStats } from '../types/index.js';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// StudyMate intentionally uses its named Firestore database configured in Firebase.
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function firestoreError(error: unknown, operationType: OperationType, path: string): Error {
  const message = error instanceof Error ? error.message : String(error);
  const details = {
    error: message,
    operationType,
    path,
    userId: auth.currentUser?.uid || null,
    email: auth.currentUser?.email || null,
  };
  console.error('StudyMate Firestore operation failed:', JSON.stringify(details));
  return new Error(message);
}

function assertOwner(userId: string): void {
  if (!auth.currentUser) {
    throw new Error('Please sign in before accessing your study data.');
  }
  if (auth.currentUser.uid !== userId) {
    throw new Error('You do not have permission to access this account data.');
  }
}

function cleanForFirestore<T extends Record<string, any>>(value: T): T {
  const clean: Record<string, any> = {};
  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined) clean[key] = item;
  }
  return clean as T;
}

function ensureDocumentFitsFirestore(document: Document): void {
  const bytes = new TextEncoder().encode(JSON.stringify(document)).length;
  if (bytes > 670 * 1024) {
    throw new Error('This extracted document is too large for a single Firestore record. Split it into smaller chapters before saving.');
  }
}

function createSubscription<T>(
  userId: string,
  collectionName: string,
  sortField: string,
  onSuccess: (items: T[]) => void,
  onError?: (error: Error) => void
) {
  assertOwner(userId);
  const path = `users/${userId}/${collectionName}`;
  try {
    const itemsQuery = query(
      collection(db, 'users', userId, collectionName),
      orderBy(sortField, 'desc')
    );
    return onSnapshot(
      itemsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((item) => item.data() as T);
        onSuccess(items);
      },
      (error) => {
        const normalized = firestoreError(error, OperationType.LIST, path);
        if (onError) onError(normalized);
      }
    );
  } catch (error) {
    const normalized = firestoreError(error, OperationType.LIST, path);
    if (onError) onError(normalized);
    return () => {};
  }
}

/**
 * Run a real server-backed read to validate the configured Firestore database
 * and its security rules. This is also used for connection diagnostics.
 */
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info('StudyMate Firestore connection verified.');
  } catch (error) {
    throw firestoreError(error, OperationType.GET, 'test/connection');
  }
}

export function canAccessUserFirestore(userId: string): boolean {
  return !!auth.currentUser && auth.currentUser.uid === userId;
}

export function isFirebaseAuthenticated(): boolean {
  return !!auth.currentUser;
}

export const firestoreService = {
  async getUserProfile(userId: string): Promise<User | null> {
    assertOwner(userId);
    const path = `users/${userId}`;
    try {
      const snapshot = await getDoc(doc(db, 'users', userId));
      return snapshot.exists() ? snapshot.data() as User : null;
    } catch (error) {
      throw firestoreError(error, OperationType.GET, path);
    }
  },

  async saveUserProfile(user: User): Promise<void> {
    assertOwner(user.id);
    const path = `users/${user.id}`;
    try {
      await setDoc(doc(db, 'users', user.id), cleanForFirestore(user), { merge: true });
    } catch (error) {
      throw firestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveDocument(userId: string, document: Document): Promise<Document> {
    assertOwner(userId);
    const cleanDocument = cleanForFirestore({ ...document, userId });
    ensureDocumentFitsFirestore(cleanDocument);
    const path = `users/${userId}/documents/${cleanDocument.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'documents', cleanDocument.id), cleanDocument);
      return cleanDocument;
    } catch (error) {
      throw firestoreError(error, OperationType.CREATE, path);
    }
  },

  /**
   * Preserve the uploaded original in the owner's private Firebase Storage folder,
   * then save the storage path beside its extracted text in Firestore.
   * If the Firestore write fails, remove the uploaded object to avoid an orphan.
   */
  async saveUploadedDocument(userId: string, document: Document, file: File): Promise<Document> {
    assertOwner(userId);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'study-material';
    const storagePath = `users/${userId}/documents/${document.id}/${safeFileName}`;
    const fileRef = ref(storage, storagePath);
    let uploaded = false;

    try {
      await uploadBytes(fileRef, file, {
        contentType: file.type || 'application/octet-stream',
        customMetadata: {
          ownerUid: userId,
          documentId: document.id,
        },
      });
      uploaded = true;

      const savedDocument: Document = { ...document, userId, storagePath };
      await this.saveDocument(userId, savedDocument);
      return savedDocument;
    } catch (error) {
      if (uploaded) {
        try {
          await deleteObject(fileRef);
        } catch (cleanupError) {
          console.warn('Unable to remove uncommitted Storage upload:', cleanupError);
        }
      }
      throw error;
    }
  },

  async getOriginalDownloadUrl(userId: string, storagePath: string): Promise<string> {
    assertOwner(userId);
    if (!storagePath.startsWith(`users/${userId}/documents/`)) {
      throw new Error('The file path does not belong to the signed-in user.');
    }
    try {
      return await getDownloadURL(ref(storage, storagePath));
    } catch (error) {
      throw firestoreError(error, OperationType.GET, storagePath);
    }
  },

  async deleteDocument(userId: string, documentId: string): Promise<void> {
    assertOwner(userId);
    const path = `users/${userId}/documents/${documentId}`;
    try {
      const documentReference = doc(db, 'users', userId, 'documents', documentId);
      const snapshot = await getDoc(documentReference);
      const storagePath = snapshot.exists() ? (snapshot.data() as Document).storagePath : undefined;

      // Remove the Firestore record first; a failed Storage cleanup cannot leave
      // the deleted document visible in the user's study library.
      await deleteDoc(documentReference);
      if (storagePath && storagePath.startsWith(`users/${userId}/documents/`)) {
        try {
          await deleteObject(ref(storage, storagePath));
        } catch (storageError) {
          console.warn('Original file cleanup failed after Firestore deletion:', storageError);
        }
      }
    } catch (error) {
      throw firestoreError(error, OperationType.DELETE, path);
    }
  },

  subscribeDocuments(userId: string, onSuccess: (items: Document[]) => void, onError?: (error: Error) => void) {
    return createSubscription<Document>(userId, 'documents', 'createdAt', onSuccess, onError);
  },

  async saveSummary(userId: string, summary: Summary): Promise<Summary> {
    assertOwner(userId);
    const cleanSummary = cleanForFirestore({ ...summary, userId });
    const path = `users/${userId}/summaries/${cleanSummary.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'summaries', cleanSummary.id), cleanSummary);
      return cleanSummary;
    } catch (error) {
      throw firestoreError(error, OperationType.CREATE, path);
    }
  },

  async deleteSummary(userId: string, summaryId: string): Promise<void> {
    assertOwner(userId);
    const path = `users/${userId}/summaries/${summaryId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'summaries', summaryId));
    } catch (error) {
      throw firestoreError(error, OperationType.DELETE, path);
    }
  },

  subscribeSummaries(userId: string, onSuccess: (items: Summary[]) => void, onError?: (error: Error) => void) {
    return createSubscription<Summary>(userId, 'summaries', 'createdAt', onSuccess, onError);
  },

  async saveQuiz(userId: string, quiz: Quiz): Promise<Quiz> {
    assertOwner(userId);
    const cleanQuiz = cleanForFirestore({ ...quiz, userId });
    const path = `users/${userId}/quizzes/${cleanQuiz.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'quizzes', cleanQuiz.id), cleanQuiz);
      return cleanQuiz;
    } catch (error) {
      throw firestoreError(error, OperationType.CREATE, path);
    }
  },

  async deleteQuiz(userId: string, quizId: string): Promise<void> {
    assertOwner(userId);
    const path = `users/${userId}/quizzes/${quizId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'quizzes', quizId));
    } catch (error) {
      throw firestoreError(error, OperationType.DELETE, path);
    }
  },

  subscribeQuizzes(userId: string, onSuccess: (items: Quiz[]) => void, onError?: (error: Error) => void) {
    return createSubscription<Quiz>(userId, 'quizzes', 'createdAt', onSuccess, onError);
  },

  async saveQuizAttempt(userId: string, attempt: QuizAttempt): Promise<QuizAttempt> {
    assertOwner(userId);
    const cleanAttempt = cleanForFirestore({ ...attempt, userId });
    const path = `users/${userId}/quizAttempts/${cleanAttempt.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'quizAttempts', cleanAttempt.id), cleanAttempt);
      return cleanAttempt;
    } catch (error) {
      throw firestoreError(error, OperationType.CREATE, path);
    }
  },

  subscribeAttempts(userId: string, onSuccess: (items: QuizAttempt[]) => void, onError?: (error: Error) => void) {
    return createSubscription<QuizAttempt>(userId, 'quizAttempts', 'completedAt', onSuccess, onError);
  },

  calculateStats(
    documents: Document[],
    summaries: Summary[],
    quizzes: Quiz[],
    attempts: QuizAttempt[]
  ): UserStats {
    const score = attempts.reduce((total, item) => total + item.score, 0);
    const possible = attempts.reduce((total, item) => total + item.totalQuestions, 0);
    return {
      totalDocuments: documents.length,
      totalSummaries: summaries.length,
      totalQuizzes: quizzes.length,
      totalAttempts: attempts.length,
      averageScore: possible > 0 ? Math.round((score / possible) * 100) : 0,
      latestAttempts: attempts.slice(0, 5),
    };
  },
};
