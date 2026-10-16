# Firebase migration status

The backend code on this branch now uses the Firebase Admin SDK and Cloud Firestore for user accounts, documents, summaries, quizzes, and quiz attempts. The one-time migration script is available as `npm run migrate:firestore` to copy records from `data/studymate_db.json` when that file exists.

Before deployment, create Firestore in Firebase Console and configure server-side Application Default Credentials. The changes have not been built or run against the user's Firebase project in this environment, so successful live operation is not yet verified. The exact separate runtime error also remains unidentified without its screenshot or message.
