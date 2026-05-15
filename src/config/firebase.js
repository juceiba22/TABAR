import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.AIzaSyBE_LcTutS7DvIPmD6FN2XS6Vq4w1BUwQ4,
  authDomain: import.meta.env.tabar-token-mvp-2026.firebaseapp.com,
  projectId: import.meta.env.tabar-token-mvp-2026,
  storageBucket: import.meta.env.tabar-token-mvp-2026.firebasestorage.app,
  messagingSenderId: import.meta.env.852502309292,
  appId: import.meta.env.1:852502309292:web:ff3f9262f81fd518833209,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Enable local persistence to maintain session across refreshes
setPersistence(auth, browserLocalPersistence)
  .catch((err) => console.error("Persistence error:", err));

export const db = getFirestore(app, "default  ");
