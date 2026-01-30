
document.addEventListener('DOMContentLoaded', () => {

    const initializeDashboard = (user) => {
        console.log("InvestMatch Dashboard Script v11.0 (Auth Fix) Loaded.");

        // --- 0. Update Welcome Message & Profile Card Name ---
        const welcomeElement = document.querySelector('.user-welcome strong');
        const profileCardNameElement = document.getElementById('profile-card-name');
        
        if (user) {
            const userRef = firebase.database().ref('users/' + user.uid);
            userRef.once('value').then(snapshot => {
                const userData = snapshot.val();
                if (userData && userData.name) {
                    const userName = userData.name;
                    if(welcomeElement) welcomeElement.textContent = userName;
                    if(profileCardNameElement) profileCardNameElement.textContent = userName;
                } else {
                    const defaultName = user.displayName || 'Usuario';
                    if(welcomeElement) welcomeElement.textContent = defaultName;
                    if(profileCardNameElement) profileCardNameElement.textContent = defaultName;
                }
            }).catch(error => {
                 console.error("Error al leer datos del perfil:", error);
                 const defaultName = user.displayName || 'Usuario';
                 if(welcomeElement) welcomeElement.textContent = defaultName;
                 if(profileCardNameElement) profileCardNameElement.textContent = defaultName;
            });
        }

        // --- 1. STATE MANAGEMENT --- 
        let favoriteProjectIds = [];
        try {
            const storedFavorites = localStorage.getItem('investMatchFavorites');
            if (storedFavorites) {
                favoriteProjectIds = JSON.parse(storedFavorites);
            }
        } catch (error) {
            console.error("Error al parsear favoritos desde localStorage:", error);
            favoriteProjectIds = [];
        }

        const saveFavorites = () => {
            localStorage.setItem('investMatchFavorites', JSON.stringify(favoriteProjectIds));
        };

        // --- 2. DOM ELEMENTS ---
        const explorarGrid = document.querySelector('#page-explorar .proyectos-grid');
        const favoritesGrid = document.querySelector('#page-favoritos .proyectos-grid');
        const noFavoritesMessage = document.querySelector('#page-favoritos .no-favorites-message');
        const investmentsGrid = document.querySelector('#page-inversiones .proyectos-grid');
        const noInvestmentsMessage = document.querySelector('#page-inversiones .no-investments-message');
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.dashboard-page');
        const logoutButton = document.getElementById('logout-button');

        // Profile Page Elements
        const editPersonalInfoBtn = document.getElementById('edit-personal-info');
        const personalInfoForm = document.getElementById('personal-info-form');
        const editInvestmentPrefsBtn = document.getElementById('edit-investment-prefs');
        const investmentPrefsForm = document.getElementById('investment-prefs-form');
        const editAvatarBtn = document.querySelector('.edit-avatar-btn');
        const avatarUploadInput = document.getElementById('avatar-upload-input');
        const profileAvatarImg = document.getElementById('profile-avatar-img');
        const deleteAccountBtn = document.getElementById('delete-account-btn');

        // --- 3. RENDER FUNCTIONS ---
        const renderProjects = () => {
            if (!explorarGrid || typeof projectsData === 'undefined') return;
            explorarGrid.innerHTML = '';
            projectsData.forEach(project => {
                const card = document.createElement('div');
                card.className = `project-card ${project.vip ? 'vip' : ''}`;
                card.dataset.projectId = project.id;
                card.innerHTML = `
                    ${project.vip ? '<div class="vip-badge"><i class="fa-solid fa-crown"></i> VIP</div>' : ''}
                    <img src="${project.image}" class="project-card-img">
                    <div class="project-card-content">
                         <div class="project-card-header">
                            <h3 class="project-card-title">${project.title}</h3>
                            <button class="favorite-btn"><i class="far fa-star"></i></button>
                        </div>
                        <p class="project-card-category">${project.category}</p>
                        <p class="project-card-description">${project.description}</p>
                        <div class="project-card-progress">
                            <div class="progress-bar" style="width: ${project.funded_percentage}%;"></div>
                            <span>${project.funded_percentage}% financiado</span>
                        </div>
                        <div class="project-card-funding">
                            <strong>${project.funded_amount.toLocaleString()}</strong> de ${project.goal.toLocaleString()}
                        </div>
                        <a href="project-detail.html?id=${project.id}" class="btn btn-primary project-card-button">Ver Proyecto</a>
                    </div>
                `;
                explorarGrid.appendChild(card);
            });
            updateStarIcons();
        };

        const renderFavorites = () => {
            if (!favoritesGrid) return;
            favoritesGrid.innerHTML = '';
            const favoriteProjects = projectsData.filter(p => favoriteProjectIds.includes(p.id));
            
            if (favoriteProjects.length === 0) {
                if (noFavoritesMessage) noFavoritesMessage.style.display = 'block';
            } else {
                if (noFavoritesMessage) noFavoritesMessage.style.display = 'none';
                favoriteProjects.forEach(project => {
                     const originalCard = document.querySelector(`#page-explorar .project-card[data-project-id="${project.id}"]`);
                    if (originalCard) {
                        const clonedCard = originalCard.cloneNode(true);
                        // Asegurarse que el icono de la estrella está activo en la vista de favoritos
                        const icon = clonedCard.querySelector('.favorite-btn i');
                        if(icon) {
                            icon.classList.remove('far');
                            icon.classList.add('fas');
                        }
                        favoritesGrid.appendChild(clonedCard);
                    }
                });
            }
        };

        const renderMyInvestments = () => {
            // Implementación futura
        };

        const updateStarIcons = () => {
            document.querySelectorAll('#page-explorar .project-card').forEach(card => {
                const projectId = card.dataset.projectId;
                const icon = card.querySelector('.favorite-btn i');
                if (projectId && icon) {
                    const isFavorited = favoriteProjectIds.includes(projectId);
                    icon.classList.toggle('fas', isFavorited);
                    icon.classList.toggle('far', !isFavorited);
                }
            });
        };

        // --- 4. EVENT HANDLERS ---
        const handleGridClick = (event) => {
            const favButton = event.target.closest('.favorite-btn');
            if (!favButton) return;
            const projectCard = favButton.closest('.project-card');
            const projectId = projectCard.dataset.projectId;
            if (projectId) {
                const index = favoriteProjectIds.indexOf(projectId);
                if (index > -1) {
                    favoriteProjectIds.splice(index, 1);
                } else {
                    favoriteProjectIds.push(projectId);
                }
                saveFavorites();
                updateStarIcons();
                renderFavorites(); // Actualizar la vista de favoritos
            }
        };

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = link.getAttribute('data-page');
                pages.forEach(p => p.classList.remove('active'));
                navLinks.forEach(n => n.classList.remove('active'));
                document.getElementById(pageId).classList.add('active');
                link.classList.add('active');
                if (pageId === 'page-favoritos') renderFavorites();
            });
        });

        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                firebase.auth().signOut().then(() => { window.location.href = 'index.html'; });
            });
        }
        
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', async () => {
                const confirmation = confirm("¿Estás absolutamente seguro de que quieres eliminar tu cuenta? Esta acción es irreversible y todos tus datos serán borrados permanentemente.");
                if (confirmation && user) {
                    try {
                        await firebase.database().ref('users/' + user.uid).remove();
                        await user.delete();
                        localStorage.clear(); 
                        window.location.href = 'index.html';
                    } catch (error) {
                        console.error("Error al eliminar la cuenta:", error);
                        alert("Hubo un error al eliminar tu cuenta. Es posible que necesites volver a iniciar sesión para completar esta acción.");
                    }
                }
            });
        }

        // --- 5. INITIALIZATION ---
        if (explorarGrid) {
            explorarGrid.addEventListener('click', handleGridClick);
        }
        renderProjects();
        renderFavorites();
        if (pages.length > 0 && navLinks.length > 0) {
            pages.forEach(p => p.classList.remove('active'));
            navLinks.forEach(n => n.classList.remove('active'));
            pages[0].classList.add('active');
            navLinks[0].classList.add('active');
        }
    };

    // --- FIREBASE AUTHENTICATION & AUTHORIZATION (FIXED) ---
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // 1. Usuario autenticado, ahora verificar rol en la base de datos
            const userRef = firebase.database().ref('users/' + user.uid);
            userRef.once('value').then(snapshot => {
                const userData = snapshot.val();
                // 2. Comprobar si los datos existen y si el rol es 'inversor'
                if (userData && userData.role === 'inversor') {
                    // 3. Rol correcto, inicializar el dashboard
                    initializeDashboard(user);
                } else {
                    // 4. Rol incorrecto o no encontrado, denegar acceso
                    console.error('Acceso denegado. El usuario no tiene el rol de inversor o no existe en la base de datos.');
                    firebase.auth().signOut(); // Cerrar sesión para evitar bucles
                    window.location.href = 'index.html';
                }
            }).catch(error => {
                console.error('Error al obtener datos del usuario:', error);
                firebase.auth().signOut();
                window.location.href = 'index.html';
            });
        } else {
            // Usuario no ha iniciado sesión, redirigir a la página de inicio
            console.log('Usuario no autenticado. Redirigiendo a inicio.');
            window.location.href = 'index.html';
        }
    });
});
