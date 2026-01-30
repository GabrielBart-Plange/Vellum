import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCp0Q81DUN9O7Bf6XFclWZ6Wb8sNU4fLyo",
  authDomain: "chronicles-11261.firebaseapp.com",
  projectId: "chronicles-11261"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
