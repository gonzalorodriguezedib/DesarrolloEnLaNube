
// Este archivo ha sido refactorizado para usar la API de Firebase v8 (namespaced), 
// eliminando la mezcla de versiones y asegurando la compatibilidad con los scripts de los dashboards.

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
            // Se utiliza la sintaxis de Firebase v8
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Se apunta a la referencia de la base de datos con la sintaxis v8
            const userRef = firebase.database().ref('users/' + user.uid);

            // Se guardan los datos del usuario en la ruta correcta, asegurando la consistencia
            await userRef.set({
                uid: user.uid,
                name: `${userData.nombre} ${userData.apellidos}`.trim(),
                email: email,
                role: userData.rol
            });

            return { success: true, user: new Usuario(user.uid, userData.nombre, userData.apellidos, email, userData.rol) };
        } catch (error) {
            console.error("Error en el registro (v8): ", error);
            return { success: false, error: error };
        }
    }

    static async login(email, password) {
        try {
            // Se utiliza la sintaxis de Firebase v8
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            const userRef = firebase.database().ref('users/' + user.uid);
            const snapshot = await userRef.once('value');

            if (snapshot.exists()) {
                const userData = snapshot.val();
                const [nombre, ...apellidos] = (userData.name || '').split(' ');
                return { success: true, user: new Usuario(user.uid, nombre, apellidos.join(' '), userData.email, userData.role) };
            } else {
                // Si no hay datos en la BD, se firma la salida para evitar bucles
                await firebase.auth().signOut();
                return { success: false, error: { message: "No se encontraron datos de usuario en la base de datos." } };
            }
        } catch (error) {
            console.error("Error en el inicio de sesión (v8): ", error);
            return { success: false, error: error };
        }
    }

    static async logout() {
        try {
            // Se utiliza la sintaxis de Firebase v8
            await firebase.auth().signOut();
            return { success: true };
        } catch (error) {
            console.error("Error al cerrar sesión (v8): ", error);
            return { success: false, error: error };
        }
    }
}

// Como este script no es un módulo ES6, se adjunta la clase al objeto window si es necesario,
// aunque la importación en registro.js debería manejarlo si se configura correctamente.
// Por ahora, se asume que el entorno de scripts lo gestiona.

export default Usuario;
