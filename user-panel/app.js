let allProducts = [];

// Category icons
const categoryIcons = {
    electronics: '💻',
    fashion: '👕',
    home: '🏠',
    beauty: '💄'
};

// Load products from Firestore
async function loadProducts() {
    const grid = document.getElementById('productsGrid');

    try {
        const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            // Load sample products if empty
            await loadSampleProducts();
            return;
        }

        allProducts = [];
        snapshot.forEach(doc => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });

        renderProducts(allProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        grid.innerHTML = '<p style="text-align:center;grid-column:1/-1;padding:40px;">Error loading products. Please check Firebase config.</p>';
    }
}

// Sample products to populate store
async function loadSampleProducts() {
    const products = [
        { name: 'Wireless Headphones', price: 1299, oldPrice: 2999, category: 'electronics', icon: '🎧', desc: 'Premium sound quality with noise cancellation', stock: 50 },
        { name: 'Smart Watch', price: 2499, oldPrice: 4999, category: 'electronics', icon: '⌚', desc: 'Track your fitness and stay connected', stock: 30 },
        { name: 'Running Shoes', price: 1899, oldPrice: 3499, category: 'fashion', icon: '👟', desc: 'Lightweight and comfortable for daily runs', stock: 40 },
        { name: 'Cotton T-Shirt', price: 499, oldPrice: 999, category: 'fashion', icon: '👕', desc: '100% organic cotton, available in multiple colors', stock: 100 },
        { name: 'Desk Lamp', price: 799, oldPrice: 1499, category: 'home', icon: '💡', desc: 'LED lamp with adjustable brightness', stock: 25 },
        { name: 'Face Cream', price: 349, oldPrice: 699, category: 'beauty', icon: '🧴', desc: 'Moisturizing cream with natural ingredients', stock: 80 },
        { name: 'Bluetooth Speaker', price: 999, oldPrice: 1999, category: 'electronics', icon: '🔊', desc: 'Portable speaker with 12hr battery life', stock: 35 },
        { name: 'Sunglasses', price: 599, oldPrice: 1299, category: 'fashion', icon: '🕶️', desc: 'UV400 protection with stylish design', stock: 60 },
        { name: 'Plant Pot Set', price: 449, oldPrice: 899, category: 'home', icon: '🪴', desc: 'Set of 3 ceramic pots for indoor plants', stock: 45 },
        { name: 'Perfume', price: 699, oldPrice: 1499, category: 'beauty', icon: '🌸', desc: 'Long-lasting floral fragrance', stock: 55 },
        { name: 'Laptop Stand', price: 899, oldPrice: 1799, category: 'electronics', icon: '💻', desc: 'Ergonomic aluminum stand for laptops', stock: 20 },
        { name: 'Denim Jacket', price: 1599, oldPrice: 2999, category: 'fashion', icon: '🧥', desc: 'Classic denim jacket with modern fit', stock: 25 }
    ];

    const batch = db.batch();
    products.forEach(p => {
        const ref = db.collection('products').doc();
        batch.set(ref, { ...p, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    });

    await batch.commit();
    loadProducts();
}

function renderProducts(products) {
    const grid = document.getElementById('productsGrid');

    if (products.length === 0) {
        grid.innerHTML = '<p style="text-align:center;grid-column:1/-1;padding:40px;color:#636e72;">No products found.</p>';
        return;
    }

    let html = '';
    products.forEach(p => {
        const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
        html += `
            <div class="product-card" data-category="${p.category}">
                <div class="product-image">${p.icon || '📦'}</div>
                ${discount > 0 ? `<span class="product-badge">${discount}% OFF</span>` : ''}
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <p class="product-category">${p.category}</p>
                    <div class="product-price">
                        <span class="price-current">₹${p.price.toLocaleString()}</span>
                        ${p.oldPrice ? `<span class="price-old">₹${p.oldPrice.toLocaleString()}</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="btn-add-cart" onclick='addToCart("${p.id}", ${JSON.stringify({ name: p.name, price: p.price, icon: p.icon })})'>
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    grid.innerHTML = html;
}

function filterByCategory(category) {
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(category) || (category === 'all' && btn.textContent === 'All')) {
            btn.classList.add('active');
        }
    });

    if (category === 'all') {
        renderProducts(allProducts);
    } else {
        renderProducts(allProducts.filter(p => p.category === category));
    }
}

function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!query) {
        renderProducts(allProducts);
        return;
    }

    const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.desc && p.desc.toLowerCase().includes(query))
    );

    renderProducts(filtered);
}

// Search on Enter key
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchProducts();
});

// Toast notification
function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    renderCart();
});
