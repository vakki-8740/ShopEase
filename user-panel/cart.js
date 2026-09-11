// Buy Now - goes directly to checkout

// Called from button click - reads data attributes
function buyFromBtn(btn) {
    var id = btn.getAttribute('data-id');
    var name = btn.getAttribute('data-name');
    var price = parseInt(btn.getAttribute('data-price'));
    var icon = btn.getAttribute('data-icon');

    var orderData = {
        items: [{
            id: id,
            name: name,
            price: price,
            icon: icon,
            qty: 1
        }],
        total: price,
        userId: 'guest',
        userName: 'Guest User',
        userEmail: ''
    };

    localStorage.setItem('pendingOrder', JSON.stringify(orderData));
    window.location.href = 'checkout.html';
}

function toggleMobileMenu() {
    document.querySelector('.nav-links').classList.toggle('show');
}
