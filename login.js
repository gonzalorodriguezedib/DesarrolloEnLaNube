import Usuario from './models/Usuario.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const notification = document.getElementById('notification');
    const submitButton = document.getElementById('submit-button');

    // Función para mostrar notificaciones
    const showNotification = (message, type = 'error') => {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
    };

    // Función para gestionar el estado del botón
    const setButtonLoading = (isLoading) => {
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<div class="spinner"></div>';
        } else {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Acceder';
        }
    };

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            notification.style.display = 'none'; // Ocultar notificaciones previas
            setButtonLoading(true);

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const resultado = await Usuario.login(email, password);

                if (resultado.success) {
                    // Redirección en caso de éxito
                    window.location.href = 'dashboard.html'; 
                } else {
                    let friendlyError = 'Credenciales incorrectas. Por favor, verifica tu correo y contraseña.';
                    if (resultado.error.includes('auth/user-not-found')) {
                         friendlyError = 'No se encontró ningún usuario con ese correo electrónico.';
                    } else if (resultado.error.includes('auth/wrong-password')) {
                        friendlyError = 'La contraseña es incorrecta.';
                    }
                    showNotification(friendlyError);
                    setButtonLoading(false);
                }

            } catch (error) {
                console.error('Error inesperado en el inicio de sesión:', error);
                showNotification('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
                setButtonLoading(false);
            }
        });
    }
});
