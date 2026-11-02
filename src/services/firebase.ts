import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, deleteObject, getDownloadURL } from 'firebase/storage';
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
   * Save extracted study text as the required durable record in Firestore.
   * A copy of the original file in Firebase Storage is a best-effort backup:
   * an unavailable or misconfigured Storage bucket must never block studying.
   */
  async saveUploadedDocument(
    userId: string,
    document: Document,
    file: File,
    onStage?: (stage: 'uploading-storage' | 'storage-unavailable' | 'saving-firestore', progress?: number) => void
  ): Promise<Document> {
    assertOwner(userId);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'study-material';
    const storagePath = `users/${userId}/documents/${document.id}/${safeFileName}`;
    const fileRef = ref(storage, storagePath);
    let uploaded = false;

    // Attempt the original-file backup briefly. If Firebase Storage cannot
    // start or finish, continue with the extracted text instead of blocking.
    onStage?.('uploading-storage', 0);
    try {
      uploaded = await new Promise<boolean>((resolve) => {
        let settled = false;
        let timeout: ReturnType<typeof setTimeout>;
        const finish = (saved: boolean) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          resolve(saved);
        };
        const task = uploadBytesResumable(fileRef, file, {
          contentType: file.type || 'application/octet-stream',
          customMetadata: {
            ownerUid: userId,
            documentId: document.id,
          },
        });
        timeout = setTimeout(() => {
          task.cancel();
          finish(false);
        }, 8000);

        task.on(
          'state_changed',
          (snapshot) => {
            const percent = snapshot.totalBytes > 0
              ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
              : 0;
            onStage?.('uploading-storage', percent);
          },
          (error) => {
            console.warn('StudyMate original-file backup skipped; extracted study text will still be saved:', error);
            finish(false);
          },
          () => finish(true)
        );
      });
    } catch (error) {
      // Storage is optional. Firestore persistence below remains mandatory.
      console.warn('StudyMate original-file backup could not start:', error);
      uploaded = false;
    }

    if (!uploaded) {
      onStage?.('storage-unavailable');
      console.warn('Original file was not archived in Firebase Storage. Saving extracted text to Firestore.');
    }

    const savedDocument: Document = uploaded
      ? { ...document, userId, storagePath }
      : { ...document, userId };
    onStage?.('saving-firestore');

    try {
      let firestoreTimeout: ReturnType<typeof setTimeout> | undefined;
      await Promise.race([
        this.saveDocument(userId, savedDocument),
        new Promise<never>((_, reject) => {
          firestoreTimeout = setTimeout(() => reject(
            new Error('Saving the extracted study material to Firestore timed out. Please retry.')
          ), 20000);
        }),
      ]).finally(() => {
        if (firestoreTimeout) clearTimeout(firestoreTimeout);
      });
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

  async getDocuments(userId: string): Promise<Document[]> {
    assertOwner(userId);
    const path = `users/${userId}/documents`;
    try {
      const result = await getDocs(query(
        collection(db, 'users', userId, 'documents'),
        orderBy('createdAt', 'desc')
      ));
      return result.docs.map((item) => item.data() as Document);
    } catch (error) {
      throw firestoreError(error, OperationType.LIST, path);
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

  async getSummaries(userId: string): Promise<Summary[]> {
    assertOwner(userId);
    const path = `users/${userId}/summaries`;
    try {
      const result = await getDocs(query(
        collection(db, 'users', userId, 'summaries'),
        orderBy('createdAt', 'desc')
      ));
      return result.docs.map((item) => item.data() as Summary);
    } catch (error) {
      throw firestoreError(error, OperationType.LIST, path);
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
