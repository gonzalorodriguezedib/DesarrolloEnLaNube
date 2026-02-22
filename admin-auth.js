
document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.database();

    // Views and Forms
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminRegisterForm = document.getElementById('admin-register-form');

    // View Toggler Links
    const showRegisterLink = document.getElementById('show-register-view');
    const showLoginLink = document.getElementById('show-login-view');

    // Error Message Paragraphs
    const loginErrorMsg = document.getElementById('error-message');
    const registerErrorMsg = document.getElementById('register-error-message');

    // --- View Toggling Logic ---
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.style.display = 'none';
        registerView.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerView.style.display = 'none';
        loginView.style.display = 'block';
    });

    // --- Admin Login Logic ---
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginErrorMsg.textContent = '';

        const email = document.getElementById('email-login').value;
        const password = document.getElementById('password-login').value;

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            const userRef = db.ref('users/' + user.uid);
            const snapshot = await userRef.once('value');

            if (snapshot.exists() && snapshot.val().role === 'admin') {
                // User is an admin, redirect to dashboard
                window.location.href = 'dashboard-admin.html';
            } else {
                // Not an admin or no data in DB
                await auth.signOut();
                loginErrorMsg.textContent = 'Acceso denegado. Solo los administradores pueden iniciar sesión aquí.';
            }
        } catch (error) {
            loginErrorMsg.textContent = 'Email o contraseña incorrectos.';
            console.error("Login Error: ", error);
        }
    });

    // --- Admin Registration Logic ---
    adminRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerErrorMsg.textContent = '';

        const nombre = document.getElementById('nombre').value.trim();
        const apellidos = document.getElementById('apellidos').value.trim();
        const email = document.getElementById('email-register').value;
        const password = document.getElementById('password-register').value;

        if (!nombre || !apellidos) {
            registerErrorMsg.textContent = 'Por favor, completa todos los campos.';
            return;
        }

        try {
            // 1. Create user in Firebase Authentication
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // 2. Save user data in Realtime Database with 'admin' role
            const newUserRef = db.ref('users/' + user.uid);
            await newUserRef.set({
                uid: user.uid,
                name: `${nombre} ${apellidos}`,
                email: email,
                role: 'admin', // Assign admin role directly
                active: true,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });

            // 3. Success: Automatically log the user in and redirect
            alert('¡Cuenta de administrador creada con éxito! Serás redirigido al panel de control.');
            window.location.href = 'dashboard-admin.html';

        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                registerErrorMsg.textContent = 'Este correo electrónico ya está en uso.';
            } else if (error.code === 'auth/weak-password') {
                registerErrorMsg.textContent = 'La contraseña debe tener al menos 6 caracteres.';
            } else {
                registerErrorMsg.textContent = 'Error al crear la cuenta: ' + error.message;
            }
            console.error("Registration Error: ", error);
        }
    });
});
