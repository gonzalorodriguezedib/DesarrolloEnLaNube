
document.addEventListener('DOMContentLoaded', () => {

    const initializeDashboard = (user) => {
        console.log("InvestMatch Dashboard Script v6.0 (Role Verification) Loaded.");

        // --- 0. Update Welcome Message ---
        const welcomeElement = document.querySelector('.user-welcome strong');
        if (welcomeElement && user) {
            const userRef = firebase.database().ref('users/' + user.uid);
            userRef.once('value').then(snapshot => {
                const userData = snapshot.val();
                if(userData && userData.name) {
                   welcomeElement.textContent = userData.name;
                } else {
                   welcomeElement.textContent = user.displayName || 'Usuario';
                }
            })
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

        if (!explorarGrid || !favoritesGrid || !investmentsGrid) {
            console.error("Faltan elementos HTML críticos para los grids. El script no puede ejecutarse.");
            return;
        }

        // --- 3. RENDER FUNCTIONS ---
        const renderFavorites = () => {
            if (!favoritesGrid) return;
            favoritesGrid.innerHTML = '';
            if (favoriteProjectIds.length === 0) {
                if (noFavoritesMessage) noFavoritesMessage.style.display = 'block';
            } else {
                if (noFavoritesMessage) noFavoritesMessage.style.display = 'none';
                favoriteProjectIds.forEach(id => {
                    const originalCard = document.querySelector(`#page-explorar .project-card[data-project-id="${id}"]`);
                    if (originalCard) {
                        const clonedCard = originalCard.cloneNode(true);
                        favoritesGrid.appendChild(clonedCard);
                    }
                });
            }
        };

        const renderMyInvestments = () => {
            if (!investmentsGrid) return;
            investmentsGrid.innerHTML = '';
            const myInvestments = JSON.parse(localStorage.getItem('myInvestments')) || [];

            if (myInvestments.length === 0) {
                if (noInvestmentsMessage) noInvestmentsMessage.style.display = 'block';
            } else {
                if (noInvestmentsMessage) noInvestmentsMessage.style.display = 'none';
                myInvestments.forEach(investment => {
                    if (typeof projectsData === 'undefined') return;
                    const projectData = projectsData.find(p => p.id === investment.projectId);
                    if (projectData) {
                        const card = document.createElement('div');
                        card.className = 'project-card';
                        card.innerHTML = `
                            <img src="${projectData.image}" class="project-card-img">
                            <div class="project-card-content">
                                <div class="project-card-header">
                                    <h3 class="project-card-title">${projectData.title}</h3>
                                </div>
                                <p class="project-card-category">${projectData.category}</p>
                                <div class="investment-details">
                                    <strong>Tu Inversión:</strong>
                                    <span class="user-investment-amount">${investment.amount.toLocaleString('es-ES')} €</span>
                                </div>
                                <div class="project-card-progress">
                                    <div class="progress-bar" style="width: ${projectData.funded_percentage}%;" ></div>
                                    <span>${projectData.funded_percentage}% financiado</span>
                                </div>
                                <a href="project-detail.html?id=${projectData.id}" class="btn btn-primary project-card-button">Ver Detalles</a>
                            </div>
                        `;
                        investmentsGrid.appendChild(card);
                    }
                });
            }
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
                renderFavorites();
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
                if (pageId === 'page-inversiones') renderMyInvestments();
                if (pageId === 'page-favoritos') renderFavorites();
            });
        });

        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                firebase.auth().signOut().then(() => { window.location.href = 'index.html'; });
            });
        }

        // --- 5. INITIALIZATION ---
        if (explorarGrid) explorarGrid.addEventListener('click', handleGridClick);
        if (favoritesGrid) favoritesGrid.addEventListener('click', handleGridClick);
        updateStarIcons();
        renderFavorites();
        renderMyInvestments();
        if (navLinks.length > 0) navLinks[0].click();
    };

    // --- FIREBASE AUTHENTICATION & AUTHORIZATION ---
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // Usuario autenticado, ahora verificamos el rol.
            const userRef = firebase.database().ref('users/' + user.uid);
            userRef.once('value').then((snapshot) => {
                const userData = snapshot.val();
                // Comprobamos si el usuario tiene el rol de 'inversor'
                if (userData && userData.role === 'inversor') {
                    // Si es inversor, inicializamos el dashboard
                    initializeDashboard(user);
                } else {
                    // Si no es inversor o no tiene rol, lo deslogueamos y redirigimos
                    console.error('Acceso denegado. El usuario no tiene el rol de inversor.');
                    firebase.auth().signOut(); // For security
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
