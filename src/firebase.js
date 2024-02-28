import { initializeApp } from "firebase/app";
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAnalytics } from 'firebase/analytics';
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBwGkSqUjVr3NCFXuD0GgGPig5zlJRnqP0",
  authDomain: "socialmediaimagesharingapp.firebaseapp.com",
  projectId: "socialmediaimagesharingapp",
  storageBucket: "socialmediaimagesharingapp.appspot.com",
  messagingSenderId: "513703873477",
  appId: "1:513703873477:web:c18c90fb33321aa4cf19ac"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics
// Export Firestore, Storage, and Analytics instances
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const analytics = initializeAnalytics(app);