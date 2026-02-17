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
        const mainContent = document.querySelector('.main-content');
        const pages = {
            explorar: document.getElementById('page-explorar'),
            inversiones: document.getElementById('page-inversiones'),
            favoritos: document.getElementById('page-favoritos'),
            perfil: document.getElementById('page-perfil'),
            detalleProyecto: document.getElementById('page-detalle-proyecto')
        };
        const navLinks = document.querySelectorAll('.nav-link');
        const logoutButton = document.querySelector('.logout-button');
        const projectGrid = pages.explorar.querySelector('.proyectos-grid');
        const favoritesGrid = pages.favoritos.querySelector('.proyectos-grid');
        const noFavoritesMessage = pages.favoritos.querySelector('.no-favorites-message');
        const investmentsList = pages.inversiones.querySelector('#investment-list');
        const noInvestmentsMessage = pages.inversiones.querySelector('.no-investments-message');
        const toastContainer = document.getElementById('toast-container');
        let portfolioChart = null;

        // --- Detail Page Elements ---
        const backToProjectsBtn = document.getElementById('back-to-projects-btn');
        const detailProjectImage = document.getElementById('detail-project-image');
        const detailProjectCategory = document.getElementById('detail-project-category');
        const detailProjectVipTag = document.getElementById('detail-project-vip-tag');
        const detailProjectTitle = document.getElementById('detail-project-title');
        const detailProjectDescriptionFull = document.getElementById('detail-project-description-full');
        const detailProjectProgressBar = document.getElementById('detail-project-progress-bar');
        const detailProjectFundedAmount = document.getElementById('detail-project-funded-amount');
        const detailProjectGoalAmount = document.getElementById('detail-project-goal-amount');
        const detailProjectInvestorsCount = document.getElementById('detail-project-investors-count');
        const detailProjectDaysLeft = document.getElementById('detail-project-days-left');
        const investmentAmountInput = document.getElementById('investment-amount-input');
        const investNowBtn = document.getElementById('invest-now-btn');
        const detailCreatorAvatar = document.getElementById('detail-creator-avatar');
        const detailCreatorName = document.getElementById('detail-creator-name');
        
        // --- Modal Elements (Added with care) ---
        const successModal = document.getElementById('investment-success-modal');
        const successModalMessage = document.getElementById('investment-success-message');
        const closeSuccessModalBtn = document.getElementById('close-success-modal-btn');

        // --- FIREBASE REFS ---
        const allProjectsRef = firebase.database().ref('proyectos-emprendedor');
        const usersRef = firebase.database().ref('users');
        const userFavoritesRef = firebase.database().ref(`favorites/${user.uid}`);
        const userInvestmentsRef = firebase.database().ref(`inversiones-inversor/${user.uid}`);

        // --- DATA CACHE & STATE ---
        let sortedProjects = [];
        let projectsById = {};
        let userFavorites = {};
        let userInvestments = {};
        let projectsLoaded = false;
        let investmentsLoaded = false;
        let currentOpenProject = { id: null, creatorId: null };
        const investorName = userData.name || 'Inversor'; // For personalized message

        // --- UI Functions (Navigation, Toast & New Modal) ---
        const showPage = (pageId) => {
            const pageKey = pageId.startsWith('page-') ? pageId.replace('page-', '') : pageId;
            Object.values(pages).forEach(p => p.classList.remove('active'));
            if (pages[pageKey]) pages[pageKey].classList.add('active');
            navLinks.forEach(n => n.classList.remove('active'));
            const activeLink = document.querySelector(`.nav-link[data-page="page-${pageKey}"]`);
            if (activeLink) activeLink.classList.add('active');
            if (pageKey === 'inversiones') updatePortfolioView();
        };

        const showToast = (message, type = 'error') => { // Kept for error handling
            if (!toastContainer) return;
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            toastContainer.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 4000);
        };
        
        const showInvestmentSuccessModal = (amount, projectName) => {
            if (!successModal || !successModalMessage) return;
            successModalMessage.innerHTML = `¡Enhorabuena, <strong>${investorName}</strong>! <br>Tu inversión de <strong>${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)}</strong> en el proyecto "${projectName}" ha sido procesada con éxito.`;
            successModal.style.display = 'flex';
            setTimeout(() => successModal.classList.add('active'), 10); // Delay for transition
        };

        const hideInvestmentSuccessModal = () => {
            if (!successModal) return;
            successModal.classList.remove('active');
            // Wait for the transition to finish before hiding
            setTimeout(() => {
                successModal.style.display = 'none';
            }, 300);
        };

        // --- RENDER & UPDATE FUNCTIONS ---

        const updateProjectDetailUI = (projectId, investmentAmount) => {
            const project = projectsById[projectId];
            if (!project) return;

            // Update local data cache immediately
            project.fundedAmount = (project.fundedAmount || 0) + investmentAmount;
            // Assuming a new investor is added with each investment
            // In a real app, you might get this from a transaction result
            project.investors = (project.investors || 0) + 1; 

            // Check if the user is currently viewing the updated project
            if (currentOpenProject.id === projectId && pages.detalleProyecto.classList.contains('active')) {
                const fundedPercentage = project.goalAmount > 0 ? (project.fundedAmount / project.goalAmount) * 100 : 0;

                detailProjectFundedAmount.textContent = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(project.fundedAmount);
                detailProjectProgressBar.style.width = `${Math.min(fundedPercentage, 100)}%`;
                // Increment investor count on the UI
                detailProjectInvestorsCount.textContent = parseInt(detailProjectInvestorsCount.textContent, 10) + 1;
            }
        };

        const renderInvestorStatistics = () => {
            const totalInvestedElem = document.getElementById('summary-total-invested');
            const portfolioDiversityElem = document.getElementById('summary-portfolio-diversity');
            const successfulProjectsElem = document.getElementById('summary-successful-projects');
            if(!totalInvestedElem) return; // Guard clause

            const investmentsData = userInvestments ? Object.values(userInvestments) : [];
            if (investmentsData.length === 0 || !projectsLoaded) {
                totalInvestedElem.textContent = '€0';
                portfolioDiversityElem.textContent = '0 Sectores';
                successfulProjectsElem.textContent = '0';
                return;
            }
            const totalInvested = investmentsData.reduce((sum, inv) => sum + inv.amountInvested, 0);
            const investedCategories = new Set(investmentsData.map(inv => projectsById[inv.projectId]?.category).filter(Boolean));
            const successfulProjectsCount = [...new Set(investmentsData.map(inv => inv.projectId))].reduce((count, projectId) => {
                const project = projectsById[projectId];
                return (project && (project.fundedAmount || 0) >= project.goalAmount) ? count + 1 : count;
            }, 0);
            totalInvestedElem.textContent = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalInvested);
            portfolioDiversityElem.textContent = `${investedCategories.size} ${investedCategories.size === 1 ? 'Sector' : 'Sectores'}`;
            successfulProjectsElem.textContent = successfulProjectsCount;
        };

        const renderInvestmentChart = () => {
            const ctx = document.getElementById('investor-portfolio-chart')?.getContext('2d');
            if (!ctx) return;
            if (portfolioChart) portfolioChart.destroy();

            if (!investmentsLoaded || !projectsLoaded || Object.keys(userInvestments).length === 0) {
                 ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); return;
            }
            
            const sectorData = {};
            Object.values(userInvestments).forEach(investment => {
                const project = projectsById[investment.projectId];
                if (project) {
                    sectorData[project.category] = (sectorData[project.category] || 0) + investment.amountInvested;
                }
            });
            if (Object.keys(sectorData).length === 0) return;

            const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
            portfolioChart = new Chart(ctx, {
                type: 'doughnut', 
                data: { labels: Object.keys(sectorData), datasets: [{ data: Object.values(sectorData), backgroundColor: ['#4a90e2', '#50e3c2', '#f5a623', '#bd10e0', '#e74c3c', '#2ecc71'], borderColor: isDarkMode ? '#2c2c2c' : '#ffffff', borderWidth: 4 }] }, 
                options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: isDarkMode ? '#f0f0f0' : '#333', padding: 25, font: { family: "'Poppins', sans-serif" } } } } }
            });
        };

        const renderPortfolio = () => {
            if (!investmentsList) return;
            investmentsList.innerHTML = '';
            const hasInvestments = investmentsLoaded && Object.keys(userInvestments).length > 0;
            noInvestmentsMessage.style.display = (hasInvestments && projectsLoaded) ? 'none' : 'block';
            if (!hasInvestments || !projectsLoaded) return;

            const investmentsArray = Object.values(userInvestments).sort((a,b) => b.timestamp - a.timestamp);
            investmentsArray.forEach(investment => {
                const project = projectsById[investment.projectId];
                if (project) {
                    const fundedPercentage = project.goalAmount ? ((project.fundedAmount || 0) / project.goalAmount) * 100 : 0;
                    const item = document.createElement('a');
                    item.href = '#';
                    item.className = 'investment-item-bar';
                    item.dataset.projectId = investment.projectId;
                    if (project.isVip) item.classList.add('vip');
                    item.innerHTML = `
                        <div class="investment-item-bar__marker-container">${project.isVip ? '<i class="fa-solid fa-crown investment-item-bar__vip-marker"></i>' : ''}</div>
                        <img src="${project.imageUrl || 'https://via.placeholder.com/100'}" alt="${project.name}" class="investment-item-bar__image">
                        <div class="investment-item-bar__info"><h4 class="investment-item-bar__title">${project.name}</h4><p class="investment-item-bar__category">${project.category}</p></div>
                        <div class="investment-item-bar__data"><div class="investment-item-bar__metric"><small>Tu Inversión</small><span>${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(investment.amountInvested)}</span></div><div class="investment-item-bar__metric"><small>Progreso</small><span>${fundedPercentage.toFixed(1)}%</span></div></div>
                        <div class="investment-item-bar__action"><i class="fa-solid fa-chevron-right"></i></div>
                    `;
                    investmentsList.appendChild(item);
                }
            });
        };

        const updatePortfolioView = () => {
            if (!projectsLoaded || !investmentsLoaded) return;
            renderInvestorStatistics();
            renderPortfolio();
            renderInvestmentChart();
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
                        <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" data-project-id="${projectId}"><i class="fa-solid fa-star"></i></button>
                    </div>
                </div>
                <div class="card-v2-body">
                    <h3 class="project-v2-title">${project.name}</h3>
                    <p class="project-v2-description">${project.description.substring(0,100)}...</p>
                    <div class="project-v2-funding">
                        <div class="funding-progress-bar"><div class="funding-progress" style="width: ${fundedPercentage.toFixed(1)}%;"></div></div>
                        <div class="funding-details"><span>${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(project.fundedAmount || 0)}</span><span>${fundedPercentage.toFixed(1)}%</span></div>
                    </div>
                    <a href="#" class="btn-v2-details" data-project-id="${projectId}">Ver Detalles</a>
                </div>
            `;
            return card;
        };

        const renderProjectDetail = async (projectId) => {
            const project = projectsById[projectId];
            if (!project) { showToast('Error al cargar el proyecto.'); return; }
            currentOpenProject = { id: projectId, creatorId: project.creatorId };
            
            detailProjectImage.src = project.imageUrl || 'https://via.placeholder.com/600x400';
            detailProjectTitle.textContent = project.name;
            detailProjectCategory.textContent = project.category;
            detailProjectDescriptionFull.textContent = project.description;
            detailProjectVipTag.style.display = project.isVip ? 'inline-flex' : 'none';

            const fundedAmount = project.fundedAmount || 0;
            const goalAmount = project.goalAmount || 0;
            const fundedPercentage = goalAmount > 0 ? (fundedAmount / goalAmount) * 100 : 0;

            detailProjectFundedAmount.textContent = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(fundedAmount);
            detailProjectGoalAmount.textContent = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(goalAmount);
            detailProjectProgressBar.style.width = `${Math.min(fundedPercentage, 100)}%`;
            detailProjectDaysLeft.textContent = 'N/A';
            detailProjectInvestorsCount.textContent = project.investors || 0; // Set initial count

            const creatorSnapshot = await usersRef.child(project.creatorId).once('value');
            const creatorData = creatorSnapshot.val();
            if (creatorData) {
                detailCreatorName.textContent = creatorData.name || 'Emprendedor';
                detailCreatorAvatar.src = creatorData.avatarUrl || 'https://via.placeholder.com/50';
            }
            
            showPage('detalleProyecto');
        };

        const renderAllProjects = () => { if(projectGrid) { projectGrid.innerHTML = ''; sortedProjects.forEach(p => projectGrid.appendChild(renderProjectCard(p.id, p))); } };
        const renderFavorites = () => { if(favoritesGrid) { favoritesGrid.innerHTML = ''; const favs = sortedProjects.filter(p => userFavorites[p.id]); favs.forEach(p => favoritesGrid.appendChild(renderProjectCard(p.id, p))); if(noFavoritesMessage) noFavoritesMessage.style.display = favs.length > 0 ? 'none' : 'block'; } };

        // --- DATA LISTENERS & HANDLERS ---
        allProjectsRef.on('value', snapshot => {
            const allProjects = snapshot.val() || {};
            const allProjectsArray = [];
            for (const userId in allProjects) {
                for (const projectId in allProjects[userId]) {
                    allProjectsArray.push({ ...allProjects[userId][projectId], id: projectId, creatorId: userId });
                }
            }
            sortedProjects = allProjectsArray.sort((a, b) => (b.isVip ? 1 : 0) - (a.isVip ? 1 : 0) || (b.createdAt || 0) - (a.createdAt || 0));
            projectsById = sortedProjects.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
            projectsLoaded = true;
            renderAllProjects();
            renderFavorites();
            updatePortfolioView();
        });

        userFavoritesRef.on('value', snapshot => { userFavorites = snapshot.val() || {}; renderAllProjects(); renderFavorites(); });
        userInvestmentsRef.on('value', snapshot => { userInvestments = snapshot.val() || {}; investmentsLoaded = true; updatePortfolioView(); });

        // --- EVENT LISTENERS ---
        if (logoutButton) logoutButton.addEventListener('click', () => firebase.auth().signOut());
        if (closeSuccessModalBtn) closeSuccessModalBtn.addEventListener('click', hideInvestmentSuccessModal);
        
        mainContent.addEventListener('click', e => {
            const detailBtn = e.target.closest('.btn-v2-details');
            const favBtn = e.target.closest('.favorite-btn');
            const investmentBar = e.target.closest('.investment-item-bar');

            if (detailBtn || investmentBar) {
                e.preventDefault();
                const projectId = detailBtn?.dataset.projectId || investmentBar?.dataset.projectId;
                if(projectId) renderProjectDetail(projectId);
            }
            if (favBtn) {
                e.preventDefault();
                const projectId = favBtn.dataset.projectId;
                if(userFavorites[projectId]) {
                    userFavoritesRef.child(projectId).remove().then(() => showToast('Eliminado de favoritos.', 'success'));
                } else {
                    userFavoritesRef.child(projectId).set(true).then(() => showToast('Añadido a favoritos.', 'success'));
                }
            }
        });

        navLinks.forEach(link => link.addEventListener('click', e => {
            e.preventDefault();
            showPage(link.getAttribute('data-page'));
        }));

        if (backToProjectsBtn) backToProjectsBtn.addEventListener('click', e => {
            e.preventDefault();
            showPage('explorar');
        });

        if (investNowBtn) investNowBtn.addEventListener('click', () => {
            const amount = Number(investmentAmountInput.value);
            if (!amount || amount <= 0) { showToast('Por favor, introduce una cantidad válida.'); return; }
            const { id: projectId, creatorId } = currentOpenProject;
            if (!projectId || !creatorId) { showToast('Error al identificar el proyecto.'); return; }

            investNowBtn.disabled = true;
            investNowBtn.textContent = 'Procesando...';

            const newInvestmentRef = userInvestmentsRef.push();
            const investmentData = {
                projectId: projectId,
                amountInvested: amount,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };

            const projectFundedAmountRef = firebase.database().ref(`proyectos-emprendedor/${creatorId}/${projectId}/fundedAmount`);

            // Securely update the funded amount using a transaction
            projectFundedAmountRef.transaction(currentAmount => (currentAmount || 0) + amount)
            .then(transactionResult => {
                if (!transactionResult.committed) {
                    throw new Error('Transaction to update funded amount failed.');
                }
                // Once amount is updated, log the investor's investment
                return newInvestmentRef.set(investmentData);
            })
            .then(() => {
                // --- Success! Now update UI and show modal ---
                updateProjectDetailUI(projectId, amount); 
                showInvestmentSuccessModal(amount, projectsById[projectId]?.name || 'este proyecto');
                investmentAmountInput.value = '';
            })
            .catch(error => {
                showToast('Hubo un error al procesar la inversión.');
                console.error("Investment failed: ", error);
            })
            .finally(()=> {
                investNowBtn.disabled = false;
                investNowBtn.textContent = 'Invertir Ahora';
            });
        });
        
        // --- INITIALIZATION ---
        showPage('page-explorar');
    };
});
