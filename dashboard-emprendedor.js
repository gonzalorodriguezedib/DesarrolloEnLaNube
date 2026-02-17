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

        // --- VIP SWITCH LOGIC ---
        const vipSwitchContainer = document.getElementById('vip-switch-container');
        const vipCheckbox = document.getElementById('is-vip-project');

        if (vipSwitchContainer && vipCheckbox) {
            vipSwitchContainer.addEventListener('click', (event) => {
                if (event.target === vipSwitchContainer) {
                    vipCheckbox.checked = !vipCheckbox.checked;
                    vipCheckbox.dispatchEvent(new Event('change'));
                }
            });
            vipCheckbox.addEventListener('change', () => {
                vipSwitchContainer.classList.toggle('vip-selected', vipCheckbox.checked);
            });
        }

        // --- STATS & CHART ELEMENTS ---
        const statsTotalProjects = document.getElementById('stats-projects-value');
        const statsTotalFunds = document.getElementById('stats-funds-value');
        const statsTotalViews = document.getElementById('stats-views-value');
        const statsConversionRate = document.getElementById('stats-conversion-value');
        const projectPerformanceChartCtx = document.getElementById('project-performance-chart')?.getContext('2d');
        let performanceChart = null;

        // --- MODAL ELEMENTS ---
        const editProjectModal = document.getElementById('edit-project-modal');
        const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
        const cancelEditProjectBtn = document.getElementById('cancel-edit-project-btn');
        const editProjectForm = document.getElementById('edit-project-form');
        const deleteProjectModal = document.getElementById('delete-project-modal');
        const closeDeleteProjectModalBtn = document.getElementById('close-delete-project-modal-btn');
        const cancelDeleteProjectBtn = document.getElementById('cancel-delete-project-btn');
        const confirmDeleteProjectBtn = document.getElementById('confirm-delete-project-btn');
        const deleteProjectConfirmCheckbox = document.getElementById('delete-project-confirm-checkbox');

        // --- FIREBASE REFS ---
        const userProjectsRef = firebase.database().ref('proyectos-emprendedor/' + user.uid);
        const allInvestmentsRef = firebase.database().ref('inversiones-inversor');
        const userRef = firebase.database().ref('users/' + user.uid);

        // --- DATA CACHE ---
        let userProjects = [];
        let allInvestments = {};
        let dataLoaded = { projects: false, investments: false };

        // --- RENDER FUNCTIONS ---
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
                const fundedPercentage = project.goalAmount ? ((project.fundedAmount || 0) / project.goalAmount) * 100 : 0;
                const card = document.createElement('div');
                card.className = 'project-card-v2';
                if (project.isVip) card.classList.add('vip');
                card.dataset.projectId = project.id;
                card.innerHTML = `
                    <div class="card-v2-header">
                        <img src="${project.imageUrl || 'https://via.placeholder.com/400x250'}" alt="${project.name}" class="project-v2-image">
                        <div class="card-v2-overlay">
                            ${project.isVip ? `<div class="vip-tag"><i class="fa-solid fa-crown"></i> VIP</div>` : ''}
                            <span class="project-v2-category">${project.category}</span>
                        </div>
                    </div>
                    <div class="card-v2-body">
                        <h3 class="project-v2-title">${project.name}</h3>
                        <p class="project-v2-description">${project.description.substring(0, 100)}...</p>
                        <div class="project-v2-funding">
                            <div class="funding-progress-bar"><div class="funding-progress" style="width: ${fundedPercentage.toFixed(1)}%;"></div></div>
                            <div class="funding-details">
                                <span>${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(project.fundedAmount || 0)}</span>
                                <span class="funding-percentage">${fundedPercentage.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div class="project-card-actions">
                           <a href="#" class="btn-action btn-edit"><i class="fa-solid fa-pencil"></i> Editar</a>
                           <a href="#" class="btn-action btn-delete"><i class="fa-solid fa-trash"></i> Eliminar</a>
                        </div>
                    </div>
                `;
                currentProjectsList.appendChild(card);
            }
        };

        const renderStatistics = () => {
            if (!dataLoaded.projects) return; 

            const totalProjects = userProjects.length;
            const totalFundsRaised = userProjects.reduce((sum, p) => sum + (p.fundedAmount || 0), 0);

            const profileProjectsStatEl = document.getElementById('profile-stat-projects');
            const profileFundsStatEl = document.getElementById('profile-stat-funds');

            if (profileProjectsStatEl) {
                profileProjectsStatEl.textContent = totalProjects;
            }
            if (profileFundsStatEl) {
                profileFundsStatEl.textContent = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(totalFundsRaised);
            }

            if (statsTotalProjects) statsTotalProjects.textContent = totalProjects;
            if (statsTotalFunds) statsTotalFunds.textContent = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalFundsRaised);
            
            if (statsTotalViews) statsTotalViews.textContent = 'N/A';
            if (statsConversionRate) statsConversionRate.textContent = 'N/A';

            if (projectPerformanceChartCtx) {
                const sortedProjectsForChart = [...userProjects].sort((a, b) => (b.fundedAmount || 0) - (a.fundedAmount || 0));
                const projectNames = sortedProjectsForChart.map(p => p.name);
                const projectFunding = sortedProjectsForChart.map(p => p.fundedAmount || 0);
                const projectGoals = sortedProjectsForChart.map(p => p.goalAmount || 0);
                if (performanceChart) performanceChart.destroy();
                const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
                const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                const textColor = isDarkMode ? '#f0f0f0' : '#333';
                performanceChart = new Chart(projectPerformanceChartCtx, {
                    type: 'bar',
                    data: {
                        labels: projectNames,
                        datasets: [
                            { label: 'Fondos Recaudados (€)', data: projectFunding, backgroundColor: 'rgba(74, 144, 226, 0.8)', borderColor: '#4a90e2', borderWidth: 1, borderRadius: 6, barPercentage: 0.7 },
                            { label: 'Meta de Financiación (€)', data: projectGoals, backgroundColor: 'rgba(224, 224, 224, 0.7)', borderColor: '#e0e0e0', borderWidth: 1, borderRadius: 6, barPercentage: 0.7 }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        layout: { padding: 10 },
                        scales: {
                            y: { beginAtZero: true, grid: { color: gridColor, drawBorder: false }, ticks: { color: textColor, padding: 10, callback: v => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(v) } },
                            x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } }
                        },
                        plugins: {
                            legend: { position: 'bottom', labels: { color: textColor, usePointStyle: true, padding: 20 } },
                            tooltip: {
                                enabled: true,
                                backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                                titleColor: isDarkMode ? '#f0f0f0' : '#333',
                                bodyColor: isDarkMode ? '#f0f0f0' : '#555',
                                titleFont: { weight: 'bold' },
                                bodySpacing: 4,
                                padding: 12,
                                cornerRadius: 8,
                                borderColor: 'rgba(74, 144, 226, 0.5)',
                                borderWidth: 1,
                                callbacks: { label: (c) => `${c.dataset.label || ''}: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c.parsed.y)}` }
                            }
                        }
                    }
                });
            }
        };

        // --- DATA LISTENERS ---
        userProjectsRef.on('value', (snapshot) => {
            const projects = snapshot.val();
            userProjects = projects ? Object.entries(projects).map(([id, data]) => ({ ...data, id })) : [];
            userProjects.sort((a, b) => (b.isVip ? 1 : 0) - (a.isVip ? 1 : 0) || b.createdAt - a.createdAt);
            dataLoaded.projects = true;
            renderProjects(userProjects);
            renderStatistics();
        });

        allInvestmentsRef.on('value', (snapshot) => {
            allInvestments = snapshot.val() || {};
            dataLoaded.investments = true;
            renderStatistics();
        });

        // --- FORM LOGIC ---
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                userProjectsRef.push({
                    name: document.getElementById('project-title').value,
                    description: document.getElementById('project-description').value,
                    category: document.getElementById('project-category').value,
                    goalAmount: Number(document.getElementById('funding-goal').value),
                    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/desarrolloenlanube-67988-277f8.appspot.com/o/placeholder%2Fplaceholder.png?alt=media&token=f0b2977c-9379-444a-b5d3-826a793abf9e',
                    isVip: document.getElementById('is-vip-project').checked,
                    fundedAmount: 0,
                    creatorId: user.uid,
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                }).then(() => {
                    projectForm.reset();
                    document.querySelector('.nav-link[data-page="page-mis-proyectos"]').click();
                }).catch(error => console.error("Error al crear proyecto: ", error));
            });
        }

        // --- MODAL & ACTION LOGIC ---
        const openModal = (modal) => { modal.style.display = 'flex'; setTimeout(() => modal.classList.add('active'), 10); };
        const closeModal = (modal) => { modal.classList.remove('active'); setTimeout(() => { modal.style.display = 'none'; }, 300); };

        const openEditModal = (project) => {
            if (!editProjectModal) return;
            document.getElementById('edit-project-id').value = project.id;
            document.getElementById('edit-project-title').value = project.name;
            document.getElementById('edit-project-description').value = project.description;
            document.getElementById('edit-project-category').value = project.category;
            document.getElementById('edit-project-goal').value = project.goalAmount;
            openModal(editProjectModal);
        };

        const openDeleteProjectModal = (projectId) => {
            if (!deleteProjectModal) return;
            document.getElementById('delete-project-id').value = projectId;
            openModal(deleteProjectModal);
        };

        currentProjectsList.addEventListener('click', (e) => {
            const target = e.target.closest('.btn-action');
            if (!target) return;
            e.preventDefault();
            const projectId = e.target.closest('.project-card-v2').dataset.projectId;
            if (target.classList.contains('btn-edit')) {
                userProjectsRef.child(projectId).once('value', snap => openEditModal({ id: snap.key, ...snap.val() }));
            } else if (target.classList.contains('btn-delete')) {
                openDeleteProjectModal(projectId);
            }
        });

        if (editProjectForm) {
            editProjectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const projectId = document.getElementById('edit-project-id').value;
                const updates = {
                    name: document.getElementById('edit-project-title').value,
                    description: document.getElementById('edit-project-description').value,
                    category: document.getElementById('edit-project-category').value,
                    goalAmount: Number(document.getElementById('edit-project-goal').value),
                };
                userProjectsRef.child(projectId).update(updates).then(() => closeModal(editProjectModal));
            });
        }

        if (confirmDeleteProjectBtn) {
            deleteProjectConfirmCheckbox.addEventListener('change', () => { confirmDeleteProjectBtn.disabled = !deleteProjectConfirmCheckbox.checked; });
            confirmDeleteProjectBtn.addEventListener('click', () => {
                const projectId = document.getElementById('delete-project-id').value;
                userProjectsRef.child(projectId).remove().then(() => closeModal(deleteProjectModal));
            });
        }

        if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', () => closeModal(editProjectModal));
        if (cancelEditProjectBtn) cancelEditProjectBtn.addEventListener('click', () => closeModal(editProjectModal));
        if (editProjectModal) editProjectModal.addEventListener('click', (e) => { if (e.target === editProjectModal) closeModal(editProjectModal); });
        if (closeDeleteProjectModalBtn) closeDeleteProjectModalBtn.addEventListener('click', () => closeModal(deleteProjectModal));
        if (cancelDeleteProjectBtn) cancelDeleteProjectBtn.addEventListener('click', () => closeModal(deleteProjectModal));
        if (deleteProjectModal) deleteProjectModal.addEventListener('click', (e) => { if (e.target === deleteProjectModal) closeModal(deleteProjectModal); });

        // --- PROFILE EDITING LOGIC ---
        const setupProfileEditing = () => {
            const profilePage = document.getElementById('page-perfil');
            if (!profilePage) return;

            const sections = profilePage.querySelectorAll('.form-section');

            sections.forEach(section => {
                const editBtn = section.querySelector('.btn-edit-section');
                const form = section.querySelector('form');
                if (!editBtn || !form) return;

                const inputs = form.querySelectorAll('input:not([type="file"]), textarea');
                const actions = form.querySelector('.form-actions');
                const cancelBtn = actions?.querySelector('.cancel-edit');
                let originalValues = {};

                const enterEditMode = () => {
                    originalValues = {};
                    inputs.forEach(input => {
                        originalValues[input.id] = input.value;
                        input.disabled = false;
                    });
                    editBtn.style.display = 'none';
                    if (actions) actions.style.display = 'flex';
                };

                const exitEditMode = (save = false) => {
                    if (!save) {
                        inputs.forEach(input => {
                            input.value = originalValues[input.id] || '';
                        });
                    }
                    inputs.forEach(input => input.disabled = true);
                    editBtn.style.display = 'block';
                    if (actions) actions.style.display = 'none';
                };

                editBtn.addEventListener('click', enterEditMode);
                cancelBtn?.addEventListener('click', () => exitEditMode(false));

                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const updates = {};
                    inputs.forEach(input => {
                        const key = input.id.replace('-input', '').replace('profile-', '').replace('company-', '');
                        updates[key] = input.value;
                    });

                    userRef.update(updates)
                        .then(() => {
                            exitEditMode(true);
                            // Update header welcome message if name changed
                            if (updates.name) {
                                if (welcomeElement) welcomeElement.textContent = updates.name;
                                if (profileCardNameElement) profileCardNameElement.textContent = updates.name;
                            }
                        })
                        .catch(error => {
                            console.error("Error updating profile:", error);
                            exitEditMode(false); // Revert on error
                        });
                });
            });
        };
        
        // --- AVATAR UPLOAD LOGIC ---
        const setupAvatarUpload = () => {
            const avatarImg = document.getElementById('profile-avatar-img');
            const editAvatarBtn = document.querySelector('.edit-avatar-btn');
            const avatarUploadInput = document.getElementById('avatar-upload-input');
            const storage = firebase.storage();

            if (!avatarImg || !editAvatarBtn || !avatarUploadInput) return;

            const triggerFileUpload = () => avatarUploadInput.click();

            avatarImg.addEventListener('click', triggerFileUpload);
            editAvatarBtn.addEventListener('click', triggerFileUpload);

            avatarUploadInput.addEventListener('change', e => {
                const file = e.target.files[0];
                if (!file || !file.type.startsWith('image/')) return;

                const uploadTask = storage.ref(`avatars/${user.uid}/${file.name}`).put(file);

                uploadTask.on('state_changed', 
                    () => {},
                    error => console.error('Error al subir la imagen:', error),
                    () => {
                        uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
                            avatarImg.src = downloadURL;
                            userRef.update({ avatarUrl: downloadURL });
                        });
                    }
                );
            });
        };

        // --- UI & ACCOUNT ACTIONS ---
        if (logoutButton) logoutButton.addEventListener('click', () => firebase.auth().signOut().then(() => { window.location.href = 'index.html'; }));

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = link.getAttribute('data-page');
                pages.forEach(p => p.classList.remove('active'));
                navLinks.forEach(n => n.classList.remove('active'));
                const targetPage = document.getElementById(pageId);
                if (targetPage) targetPage.classList.add('active');
                link.classList.add('active');
                if (pageId === 'page-estadisticas') renderStatistics();
            });
        });

        // --- INITIALIZATION ---
        userRef.once('value').then(snapshot => {
            const userData = snapshot.val() || {};
            const name = userData.name || user.displayName || 'Emprendedor';
            if (welcomeElement) welcomeElement.textContent = name;
            if (profileCardNameElement) profileCardNameElement.textContent = name;
            if (userData.avatarUrl) {
                const avatarImg = document.getElementById('profile-avatar-img');
                if(avatarImg) avatarImg.src = userData.avatarUrl;
            }

            // Populate profile form
            document.getElementById('profile-name-input').value = userData.name || '';
            document.getElementById('profile-email-input').value = userData.email || user.email || '';
            document.getElementById('company-name-input').value = userData.companyName || '';
            document.getElementById('company-website-input').value = userData.companyWebsite || '';
            document.getElementById('company-bio-input').value = userData.companyBio || '';
        });

        if (navLinks.length > 0) {
            const initialLink = document.querySelector('.nav-link[data-page="page-mis-proyectos"]');
            if (initialLink) initialLink.click();
        }
        
        setupProfileEditing();
        setupAvatarUpload();
    };

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            firebase.database().ref('users/' + user.uid).once('value').then((snapshot) => {
                const userData = snapshot.val();
                if (userData && userData.role === 'emprendedor') {
                    initializeDashboard(user);
                } else {
                    firebase.auth().signOut().then(() => { window.location.href = 'index.html'; });
                }
            });
        } else {
            window.location.href = 'index.html';
        }
    });
});
