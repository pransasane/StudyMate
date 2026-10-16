import fs from 'node:fs';
import path from 'node:path';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'studymate-135bf';
const sourcePath = path.resolve(process.cwd(), 'data', 'studymate_db.json');
if (!fs.existsSync(sourcePath)) {
  throw new Error(`Legacy database not found at ${sourcePath}. Back up/copy data/studymate_db.json before running this migration.`);
}
if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId });
const firestore = getFirestore();
const legacy = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const collections = ['users', 'documents', 'summaries', 'quizzes', 'quizAttempts'] as const;

for (const collectionName of collections) {
  const rows = Array.isArray(legacy[collectionName]) ? legacy[collectionName] : [];
  for (const row of rows) {
    if (!row?.id) {
      console.warn(`Skipping ${collectionName} record without an id.`);
      continue;
    }
    await firestore.collection(collectionName).doc(String(row.id)).set(row);
  }
  console.log(`Migrated ${rows.length} records to ${collectionName}.`);
}
console.log('Migration finished. Verify records in Firebase Console before deleting the old JSON file.');
