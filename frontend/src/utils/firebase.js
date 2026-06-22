// frontend/src/utils/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
//import { getAnalytics } from "firebase/analytics";

// Your Firebase config from Step 2 (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyBIxlavjylA-V5uU8TfpcvXqwvFoEM1OKU",
  authDomain: "lumora-peer-support.firebaseapp.com",
  projectId: "lumora-peer-support",
  storageBucket: "lumora-peer-support.firebasestorage.app",
  messagingSenderId: "956103926893",
  appId: "1:956103926893:web:2c6b54780da793a0ea4b64",
  measurementId: "G-ZW2K54V6S4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };