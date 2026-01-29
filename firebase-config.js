
// Este archivo contiene la configuración de Firebase.
// Es crucial para conectar tu aplicación web con los servicios de Firebase (autenticación, base de datos, etc.).

// Por favor, reemplaza el siguiente objeto de configuración con las credenciales reales de tu proyecto de Firebase.
// Puedes encontrar estas credenciales en la configuración de tu proyecto en la consola de Firebase.
// Instrucciones:
// 1. Ve a la Consola de Firebase (https://console.firebase.google.com/).
// 2. Selecciona tu proyecto.
// 3. Haz clic en el ícono de engranaje (Configuración del proyecto) en el menú de la izquierda.
// 4. En la pestaña "General", desplázate hacia abajo hasta la sección "Tus apps".
// 5. Deberías ver una app web. Haz clic en el botón "SDK setup and configuration" (Configuración y configuración del SDK) y copia el objeto de configuración.

const firebaseConfig = {
  apiKey: "AIzaSyCoUJo-Y4Uow5wI5zHYfyp7gR3Zn9E7ntc",
  authDomain: "desarrolloenlanube-67988-277f8.firebaseapp.com",
  databaseURL: "https://desarrolloenlanube-67988-277f8-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "desarrolloenlanube-67988-277f8",
  storageBucket: "desarrolloenlanube-67988-277f8.firebasestorage.app",
  messagingSenderId: "964403485070",
  appId: "1:964403485070:web:18f7e36a308e56089f6cdf"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

