let currentUser = null;
let isAdmin = false;

// Listen for auth state changes
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    if (user) {
        document.getElementById('authLink').innerHTML = '<i class="fas fa-user"></i> ' + (user.displayName || user.email.split('@')[0]);
        document.getElementById('authLink').onclick = null;
        document.getElementById('logoutBtn').style.display = 'inline';
        document.getElementById('ordersLink').style.display = 'inline';

        // Check if admin
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().role === 'admin') {
            isAdmin = true;
            document.getElementById('adminLink').style.display = 'inline';
        } else {
            // Also check by email
            if (user.email === ADMIN_EMAIL) {
                isAdmin = true;
                document.getElementById('adminLink').style.display = 'inline';
            }
        }

        // Load cart from Firestore
        loadCartFromFirestore();
    } else {
        isAdmin = false;
        document.getElementById('authLink').innerHTML = '<i class="fas fa-user"></i> Login';
        document.getElementById('authLink').onclick = openAuthModal;
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('adminLink').style.display = 'none';
        document.getElementById('ordersLink').style.display = 'none';
    }
});

function openAuthModal() {
    document.getElementById('authModal').classList.add('show');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('show');
}

function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    if (tab === 'login') {
        document.querySelector('.auth-tab:first-child').classList.add('active');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    } else {
        document.querySelector('.auth-tab:last-child').classList.add('active');
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    }
}

async function loginUser(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');

    btn.textContent = 'Logging in...';
    btn.disabled = true;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        closeAuthModal();
        showToast('Login successful!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }

    btn.textContent = 'Login';
    btn.disabled = false;
}

async function registerUser(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const phone = document.getElementById('regPhone').value;
    const btn = document.getElementById('registerBtn');

    btn.textContent = 'Registering...';
    btn.disabled = true;

    try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: name });

        // Save user data in Firestore
        await db.collection('users').doc(cred.user.uid).set({
            name: name,
            email: email,
            phone: phone,
            role: 'user',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        closeAuthModal();
        showToast('Registration successful!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }

    btn.textContent = 'Register';
    btn.disabled = false;
}

async function logoutUser() {
    try {
        await auth.signOut();
        cart = [];
        saveCart();
        renderCart();
        showToast('Logged out!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Close modal on outside click
document.getElementById('authModal').addEventListener('click', function(e) {
    if (e.target === this) closeAuthModal();
});
