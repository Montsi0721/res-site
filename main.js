// Frontend JavaScript
let allMenuItems = [];
let currentOrderItem = null;

document.addEventListener('DOMContentLoaded', function () {
    // Fetch menu items from backend
    fetchMenuItems();

    // Setup event listeners
    setupEventListeners();

    // Show welcome toast
    showToast('Welcome to Savory Delights!');

    const specialOffersHeading = document.querySelector('#special-offers h2');
    if (specialOffersHeading) {
        specialOffersHeading.style.display = 'none';
    }
});


// From localhost:
//const API_BASE = "http://localhost:5000/api";

// To Render backend URL:
const API_BASE = "https://res-site-backend.onrender.com/api";

function fetchMenuItems() {
    fetch(`${API_BASE}/menu`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(menuItems => {
            allMenuItems = menuItems;
            renderMenuItems(menuItems);
        })
        .catch(error => {
            console.error('Error loading menu:', error);
            // Fallback to sample data if server is not available
            loadSampleMenu();
        });
}

function loadSampleMenu() {
    allMenuItems = [
        {
            id: 1,
            name: "Grilled Salmon",
            description: "Fresh Atlantic salmon with lemon butter sauce, served with seasonal vegetables",
            price: 24.99,
            image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        },
        {
            id: 2,
            name: "Filet Mignon",
            description: "8oz premium beef tenderloin with red wine reduction and garlic mashed potatoes",
            price: 32.99,
            image: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        },
        {
            id: 3,
            name: "Mushroom Risotto",
            description: "Creamy arborio rice with wild mushrooms and parmesan cheese",
            price: 18.99,
            image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        }
    ];
    renderMenuItems(allMenuItems);
}

function setupEventListeners() {
    // Menu button
    const menuBtn = document.getElementById('menuBtn');
    const navMenu = document.getElementById('navMenu');

    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });

    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    }

    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        if (!item.classList.contains('theme-toggle')) {
            item.addEventListener('click', function () {
                const target = this.getAttribute('data-target');
                handleNavItemClick(target);
                menuBtn.classList.remove('active');
                navMenu.classList.remove('active');
            });
        }
    });

    // Reservation modal
    const reservationBtn = document.getElementById('reservationBtn');
    const reservationModal = document.getElementById('reservationModal');
    const modalClose = document.getElementById('modalClose');

    reservationBtn.addEventListener('click', () => {
        reservationModal.classList.add('visible');
    });

    modalClose.addEventListener('click', () => {
        reservationModal.classList.remove('visible');
    });

    reservationModal.addEventListener('click', (e) => {
        if (e.target === reservationModal) {
            reservationModal.classList.remove('visible');
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
        const menuBtn = document.getElementById('menuBtn');
        const navMenu = document.getElementById('navMenu');

        if (!navMenu.contains(e.target) && !menuBtn.contains(e.target)) {
            menuBtn.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });

    // Bottom navigation functionality
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            handleNavItemClick(target);

            // Update active state
            bottomNavItems.forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Set initial active state based on scroll position
    window.addEventListener('scroll', function () {
        if (window.innerWidth <= 1024) {
            const sections = document.querySelectorAll('section');
            let currentSection = '';

            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                const sectionHeight = section.clientHeight;
                if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                    currentSection = section.id;
                }
            });

            bottomNavItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-target') === currentSection) {
                    item.classList.add('active');
                }
            });
        }
    });

    // Reservation form
    const reservationForm = document.getElementById('reservationForm');
    reservationForm.addEventListener('submit', handleReservation);

    // Contact form
    const contactForm = document.getElementById('contactForm');
    contactForm.addEventListener('submit', handleContact);

    // Search functionality
    const searchInput = document.querySelector('.search-input');
    const searchContainer = document.querySelector('.search-container');
    const searchIcon = document.querySelector('.search-icon');

    searchIcon.addEventListener('click', function () {
        searchContainer.classList.add('expanded');
        searchInput.focus();
    });

    searchInput.addEventListener('input', handleSearch);

    document.addEventListener('click', function (e) {
        if (!searchContainer.contains(e.target) && searchInput.value.trim() === '') {
            searchContainer.classList.remove('expanded');
        }
    });

    // Scroll progress
    window.addEventListener('scroll', updateProgressBar);
}

function renderMenuItems(menuItems) {
    const menuContainer = document.getElementById('menu-items');
    menuContainer.innerHTML = '';

    menuItems.forEach(item => {
        const menuItemElement = document.createElement('div');
        menuItemElement.className = 'card';
        menuItemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="card-img">
            <div class="card-content">
                <h3 class="card-title">${item.name}</h3>
                <p class="card-text">${item.description}</p>
                <div class="card-footer">
                    <p class="price">M${item.price.toFixed(2)}</p>
                    <button class="card-btn order-btn" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">
                        Order Now
                    </button>
                </div>
            </div>
        `;
        menuContainer.appendChild(menuItemElement);
    });

    // Add event listeners to order buttons
    document.querySelectorAll('.order-btn').forEach(button => {
        button.addEventListener('click', function () {
            const itemId = this.getAttribute('data-id');
            const itemName = this.getAttribute('data-name');
            const itemPrice = parseFloat(this.getAttribute('data-price'));
            showOrderModal(itemId, itemName, itemPrice);
        });
    });
}

function handleNavItemClick(target) {
    const menuBtn = document.getElementById('menuBtn');
    const navMenu = document.getElementById('navMenu');

    // Close menu
    menuBtn.classList.remove('active');
    navMenu.classList.remove('active');

    // Update bottom nav active state on mobile
    if (window.innerWidth <= 1024) {
        const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
        bottomNavItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-target') === target) {
                item.classList.add('active');
            }
        });
    }

    switch (target) {
        case 'welcome':
            scrollToSection('welcome');
            break;
        case 'menu':
            scrollToSection('menu');
            break;
        case 'gallery':
            showGallery();
            break;
        case 'special-offers':
            showSpecialOffers();
            break;
        case 'contact':
            scrollToSection('contact');
            break;
        case 'about':
            scrollToSection('about');
            break;
    }
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

function showGallery() {
    // Clear any previous containers
    document.getElementById('search-results-container')?.remove();
    document.getElementById('gallery-container')?.remove();
    document.getElementById('offers-container')?.remove();

    const menuContainer = document.getElementById('menu-items');
    menuContainer.style.display = 'none';

    const restaurantImages = [
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    ];

    const allGalleryImages = [...restaurantImages, ...allMenuItems.map(item => item.image)];

    const galleryContainer = document.createElement('div');
    galleryContainer.id = 'gallery-container';
    galleryContainer.className = 'search-results';
    galleryContainer.innerHTML = `
        <h3>Our Restaurant Gallery</h3>
        <p style="text-align: center; margin-bottom: 30px;">Take a visual tour of our restaurant and delicious dishes</p>
        <div class="gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin: 30px 0;">
            ${allGalleryImages.map((image, index) => `
                <div class="gallery-item" style="border-radius: 12px; overflow: hidden; box-shadow: 0 6px 12px rgba(0,0,0,0.1); transition: transform 0.3s ease; cursor: pointer;">
                    <img src="${image}" alt="Gallery image ${index + 1}" style="width: 100%; height: 200px; object-fit: cover;">
                </div>
            `).join('')}
        </div>
        <div style="text-align: center; margin-top: 30px;">
            <button id="closeGalleryBtn" class="card-btn">Close Gallery</button>
        </div>
    `;

    const menuSection = document.getElementById('menu');
    menuSection.appendChild(galleryContainer);

    // Add hover effects
    setTimeout(() => {
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('mouseenter', function () {
                this.style.transform = 'scale(1.05)';
                this.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
            });
            item.addEventListener('mouseleave', function () {
                this.style.transform = 'scale(1)';
                this.style.boxShadow = '0 6px 12px rgba(0,0,0,0.1)';
            });

            // Add click to enlarge functionality
            item.addEventListener('click', function () {
                const imgSrc = this.querySelector('img').src;
                showEnlargedImage(imgSrc);
            });
        });

        // Add close gallery button functionality
        document.getElementById('closeGalleryBtn').addEventListener('click', function () {
            galleryContainer.remove();
            menuContainer.style.display = 'grid';
        });
    }, 100);

    // Scroll to gallery
    galleryContainer.scrollIntoView({ behavior: 'smooth' });
}

function showSpecialOffers() {
    // Show the special offers section heading
    const specialOffersSection = document.getElementById('special-offers');
    const originalHeading = specialOffersSection.querySelector('h2');
    originalHeading.style.display = 'block';

    // Clear any previous containers
    document.getElementById('search-results-container')?.remove();
    document.getElementById('gallery-container')?.remove();
    document.getElementById('offers-container')?.remove();

    const menuContainer = document.getElementById('menu-items');
    menuContainer.style.display = 'none';

    // Fetch special offers from backend
    fetch(`${API_BASE}/special-offers`)
        .then(response => response.json())
        .then(specialOffers => {
            if (specialOffers.length === 0) {
                // Fallback to filtered items if no special offers
                specialOffers = allMenuItems.filter(item => item.price < 20);
            }

            displaySpecialOffers(specialOffers);
        })
        .catch(error => {
            console.error('Error fetching special offers:', error);
            // Fallback to filtered items
            const specialOffers = allMenuItems.filter(item => item.price < 20);
            displaySpecialOffers(specialOffers);
        });
}

function displaySpecialOffers(specialOffers) {
    const offersContainer = document.createElement('div');
    offersContainer.id = 'offers-container';
    offersContainer.className = 'search-results';
    offersContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0;">Special Offers</h3>
            <button id="closeOffersBtn" class="card-btn" style="background: #e74c3c;">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
        <p style="text-align: center; margin-bottom: 20px;">Enjoy our specially priced menu items!</p>
        <div class="card-grid">
            ${specialOffers.map(offer => `
                <div class="card">
                    <img src="${offer.item_image || offer.image}" alt="${offer.item_name || offer.name}" class="card-img">
                    <div class="card-content">
                        <h3 class="card-title">${offer.item_name || offer.name} <span style="color: #e74c3c; font-size: 0.8em;">SPECIAL</span></h3>
                        <p class="card-text">${offer.item_description || offer.description}</p>
                        <div class="card-footer">
                            <p class="price" style="text-decoration: line-through; color: #999;">M${offer.original_price ? offer.original_price.toFixed(2) : (offer.price * 1.2).toFixed(2)}</p>
                            <p class="price" style="color: #e74c3c; font-weight: bold;">M${offer.discount_price ? offer.discount_price.toFixed(2) : offer.price.toFixed(2)}</p>
                            <button class="card-btn order-btn" data-id="${offer.menu_item_id || offer.id}" data-name="${offer.item_name || offer.name}" data-price="${offer.discount_price || offer.price}">Order Now</button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Insert after the special offers heading instead of replacing it
    const specialOffersSection = document.getElementById('special-offers');
    const originalHeading = specialOffersSection.querySelector('h2');
    specialOffersSection.insertBefore(offersContainer, originalHeading.nextSibling);

    // Add close button functionality
    document.getElementById('closeOffersBtn').addEventListener('click', function () {
        offersContainer.remove();
        const menuContainer = document.getElementById('menu-items');
        menuContainer.style.display = 'grid';
        originalHeading.style.display = 'none';
    });

    // Reattach event listeners to order buttons
    document.querySelectorAll('.order-btn').forEach(button => {
        button.addEventListener('click', function () {
            const itemId = this.getAttribute('data-id');
            const itemName = this.getAttribute('data-name');
            const itemPrice = parseFloat(this.getAttribute('data-price'));
            showOrderModal(itemId, itemName, itemPrice);
        });
    });

    offersContainer.scrollIntoView({ behavior: 'smooth' });
}

function handleSearch() {
    const searchTerm = this.value.trim().toLowerCase();

    if (searchTerm.length === 0) {
        document.getElementById('search-results-container')?.remove();
        const menuContainer = document.getElementById('menu-items');
        menuContainer.style.display = 'grid';
        renderMenuItems(allMenuItems);
        return;
    }

    // Admin access
    if (searchTerm === 'admin') {
        this.value = '';
        const password = prompt('Enter admin password:');
        if (password === '1234') {
            localStorage.setItem('adminAuthenticated', 'true');
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                window.location.href = "../public/admin.html";
            } else {
                window.location.href = "admin.html";
            }
        } else {
            alert('Invalid admin password');
        }
        return;
    }

    const filteredItems = allMenuItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
    );

    displaySearchResults(filteredItems, searchTerm);
}

function displaySearchResults(filteredItems, searchTerm) {
    const menuContainer = document.getElementById('menu-items');
    menuContainer.style.display = 'none';

    document.getElementById('search-results-container')?.remove();

    const searchResultsContainer = document.createElement('div');
    searchResultsContainer.id = 'search-results-container';
    searchResultsContainer.className = 'search-results';

    if (filteredItems.length > 0) {
        searchResultsContainer.innerHTML = `
            <h3>Search Results for "${searchTerm}" (${filteredItems.length} items found)</h3>
            <div class="card-grid">
                ${filteredItems.map(item => {
            const highlightedName = highlightText(item.name, searchTerm);
            const highlightedDescription = highlightText(item.description, searchTerm);
            return `
                        <div class="card">
                            <img src="${item.image}" alt="${item.name}" class="card-img">
                            <div class="card-content">
                                <h3 class="card-title">${highlightedName}</h3>
                                <p class="card-text">${highlightedDescription}</p>
                                <div class="card-footer">
                                    <p class="price">M${item.price.toFixed(2)}</p>
                                    <button class="card-btn order-btn" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">Order Now</button>
                                </div>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    } else {
        searchResultsContainer.innerHTML = `
            <p class="no-results">No menu items found for "${searchTerm}". Try different keywords.</p>
        `;
    }

    const menuSection = document.getElementById('menu');
    menuSection.appendChild(searchResultsContainer);

    // Reattach event listeners
    document.querySelectorAll('.order-btn').forEach(button => {
        button.addEventListener('click', function () {
            const itemId = this.getAttribute('data-id');
            const itemName = this.getAttribute('data-name');
            const itemPrice = parseFloat(this.getAttribute('data-price'));
            showOrderModal(itemId, itemName, itemPrice);
        });
    });
}

function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="highlight">M1</span>');
}

function showOrderModal(itemId, itemName, itemPrice) {
    currentOrderItem = { id: itemId, name: itemName, price: itemPrice };

    const orderModal = document.getElementById('orderModal');
    const orderModalTitle = document.getElementById('orderModalTitle');
    const orderTotal = document.getElementById('orderTotal');

    orderModalTitle.textContent = `Order ${itemName}`;
    orderTotal.textContent = itemPrice.toFixed(2);

    const orderForm = document.getElementById('orderForm');
    orderForm.reset();
    document.getElementById('orderQuantity').value = 1;

    orderModal.classList.add('visible');

    // Quantity change handler
    document.getElementById('orderQuantity').addEventListener('input', function () {
        const quantity = parseInt(this.value) || 1;
        orderTotal.textContent = (itemPrice * quantity).toFixed(2);
    });

    // Close handler
    document.getElementById('orderModalClose').addEventListener('click', function () {
        orderModal.classList.remove('visible');
    });

    orderModal.addEventListener('click', function (e) {
        if (e.target === orderModal) {
            orderModal.classList.remove('visible');
        }
    });
}

function handleReservation(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        guests: document.getElementById('guests').value
    };

    fetch(`${API_BASE}/reservations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
        .then(response => response.json())
        .then(data => {
            showToast('Reservation submitted successfully!');
            document.getElementById('reservationForm').reset();
            document.getElementById('reservationModal').classList.remove('visible');
        })
        .catch(error => {
            console.error('Error submitting reservation:', error);
            showToast('Error submitting reservation. Please try again.');
        });
}

function handleContact(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        message: document.getElementById('contactMessage').value
    };

    fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Your message has been sent successfully!');
                document.getElementById('contactForm').reset();
            } else {
                showToast('Error sending message. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error sending message:', error);
            showToast('Error sending message. Please try again.');
        });
}

// Order form submission
document.getElementById('orderForm').addEventListener('submit', function (e) {
    e.preventDefault();

    if (!currentOrderItem) return;

    const orderData = {
        customer_name: document.getElementById('orderName').value,
        customer_email: document.getElementById('orderEmail').value,
        customer_phone: document.getElementById('orderPhone').value,
        items: [{
            id: currentOrderItem.id,
            name: currentOrderItem.name,
            price: currentOrderItem.price,
            quantity: parseInt(document.getElementById('orderQuantity').value) || 1
        }],
        total_amount: currentOrderItem.price * (parseInt(document.getElementById('orderQuantity').value) || 1)
    };

    fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
        .then(response => response.json())
        .then(data => {
            showToast('Order placed successfully!');
            document.getElementById('orderModal').classList.remove('visible');
            document.getElementById('orderForm').reset();
        })
        .catch(error => {
            console.error('Error placing order:', error);
            showToast('Error placing order. Please try again.');
        });
});

function showEnlargedImage(src) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        cursor: pointer;
    `;

    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    `;

    overlay.appendChild(img);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function () {
        document.body.removeChild(overlay);
    });
}

function updateProgressBar() {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = (scrollTop / scrollHeight) * 100;
    document.getElementById('progressBar').style.width = scrollPercent + '%';
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.querySelector('span').textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);

}
