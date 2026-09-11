// Buy Now - goes directly to checkout

let currentUser = null;

// Get current user from auth.js
function setCurrentUser(user) {
    currentUser = user;
}

// Called from button click - reads data attributes
function buyFromBtn(btn) {
    const id = btn.getAttribute('data-id');
    const name = btn.getAttribute('data-name');
    const price = parseInt(btn.getAttribute('data-price'));
    const icon = btn.getAttribute('data-icon');

    buyNow(id, { name: name, price: price, icon: icon });
}

function buyNow(productId, product) {
    const orderData = {
        items: [{
            id: productId,
            name: product.name,
            price: product.price,
            icon: product.icon,
            qty: 1
        }],
        total: product.price,
        userId: currentUser ? currentUser.uid : 'guest',
        userName: currentUser ? (currentUser.displayName || currentUser.email) : 'Guest User',
        userEmail: currentUser ? currentUser.email : ''
    };

    localStorage.setItem('pendingOrder', JSON.stringify(orderData));
    window.location.href = 'checkout.html';
}

function toggleMobileMenu() {
    document.querySelector('.nav-links').classList.toggle('show');
}

// Make functions globally accessible
window.buyNow = buyNow;
window.buyFromBtn = buyFromBtn;
window.toggleMobileMenu = toggleMobileMenu;
window.setCurrentUser = setCurrentUser;
