document.addEventListener('DOMContentLoaded', () => {

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const userRef = firebase.database().ref('users/' + user.uid);
            userRef.once('value').then(snapshot => {
                const userData = snapshot.val();
                if (userData && userData.role === 'inversor') {
                    initializeDashboard(user, userData);
                } else {
                    firebase.auth().signOut().then(() => { window.location.href = 'index.html'; });
                }
            });
        } else {
            window.location.href = 'index.html';
        }
    });

    const initializeDashboard = (user, userData) => {

        // --- DOM Elements ---
        const pages = {
            explorar: document.getElementById('page-explorar'),
            inversiones: document.getElementById('page-inversiones'),
            favoritos: document.getElementById('page-favoritos'),
            perfil: document.getElementById('page-perfil')
        };
        const navLinks = document.querySelectorAll('.nav-link');
        const logoutButton = document.querySelector('.logout-button');
        const projectGrid = pages.explorar.querySelector('.proyectos-grid');
        const favoritesGrid = pages.favoritos.querySelector('.proyectos-grid');
        const noFavoritesMessage = pages.favoritos.querySelector('.no-favorites-message');
        const investmentsList = pages.inversiones.querySelector('.investments-list');
        const noInvestmentsMessage = pages.inversiones.querySelector('.no-investments-message');
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
        let portfolioChart = null;

        // --- FIREBASE REFS ---
        const allProjectsRef = firebase.database().ref('proyectos-emprendedor');
        const userFavoritesRef = firebase.database().ref(`favorites/${user.uid}`);
        const userInvestmentsRef = firebase.database().ref(`inversiones-inversor/${user.uid}`);

        // --- DATA CACHE & STATE ---
        let sortedProjects = [];
        let projectsById = {};
        let userFavorites = {};
        let userInvestments = {};
        let projectsLoaded = false;
        let investmentsLoaded = false;

        // --- RENDER FUNCTIONS ---
        const renderInvestorStatistics = () => {
            const totalInvertidoElem = document.getElementById('stats-total-invertido');
            const proyectosInvertidosElem = document.getElementById('stats-proyectos-invertidos');
            if (!totalInvertidoElem || !proyectosInvertidosElem) return;

            if (!userInvestments || Object.keys(userInvestments).length === 0) {
                totalInvertidoElem.textContent = '0 €';
                proyectosInvertidosElem.textContent = '0';
                return;
            }
            const investmentsData = Object.values(userInvestments);
            const totalInvested = investmentsData.reduce((sum, investment) => sum + investment.amountInvested, 0);
            const investedProjectsCount = new Set(investmentsData.map(inv => inv.projectId)).size;
            totalInvertidoElem.innerHTML = `${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalInvested)}`;
            proyectosInvertidosElem.textContent = investedProjectsCount;
        };
        
        const renderProjectCard = (projectId, project) => {
            const isFavorite = userFavorites[projectId] === true;
            const fundedPercentage = project.goalAmount ? ((project.fundedAmount || 0) / project.goalAmount) * 100 : 0;
            const card = document.createElement('div');
            card.className = 'project-card-v2';
            if (project.isVip) card.classList.add('vip');
            card.innerHTML = `
                <div class="card-v2-header">
                    <img src="${project.imageUrl || 'https://via.placeholder.com/400x250'}" alt="${project.name}" class="project-v2-image">
                    <div class="card-v2-overlay">
                        ${project.isVip ? '<div class="vip-tag"><i class="fa-solid fa-crown"></i> VIP</div>' : ''}
                        <span class="project-v2-category">${project.category}</span>
                        <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" data-project-id="${projectId}">
                            <i class="fa-solid fa-star"></i>
                        </button>
                    </div>
                </div>
                <div class="card-v2-body">
                    <h3 class="project-v2-title">${project.name}</h3>
                    <p class="project-v2-description">${project.description}</p>
                    <div class="project-v2-funding">
                        <div class="funding-progress-bar">
                            <div class="funding-progress" style="width: ${fundedPercentage.toFixed(1)}%;"></div>
                        </div>
                        <div class="funding-details">
                            <span>${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(project.fundedAmount || 0)}</span>
                            <span class="funding-percentage">${fundedPercentage.toFixed(1)}%</span>
                        </div>
                    </div>
                    <a href="project-detail.html?id=${projectId}" class="btn-v2-details">Ver Detalles</a>
                </div>
            `;
            return card;
        };
        
        const renderInvestmentChart = () => {
            const ctx = document.getElementById('investor-portfolio-chart')?.getContext('2d');
            if (!ctx) return;
            if (portfolioChart) portfolioChart.destroy();

            if (!investmentsLoaded || !projectsLoaded || Object.keys(userInvestments).length === 0) {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
                ctx.font = "16px 'Poppins', sans-serif"; ctx.fillStyle = textColor; ctx.textAlign = "center";
                ctx.fillText("Aún no has realizado inversiones.", ctx.canvas.width / 2, 50);
                return;
            }
            
            const sectorData = {};
            Object.values(userInvestments).forEach(investment => {
                const project = projectsById[investment.projectId];
                if (project) {
                    const category = project.category || 'Otro';
                    sectorData[category] = (sectorData[category] || 0) + investment.amountInvested;
                }
            });

            const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
            const legendTextColor = isDarkMode ? '#f0f0f0' : '#333';
            const cardBgColor = isDarkMode ? '#2c2c2c' : '#ffffff';
            const chartColors = ['#4a90e2', '#50e3c2', '#f5a623', '#bd10e0', '#e74c3c', '#2ecc71'];

            portfolioChart = new Chart(ctx, {
                type: 'doughnut', data: { labels: Object.keys(sectorData), datasets: [{ data: Object.values(sectorData), backgroundColor: chartColors, borderColor: cardBgColor, borderWidth: 4 }] },
                options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: legendTextColor, padding: 25, font: { family: "'Poppins', sans-serif", size: 13 }, usePointStyle: true } }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c.parsed)} (${((c.parsed / c.chart.getDataObjects()[0].data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%)` } } } }
            });
        };

        const renderPortfolio = () => {
            investmentsList.innerHTML = '';
            const hasInvestments = investmentsLoaded && Object.keys(userInvestments).length > 0;

            if (!hasInvestments || !projectsLoaded) {
                noInvestmentsMessage.style.display = 'block';
                return;
            }

            let itemsRendered = 0;
            for (const investmentId in userInvestments) {
                const investment = userInvestments[investmentId];
                const project = projectsById[investment.projectId];
                if (project) {
                    itemsRendered++;
                    const item = document.createElement('div');
                    item.className = 'investment-item';
                    item.innerHTML = `<img src="${project.imageUrl}" alt="${project.name}" class="investment-item-image"><div class="investment-item-info"><h4 class="investment-item-title">${project.name}</h4><p class="investment-item-category">${project.category}</p></div><div class="investment-item-amount">${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(investment.amountInvested)}</div>`;
                    investmentsList.appendChild(item);
                }
            }
            noInvestmentsMessage.style.display = itemsRendered > 0 ? 'none' : 'block';
        };
        
        const renderAllProjects = () => { projectGrid.innerHTML = ''; sortedProjects.forEach(p => projectGrid.appendChild(renderProjectCard(p.id, p))); };
        const renderFavorites = () => { favoritesGrid.innerHTML = ''; const favs = sortedProjects.filter(p => userFavorites[p.id]); favs.forEach(p => favoritesGrid.appendChild(renderProjectCard(p.id, p))); noFavoritesMessage.style.display = favs.length > 0 ? 'none' : 'block'; };
        const showToast = (message) => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = message; toastContainer.appendChild(t); setTimeout(() => t.classList.add('show'), 100); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000); };

        // --- Main UI Update Function ---
        const updatePortfolioView = () => {
            if (!projectsLoaded || !investmentsLoaded) return; // Wait for all data
            renderInvestorStatistics();
            renderPortfolio();
            renderInvestmentChart();
        };

        // --- EVENT LISTENERS ---
        logoutButton.addEventListener('click', () => firebase.auth().signOut());
        document.body.addEventListener('click', e => { const b = e.target.closest('.favorite-btn'); if (b) { e.preventDefault(); const id = b.dataset.projectId; if (userFavorites[id]) { userFavoritesRef.child(id).remove(); showToast('Eliminado de favoritos'); } else { userFavoritesRef.child(id).set(true); showToast('Añadido a favoritos'); } } });
        navLinks.forEach(link => link.addEventListener('click', e => { e.preventDefault(); const pageId = link.getAttribute('data-page'); Object.values(pages).forEach(p => p.classList.remove('active')); pages[pageId.replace('page-', '')].classList.add('active'); navLinks.forEach(n => n.classList.remove('active')); link.classList.add('active'); if (pageId === 'page-inversiones') updatePortfolioView(); }));
        
        // --- FIREBASE DATA LISTENERS ---
        allProjectsRef.on('value', snapshot => {
            const allProjects = snapshot.val() || {};
            const allProjectsArray = [];
            for (const userId in allProjects) { for (const projectId in allProjects[userId]) { allProjectsArray.push({ ...allProjects[userId][projectId], id: projectId }); } }
            allProjectsArray.sort((a, b) => (b.isVip ? 1 : 0) - (a.isVip ? 1 : 0) || b.createdAt - a.createdAt);
            sortedProjects = allProjectsArray;
            projectsById = sortedProjects.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
            projectsLoaded = true;
            renderAllProjects();
            renderFavorites();
            updatePortfolioView();
        });

        userFavoritesRef.on('value', snapshot => {
            userFavorites = snapshot.val() || {};
            renderAllProjects(); // Update favorite icons
            renderFavorites();
        });

        userInvestmentsRef.on('value', snapshot => {
            userInvestments = snapshot.val() || {};
            investmentsLoaded = true;
            updatePortfolioView();
        });

        // --- INITIALIZATION ---
        const initialPage = document.querySelector('.nav-link[data-page="page-explorar"]');
        if(initialPage) initialPage.click();
    };
});