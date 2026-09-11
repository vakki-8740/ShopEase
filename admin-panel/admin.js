// Admin panel JavaScript

// Check admin access
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = '../user-panel/';
        return;
    }

    // Check if admin
    const userDoc = await db.collection('users').doc(user.uid).get();
    const isAdmin = (userDoc.exists && userDoc.data().role === 'admin') || user.email === ADMIN_EMAIL;

    if (!isAdmin) {
        document.getElementById('accessDenied').style.display = 'block';
        document.getElementById('adminContent').style.display = 'none';
        return;
    }

    document.getElementById('accessDenied').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    document.getElementById('adminName').textContent = user.displayName || user.email;

    loadDashboard();
});

function showSection(section) {
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.admin-menu li').forEach(li => li.classList.remove('active'));

    document.getElementById('section-' + section).style.display = 'block';
    event.target.closest('li').classList.add('active');

    if (section === 'dashboard') loadDashboard();
    if (section === 'products') loadAdminProducts();
    if (section === 'orders') loadAdminOrders();
}

async function loadDashboard() {
    try {
        // Products count
        const prodSnap = await db.collection('products').get();
        document.getElementById('totalProducts').textContent = prodSnap.size;

        // Orders
        const orderSnap = await db.collection('orders').orderBy('createdAt', 'desc').get();
        document.getElementById('totalOrders').textContent = orderSnap.size;

        let revenue = 0;
        let recentHtml = '';
        let count = 0;

        orderSnap.forEach(doc => {
            const order = doc.data();
            revenue += order.total || 0;

            // Show only 5 recent
            if (count < 5) {
                const date = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
                recentHtml += `
                    <div class="admin-order-card">
                        <div class="order-header">
                            <h4>#${doc.id.slice(-6).toUpperCase()}</h4>
                            <span class="order-status ${order.status}">${(order.status || 'pending').toUpperCase()}</span>
                        </div>
                        <p class="order-customer">${order.userName || 'N/A'} - ${order.userEmail}</p>
                        <p class="order-items-list">${order.items.map(i => i.name + ' x' + i.qty).join(', ')}</p>
                        <p class="order-total">₹${(order.total || 0).toLocaleString()} | ${date}</p>
                    </div>
                `;
                count++;
            }
        });

        document.getElementById('totalRevenue').textContent = '₹' + revenue.toLocaleString();
        document.getElementById('recentOrdersList').innerHTML = recentHtml || '<p style="color:#636e72;">No orders yet.</p>';

        // Users count
        const usersSnap = await db.collection('users').get();
        document.getElementById('totalUsers').textContent = usersSnap.size;

    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

async function loadAdminProducts() {
    const list = document.getElementById('adminProductsList');
    list.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Loading...</p>';

    try {
        const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            list.innerHTML = '<p style="color:#636e72;">No products.</p>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const p = doc.data();
            html += `
                <div class="admin-product-card">
                    <div class="prod-icon">${p.icon || '📦'}</div>
                    <div class="prod-info">
                        <h4>${p.name}</h4>
                        <p>${p.category} | Stock: ${p.stock || 0}</p>
                    </div>
                    <span class="prod-price">₹${p.price}</span>
                    <button class="btn-delete" onclick="deleteProduct('${doc.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });

        list.innerHTML = html;
    } catch (error) {
        list.innerHTML = '<p style="color:red;">Error loading products.</p>';
    }
}

async function loadAdminOrders() {
    const list = document.getElementById('adminOrdersList');
    list.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Loading...</p>';

    try {
        const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            list.innerHTML = '<p style="color:#636e72;">No orders yet.</p>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const order = doc.data();
            const date = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';

            html += `
                <div class="admin-order-card">
                    <div class="order-header">
                        <h4>Order #${doc.id.slice(-6).toUpperCase()}</h4>
                        <select onchange="updateOrderStatus('${doc.id}', this.value)">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        </select>
                    </div>
                    <p class="order-customer">
                        <i class="fas fa-user"></i> ${order.userName || 'N/A'} |
                        <i class="fas fa-envelope"></i> ${order.userEmail} |
                        <i class="fas fa-calendar"></i> ${date}
                    </p>
                    <p class="order-items-list">
                        <i class="fas fa-box"></i> ${order.items.map(i => `${i.name} x${i.qty} (₹${i.price * i.qty})`).join(', ')}
                    </p>
                    <p class="order-total">Total: ₹${(order.total || 0).toLocaleString()}</p>
                </div>
            `;
        });

        list.innerHTML = html;
    } catch (error) {
        list.innerHTML = '<p style="color:red;">Error loading orders.</p>';
    }
}

async function addProduct(e) {
    e.preventDefault();
    const btn = document.getElementById('addProdBtn');
    btn.textContent = 'Adding...';
    btn.disabled = true;

    try {
        await db.collection('products').add({
            name: document.getElementById('prodName').value,
            category: document.getElementById('prodCategory').value,
            price: parseInt(document.getElementById('prodPrice').value),
            oldPrice: parseInt(document.getElementById('prodOldPrice').value) || null,
            icon: document.getElementById('prodIcon').value || '📦',
            stock: parseInt(document.getElementById('prodStock').value),
            desc: document.getElementById('prodDesc').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Reset form
        e.target.reset();
        showToast('Product added successfully!', 'success');
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }

    btn.innerHTML = '<i class="fas fa-plus"></i> Add Product';
    btn.disabled = false;
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        await db.collection('products').doc(productId).delete();
        showToast('Product deleted!', 'success');
        loadAdminProducts();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        await db.collection('orders').doc(orderId).update({ status: status });
        showToast('Order status updated!', 'success');
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

async function adminLogout() {
    await auth.signOut();
    window.location.href = '../user-panel/';
}

function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}
