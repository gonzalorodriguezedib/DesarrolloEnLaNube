
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');
    const project = projectsData.find(p => p.id === projectId);

    if (!project) {
        document.body.innerHTML = '<h1>Error: Proyecto no encontrado</h1><a href="dashboard-inversor.html">Volver al Dashboard</a>';
        return;
    }

    document.getElementById('project-title').textContent = project.title;
    document.getElementById('project-category').textContent = project.category;
    document.getElementById('project-image').src = project.image;
    document.getElementById('project-description-long').textContent = project.description_long;
    
    const fundedAmountEl = document.getElementById('funded-amount');
    const goalAmountEl = document.getElementById('goal-amount');
    const fundedPercentageEl = document.getElementById('funded-percentage');
    const progressBarEl = document.getElementById('progress-bar');

    fundedAmountEl.textContent = project.funded_amount.toLocaleString('es-ES') + ' €';
    goalAmountEl.textContent = project.goal_amount.toLocaleString('es-ES') + ' €';
    fundedPercentageEl.textContent = `${project.funded_percentage}% financiado`;
    progressBarEl.style.width = `${project.funded_percentage}%`;

    document.getElementById('investors-count').textContent = project.investors;
    document.getElementById('days-left').textContent = project.days_left;

    const investButton = document.getElementById('invest-button');
    const investmentAmountInput = document.getElementById('investment-amount');

    investButton.addEventListener('click', () => {
        const amount = parseInt(investmentAmountInput.value, 10);

        if (isNaN(amount) || amount <= 0) {
            alert('Por favor, introduce una cantidad de inversión válida.');
            return;
        }

        const confirmation = confirm(
            `Estás a punto de invertir ${amount.toLocaleString('es-ES')} € en el proyecto "${project.title}".\n\n` +
            `¿Quieres confirmar tu inversión?`
        );

        if (confirmation) {
            // --- LÓGICA DE GUARDADO CORREGIDA Y ROBUSTA ---
            let investments = [];
            try {
                const storedData = localStorage.getItem('myInvestments');
                if (storedData) {
                    const parsedData = JSON.parse(storedData);
                    if (Array.isArray(parsedData)) {
                        investments = parsedData;
                    }
                }
            } catch (error) {
                console.error('Error al leer las inversiones, se reiniciará la lista:', error);
                investments = []; // Empezar de cero si hay un error
            }

            const existingInvestmentIndex = investments.findIndex(inv => inv.projectId === projectId);

            if (existingInvestmentIndex > -1) {
                investments[existingInvestmentIndex].amount += amount;
            } else {
                investments.push({ projectId: projectId, amount: amount });
            }

            localStorage.setItem('myInvestments', JSON.stringify(investments));

            alert('¡Enhorabuena! Tu inversión ha sido registrada con éxito. La verás reflejada en la sección "Mis Inversiones" de tu dashboard.');
        }
    });
});
