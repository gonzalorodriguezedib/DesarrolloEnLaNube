
document.addEventListener('DOMContentLoaded', () => {
    // --- Logout Handler ---
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            console.log('Admin logging out...');
            window.location.href = 'admin.html';
        });
    }

    // --- Dynamic Content & Interactivity ---
    const mainContent = document.querySelector('.main-content');

    mainContent.addEventListener('click', (e) => {
        const target = e.target;

        // --- User Management Logic ---
        if (target.matches('.btn-primary') && target.textContent === 'Activar') {
            const row = target.closest('tr');
            const statusBadge = row.querySelector('.status-badge');
            
            statusBadge.classList.remove('status-inactive');
            statusBadge.classList.add('status-active');
            statusBadge.textContent = 'Activo';
            
            target.textContent = 'Desactivar';
            target.classList.remove('btn-primary');
            target.classList.add('btn-secondary');
            console.log('User activated');
        } else if (target.matches('.btn-secondary') && target.textContent === 'Desactivar') {
            const row = target.closest('tr');
            const statusBadge = row.querySelector('.status-badge');
            
            statusBadge.classList.remove('status-active');
            statusBadge.classList.add('status-inactive');
            statusBadge.textContent = 'Inactivo';
            
            target.textContent = 'Activar';
            target.classList.remove('btn-secondary');
            target.classList.add('btn-primary');
            console.log('User deactivated');
        }

        // --- Payment Management Logic ---
        if (target.matches('.btn-success') && target.textContent === 'Aprobar') {
            const row = target.closest('tr');
            const statusBadge = row.querySelector('.status-badge');
            const actionsCell = target.parentElement;

            statusBadge.classList.remove('status-pendiente');
            statusBadge.classList.add('status-pagado');
            statusBadge.textContent = 'Pagado';
            
            actionsCell.innerHTML = '-'; // Remove buttons after action
            console.log('Payment approved');
        } else if (target.matches('.btn-danger') && target.textContent === 'Rechazar') {
            const row = target.closest('tr');
            const statusBadge = row.querySelector('.status-badge');
            const actionsCell = target.parentElement;
            
            statusBadge.classList.remove('status-pendiente');
            statusBadge.classList.add('status-rechazado');
            statusBadge.textContent = 'Rechazado';
            
            actionsCell.innerHTML = '-'; // Remove buttons after action
            console.log('Payment rejected');
        }
    });

    console.log('Admin dashboard script loaded with interactivity.');
});
