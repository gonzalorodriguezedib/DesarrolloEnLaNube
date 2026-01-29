
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = loginForm.email.value;
            const password = loginForm.password.value;

            if (errorMessage) errorMessage.style.display = 'none';

            firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
              .then(() => {
                return firebase.auth().signInWithEmailAndPassword(email, password);
              })
              .then((userCredential) => {
                    const user = userCredential.user;
                    const userRef = firebase.database().ref('users/' + user.uid);
                    return userRef.once('value');
              })
              .then((snapshot) => {
                    const userData = snapshot.val();
                    if (userData && userData.role) {
                        if (userData.role === 'inversor') {
                            window.location.href = 'dashboard-inversor.html';
                        } else if (userData.role === 'emprendedor') {
                            window.location.href = 'dashboard-emprendedor.html';
                        } else {
                            throw new Error('Rol de usuario no reconocido: ' + userData.role);
                        }
                    } else {
                        throw new Error('No se pudo encontrar el rol para el usuario.');
                    }
              })
              .catch((error) => {
                    console.error('Error en el proceso de inicio de sesión:', error);
                    if (errorMessage) {
                        switch (error.code) {
                            case 'auth/user-not-found':
                            case 'auth/wrong-password':
                            case 'auth/invalid-credential':
                                errorMessage.textContent = 'Correo electrónico o contraseña incorrectos.';
                                break;
                            default:
                                errorMessage.textContent = error.message || 'Ha ocurrido un error. Inténtalo de nuevo.';
                                break;
                        }
                        errorMessage.style.display = 'block';
                    }
              });
        });
    }
});
