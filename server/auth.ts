import { Request, Response, NextFunction } from 'express';

export interface FirebaseAuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: FirebaseAuthenticatedUser;
}

/**
 * Verify the Firebase ID token with Firebase Authentication.
 * No user identity or session is read from deployment-local storage.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }

  const idToken = authorization.slice('Bearer '.length).trim();
  const firebaseApiKey = process.env.FIREBASE_API_KEY;

  if (!firebaseApiKey) {
    console.error('FIREBASE_API_KEY is missing from the server environment.');
    return res.status(503).json({ error: 'Firebase authentication is not configured on the server.' });
  }

  try {
    const verification = await fetch(
      'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(firebaseApiKey),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!verification.ok) {
      return res.status(401).json({ error: 'Your Firebase sign-in has expired. Please sign in again.' });
    }

    const result = await verification.json() as {
      users?: Array<{
        localId?: string;
        email?: string;
        displayName?: string;
        disabled?: boolean;
      }>;
    };

    const firebaseUser = result.users?.[0];
    if (!firebaseUser?.localId || !firebaseUser.email || firebaseUser.disabled) {
      return res.status(401).json({ error: 'The Firebase account could not be verified.' });
    }

    req.user = {
      id: firebaseUser.localId,
      email: firebaseUser.email,
      fullName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
    };

    return next();
  } catch (error) {
    console.error('Firebase ID token verification failed:', error);
    return res.status(503).json({ error: 'Unable to verify your Firebase session right now. Please retry.' });
  }
}
