import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { auth, db } from '../init.js';

class Usuario {
    constructor(nombre, apellidos, email, password, rol = 'cliente') {
        this.nombre = nombre;
        this.apellidos = apellidos;
        this.email = email;
        this.password = password;
        this.rol = rol; // Por defecto, el rol es 'cliente'
    }

    // Método para registrar un nuevo usuario
    async registro() {
        try {
            // 1. Crear el usuario en Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password);
            const user = userCredential.user;

            // 2. Guardar los datos adicionales en Realtime Database
            const userRef = ref(db, 'usuarios/' + user.uid);

            await set(userRef, {
                nombre: this.nombre,
                apellidos: this.apellidos,
                email: this.email,
                rol: this.rol
            });

            console.log("Usuario registrado y datos guardados en Realtime Database con ID: ", user.uid);
            return { success: true, user: user };

        } catch (error) {
            console.error("Error en el registro: ", error);
            return { success: false, error: error.message };
        }
    }

    // Método estático para iniciar sesión
    static async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log("Usuario autenticado con ID: ", user.uid);
            return { success: true, user: user };
        } catch (error) {
            console.error("Error en el inicio de sesión: ", error);
            return { success: false, error: error.message };
        }
    }
}

export default Usuario;
