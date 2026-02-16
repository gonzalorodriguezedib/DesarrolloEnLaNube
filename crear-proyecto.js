import { auth, db } from './firebase.js';
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
            userNameElement.textContent = 'Emprendedor';
        } else {
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

            submitButton.disabled = true;
            submitButton.textContent = 'Publicando...';

            const titulo = document.getElementById('titulo').value;
            const descripcion = document.getElementById('descripcion').value;
            const monto = document.getElementById('monto').value;
            const categoria = document.getElementById('categoria').value;

            try {
                // NOTE: Image upload logic is temporarily disabled.
                // We will just save the project with a placeholder image.
                const imageUrl = 'https://via.placeholder.com/300'; // Using a placeholder

                const projectsRef = ref(db, `proyectos-emprendedor/${currentUser.uid}`);
                const newProjectRef = push(projectsRef);

                await set(newProjectRef, {
                    creatorId: currentUser.uid,
                    name: titulo,
                    description: descripcion,
                    goalAmount: Number(monto),
                    category: categoria,
                    createdAt: serverTimestamp(),
                    fundedAmount: 0,
                    isVip: false,
                    imageUrl: imageUrl // Using the placeholder URL
                });

                showNotification('¡Proyecto publicado con éxito! Redirigiendo...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard-emprendedor.html';
                }, 2000);

            } catch (error) {
                console.error("Error al guardar el proyecto:", error);
                showNotification(`Error: ${error.message}`, 'error');
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
