// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1r1WsnV4rmLdf1XEcO7-QPEUNTJfCGt8",
  authDomain: "success-squad-eureka.firebaseapp.com",
  projectId: "success-squad-eureka",
  storageBucket: "success-squad-eureka.firebasestorage.app",
  messagingSenderId: "980912585121",
  appId: "1:980912585121:web:b89422e515f76bc82373e0",
  measurementId: "G-QT7070K1QW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);

// Enable Firestore persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn('Firestore persistence failed: Browser not supported');
    }
  });
}

export { app, analytics, auth, db };
