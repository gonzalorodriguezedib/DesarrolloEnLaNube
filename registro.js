import { auth, db } from './init.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registroForm');
    const notification = document.getElementById('notification');
    const submitButton = document.getElementById('submit-button');
    const registroWrapper = document.getElementById('registro-wrapper');
    const successMessage = document.getElementById('success-message');
    const nombreUsuario = document.getElementById('nombre-usuario');

    registroForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Mostrar spinner y deshabilitar botón
        submitButton.innerHTML = '<div class="spinner"></div>';
        submitButton.disabled = true;

        // Ocultar notificaciones previas
        notification.style.display = 'none';
        notification.textContent = '';
        notification.className = 'notification';

        const nombre = document.getElementById('nombre').value.trim();
        const apellidos = document.getElementById('apellidos').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmarPassword = document.getElementById('confirmarPassword').value;
        const rol = document.getElementById('rol').value;

        if (password !== confirmarPassword) {
            showNotification('Las contraseñas no coinciden.', 'error');
            resetSubmitButton();
            return;
        }

        try {
            // Crear usuario en Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Guardar información adicional en Realtime Database
            await set(ref(db, 'users/' + user.uid), {
                nombre: nombre,
                apellidos: apellidos,
                email: email,
                rol: rol
            });
            
            // Ocultar formulario y mostrar mensaje de éxito
            registroWrapper.style.display = 'none';
            nombreUsuario.textContent = nombre;
            successMessage.style.display = 'block';

        } catch (error) {
            console.error("Error en el registro:", error);
            let friendlyMessage = 'Ocurrió un error durante el registro.';
            if (error.code === 'auth/email-already-in-use') {
                friendlyMessage = 'El correo electrónico ya está en uso.';
            } else if (error.code === 'auth/weak-password') {
                friendlyMessage = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
            }
            showNotification(friendlyMessage, 'error');
            resetSubmitButton();
        }
    });

    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
    }

    function resetSubmitButton() {
        submitButton.innerHTML = 'Crear Cuenta';
        submitButton.disabled = false;
    }
});
