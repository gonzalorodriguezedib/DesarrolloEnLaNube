
document.addEventListener('DOMContentLoaded', function () {
    console.log("Dashboard Emprendedor Script v3.0 (Role Verification) Loaded.");

    const initializeDashboard = (user) => {
        if (!user) return;

        // --- DOM ELEMENTS ---
        const projectForm = document.getElementById('create-project-form');
        const currentProjectsList = document.querySelector('#page-mis-proyectos .proyectos-grid');
        const logoutButton = document.getElementById('logout-button');
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.dashboard-page');
        const welcomeElement = document.querySelector('.user-welcome strong');

        // --- Set Welcome Message ---
        if (welcomeElement) {
            const userRef = firebase.database().ref('users/' + user.uid);
            userRef.once('value').then(snapshot => {
                const userData = snapshot.val();
                if (userData && userData.name) {
                    welcomeElement.textContent = userData.name;
                } else {
                    welcomeElement.textContent = user.displayName || 'Emprendedor';
                }
            });
        }

        // --- FIREBASE DATABASE ---
        const userProjectsRef = firebase.database().ref('proyectos-emprendedor/' + user.uid);

        const renderProjects = (projects) => {
            if (!currentProjectsList) return;
            const noProjectsMessage = document.querySelector('#page-mis-proyectos .no-projects-message');
            currentProjectsList.innerHTML = ''; // Clear list
            
            if (!projects || Object.keys(projects).length === 0) {
                if(noProjectsMessage) noProjectsMessage.style.display = 'block';
                return;
            }
             if(noProjectsMessage) noProjectsMessage.style.display = 'none';

            for (const projectId in projects) {
                const project = projects[projectId];
                const fundedPercentage = project.goalAmount ? (project.fundedAmount / project.goalAmount) * 100 : 0;
                const projectCard = `
                    <div class="project-card" data-project-id="${projectId}">
                        <img src="${project.imageUrl || 'https://via.placeholder.com/300'}" class="project-card-img">
                        <div class="project-card-content">
                            <h3 class="project-card-title">${project.name}</h3>
                            <p class="project-card-category">${project.category}</p>
                            <div class="project-card-progress">
                                <div class="progress-bar" style="width: ${fundedPercentage.toFixed(2)}%;"></div>
                                <span>${fundedPercentage.toFixed(2)}% financiado</span>
                            </div>
                            <div class="project-card-funding">
                                <strong>${(project.fundedAmount || 0).toLocaleString('es-ES')} €</strong> de ${project.goalAmount.toLocaleString('es-ES')} €
                            </div>
                            <div class="project-card-actions">
                                <a href="#" class="btn btn-secondary btn-edit">Editar</a>
                                <a href="#" class="btn btn-danger btn-delete">Eliminar</a>
                            </div>
                        </div>
                    </div>
                `;
                currentProjectsList.insertAdjacentHTML('beforeend', projectCard);
            }
        };

        userProjectsRef.on('value', (snapshot) => {
            const projects = snapshot.val();
            renderProjects(projects);
        });

        // --- EVENT HANDLERS ---
        if (projectForm) {
            projectForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const newProject = {
                    name: document.getElementById('project-title').value,
                    description: document.getElementById('project-description').value,
                    category: document.getElementById('project-category').value,
                    goalAmount: Number(document.getElementById('funding-goal').value),
                    imageUrl: document.getElementById('project-image').value,
                    fundedAmount: 0, // Initial funded amount
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                };
                userProjectsRef.push(newProject).then(() => {
                    projectForm.reset();
                    // Switch to the 'Mis Proyectos' tab
                    document.querySelector('.nav-link[data-page="page-mis-proyectos"]').click();
                }).catch(error => console.error("Error al crear proyecto: ", error));
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                firebase.auth().signOut().then(() => { window.location.href = 'index.html'; });
            });
        }

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = link.getAttribute('data-page');
                pages.forEach(p => p.classList.remove('active'));
                navLinks.forEach(n => n.classList.remove('active'));
                document.getElementById(pageId).classList.add('active');
                link.classList.add('active');
            });
        });

        // --- INITIALIZATION ---
        if (navLinks.length > 0) {
             document.querySelector('.nav-link[data-page="page-mis-proyectos"]').click();
        }
    };

    // --- FIREBASE AUTHENTICATION & AUTHORIZATION ---
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // Usuario autenticado, ahora verificamos el rol.
            const userRef = firebase.database().ref('users/' + user.uid);
            userRef.once('value').then((snapshot) => {
                const userData = snapshot.val();
                // Comprobamos si el usuario tiene el rol de 'emprendedor'
                if (userData && userData.role === 'emprendedor') {
                    // Si es emprendedor, inicializamos el dashboard
                    initializeDashboard(user);
                } else {
                    // Si no es emprendedor o no tiene rol, lo deslogueamos y redirigimos
                    console.error('Acceso denegado. El usuario no tiene el rol de emprendedor.');
                    firebase.auth().signOut();
                    window.location.href = 'index.html';
                }
            }).catch(error => {
                console.error('Error al obtener datos del usuario:', error);
                firebase.auth().signOut();
                window.location.href = 'index.html';
            });
        } else {
            // Si no hay usuario, simplemente redirigimos a la página de inicio.
            console.log('Usuario no autenticado. Redirigiendo a inicio.');
            window.location.href = 'index.html';
        }
    });
});
