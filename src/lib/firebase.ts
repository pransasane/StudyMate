import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase's web configuration identifies the project; it is not a private
 * service-account credential. Keep privileged server credentials out of this file.
 */
const firebaseConfig = {
  apiKey: "AIzaSyBANKPCIcqtPAWsbsmdczJ5rjpDztgO8_A",
  authDomain: "studymate-135bf.firebaseapp.com",
  projectId: "studymate-135bf",
  storageBucket: "studymate-135bf.firebasestorage.app",
  messagingSenderId: "739706215219",
  appId: "1:739706215219:web:02cf7fd6b1d61dc7377c46",
  measurementId: "G-L4ET7LH2N7",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firestore = getFirestore(firebaseApp);

/** Analytics is optional and only supported in some browser environments. */
export async function initializeFirebaseAnalytics() {
  if (typeof window === 'undefined' || !(await isSupported())) return null;
  return getAnalytics(firebaseApp);
}
