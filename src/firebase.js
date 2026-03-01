import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC3kglnrThGLz9T_Xp44fwQQSkRrRVtZRg",
  authDomain: "munsiji-b2a55.firebaseapp.com",
  projectId: "munsiji-b2a55",
  storageBucket: "munsiji-b2a55.firebasestorage.app",
  messagingSenderId: "1037754771828",
  appId: "1:1037754771828:web:6ce19e84bf9a93687d6421"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export default app;
