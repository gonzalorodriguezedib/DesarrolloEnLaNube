// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCoUJo-Y4Uow5wI5zHYfyp7gR3Zn9E7ntc",
    authDomain: "desarrolloenlanube-67988-277f8.firebaseapp.com",
    databaseURL: "https://desarrolloenlanube-67988-277f8-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "desarrolloenlanube-67988-277f8",
    storageBucket: "desarrolloenlanube-67988-277f8.firebasestorage.app",
    messagingSenderId: "964403485070",
    appId: "1:964403485070:web:18f7e36a308e56089f6cdf"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
const auth = getAuth(app);
// Explicitly pass the databaseURL to getDatabase
const db = getDatabase(app, firebaseConfig.databaseURL);

export { auth, db };
