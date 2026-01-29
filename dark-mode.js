
document.addEventListener('DOMContentLoaded', () => {
    // Busca el checkbox específico del dashboard actual
    const checkbox = document.getElementById('dark-mode-checkbox-inversor') || document.getElementById('dark-mode-checkbox-emprendedor');
    const userTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Función para aplicar el tema
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            if(checkbox) checkbox.checked = true;
        } else {
            document.body.removeAttribute('data-theme');
            if(checkbox) checkbox.checked = false;
        }
    };

    // Aplica el tema inicial al cargar la página
    if (userTheme === 'dark' || (!userTheme && systemTheme)) {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }

    // Añade el listener solo si se encontró el checkbox
    if (checkbox) {
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                applyTheme('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                applyTheme('light');
                localStorage.setItem('theme', 'light');
            }
        });
    }
});
