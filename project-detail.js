
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM & Firebase Refs ---
    const projectDetailContent = document.getElementById('project-detail-content');
    const loadingSpinner = document.getElementById('loading-spinner');
    const allProjectsRef = firebase.database().ref('proyectos-emprendedor');

    // --- STATE ---
    let currentProject = null;
    let currentProjectId = null;
    let currentProjectCreatorId = null;
    let currentUser = null;
    let currentUserData = null;

    /**
     * Renderiza los detalles del proyecto y el panel de inversión.
     */
    const renderProjectDetails = async () => {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (!currentProject || !projectDetailContent) {
            projectDetailContent.innerHTML = '<p class="text-center text-red-500">No se pudo encontrar la información del proyecto.</p>';
            return;
        }

        const fundedAmount = currentProject.fundedAmount || 0;
        const goalAmount = currentProject.goalAmount || 0;
        const fundedPercentage = goalAmount > 0 ? (fundedAmount / goalAmount) * 100 : 0;

        // Obtener nombre del creador
        let creatorName = 'Emprendedor Anónimo';
        if (currentProjectCreatorId) {
            const creatorSnapshot = await firebase.database().ref(`users/${currentProjectCreatorId}`).once('value');
            const creatorData = creatorSnapshot.val();
            creatorName = creatorData ? creatorData.name : creatorName;
        }

        // Lógica de visualización del panel de inversión
        let investmentPanelHtml = '';
        if (currentUser && currentUserData && currentUserData.role === 'inversor') {
            // Panel para inversores logueados
            investmentPanelHtml = `
                <h3>Panel de Inversión</h3>
                <div class="funding-status">
                    <div class="flex justify-between items-baseline">
                         <p class="text-lg font-bold text-green-500">${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(fundedAmount)}</p>
                         <p class="text-sm text-gray-500">de ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(goalAmount)}</p>
                    </div>
                    <div class="progress-bar-detail">
                        <div style="width: ${fundedPercentage.toFixed(2)}%;"></div>
                    </div>
                    <p class="text-right text-sm font-semibold">${fundedPercentage.toFixed(2)}% financiado</p>
                </div>
                <div class="investment-form">
                    <div class="investment-input-wrapper">
                        <span class="currency-symbol">€</span>
                        <input type="number" id="investment-amount-input" placeholder="50" min="50">
                    </div>
                    <button id="invest-button" class="w-full">Invertir Ahora</button>
                    <p id="investment-feedback" class="feedback-message"></p>
                </div>
            `;
        } else {
            // Panel deshabilitado para no logueados o no inversores
            investmentPanelHtml = `
                 <h3>Panel de Inversión</h3>
                <div class="funding-status">
                     <div class="flex justify-between items-baseline">
                         <p class="text-lg font-bold text-green-500">${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(fundedAmount)}</p>
                         <p class="text-sm text-gray-500">de ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(goalAmount)}</p>
                    </div>
                    <div class="progress-bar-detail">
                        <div style="width: ${fundedPercentage.toFixed(2)}%;"></div>
                    </div>
                    <p class="text-right text-sm font-semibold">${fundedPercentage.toFixed(2)}% financiado</p>
                </div>
                <div class="investment-form-disabled">
                    <p class="text-center text-gray-600">Debes <a href="login.html" class="text-indigo-600 hover:underline">iniciar sesión como inversor</a> para poder invertir en este proyecto.</p>
                </div>
            `;
        }

        projectDetailContent.innerHTML = `
            <div class="project-detail-layout">
                <div class="project-main-content">
                    <img src="${currentProject.imageUrl}" alt="${currentProject.name}" class="project-main-image">
                    <span class="project-category-tag">${currentProject.category}</span>
                    <h1 class="project-title-detail">${currentProject.name}</h1>
                    <p class="project-description-full">${currentProject.description}</p>
                </div>
                <aside class="investment-sidebar">
                    <div class="investment-box">
                        ${investmentPanelHtml}
                    </div>
                    <div class="creator-box">
                        <h3>Creador del Proyecto</h3>
                        <p class="creator-name">${creatorName}</p>
                    </div>
                </aside>
            </div>
        `;

        // Añadir el listener solo si el botón existe
        const investButton = document.getElementById('invest-button');
        if (investButton) {
            investButton.addEventListener('click', handleInvestment);
        }
    };

    /**
     * Maneja la lógica de inversión atómica.
     */
    const handleInvestment = async () => {
        const investButton = document.getElementById('invest-button');
        const investmentAmountInput = document.getElementById('investment-amount-input');
        
        if (!currentUser || !currentUserData || currentUserData.role !== 'inversor') {
            showFeedback('Solo los inversores pueden realizar inversiones.', 'error');
            return;
        }

        const amount = parseInt(investmentAmountInput.value, 10);

        if (isNaN(amount) || amount < 50) {
            showFeedback('La inversión mínima es de 50 €.', 'error');
            return;
        }

        investButton.disabled = true;
        investButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Procesando...';

        try {
            const newFundedAmount = (currentProject.fundedAmount || 0) + amount;
            const newInvestmentKey = firebase.database().ref().child('inversiones-inversor').push().key;

            const updates = {};
            // 1. Actualizar el monto del proyecto
            updates[`/proyectos-emprendedor/${currentProjectCreatorId}/${currentProjectId}/fundedAmount`] = newFundedAmount;
            // 2. Añadir registro de la inversión en el perfil del inversor
            updates[`/inversiones-inversor/${currentUser.uid}/${newInvestmentKey}`] = {
                projectId: currentProjectId,
                amountInvested: amount,
                investmentDate: firebase.database.ServerValue.TIMESTAMP
            };
            // 3. Añadir al inversor a la lista de inversores del proyecto
            updates[`/proyectos-emprendedor/${currentProjectCreatorId}/${currentProjectId}/investors/${currentUser.uid}`] = firebase.database.ServerValue.increment(amount);

            // Ejecutar la actualización atómica
            await firebase.database().ref().update(updates);

            showFeedback('¡Inversión realizada con éxito!', 'success');
            investmentAmountInput.value = '';
            investButton.textContent = 'Inversión Confirmada';
            investButton.style.backgroundColor = '#28a745'; // Verde éxito

        } catch (error) {
            console.error('Error al procesar la inversión:', error);
            showFeedback('Hubo un error al procesar tu inversión. Inténtalo de nuevo.', 'error');
            investButton.disabled = false;
            investButton.innerHTML = 'Invertir Ahora';
        }
    };

    /**
     * Muestra feedback en el panel de inversión.
     */
    const showFeedback = (message, type) => {
        const investmentFeedback = document.getElementById('investment-feedback');
        if (!investmentFeedback) return;
        investmentFeedback.textContent = message;
        investmentFeedback.className = `feedback-message ${type}`;
        investmentFeedback.style.display = 'block';
    };

    // --- INITIALIZATION ---
    firebase.auth().onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            firebase.database().ref(`users/${user.uid}`).once('value').then(snapshot => {
                currentUserData = snapshot.val();
                // Una vez tenemos el usuario, volvemos a renderizar por si hay que cambiar la UI
                if(currentProject) renderProjectDetails();
            });
        } else {
             if(currentProject) renderProjectDetails();
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    currentProjectId = urlParams.get('id');

    if (!currentProjectId) {
        projectDetailContent.innerHTML = '<p class="text-center text-red-500">ID de proyecto no especificado.</p>';
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    } else {
        // Escuchar cambios en el proyecto en tiempo real
        allProjectsRef.on('value', snapshot => {
            const allUserProjects = snapshot.val();
            let projectFound = false;
            if (allUserProjects) {
                for (const userId in allUserProjects) {
                    if (allUserProjects[userId][currentProjectId]) {
                        currentProjectCreatorId = userId;
                        currentProject = allUserProjects[userId][currentProjectId];
                        projectFound = true;
                        break;
                    }
                }
            }

            if (projectFound) {
                renderProjectDetails();
            } else {
                if (loadingSpinner) loadingSpinner.style.display = 'none';
                projectDetailContent.innerHTML = '<p class="text-center text-red-500">El proyecto solicitado no existe o fue eliminado.</p>';
            }
        }, error => {
            console.error("Error al leer los proyectos:", error);
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            projectDetailContent.innerHTML = '<p class="text-center text-red-500">Error al cargar el proyecto.</p>';
        });
    }
});
