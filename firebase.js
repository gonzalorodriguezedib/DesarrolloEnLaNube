
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection } from "firebase/firestore";

// TODO: Add your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections based on your UML diagram
const usuariosCollection = collection(db, 'usuarios');
const proyectosCollection = collection(db, 'proyectos');
const reservasCollection = collection(db, 'reservas');
const pagosCollection = collection(db, 'pagos');

// Export collections to be used in other files
export { db, usuariosCollection, proyectosCollection, reservasCollection, pagosCollection };

