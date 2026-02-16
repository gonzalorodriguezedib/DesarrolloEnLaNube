document.addEventListener('DOMContentLoaded', () => {
    let projectId = null;
    let projectCreatorId = null;
    let projectData = null;
    let currentUser = null;

    // --- DOM Elements ---
    const amountInput = document.getElementById('investment-amount');
    const payButton = document.getElementById('pay-button');
    const amountToPaySpan = document.getElementById('amount-to-pay');
    const paymentMethodOptions = document.querySelectorAll('.payment-method-option');
    const paymentForms = document.querySelectorAll('.payment-form');
    const projectTitlePlaceholder = document.getElementById('project-title-placeholder');
    const loadingOverlay = document.querySelector('.loading-overlay');

    const showLoading = (show) => {
        if (loadingOverlay) loadingOverlay.style.display = show ? 'flex' : 'none';
    };

    // --- Firebase Auth ---
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            initializePage();
        } else {
            alert('Debes iniciar sesión para poder invertir.');
            window.location.href = 'login.html';
        }
    });

    const initializePage = () => {
        const urlParams = new URLSearchParams(window.location.search);
        projectId = urlParams.get('id');

        if (!projectId) {
            alert('ID de proyecto no encontrado.');
            window.location.href = 'index.html';
            return;
        }

        const projectsRef = firebase.database().ref('proyectos-emprendedor');
        showLoading(true);
        projectsRef.once('value').then(snapshot => {
            const allProjectsByCreator = snapshot.val();
            if (allProjectsByCreator) {
                for (const creatorId in allProjectsByCreator) {
                    if (allProjectsByCreator[creatorId][projectId]) {
                        projectData = allProjectsByCreator[creatorId][projectId];
                        projectCreatorId = creatorId;
                        break;
                    }
                }
            }

            if (projectData && projectCreatorId) {
                projectTitlePlaceholder.textContent = projectData.name;
                showLoading(false);
            } else {
                alert('El proyecto en el que intentas invertir ya no existe.');
                window.location.href = 'dashboard-inversor.html';
                showLoading(false);
            }
        }).catch(error => {
            console.error("Error fetching project data:", error);
            alert("Error al cargar la información del proyecto.");
            showLoading(false);
        });
    };

    // --- UI Logic ---
    let selectedMethod = null;

    paymentMethodOptions.forEach(option => {
        option.addEventListener('click', () => {
            paymentMethodOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedMethod = option.dataset.method;
            paymentForms.forEach(form => form.style.display = 'none');
            document.getElementById(`${selectedMethod}-form`).style.display = 'block';
            validateForm();
        });
    });

    amountInput.addEventListener('input', () => {
        const amount = parseFloat(amountInput.value) || 0;
        amountToPaySpan.textContent = `€${amount.toFixed(2)}`;
        validateForm();
    });

    function validateForm() {
        const amount = parseFloat(amountInput.value) || 0;
        const isAmountValid = amount >= 50;
        const isMethodSelected = selectedMethod !== null;
        payButton.disabled = !(isAmountValid && isMethodSelected && projectData);
    }

    // --- Payment Logic ---
    payButton.addEventListener('click', () => {
        const amountToInvest = parseFloat(amountInput.value);
        if (!currentUser || !projectData || !projectCreatorId || !projectId || amountToInvest < 50) {
            alert('Error en los datos. No se puede procesar la inversión.');
            return;
        }

        if (currentUser.uid === projectCreatorId) {
            alert('No puedes invertir en tu propio proyecto.');
            return;
        }

        payButton.textContent = 'Procesando...';
        payButton.disabled = true;

        setTimeout(() => {
            const newInvestmentKey = firebase.database().ref().child(`inversiones-inversor/${currentUser.uid}`).push().key;
            const updates = {};

            updates[`inversiones-inversor/${currentUser.uid}/${newInvestmentKey}`] = {
                projectId: projectId,
                amountInvested: amountToInvest,
                investedAt: firebase.database.ServerValue.TIMESTAMP
            };

            updates[`inversiones-proyecto/${projectId}/${newInvestmentKey}`] = {
                investorId: currentUser.uid,
                amount: amountToInvest,
                date: firebase.database.ServerValue.TIMESTAMP
            };
            
            const newFundedAmount = (projectData.fundedAmount || 0) + amountToInvest;
            updates[`proyectos-emprendedor/${projectCreatorId}/${projectId}/fundedAmount`] = newFundedAmount;

            firebase.database().ref().update(updates)
                .then(() => {
                    window.location.href = `dashboard-inversor.html?investment_success=true&project=${projectData.name}`;
                })
                .catch(error => {
                    console.error("Error saving investment:", error);
                    alert("Ha ocurrido un error al registrar tu inversión. Por favor, inténtalo de nuevo.");
                    payButton.textContent = 'Pagar';
                    validateForm();
                });
        }, 1500); 
    });

    validateForm();
});