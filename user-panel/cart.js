let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Make functions globally accessible
window.addToCart = addToCart;
window.buyNow = buyNow;
window.removeFromCart = removeFromCart;
window.updateQty = updateQty;
window.toggleCart = toggleCart;
window.toggleMobileMenu = toggleMobileMenu;
window.checkout = checkout;
window.showMyOrders = showMyOrders;
window.closeOrdersModal = closeOrdersModal;

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    // Save to Firestore if logged in
    if (currentUser) {
        db.collection('carts').doc(currentUser.uid).set({ items: cart });
    }
}

async function loadCartFromFirestore() {
    if (!currentUser) return;
    try {
        const doc = await db.collection('carts').doc(currentUser.uid).get();
        if (doc.exists && doc.data().items) {
            cart = doc.data().items;
            saveCart();
            renderCart();
        }
    } catch (e) {
        console.log('Cart load error:', e);
    }
}

function addToCart(productId, product) {
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            icon: product.icon,
            qty: 1
        });
    }
    saveCart();
    renderCart();
    showToast(`${product.name} added to cart!`, 'success');
}

function buyNow(productId, product) {
    // Add to cart
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            icon: product.icon,
            qty: 1
        });
    }
    saveCart();
    renderCart();
    // Go directly to checkout
    goToCheckout();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCart();
}

function updateQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            removeFromCart(productId);
            return;
        }
    }
    saveCart();
    renderCart();
}

function renderCart() {
    const cartItemsEl = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');

    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartFooter.style.display = 'none';
        return;
    }

    let html = '';
    let total = 0;

    cart.forEach(item => {
        const subtotal = item.price * item.qty;
        total += subtotal;
        html += `
            <div class="cart-item">
                <div class="cart-item-image">${item.icon || '📦'}</div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <span class="cart-item-price">₹${item.price}</span>
                    <div class="cart-item-qty">
                        <button onclick="updateQty('${item.id}', -1)">-</button>
                        <span>${item.qty}</span>
                        <button onclick="updateQty('${item.id}', 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });

    cartItemsEl.innerHTML = html;
    cartTotal.textContent = '₹' + total.toLocaleString();
    cartFooter.style.display = 'block';
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cartCount').textContent = count;
}

function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
}

function toggleMobileMenu() {
    document.querySelector('.nav-links').classList.toggle('show');
}

async function checkout() {
    if (cart.length === 0) return;
    goToCheckout();
}

function goToCheckout() {
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Save order data to localStorage for checkout page
    const orderData = {
        items: [...cart],
        total: total,
        userId: currentUser ? currentUser.uid : 'guest',
        userName: currentUser ? (currentUser.displayName || currentUser.email) : 'Guest User',
        userEmail: currentUser ? currentUser.email : ''
    };

    localStorage.setItem('pendingOrder', JSON.stringify(orderData));
    window.location.href = 'checkout.html';
}

async function showMyOrders() {
    if (!currentUser) return;

    const modal = document.getElementById('ordersModal');
    const list = document.getElementById('myOrdersList');

    modal.classList.add('show');
    list.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Loading orders...</p>';

    try {
        const snapshot = await db.collection('orders')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            list.innerHTML = '<p style="text-align:center;color:#636e72;padding:20px;">No orders yet.</p>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const order = doc.data();
            const date = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
            const statusClass = order.status || 'pending';

            html += `
                <div class="order-card">
                    <h4>Order #${doc.id.slice(-6).toUpperCase()}</h4>
                    <span class="order-status ${statusClass}">${statusClass.toUpperCase()}</span>
                    <p style="font-size:0.8rem;color:#636e72;margin:4px 0;">${date}</p>
                    <div class="order-items">
                        ${order.items.map(i => `${i.name} x${i.qty}`).join(', ')}
                    </div>
                    <div class="order-total">Total: ₹${order.total.toLocaleString()}</div>
                </div>
            `;
        });

        list.innerHTML = html;
    } catch (error) {
        list.innerHTML = '<p style="color:red;">Error loading orders.</p>';
    }
}

function closeOrdersModal() {
    document.getElementById('ordersModal').classList.remove('show');
}

document.getElementById('ordersModal').addEventListener('click', function(e) {
    if (e.target === this) closeOrdersModal();
});

// Init cart count
updateCartCount();
