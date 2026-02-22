document.addEventListener('DOMContentLoaded', function () {
    const auth = firebase.auth();
    const db = firebase.database();

    const usersLink = document.getElementById('users-link');
    const projectsLink = document.getElementById('projects-link');
    const paymentsLink = document.getElementById('payments-link');
    const adminContent = document.getElementById('admin-content');
    const logoutButton = document.getElementById('logout-button');

    // --- Listener de Cerrar Sesión ---
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'admin.html';
            }).catch(error => {
                console.error('Error al cerrar sesión:', error);
                alert('Hubo un error al cerrar la sesión.');
            });
        });
    }

    // --- Autenticación y Verificación de Rol ---
    auth.onAuthStateChanged(user => {
        if (user) {
            db.ref('users/' + user.uid).once('value').then(snapshot => {
                const userData = snapshot.val();
                if (userData && userData.role === 'admin') {
                    setupAdminNavListeners();
                    showProjects(); // Cargar la vista de proyectos por defecto
                } else {
                    auth.signOut();
                    window.location.href = 'admin.html';
                }
            }).catch(error => {
                console.error("Error al verificar el rol del usuario:", error);
                auth.signOut();
                window.location.href = 'admin.html';
            });
        } else {
            window.location.href = 'admin.html';
        }
    });

    // --- Listeners de Navegación ---
    function setupAdminNavListeners() {
        usersLink.addEventListener('click', (e) => { e.preventDefault(); showUsers(); });
        projectsLink.addEventListener('click', (e) => { e.preventDefault(); showProjects(); });
        paymentsLink.addEventListener('click', (e) => { e.preventDefault(); showPayments(); });
        adminContent.addEventListener('click', handleAdminContentClick);
    }

    // --- Gestión de Usuarios ---
    async function showUsers() {
        try {
            adminContent.innerHTML = '<h1>Cargando usuarios...</h1>';
            const snapshot = await db.ref('users').once('value');
            const usersData = snapshot.val();
            const users = usersData ? Object.keys(usersData).map(key => ({ id: key, ...usersData[key] })) : [];

            const tableRows = users.map(user => `
                <tr data-id="${user.id}">
                    <td>${user.name || 'No especificado'}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>${user.active === false ? 'Inactivo' : 'Activo'}</td>
                    <td class="actions">
                        <button class="btn-toggle-status">${user.active === false ? 'Activar' : 'Desactivar'}</button>
                        <button class="btn-change-role">Cambiar Rol</button>
                        <button class="btn-delete-user">Eliminar</button>
                    </td>
                </tr>
            `).join('');

            adminContent.innerHTML = `
                <h1>Gestión de Usuarios</h1>
                <table>
                    <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
            `;
        } catch (error) {
            console.error('Error al mostrar usuarios:', error);
            adminContent.innerHTML = '<h1>Error al cargar los usuarios.</h1><p>Consulta la consola para más detalles.</p>';
        }
    }

    // --- Gestión de Proyectos (CORREGIDO) ---
    async function showProjects() {
        try {
            adminContent.innerHTML = '<h1>Cargando proyectos...</h1>';
            
            const [projectsSnapshot, usersSnapshot] = await Promise.all([
                db.ref('proyectos-emprendedor').once('value'),
                db.ref('users').once('value')
            ]);

            const projectsData = projectsSnapshot.val();
            const usersData = usersSnapshot.val() || {};

            const allProjects = [];
            if (projectsData) {
                for (const userId in projectsData) {
                    const userProjects = projectsData[userId];
                    for (const projectId in userProjects) {
                        allProjects.push({
                            id: projectId,
                            creatorId: userId,
                            ...userProjects[projectId]
                        });
                    }
                }
            }
            
            const tableRows = allProjects.map(p => {
                const creatorName = usersData[p.creatorId] ? usersData[p.creatorId].name : 'Usuario Desconocido';
                return `
                <tr data-project-id="${p.id}" data-creator-id="${p.creatorId}">
                    <td>${p.name || 'Sin nombre'}</td>
                    <td>${creatorName}</td>
                    <td>${p.estado || 'Pendiente'}</td>
                    <td class="actions">
                        ${!p.estado ? `<button class="btn-approve-project">Aprobar</button> <button class="btn-reject-project">Rechazar</button>` : ''}
                        ${(p.estado === 'aprobado' || p.estado === 'rechazado') ? `<button class="btn-delete-project">Eliminar</button>` : ''}
                    </td>
                </tr>
            `}).join('');

            adminContent.innerHTML = `
                <h1>Gestión de Proyectos</h1>
                <table>
                    <thead><tr><th>Nombre del Proyecto</th><th>Emprendedor</th><th>Estado</th><th>Acciones</th></tr></thead>
                    <tbody>${tableRows.length > 0 ? tableRows : '<tr><td colspan="4">No hay proyectos para mostrar.</td></tr>'}</tbody>
                </table>
            `;
        } catch (error) {
            console.error('Error al mostrar proyectos:', error);
            adminContent.innerHTML = '<h1>Error al cargar los proyectos.</h1><p>Consulta la consola para más detalles.</p>';
        }
    }
    
    // --- Gestión de Pagos ---
    async function showPayments() {
        try {
            adminContent.innerHTML = '<h1>Cargando pagos...</h1>';

            const [investmentsSnapshot, usersSnapshot, allProjectsSnapshot] = await Promise.all([
                db.ref('inversiones-inversor').once('value'),
                db.ref('users').once('value'),
                db.ref('proyectos-emprendedor').once('value')
            ]);

            const investmentsData = investmentsSnapshot.val() || {};
            const usersData = usersSnapshot.val() || {};
            const allProjectsData = allProjectsSnapshot.val() || {};

            const projectNames = {};
            for (const creatorId in allProjectsData) {
                for (const projectId in allProjectsData[creatorId]) {
                    projectNames[projectId] = allProjectsData[creatorId][projectId].name;
                }
            }

            const allInvestments = [];
            for (const investorId in investmentsData) {
                const userInvestments = investmentsData[investorId];
                for (const investmentId in userInvestments) {
                    const investment = userInvestments[investmentId];
                    allInvestments.push({
                        id: investmentId,
                        investorId: investorId,
                        ...investment
                    });
                }
            }

            const tableRows = allInvestments.map(inv => {
                const investorName = usersData[inv.investorId] ? usersData[inv.investorId].name : 'Usuario Desconocido';
                const projectName = projectNames[inv.projectId] || 'Proyecto Desconocido';
                const investmentDate = inv.investedAt ? new Date(inv.investedAt).toLocaleString('es-ES') : 'Fecha no disponible';

                return `
                    <tr>
                        <td>${investorName}</td>
                        <td>${projectName}</td>
                        <td>€${(inv.amountInvested || 0).toFixed(2)}</td>
                        <td>${investmentDate}</td>
                    </tr>
                `;
            }).join('');

            adminContent.innerHTML = `
                <h1>Gestión de Pagos</h1>
                <table>
                    <thead><tr><th>Inversor</th><th>Proyecto</th><th>Cantidad</th><th>Fecha</th></tr></thead>
                    <tbody>${tableRows.length > 0 ? tableRows : '<tr><td colspan="4">No hay pagos para mostrar.</td></tr>'}</tbody>
                </table>
            `;

        } catch (error) {
            console.error('Error al mostrar los pagos:', error);
            adminContent.innerHTML = '<h1>Error al cargar los pagos.</h1><p>Consulta la consola para más detalles.</p>';
        }
    }

    // --- Delegación de Eventos para Acciones ---
    async function handleAdminContentClick(e) {
        const target = e.target;
        const tr = target.closest('tr');
        if (!tr) return;

        const userId = tr.dataset.id;
        const projectId = tr.dataset.projectId;
        const creatorId = tr.dataset.creatorId;

        // Acciones de Usuario
        if (userId) {
            if (target.classList.contains('btn-toggle-status')) {
                const userRef = db.ref('users/' + userId);
                const snapshot = await userRef.once('value');
                const currentStatus = snapshot.val().active;
                await userRef.update({ active: currentStatus === false ? true : false });
                showUsers();
            } else if (target.classList.contains('btn-change-role')) {
                const userRef = db.ref('users/' + userId);
                const snapshot = await userRef.once('value');
                const currentRole = snapshot.val().role;
                const newRole = prompt(`Rol actual: ${currentRole}. Ingresa el nuevo rol (admin, inversor, emprendedor):`);
                if (newRole && ['admin', 'inversor', 'emprendedor'].includes(newRole)) {
                    await userRef.update({ role: newRole });
                    showUsers();
                }
            } else if (target.classList.contains('btn-delete-user')) {
                if (confirm('¿Seguro que quieres eliminar este usuario? Por seguridad, solo se marcará como inactivo.')) {
                    await db.ref('users/' + userId).update({ active: false });
                    showUsers();
                }
            }
        }

        // Acciones de Proyecto
        if (projectId && creatorId) {
            const projectRef = db.ref(`proyectos-emprendedor/${creatorId}/${projectId}`);
            if (target.classList.contains('btn-approve-project')) {
                await projectRef.update({ estado: 'aprobado' });
                showProjects();
            } else if (target.classList.contains('btn-reject-project')) {
                await projectRef.update({ estado: 'rechazado' });
                showProjects();
            } else if (target.classList.contains('btn-delete-project')) {
                if (confirm('¿Seguro que quieres eliminar este proyecto? Esta acción es irreversible y eliminará todas las inversiones asociadas.')) {
                    try {
                        const investmentsForProjectRef = db.ref(`inversiones-proyecto/${projectId}`);
                        const snapshot = await investmentsForProjectRef.once('value');
                        const investments = snapshot.val();
                        const updates = {};

                        if (investments) {
                            for (const investmentId in investments) {
                                const investorId = investments[investmentId].investorId;
                                if (investorId) {
                                    updates[`inversiones-inversor/${investorId}/${investmentId}`] = null;
                                }
                            }
                        }

                        updates[`inversiones-proyecto/${projectId}`] = null;
                        updates[`proyectos-emprendedor/${creatorId}/${projectId}`] = null;

                        await db.ref().update(updates);
                        showProjects();

                    } catch (error) {
                        console.error("Error en la eliminación en cascada del proyecto:", error);
                        alert("No se pudo eliminar el proyecto y todas sus dependencias. Revisa la consola.");
                    }
                }
            }
        }
    }
});