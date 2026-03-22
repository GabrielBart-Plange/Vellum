import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCp0Q81DUN9O7Bf6XFclWZ6Wb8sNU4fLyo",
  authDomain: "chronicles-11261.firebaseapp.com",
  projectId: "chronicles-11261",
  storageBucket: "chronicles-11261.firebasestorage.app",
  messagingSenderId: "304738391212",
  appId: "1:304738391212:web:66d7d6fe53874d2cebfb09"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Use a singleton pattern for Auth to avoid re-initialization errors in Next.js/Turbopack
import { Auth } from "firebase/auth";
let cachedAuth: Auth | null = null;
export const auth = getApps().length > 0 && cachedAuth ? cachedAuth : (cachedAuth = getAuth(app));
export const db = getFirestore(app);
