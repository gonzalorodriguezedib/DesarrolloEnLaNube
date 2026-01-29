
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
// Se cambian las importaciones de Firestore por las de Realtime Database
import { ref, set, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
// Se corrige la ruta de importación para que apunte a firebase.js
import { auth, db } from '../firebase.js';

class Usuario {
    constructor(uid, nombre, apellidos, email, rol) {
        this.uid = uid;
        this.nombre = nombre;
        this.apellidos = apellidos;
        this.email = email;
        this.rol = rol;
    }

    static async register(email, password, userData) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            // Se usa `ref` para apuntar a la ruta en Realtime Database
            const userRef = ref(db, 'usuarios/' + user.uid);
            // Se usa `set` para guardar los datos
            await set(userRef, {
                uid: user.uid,
                nombre: userData.nombre,
                apellidos: userData.apellidos,
                email: email,
                rol: userData.rol
            });
            return { success: true, user: new Usuario(user.uid, userData.nombre, userData.apellidos, email, userData.rol) };
        } catch (error) {
            console.error("Error en el registro: ", error);
            return { success: false, error: error };
        }
    }

    static async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userRef = ref(db, 'usuarios/' + user.uid);
            // Se usa `get` para obtener los datos una vez
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                // `snapshot.val()` contiene los datos del usuario
                const userData = snapshot.val();
                return { success: true, user: new Usuario(user.uid, userData.nombre, userData.apellidos, userData.email, userData.rol) };
            } else {
                return { success: false, error: { message: "No se encontraron datos de usuario en la base de datos." } };
            }
        } catch (error) {
            console.error("Error en el inicio de sesión: ", error);
            return { success: false, error: error };
        }
    }

    static async logout() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error("Error al cerrar sesión: ", error);
            return { success: false, error: error };
        }
    }
}

export default Usuario;
