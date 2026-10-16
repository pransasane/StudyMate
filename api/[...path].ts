import { createApp } from '../server.js';

let appPromise: ReturnType<typeof createApp> | undefined;

// Vercel sends all /api/* requests to this serverless function.
// Reuse the Express app for warm invocations.
export default async function handler(req: any, res: any) {
  try {
    appPromise ??= createApp();
    const app = await appPromise;
    return app(req, res);
  } catch (error) {
    console.error('StudyMate API initialization failed:', error);
    return res.status(500).json({
      error: 'StudyMate API could not start. Check the Vercel deployment logs and Firebase server credentials.',
    });
  }
}
