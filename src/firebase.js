// ============================================================
// Firebase কনফিগারেশন
// Firebase Console → Project Settings → General → Your apps →
// Web app → firebaseConfig — সেখান থেকে নিচের মানগুলো বসাও।
// ============================================================
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'তোমার-API-KEY-এখানে',
  authDomain: 'munsiji-app.firebaseapp.com',
  projectId: 'munsiji-app',
  storageBucket: 'munsiji-app.firebasestorage.app',
  messagingSenderId: 'তোমার-SENDER-ID',
  appId: 'তোমার-APP-ID',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
auth.languageCode = 'bn'
