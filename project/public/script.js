// Global state
let currentUser = null;
let products = [];
let cart = [];
let orders = [];

// DOM elements
const sections = {
    products: document.getElementById('products-section'),
    productDetail: document.getElementById('product-detail-section'),
    cart: document.getElementById('cart-section'),
    login: document.getElementById('login-section'),
    register: document.getElementById('register-section'),
    orders: document.getElementById('orders-section')
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadProducts();
    setupEventListeners();
    loadCart();
});

// Auth functions
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentUser = JSON.parse(user);
        updateAuthUI();
    }
}

function updateAuthUI() {
    const authSection = document.getElementById('auth-section');
    
    if (currentUser) {
        authSection.innerHTML = `
            <span class="nav-link">Hello, ${currentUser.name}</span>
            <a href="#" class="nav-link" onclick="showOrders()">My Orders</a>
            <a href="#" class="nav-link" onclick="logout()">Logout</a>
        `;
    } else {
        authSection.innerHTML = `
            <a href="#" class="nav-link" onclick="showLogin()">Login</a>
            <a href="#" class="nav-link" onclick="showRegister()">Register</a>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    updateAuthUI();
    showProducts();
}

// API functions
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        ...options
    };

    try {
        const response = await fetch(`http://localhost:3000/api${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Product functions
async function loadProducts() {
    try {
        showLoading('products-container');
        products = await apiCall('/products');
        displayProducts();
    } catch (error) {
        showError('products-container', 'Failed to load products');
    }
}

function displayProducts() {
    const container = document.getElementById('products-container');
    
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state">No products available</div>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image">Product Image</div>
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <p class="product-description">${product.description}</p>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-primary" onclick="addToCart('${product.id}')">
                    Add to Cart
                </button>
                <button class="btn btn-secondary" onclick="showProductDetail('${product.id}')">
                    View Details
                </button>
            </div>
        </div>
    `).join('');
}

async function showProductDetail(productId) {
    try {
        showLoading('product-detail-container');
        const product = await apiCall(`/products/${productId}`);
        displayProductDetail(product);
        showSection('productDetail');
    } catch (error) {
        showError('product-detail-container', 'Failed to load product details');
    }
}

function displayProductDetail(product) {
    const container = document.getElementById('product-detail-container');
    container.innerHTML = `
        <div class="product-detail">
            <button class="btn btn-secondary back-btn" onclick="showProducts()">← Back to Products</button>
            <div class="product-detail-image">Product Image</div>
            <h2 class="product-name">${product.name}</h2>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <p class="product-description">${product.description}</p>
            <p><strong>Stock:</strong> ${product.stock} available</p>
            <div style="margin-top: 20px;">
                <label for="quantity">Quantity:</label>
                <input type="number" id="quantity" class="quantity-input" value="1" min="1" max="${product.stock}">
                <button class="btn btn-primary" onclick="addToCart('${product.id}', parseInt(document.getElementById('quantity').value))">
                    Add to Cart
                </button>
            </div>
        </div>
    `;
}

// Cart functions
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showMessage('Product not found', 'error');
        return;
    }

    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
            showMessage('Not enough stock available', 'error');
            return;
        }
        existingItem.quantity = newQuantity;
    } else {
        if (quantity > product.stock) {
            showMessage('Not enough stock available', 'error');
            return;
        }
        cart.push({
            productId: productId,
            name: product.name,
            price: product.price,
            quantity: quantity
        });
    }
    
    saveCart();
    showMessage('Item added to cart!', 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    saveCart();
    displayCart();
}

function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.productId === productId);
    const product = products.find(p => p.id === productId);
    
    if (item && product) {
        if (quantity > product.stock) {
            showMessage('Not enough stock available', 'error');
            return;
        }
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        item.quantity = quantity;
        saveCart();
        displayCart();
    }
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = count;
}

function displayCart() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-state">Your cart is empty</div>';
        cartTotal.innerHTML = '';
        return;
    }
    
    let total = 0;
    
    cartItems.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>$${item.price.toFixed(2)} each</p>
                </div>
                <div class="cart-item-controls">
                    <input type="number" value="${item.quantity}" min="1" 
                           onchange="updateCartQuantity('${item.productId}', parseInt(this.value))"
                           class="quantity-input">
                    <span>$${itemTotal.toFixed(2)}</span>
                    <button class="btn btn-secondary" onclick="removeFromCart('${item.productId}')">
                        Remove
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    cartTotal.innerHTML = `
        <div class="cart-total">
            <div class="total-amount">Total: $${total.toFixed(2)}</div>
        </div>
    `;
}

async function checkout() {
    if (!currentUser) {
        showMessage('Please login to checkout', 'error');
        showLogin();
        return;
    }
    
    if (cart.length === 0) {
        showMessage('Your cart is empty', 'error');
        return;
    }
    
    try {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        await apiCall('/orders', {
            method: 'POST',
            body: JSON.stringify({
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                })),
                total: total
            })
        });
        
        cart = [];
        saveCart();
        showMessage('Order placed successfully!', 'success');
        loadProducts(); // Refresh products to update stock
        displayCart();
    } catch (error) {
        showMessage(error.message || 'Failed to place order', 'error');
    }
}

// Order functions
async function loadOrders() {
    if (!currentUser) return;
    
    try {
        showLoading('orders-container');
        orders = await apiCall('/orders');
        displayOrders();
    } catch (error) {
        showError('orders-container', 'Failed to load orders');
    }
}

function displayOrders() {
    const container = document.getElementById('orders-container');
    
    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-state">No orders found</div>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-header">
                <div>
                    <strong>Order #${order.id.substring(0, 8)}</strong>
                    <div>Date: ${new Date(order.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                    <div class="order-status ${order.status}">${order.status}</div>
                    <div><strong>Total: $${order.total.toFixed(2)}</strong></div>
                </div>
            </div>
            <div class="order-item-list">
                ${order.items.map(item => `
                    <div class="order-item-detail">
                        <span>${item.name} x ${item.quantity}</span>
                        <span>$${item.total.toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await apiCall('/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            currentUser = response.user;
            
            updateAuthUI();
            showMessage('Login successful!', 'success');
            showProducts();
        } catch (error) {
            showMessage(error.message || 'Login failed', 'error');
        }
    });
    
    // Register form
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        try {
            const response = await apiCall('/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password })
            });
            
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            currentUser = response.user;
            
            updateAuthUI();
            showMessage('Registration successful!', 'success');
            showProducts();
        } catch (error) {
            showMessage(error.message || 'Registration failed', 'error');
        }
    });
}

// Navigation functions
function showSection(sectionName) {
    Object.values(sections).forEach(section => section.classList.remove('active'));
    sections[sectionName].classList.add('active');
}

function showProducts() {
    showSection('products');
    loadProducts();
}

function showCart() {
    showSection('cart');
    displayCart();
}

function showLogin() {
    showSection('login');
}

function showRegister() {
    showSection('register');
}

function showOrders() {
    if (!currentUser) {
        showMessage('Please login to view orders', 'error');
        showLogin();
        return;
    }
    showSection('orders');
    loadOrders();
}

// Utility functions
function showLoading(containerId) {
    document.getElementById(containerId).innerHTML = '<div class="loading">Loading...</div>';
}

function showError(containerId, message) {
    document.getElementById(containerId).innerHTML = `<div class="error">${message}</div>`;
}

function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = type;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px;
        border-radius: 4px;
        z-index: 1001;
        max-width: 300px;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}