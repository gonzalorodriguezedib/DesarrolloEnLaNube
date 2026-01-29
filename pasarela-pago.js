
document.addEventListener('DOMContentLoaded', () => {
    // --- Datos de Ejemplo (en una app real vendrían de una API) ---
    const projectsData = {
        'proj-agrotech': { title: 'AgroTech Sostenible' },
        'proj-educafuturo': { title: 'EducaFuturo' },
        'proj-connectlocal': { title: 'Connect-Local' }
    };

    // --- Obtener datos del proyecto de la URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    const project = projectsData[projectId] || { title: 'un proyecto increíble' };

    document.getElementById('project-title-placeholder').textContent = project.title;

    // --- Elementos del DOM ---
    const amountInput = document.getElementById('investment-amount');
    const payButton = document.getElementById('pay-button');
    const amountToPaySpan = document.getElementById('amount-to-pay');
    const paymentMethodOptions = document.querySelectorAll('.payment-method-option');
    const paymentForms = document.querySelectorAll('.payment-form');

    let selectedMethod = null;

    // --- Lógica de Selección de Método de Pago ---
    paymentMethodOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Deseleccionar otros
            paymentMethodOptions.forEach(opt => opt.classList.remove('selected'));
            // Seleccionar el actual
            option.classList.add('selected');
            selectedMethod = option.dataset.method;

            // Mostrar el formulario correcto
            paymentForms.forEach(form => form.style.display = 'none');
            document.getElementById(`${selectedMethod}-form`).style.display = 'block';
            
            validateForm();
        });
    });

    // --- Lógica de Actualización de Cantidad ---
    amountInput.addEventListener('input', () => {
        const amount = parseFloat(amountInput.value) || 0;
        amountToPaySpan.textContent = `$${amount.toFixed(2)}`;
        validateForm();
    });

    // --- Validación para Activar el Botón de Pago ---
    function validateForm() {
        const amount = parseFloat(amountInput.value) || 0;
        const isAmountValid = amount >= 50;
        const isMethodSelected = selectedMethod !== null;

        payButton.disabled = !(isAmountValid && isMethodSelected);
    }

    // --- Lógica del Botón de Pagar ---
    payButton.addEventListener('click', () => {
        payButton.textContent = 'Procesando...';
        payButton.disabled = true;

        // Simular llamada a una API de pago
        setTimeout(() => {
            // Guardar la inversión en localStorage
            const investments = JSON.parse(localStorage.getItem('investments')) || [];
            if (!investments.includes(projectId)) {
                investments.push(projectId);
                localStorage.setItem('investments', JSON.stringify(investments));
            }

            // Redirigir al dashboard con un mensaje de éxito
            window.location.href = `dashboard-inversor.html?investment_success=true`;

        }, 2000); // Simular 2 segundos de procesamiento
    });

    // Estado inicial
    validateForm();
});
