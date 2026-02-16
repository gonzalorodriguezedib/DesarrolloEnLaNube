
// Este archivo ahora cargará dinámicamente los proyectos desde Firebase
// en lugar de usar datos estáticos.

document.addEventListener('DOMContentLoaded', () => {
    const projectsContainer = document.getElementById('projects-container');
    const loadingSpinner = document.getElementById('loading-spinner');

    if (!projectsContainer) {
        console.error("El contenedor de proyectos no se encontró en el DOM.");
        return;
    }

    const renderProjects = (projects) => {
        projectsContainer.innerHTML = ''; // Limpiar el contenedor antes de renderizar

        if (!projects || Object.keys(projects).length === 0) {
            projectsContainer.innerHTML = '<p class="text-center text-gray-500">No hay proyectos disponibles en este momento.</p>';
            return;
        }

        // Firebase devuelve los proyectos como un objeto. Si es necesario, se puede convertir a array:
        // const projectsArray = Object.values(projects);

        for (const projectId in projects) {
            const project = projects[projectId];

            // Asegurarse de que los datos necesarios existen
            if (!project.name || !project.description || !project.category || !project.imageUrl || !project.goalAmount) {
                console.warn('Proyecto omitido por falta de datos esenciales:', project);
                continue;
            }
            
            const fundedAmount = project.fundedAmount || 0;
            const fundingPercentage = ((fundedAmount / project.goalAmount) * 100).toFixed(2);

            const vipBadge = project.isVip ? `
                <div class="absolute top-3 right-3 bg-yellow-400 text-gray-900 font-bold text-xs px-2 py-1 rounded-full shadow-lg transform rotate-6">
                    <i class="fas fa-star text-sm"></i> VIP
                </div>
            ` : '';

            const projectCard = `
                <div class="project-card-link group" data-project-id="${projectId}">
                    <div class="project-card-public bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 ease-in-out relative">
                        <img src="${project.imageUrl}" alt="Imagen de ${project.name}" class="w-full h-48 object-cover">
                        ${vipBadge}
                        <div class="p-6">
                            <span class="text-sm font-semibold text-indigo-600">${project.category}</span>
                            <h3 class="text-2xl font-bold text-gray-800 mt-2 truncate">${project.name}</h3>
                            <p class="text-gray-600 mt-2 h-12 overflow-hidden text-ellipsis">${project.description}</p>
                            
                            <div class="mt-4">
                                <div class="w-full bg-gray-200 rounded-full h-2.5">
                                    <div class="bg-green-500 h-2.5 rounded-full" style="width: ${fundingPercentage}%;"></div>
                                </div>
                                <div class="flex justify-between items-center mt-2 text-sm text-gray-600">
                                    <span>${fundingPercentage}%</span>
                                    <span>
                                        <strong>${fundedAmount.toLocaleString('es-ES')} €</strong> de ${project.goalAmount.toLocaleString('es-ES')} €
                                    </span>
                                </div>
                            </div>

                            <div class="mt-6 text-center">
                                <a href="project-detail.html?id=${projectId}" class="w-full inline-block bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors duration-300">
                                    Ver Detalles
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            projectsContainer.innerHTML += projectCard;
        }
    };

    // Mostrar el spinner mientras se cargan los datos
    if (loadingSpinner) loadingSpinner.style.display = 'flex';

    // Referencia a la base de datos que contiene todos los proyectos de todos los emprendedores
    const allProjectsRef = firebase.database().ref('proyectos-emprendedor');

    allProjectsRef.on('value', 
        (snapshot) => {
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            
            const allProjects = {};
            snapshot.forEach(userProjectsSnapshot => {
                const userProjects = userProjectsSnapshot.val();
                for (const projectId in userProjects) {
                    allProjects[projectId] = userProjects[projectId];
                }
            });

            renderProjects(allProjects);
        },
        (error) => {
            console.error("Error al cargar los proyectos desde Firebase:", error);
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            if (projectsContainer) projectsContainer.innerHTML = '<p class="text-center text-red-500">No se pudieron cargar los proyectos. Inténtalo de nuevo más tarde.</p>';
        }
    );
});
