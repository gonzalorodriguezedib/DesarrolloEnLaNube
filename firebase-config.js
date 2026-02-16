
/*
=================================================================================================
|   Este archivo contiene la configuración de Firebase para la aplicación.                      |
|   Es FUNDAMENTAL que reemplaces el objeto `firebaseConfig` con la configuración real          |
|   de tu propio proyecto de Firebase.                                                        |
|                                                                                             |
|   ¿Cómo obtener tu configuración?                                                           |
|   1. Ve a la Consola de Firebase (https://console.firebase.google.com/).                    |
|   2. Selecciona tu proyecto.                                                                |
|   3. Haz clic en el icono de engranaje (Configuración del proyecto).                        |
|   4. En la pestaña "General", baja hasta "Tus apps".                                       |
|   5. Busca tu aplicación web y haz clic en "Configuración" o "SDK setup and configuration".   |
|   6. Selecciona la opción `Config` o `CDN`.                                                 |
|   7. Copia el objeto `firebaseConfig` y pégalo aquí abajo.                                  |
=================================================================================================
*/

// Objeto de configuración de Firebase
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
