
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {

    // --- Helper function to display form messages ---
    const showMessage = (element, message) => {
        element.textContent = message;
        element.style.display = 'block';
        // Hide the message after 5 seconds
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    };

    // --- Firebase Admin Registration Logic (using Realtime Database) ---
    const adminRegisterForm = document.getElementById('admin-register-form');
    const registerSuccessMessage = document.getElementById('register-success-message');
    const registerErrorMessage = document.getElementById('register-error-message');

    if (adminRegisterForm) {
        adminRegisterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('admin-name-register').value;
            const email = document.getElementById('admin-email-register').value;
            const password = document.getElementById('admin-password-register').value;

            createUserWithEmailAndPassword(auth, email, password)
                .then(userCredential => {
                    const user = userCredential.user;
                    // Using 'usuarios' collection to match the other part of the app
                    const userRef = ref(db, 'usuarios/' + user.uid);
                    return set(userRef, {
                        nombre: name,
                        apellidos: '', // Add empty apellidos to match the data model
                        email: email,
                        rol: 'admin',
                        status: 'pending',
                        requestDate: new Date().toISOString()
                    });
                })
                .then(() => {
                    showMessage(registerSuccessMessage, '¡Solicitud enviada con éxito! Un administrador la revisará pronto.');
                    adminRegisterForm.reset();
                })
                .catch(error => {
                    console.error("Error en el registro: ", error);
                    showMessage(registerErrorMessage, `Error: ${error.message}`);
                });
        });
    }

    // --- Firebase Admin Login Logic (using Realtime Database) ---
    const adminLoginForm = document.getElementById('admin-login-form');
    const loginErrorMessage = document.getElementById('login-error-message');

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email-login').value;
            const password = document.getElementById('admin-password-login').value;

            signInWithEmailAndPassword(auth, email, password)
                .then(userCredential => {
                    const userRef = ref(db, 'usuarios/' + userCredential.user.uid);
                    return get(userRef);
                })
                .then(snapshot => {
                    if (snapshot.exists() && snapshot.val().rol === 'admin' && snapshot.val().status === 'active') {
                        window.location.href = 'dashboard-admin.html';
                    } else {
                        signOut(auth);
                        showMessage(loginErrorMessage, 'Acceso denegado. No eres un administrador activo.');
                    }
                })
                .catch(error => {
                    console.error("Error en el inicio de sesión: ", error);
                    showMessage(loginErrorMessage, `Error: ${error.message}`);
                });
        });
    }
});
