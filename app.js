import { Usuario } from './models/Usuario.js';

document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registro-form');

    registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Obtener los datos del formulario
        const nombre = document.getElementById('nombre').value;
        const apellidos = document.getElementById('apellidos').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rol = document.getElementById('rol').value;

        try {
            // 2. Instanciar la clase Usuario
            const nuevoUsuario = new Usuario(email, password, nombre, apellidos, rol);

            // 3. Llamar al método de registro
            const resultado = await nuevoUsuario.registro();

            // 4. Actualizar la interfaz (en este caso, con un alert)
            if (resultado.success) {
                registroForm.reset(); // Limpiar el formulario
                // Podríamos redirigir al usuario o mostrar un mensaje de éxito más elaborado
            }

        } catch (error) {
            console.error("Error en el flujo de registro:", error);
            alert("Ocurrió un error inesperado. Por favor, inténtalo de nuevo.");
        }
    });
});
