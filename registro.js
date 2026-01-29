
import Usuario from './models/Usuario.js';

document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registroForm');
    if (!registroForm) return;

    const notification = document.getElementById('notification');
    const registroWrapper = document.getElementById('registro-wrapper');
    const successMessage = document.getElementById('success-message');
    const nombreUsuario = document.getElementById('nombre-usuario');
    const submitButton = document.getElementById('submit-button');

    const showNotification = (message, type = 'error') => {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
    };

    const setButtonLoading = (isLoading) => {
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<div style="border: 2px solid #f3f3f3; border-top: 2px solid #3498db; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite; margin: auto;"></div>';
        } else {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Crear Cuenta';
        }
    };

    registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        notification.style.display = 'none';
        
        const nombre = document.getElementById('nombre').value.trim();
        const apellidos = document.getElementById('apellidos').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmarPassword = document.getElementById('confirmarPassword').value.trim();
        const rol = document.getElementById('rol').value;

        if (!nombre || !apellidos || !email || !password || !confirmarPassword || !rol) {
            showNotification('Por favor, completa todos los campos.');
            return;
        }

        if (password !== confirmarPassword) {
            showNotification('Las contraseñas no coinciden.');
            return;
        }

        setButtonLoading(true);

        const { success, error } = await Usuario.register(email, password, { nombre, apellidos, rol });

        setButtonLoading(false);

        if (success) {
            registroWrapper.style.display = 'none';
            successMessage.style.display = 'block';
            nombreUsuario.textContent = nombre;

            const dashboardLink = document.getElementById('dashboard-link');
            dashboardLink.href = (rol === 'inversor') ? 'dashboard-inversor.html' : 'dashboard-emprendedor.html';
        } else {
            if (error.code === 'auth/email-already-in-use') {
                showNotification('El correo electrónico ya está en uso.');
            } else if (error.code === 'auth/weak-password') {
                showNotification('La contraseña es demasiado débil. Debe tener al menos 6 caracteres.');
            } else {
                showNotification('Error al crear la cuenta: ' + error.message);
            }
        }
    });
});
