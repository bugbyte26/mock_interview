// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAeFiM9Vt4Nkgpdjb1_xXErHgUyiejhYSc",
  authDomain: "prepwise-9c8f2.firebaseapp.com",
  projectId: "prepwise-9c8f2",
  storageBucket: "prepwise-9c8f2.firebasestorage.app",
  messagingSenderId: "1085415077776",
  appId: "1:1085415077776:web:afce88f1a666eeacb2a515",
  measurementId: "G-X217BCRKKQ",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
