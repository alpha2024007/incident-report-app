import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBsudc7jWdLLjPcGj4rTlPDzUrDqM-3YNI",
  authDomain: "sos-app-402c3.firebaseapp.com",
  projectId: "sos-app-402c3",
  storageBucket: "sos-app-402c3.appspot.com",
  messagingSenderId: "824711504343",
  appId: "1:824711504343:web:bebabac48156ee25e86b92"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage();