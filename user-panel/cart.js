// Buy Now - goes directly to checkout

let currentUser = null;

// Get current user from auth.js
function setCurrentUser(user) {
    currentUser = user;
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
window.toggleMobileMenu = toggleMobileMenu;
window.setCurrentUser = setCurrentUser;
