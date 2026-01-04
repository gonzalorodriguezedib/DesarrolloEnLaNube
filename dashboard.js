import { auth, db } from './init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = document.getElementById('welcome-message');
    const logoutButton = document.getElementById('logout-button');

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // El usuario está autenticado, obtener y mostrar sus datos
            const userRef = ref(db, 'usuarios/' + user.uid);
            try {
                const snapshot = await get(userRef);
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const nombre = userData.nombre;
                    welcomeMessage.textContent = `¡Bienvenido a InvestMatch, ${nombre}!`;
                } else {
                    console.log("No se encontraron datos para el usuario.");
                    welcomeMessage.textContent = '¡Bienvenido a InvestMatch!';
                }
            } catch (error) {
                console.error("Error al obtener los datos del usuario:", error);
                welcomeMessage.textContent = '¡Bienvenido a InvestMatch!';
            }
        } else {
            // El usuario no está autenticado, redirigir al login
            console.log("Usuario no autenticado, redirigiendo a login.html");
            window.location.href = 'login.html';
        }
    });

    // Funcionalidad para cerrar sesión
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            signOut(auth).then(() => {
                console.log('Cierre de sesión exitoso.');
                // onAuthStateChanged se encargará de la redirección
            }).catch((error) => {
                console.error('Error al cerrar sesión:', error);
            });
        });
    }
});
