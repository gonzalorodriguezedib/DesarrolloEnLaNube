
document.addEventListener('DOMContentLoaded', function () {
    
    const initializeDashboard = (user) => {
        console.log("InvestMatch Entrepreneur Dashboard Script v5.0 (Account Deletion) Loaded.");
        if (!user) return;

        // --- DOM ELEMENTS ---
        const projectForm = document.getElementById('create-project-form');
        const currentProjectsList = document.querySelector('#current-projects-list');
        const logoutButton = document.getElementById('logout-button');
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.dashboard-page');
        const welcomeElement = document.querySelector('.user-welcome strong');
        const profileCardNameElement = document.getElementById('profile-card-name');

        // Profile Page Elements
        const editPersonalInfoBtn = document.getElementById('edit-personal-info');
        const personalInfoForm = document.getElementById('personal-info-form');
        const editCompanyInfoBtn = document.getElementById('edit-company-info');
        const companyInfoForm = document.getElementById('company-info-form');
        const editAvatarBtn = document.querySelector('.edit-avatar-btn');
        const avatarUploadInput = document.getElementById('avatar-upload-input');
        const profileAvatarImg = document.getElementById('profile-avatar-img');
        const deleteAccountBtn = document.getElementById('delete-account-btn');

        // --- 0. Set Welcome Message & Profile Name ---
        if (user) {
            const userRef = firebase.database().ref('users/' + user.uid);
            userRef.once('value').then(snapshot => {
                const userData = snapshot.val();
                const defaultName = user.displayName || 'Emprendedor';
                if (userData && userData.name) {
                    if(welcomeElement) welcomeElement.textContent = userData.name;
                    if(profileCardNameElement) profileCardNameElement.textContent = userData.name;
                } else {
                    if(welcomeElement) welcomeElement.textContent = defaultName;
                    if(profileCardNameElement) profileCardNameElement.textContent = defaultName;
                }
            }).catch(error => {
                 console.error("Error al leer datos del perfil:", error);
                 const defaultName = user.displayName || 'Emprendedor';
                 if(welcomeElement) welcomeElement.textContent = defaultName;
                 if(profileCardNameElement) profileCardNameElement.textContent = defaultName;
            });
        }

        // --- FIREBASE DATABASE ---
        const userProjectsRef = firebase.database().ref('proyectos-emprendedor/' + user.uid);

        const renderProjects = (projects) => {
            if (!currentProjectsList) return;
            const noProjectsMessage = document.querySelector('.no-projects-message');
            currentProjectsList.innerHTML = ''; 
            
            if (!projects || Object.keys(projects).length === 0) {
                if(noProjectsMessage) noProjectsMessage.style.display = 'block';
                return;
            }
            if(noProjectsMessage) noProjectsMessage.style.display = 'none';

            for (const projectId in projects) {
                const project = projects[projectId];
                const fundedPercentage = project.goalAmount ? ((project.fundedAmount || 0) / project.goalAmount) * 100 : 0;
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
                    fundedAmount: 0, 
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                };
                userProjectsRef.push(newProject).then(() => {
                    projectForm.reset();
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
        
        // --- PROFILE PAGE FUNCTIONS & HANDLERS ---
        const setFormEditState = (form, isEditing) => {
            if (!form) return;
            const inputs = form.querySelectorAll('input, textarea');
            const actions = form.querySelector('.form-actions');
            const editButtonId = `edit-${form.id.split('-form')[0]}`;
            const editButton = document.getElementById(editButtonId);

            inputs.forEach(input => {
                 if (input.type !== 'email') { 
                    input.disabled = !isEditing;
                }
            });

            if (actions) actions.style.display = isEditing ? 'flex' : 'none';
            if (editButton) editButton.style.display = isEditing ? 'none' : 'block';
        };
        
        const triggerAvatarUpload = () => {
            if (avatarUploadInput) avatarUploadInput.click();
        };

        if (editAvatarBtn) {
            editAvatarBtn.addEventListener('click', triggerAvatarUpload);
        }

        if (profileAvatarImg) {
            profileAvatarImg.style.cursor = 'pointer';
            profileAvatarImg.addEventListener('click', triggerAvatarUpload);
        }

        if (avatarUploadInput) {
            avatarUploadInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file && profileAvatarImg) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        profileAvatarImg.src = e.target.result;
                        console.log("Avatar del emprendedor actualizado en la vista.");
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if(editPersonalInfoBtn) {
            editPersonalInfoBtn.addEventListener('click', () => setFormEditState(personalInfoForm, true));
        }

        if (personalInfoForm) {
            personalInfoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Guardando información personal del emprendedor...');
                setFormEditState(personalInfoForm, false);
            });
            const cancelBtn = personalInfoForm.querySelector('.cancel-edit');
            if(cancelBtn) cancelBtn.addEventListener('click', () => setFormEditState(personalInfoForm, false));
        }

        if(editCompanyInfoBtn) {
            editCompanyInfoBtn.addEventListener('click', () => setFormEditState(companyInfoForm, true));
        }

        if (companyInfoForm) {
            companyInfoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Guardando información de la empresa...');
                setFormEditState(companyInfoForm, false);
            });
            const cancelBtn = companyInfoForm.querySelector('.cancel-edit');
            if(cancelBtn) cancelBtn.addEventListener('click', () => setFormEditState(companyInfoForm, false));
        }

        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', async () => {
                const confirmation = confirm("¿Estás absolutamente seguro de que quieres eliminar tu cuenta? Esta acción es irreversible y todos tus datos, incluidos tus proyectos, serán borrados permanentemente.");
                if (confirmation) {
                    try {
                        const userId = user.uid;
                        // 1. Eliminar datos de la Realtime Database (proyectos y perfil)
                        await firebase.database().ref('proyectos-emprendedor/' + userId).remove();
                        await firebase.database().ref('users/' + userId).remove();

                        // 2. Eliminar cuenta de autenticación de Firebase
                        await user.delete();

                        // 3. Redirigir al inicio
                        window.location.href = 'index.html';

                    } catch (error) {
                        console.error("Error al eliminar la cuenta:", error);
                        alert("Hubo un error al intentar eliminar tu cuenta. Es posible que necesites volver a iniciar sesión para completar esta acción.");
                    }
                }
            });
        }

        // --- INITIALIZATION ---
        if (navLinks.length > 0) {
             document.querySelector('.nav-link[data-page="page-mis-proyectos"]').click();
        }
    };

    // --- FIREBASE AUTHENTICATION & AUTHORIZATION ---
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const userRef = firebase.database().ref('users/' + user.uid);
            userRef.once('value').then((snapshot) => {
                const userData = snapshot.val();
                if (userData && userData.role === 'emprendedor') {
                    initializeDashboard(user);
                } else {
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
            console.log('Usuario no autenticado. Redirigiendo a inicio.');
            window.location.href = 'index.html';
        }
    });
});
