
document.addEventListener('DOMContentLoaded', () => {
    // --- Base de Datos de Ejemplo ---
    const projectsData = {
        'proj-agrotech': { title: 'AgroTech Sostenible', image: '...', recaudado: 50000, meta: 100000, plazo: '30 días restantes' },
        'proj-educafuturo': { title: 'EducaFuturo', image: '...', recaudado: 75000, meta: 120000, plazo: '15 días restantes' },
        'proj-connectlocal': { title: 'Connect-Local', image: '...', recaudado: 25000, meta: 80000, plazo: '60 días restantes' }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    const projectData = projectsData[projectId];

    if (projectData) {
        document.querySelector('.project-title').textContent = projectData.title;
        document.querySelector('.project-image').src = projectData.image;
        document.getElementById('recaudado').textContent = `$${projectData.recaudado.toLocaleString()}`;
        document.getElementById('meta').textContent = `$${projectData.meta.toLocaleString()}`;
        document.getElementById('plazo').textContent = projectData.plazo;
        document.getElementById('progreso-barra').style.width = `${(projectData.recaudado / projectData.meta) * 100}%`;
    } else {
        document.querySelector('.project-detail-container').innerHTML = '<h1>Proyecto no encontrado</h1>';
    }

    const investButton = document.querySelector('.invest-button');
    const investments = JSON.parse(localStorage.getItem('investments')) || [];

    if (investments.includes(projectId)) {
        investButton.textContent = 'Inversión Ya Realizada';
        investButton.disabled = true;
    } else {
        investButton.addEventListener('click', () => {
            // Redirigir a la pasarela de pago con el ID del proyecto
            window.location.href = `pasarela-pago.html?id=${projectId}`;
        });
    }
});
