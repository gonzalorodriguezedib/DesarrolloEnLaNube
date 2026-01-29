
import { auth, db } from './init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { ref, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
    const userNameElement = document.getElementById('user-name');
    const logoutButton = document.getElementById('logout-button');
    const createProjectForm = document.getElementById('create-project-form');
    const notificationElement = document.getElementById('notification');
    const submitButton = document.getElementById('submit-button');

    let currentUser = null;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            // Como no tenemos el nombre directamente, podemos dejar un genérico o buscarlo
            userNameElement.textContent = 'Emprendedor'; // Simplificado
        } else {
            // Si no hay usuario, no debería estar aquí. Redirigir.
            window.location.href = 'login.html';
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            signOut(auth).catch(error => console.error('Error al cerrar sesión:', error));
        });
    }

    if (createProjectForm) {
        createProjectForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentUser) {
                showNotification('Debes iniciar sesión para crear un proyecto.', 'error');
                return;
            }

            // Deshabilitar botón para evitar envíos múltiples
            submitButton.disabled = true;
            submitButton.textContent = 'Publicando...';

            // Recoger los datos del formulario
            const titulo = document.getElementById('titulo').value;
            const descripcion = document.getElementById('descripcion').value;
            const monto = document.getElementById('monto').value;
            const categoria = document.getElementById('categoria').value;

            try {
                // Crear una nueva referencia para el proyecto en la base de datos
                const projectsRef = ref(db, 'proyectos');
                const newProjectRef = push(projectsRef);

                // Guardar el nuevo proyecto
                await set(newProjectRef, {
                    ownerId: currentUser.uid,
                    titulo: titulo,
                    descripcion: descripcion,
                    monto: Number(monto),
                    categoria: categoria,
                    createdAt: serverTimestamp() // Marcar el tiempo de creación
                });

                // Notificación de éxito y redirección
                showNotification('¡Proyecto publicado con éxito! Redirigiendo...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);

            } catch (error) {
                console.error("Error al guardar el proyecto:", error);
                showNotification(`Error: ${error.message}`, 'error');
                // Reactivar el botón si hay un error
                submitButton.disabled = false;
                submitButton.textContent = 'Publicar Proyecto';
            }
        });
    }

    function showNotification(message, type) {
        notificationElement.textContent = message;
        notificationElement.className = `notification ${type}`;
        notificationElement.style.display = 'block';
    }
});
