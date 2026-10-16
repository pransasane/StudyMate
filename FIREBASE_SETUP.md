# StudyMate Firestore setup

The Express backend uses Cloud Firestore for users, documents, summaries, quizzes, and quiz attempts.

## One-time setup

1. In Firebase Console, open project `studymate-135bf`.
2. Select **Build → Firestore Database** and create the database.
3. Configure backend credentials securely. For local development, set `GOOGLE_APPLICATION_CREDENTIALS` to the full path of a private service-account JSON file and `FIREBASE_PROJECT_ID=studymate-135bf`. Never commit that JSON key to GitHub or put it in frontend variables.
4. Run `npm install`, then `npm run lint` and `npm run build`.
5. If you have an old `data/studymate_db.json` file, back it up and run `npm run migrate:firestore` before relying on the new database.

## Existing data

The migration script copies the users, documents, summaries, quizzes, and quiz attempts in the old JSON file into matching Firestore collections using each record's existing ID. Verify the Firestore records before deleting the old file. Hosted JSON data may be unavailable if the host uses an ephemeral filesystem.

## Security and limitations

Firebase Admin SDK access is server-side. Keep Admin credentials private. The Firebase Web SDK config is public project configuration and does not grant database access by itself. Firestore must be created in the Firebase Console and the backend must have valid credentials.

The exact runtime error mentioned by the project owner has not been identified because no error screenshot or text was provided. This change migrates the code's database layer, but it still needs to be built and run with valid Firebase credentials to confirm the live deployment works.
