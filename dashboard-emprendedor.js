document.addEventListener('DOMContentLoaded', function () {

    const initializeDashboard = (user) => {
        if (!user) return;

        // --- DOM ELEMENTS ---
        const projectForm = document.getElementById('create-project-form');
        const currentProjectsList = document.querySelector('#current-projects-list');
        const logoutButton = document.getElementById('logout-button');
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.dashboard-page');
        const welcomeElement = document.querySelector('.user-welcome strong');
        const profileCardNameElement = document.getElementById('profile-card-name');
        const vipSwitchContainer = document.getElementById('vip-switch-container');
        const vipCheckbox = document.getElementById('is-vip-project');

        // Profile Page Elements
        const deleteAccountBtn = document.getElementById('delete-account-btn');

        // --- MODAL DELETE ELEMENTS ---
        const deleteModal = document.getElementById('delete-account-modal');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        const deleteConfirmInput = document.getElementById('delete-confirm-input');
        const deleteConfirmCheckbox = document.getElementById('delete-confirm-checkbox');

        // --- FIREBASE DATABASE & STORAGE ---
        const userProjectsRef = firebase.database().ref('proyectos-emprendedor/' + user.uid);

        // --- RENDER FUNCTIONS ---

        const renderSummaryStatistics = (projects) => {
            const totalRecaudadoElem = document.getElementById('stats-total-recaudado');
            const totalInversoresElem = document.getElementById('stats-total-inversores');
            const proyectosActivosElem = document.getElementById('stats-proyectos-activos');

            if (!totalRecaudadoElem || !totalInversoresElem || !proyectosActivosElem) return;

            if (!projects || Object.keys(projects).length === 0) {
                totalRecaudadoElem.textContent = '0 €';
                totalInversoresElem.textContent = '0';
                proyectosActivosElem.textContent = '0';
                return;
            }

            const projectsData = Object.values(projects);
            const totalFunded = projectsData.reduce((sum, project) => sum + (project.fundedAmount || 0), 0);
            const totalInvestors = projectsData.reduce((sum, project) => {
                const investorsCount = project.investors ? Object.keys(project.investors).length : 0;
                return sum + investorsCount;
            }, 0);
            const activeProjects = projectsData.length;

            totalRecaudadoElem.innerHTML = `${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalFunded)}`;
            totalInversoresElem.textContent = totalInvestors;
            proyectosActivosElem.textContent = activeProjects;
        };

        const renderProjects = (projectsArray) => {
            if (!currentProjectsList) return;
            const noProjectsMessage = document.querySelector('.no-projects-message');
            currentProjectsList.innerHTML = '';
        
            if (!projectsArray || projectsArray.length === 0) {
                if (noProjectsMessage) noProjectsMessage.style.display = 'block';
                return;
            }
            if (noProjectsMessage) noProjectsMessage.style.display = 'none';
        
            for (const project of projectsArray) {
                const projectId = project.id;
                const fundedPercentage = project.goalAmount ? ((project.fundedAmount || 0) / project.goalAmount) * 100 : 0;
                const shortDescription = project.description.length > 100 ? project.description.substring(0, 100) + '...' : project.description;

                const card = document.createElement('div');
                card.className = 'project-card-v2';
                if (project.isVip) card.classList.add('vip');
                card.dataset.projectId = projectId;


                card.innerHTML = `
                    <div class="card-v2-header">
                        <img src="${project.imageUrl || 'https://via.placeholder.com/400x250'}" alt="${project.name}" class="project-v2-image">
                        <div class="card-v2-overlay">
                            ${project.isVip ? '<div class="vip-tag"><i class="fa-solid fa-crown"></i> VIP</div>' : ''}
                            <span class="project-v2-category">${project.category}</span>
                        </div>
                    </div>
                    <div class="card-v2-body">
                        <h3 class="project-v2-title">${project.name}</h3>
                        <p class="project-v2-description">${shortDescription}</p>
                        <div class="project-v2-funding">
                            <div class="funding-progress-bar">
                                <div class="funding-progress" style="width: ${fundedPercentage.toFixed(1)}%;"></div>
                            </div>
                            <div class="funding-details">
                                <span>${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(project.fundedAmount || 0)}</span>
                                <span class="funding-percentage">${fundedPercentage.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div class="project-card-actions" style="margin-top: 1rem;">
                           <a href="#" class="btn btn-secondary btn-edit" style="width: 100%; margin-bottom: 0.5rem;">Editar</a>
                           <a href="#" class="btn btn-danger btn-delete" style="width: 100%;">Eliminar</a>
                        </div>
                    </div>
                `;
                currentProjectsList.appendChild(card);
            }
        };

        const renderStatisticsChart = (projectsArray) => {
            const ctx = document.getElementById('project-performance-chart')?.getContext('2d');
            if (!ctx) return;

            const projectsData = projectsArray || [];

            if (window.myProjectChart) {
                window.myProjectChart.destroy();
            }

            if (projectsData.length === 0) {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
                ctx.font = "16px 'Poppins', sans-serif";
                ctx.fillStyle = textColor;
                ctx.textAlign = "center";
                ctx.fillText("Aún no tienes proyectos para mostrar estadísticas.", ctx.canvas.width / 2, 50);
                return;
            }

            const projectNames = projectsData.map(p => p.name);
            const projectFunding = projectsData.map(p => p.fundedAmount || 0);
            const projectGoals = projectsData.map(p => p.goalAmount);

            const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
            const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim();
            const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
            const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
            const cardBgColor = getComputedStyle(document.documentElement).getPropertyValue('--card-background').trim();

            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, primaryColor);
            gradient.addColorStop(1, secondaryColor);

            window.myProjectChart = new Chart(ctx, {
                type: 'bar', 
                data: {
                    labels: projectNames,
                    datasets: [
                        { 
                            label: 'Fondos Recaudados (€)', 
                            data: projectFunding, 
                            backgroundColor: gradient, 
                            barPercentage: 0.6, 
                            categoryPercentage: 0.7, 
                            order: 1 
                        },
                        { 
                            label: 'Meta de Financiación (€)', 
                            data: projectGoals, 
                            type: 'line', 
                            borderColor: textColor, 
                            borderWidth: 2, 
                            borderDash: [5, 5], 
                            pointBackgroundColor: textColor, 
                            pointRadius: 4, 
                            pointHoverRadius: 6, 
                            fill: false, 
                            tension: 0.3, 
                            order: 0 
                        }
                    ]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    interaction: { mode: 'index', intersect: false }, 
                    scales: { 
                        y: { beginAtZero: true, ticks: { color: textColor, font: { family: "'Poppins', sans-serif" }, callback: function(value) { return '€' + value.toLocaleString('es-ES'); } }, grid: { color: gridColor, drawBorder: false } }, 
                        x: { ticks: { color: textColor, font: { family: "'Poppins', sans-serif" } }, grid: { display: false } } 
                    }, 
                    plugins: { 
                        legend: { position: 'top', labels: { color: textColor, font: { size: 14, family: "'Poppins', sans-serif" }, usePointStyle: true, boxWidth: 8 } }, 
                        tooltip: { 
                            enabled: true, 
                            backgroundColor: cardBgColor, 
                            titleColor: textColor, 
                            bodyColor: textColor, 
                            borderColor: gridColor, 
                            borderWidth: 1, 
                            titleFont: { size: 16, weight: '600', family: "'Poppins', sans-serif" }, 
                            bodyFont: { size: 13, family: "'Poppins', sans-serif" }, 
                            padding: 15, 
                            cornerRadius: 10, 
                            displayColors: true, 
                            callbacks: { 
                                title: (ctx) => ctx[0].label, 
                                label: (ctx) => ` ${ctx.dataset.label || ''}: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(ctx.parsed.y)}`
                            } 
                        } 
                    } 
                }
            });
        };

        // --- DATA LISTENER ---
        userProjectsRef.on('value', (snapshot) => {
            const projects = snapshot.val();

            const sortedProjects = projects
                ? Object.entries(projects).map(([id, data]) => ({ ...data, id }))
                : [];

            sortedProjects.sort((a, b) => {
                const vipSort = (b.isVip ? 1 : 0) - (a.isVip ? 1 : 0);
                if (vipSort !== 0) return vipSort;
                return b.createdAt - a.createdAt;
            });

            renderSummaryStatistics(projects);
            renderProjects(sortedProjects);
            renderStatisticsChart(sortedProjects);
        });

        // --- FORM LOGIC ---
        if (vipSwitchContainer && vipCheckbox) {
            vipSwitchContainer.addEventListener('click', () => {
                vipCheckbox.checked = !vipCheckbox.checked;
                vipCheckbox.dispatchEvent(new Event('change')); 
            });
            vipCheckbox.addEventListener('change', () => {
                vipSwitchContainer.classList.toggle('vip-selected', vipCheckbox.checked);
            });
        }

        if (projectForm) {
            projectForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const isVip = vipCheckbox.checked;
                const submitButton = projectForm.querySelector('.btn-submit');

                submitButton.disabled = true;
                submitButton.textContent = 'Publicando...';

                const newProject = {
                    name: document.getElementById('project-title').value,
                    description: document.getElementById('project-description').value,
                    category: document.getElementById('project-category').value,
                    goalAmount: Number(document.getElementById('funding-goal').value),
                    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/desarrolloenlanube-67988-277f8.appspot.com/o/placeholder%2Fplaceholder.png?alt=media&token=f0b2977c-9379-444a-b5d3-826a793abf9e',
                    isVip: isVip,
                    fundedAmount: 0,
                    creatorId: user.uid,
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                };

                userProjectsRef.push(newProject).then(() => {
                    projectForm.reset();
                    vipCheckbox.checked = false;
                    vipSwitchContainer.classList.remove('vip-selected');
                    document.querySelector('.nav-link[data-page="page-mis-proyectos"]').click();
                }).catch(error => {
                    console.error("Error al crear proyecto: ", error);
                    alert("Error al guardar los datos del proyecto.");
                }).finally(() => {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Publicar Proyecto';
                });
            });
        }
        
        // --- UI & ACCOUNT ACTIONS ---
        if (logoutButton) logoutButton.addEventListener('click', () => firebase.auth().signOut().then(() => { window.location.href = 'index.html'; }));

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

        const validateDeleteInput = () => { confirmDeleteBtn.disabled = !(deleteConfirmInput.value === 'ELIMINAR' && deleteConfirmCheckbox.checked); };
        const openDeleteModal = () => { if (deleteModal) { deleteModal.style.display = 'flex'; setTimeout(() => deleteModal.classList.add('active'), 10); } };
        const closeDeleteModal = () => { if (deleteModal) { deleteModal.classList.remove('active'); setTimeout(() => { deleteModal.style.display = 'none'; deleteConfirmInput.value = ''; deleteConfirmCheckbox.checked = false; confirmDeleteBtn.disabled = true; }, 300); } };
        if(deleteAccountBtn) deleteAccountBtn.addEventListener('click', openDeleteModal);
        deleteConfirmInput.addEventListener('input', validateDeleteInput);
        deleteConfirmCheckbox.addEventListener('change', validateDeleteInput);
        const executeDeleteAccount = async () => {
            confirmDeleteBtn.disabled = true; confirmDeleteBtn.textContent = 'Eliminando...';
            try {
                await firebase.database().ref('proyectos-emprendedor/' + user.uid).remove();
                await firebase.database().ref('users/' + user.uid).remove();
                await user.delete();
                localStorage.clear(); window.location.href = 'index.html';
            } catch (error) {
                console.error("Error al eliminar la cuenta del emprendedor:", error);
                alert("Hubo un error al eliminar tu cuenta.");
                confirmDeleteBtn.disabled = false; confirmDeleteBtn.textContent = 'Eliminar Cuenta'; closeDeleteModal();
            }
        };
        if(closeModalBtn) closeModalBtn.addEventListener('click', closeDeleteModal);
        if(cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
        if(confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', executeDeleteAccount);
        if (deleteModal) deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) closeDeleteModal(); });

        // --- INITIALIZATION ---
        firebase.database().ref('users/' + user.uid).once('value').then(snapshot => {
            const userData = snapshot.val();
            const name = (userData && userData.name) || user.displayName || 'Emprendedor';
            if (welcomeElement) welcomeElement.textContent = name;
            if (profileCardNameElement) profileCardNameElement.textContent = name;
        });

        if (navLinks.length > 0) document.querySelector('.nav-link[data-page="page-mis-proyectos"]').click();

    };

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            firebase.database().ref('users/' + user.uid).once('value').then((snapshot) => {
                const userData = snapshot.val();
                if (userData && userData.role === 'emprendedor') {
                    initializeDashboard(user);
                } else {
                    firebase.auth().signOut(); window.location.href = 'index.html';
                }
            }).catch(error => { console.error('Error al obtener datos del usuario:', error); firebase.auth().signOut(); window.location.href = 'index.html'; });
        } else {
            window.location.href = 'index.html';
        }
    });
});