import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBE_LcTutS7DvIPmD6FN2XS6Vq4w1BUwQ4",
  authDomain: "tabar-token-mvp-2026.firebaseapp.com",
  projectId: "tabar-token-mvp-2026",
  storageBucket: "tabar-token-mvp-2026.firebasestorage.app",
  messagingSenderId: "852502309292",
  appId: "1:852502309292:web:ff3f9262f81fd518833209"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
