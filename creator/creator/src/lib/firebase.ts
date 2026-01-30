import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCp0Q81DUN9O7Bf6XFclWZ6Wb8sNU4fLyo",
    authDomain: "chronicles-11261.firebaseapp.com",
    projectId: "chronicles-11261",
    storageBucket: "chronicles-11261.firebasestorage.app",
    messagingSenderId: "304738391212",
    appId: "1:304738391212:web:66d7d6fe53874d2cebfb09"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);