const PRODUCTOS = [
    { id: 1, nombre: 'Labial Mate Rojo', categoria: 'labios', precio: 15.99, img: 'img/productos/labial.jpg' },
    { id: 2, nombre: 'Paleta de Sombras Nude', categoria: 'ojos', precio: 24.99, img: 'img/productos/sombras.jpg' },
    { id: 3, nombre: 'Rubor Rosado', categoria: 'rostro', precio: 12.50, img: 'img/productos/rubor.jpg' },
    { id: 4, nombre: 'Máscara de Pestañas', categoria: 'ojos', precio: 18.75, img: 'img/productos/mascara.jpg' },
    { id: 5, nombre: 'Iluminador Dorado', categoria: 'rostro', precio: 19.99, img: 'img/productos/iluminador.jpg' }
];

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let filtroActual = 'all';

const productsContainer = document.getElementById('products');
const cartBtn = document.getElementById('cart-btn');
const cartModal = document.getElementById('cart-modal');
const closeCart = document.getElementById('close-cart');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const notifBtn = document.getElementById('notif-btn');
const toast = document.getElementById('toast');
const filterBtns = document.querySelectorAll('.filter-btn');

function renderProductos(categoria = 'all') {
    const filtered = categoria === 'all' 
        ? PRODUCTOS 
        : PRODUCTOS.filter(p => p.categoria === categoria);

    productsContainer.innerHTML = filtered.map(p => `
        <div class="product-card">
            <img class="product-img" src="${p.img}" alt="${p.nombre}" 
                 onerror="this.src='img/icons/icon-192x192.png'">
            <div class="product-info">
                <span class="product-cat">${p.categoria}</span>
                <h3>${p.nombre}</h3>
                <p class="product-price">$${p.precio.toFixed(2)}</p>
                <button class="add-btn" onclick="agregarAlCarrito(${p.id})">
                    <i class="fas fa-cart-plus"></i> Agregar
                </button>
            </div>
        </div>
    `).join('');
}

function agregarAlCarrito(id) {
    const producto = PRODUCTOS.find(p => p.id === id);
    if (!producto) return;

    const existente = carrito.find(item => item.id === id);
    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }

    guardarCarrito();
    actualizarCarrito();
    mostrarToast(` ${producto.nombre} agregado`);
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    guardarCarrito();
    actualizarCarrito();
}

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

function actualizarCarrito() {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const totalPrecio = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    cartCount.textContent = totalItems;
    cartTotal.textContent = `$${totalPrecio.toFixed(2)}`;

    if (carrito.length === 0) {
        cartItems.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Tu carrito está vacío 🛍️</p>';
    } else {
        cartItems.innerHTML = carrito.map(item => `
            <div class="cart-item">
                <img src="${item.img}" alt="${item.nombre}"
                     onerror="this.src='img/icons/icon-192x192.png'">
                <div class="cart-item-info">
                    <h4>${item.nombre}</h4>
                    <p>$${item.precio.toFixed(2)} x ${item.cantidad}</p>
                </div>
                <button class="remove-btn" onclick="eliminarDelCarrito(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }
}

cartBtn.addEventListener('click', () => {
    cartModal.classList.remove('oculto');
    actualizarCarrito();
});

closeCart.addEventListener('click', () => {
    cartModal.classList.add('oculto');
});

cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) cartModal.classList.add('oculto');
});

checkoutBtn.addEventListener('click', () => {
    if (carrito.length === 0) {
        mostrarToast('Tu carrito está vacío');
        return;
    }
    
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('¡Compra exitosa!', {
            body: `Tu pedido de $${total.toFixed(2)} ha sido procesado.`,
            icon: 'img/icons/icon-192x192.png'
        });
    }
    
    carrito = [];
    guardarCarrito();
    actualizarCarrito();
    cartModal.classList.add('oculto');
    mostrarToast('🎉 ¡Gracias por tu compra!');
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filtroActual = btn.dataset.cat;
        renderProductos(filtroActual);
    });
});

function mostrarToast(mensaje) {
    toast.textContent = mensaje;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

notifBtn.addEventListener('click', async () => {
    if (!('Notification' in window) || !('PushManager' in window)) {
        mostrarToast('Tu navegador no soporta notificaciones');
        return;
    }

    try {
        const permiso = await Notification.requestPermission();
        
        if (permiso !== 'granted') {
            mostrarToast('Permiso denegado');
            return;
        }

        new Notification('¡Notificaciones activadas!', {
            body: 'Te avisaremos de ofertas y nuevos productos.',
            icon: 'img/icons/icon-192x192.png',
            badge: 'img/icons/icon-72x72.png',
            vibrate: [200, 100, 200]
        });

        mostrarToast('🔔 ¡Notificaciones activadas!');
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('❌ Error al activar notificaciones');
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log(' SW registrado:', reg.scope))
            .catch(err => console.error(' Error SW:', err));
    });
}

window.addEventListener('online', () => {
    document.querySelector('.offline-badge')?.remove();
    mostrarToast(' Conexión restaurada');
});

window.addEventListener('offline', () => {
    if (!document.querySelector('.offline-badge')) {
        const badge = document.createElement('div');
        badge.className = 'offline-badge';
        badge.innerHTML = '<i class="fas fa-wifi"></i> Modo offline';
        document.body.appendChild(badge);
    }
    mostrarToast('Sin conexión - Modo offline');
});

renderProductos();
actualizarCarrito();

if (!navigator.onLine) {
    window.dispatchEvent(new Event('offline'));
}