import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection, addDoc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, doc, where, query } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Use import.meta.env instead of process.env for Vite
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Export Firebase Auth and Firestore instances
const auth = getAuth(app)
// Initialize Firestore
const db = getFirestore(app);
const storage = getStorage(app);

export { 
  db, 
  auth, 
  storage, 
  addDoc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc,
  updateDoc,
  collection, 
  doc, 
  uploadBytesResumable, 
  getDownloadURL, 
  ref, 
  where, 
  query 
};