import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD5kS2u6WXDitIlP_451quH4V9pqbhuX7M",
  authDomain: "olivia-4339f.firebaseapp.com",
  projectId: "olivia-4339f",
  storageBucket: "olivia-4339f.firebasestorage.app",
  messagingSenderId: "246023736485",
  appId: "1:246023736485:web:ab81aa122a50a8f52f114c",
  measurementId: "G-JZY1BD1S6X"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
