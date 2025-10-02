// Frontend JavaScript
let allMenuItems = [];
let currentOrderItem = null;

// Pagination variables
let currentPage = 1;
const itemsPerPage = 6;

// Live Location Variables
let map;
let directionsService;
let directionsRenderer;
let userMarker;

const API_BASE = "https://res-site-backend.onrender.com/api";

document.addEventListener('DOMContentLoaded', function () {
    // Fetch menu items from backend
    fetchMenuItems();

    // Setup event listeners
    setupEventListeners();

    setupOrderTracking();

    setupPagination();

    addLocationToNavigation();
    initializeLocationFeature();

    // Show welcome toast
    showToast('Welcome to Savory Delights!');

    const specialOffersHeading = document.querySelector('#special-offers h2');
    if (specialOffersHeading) {
        specialOffersHeading.style.display = 'none';
    }
});

function fetchMenuItems() {
    // Show loading spinner
    const menuContainer = document.getElementById('menu-items');
    menuContainer.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
        </div>
    `;
    fetch(`${API_BASE}/menu`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(menuItems => {
            allMenuItems = menuItems;
            currentPage = 1;
            renderCurrentPage();
            updatePaginationControls();
        })
        .catch(error => {
            console.error('Error loading menu:', error);
            loadSampleMenu();
        });
}

function loadSampleMenu() {
    const menuContainer = document.getElementById('menu-items');
    menuContainer.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
        </div>
    `;
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
        },
        {
            id: 4,
            name: "Truffle Pasta",
            description: "Fresh pasta with black truffle cream sauce and parmesan",
            price: 22.99,
            image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        },
        {
            id: 5,
            name: "Seafood Platter",
            description: "Assorted fresh seafood with lemon butter and herbs",
            price: 35.99,
            image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        },
        {
            id: 6,
            name: "Vegetarian Delight",
            description: "Seasonal vegetables with quinoa and tahini sauce",
            price: 16.99,
            image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        },
        {
            id: 7,
            name: "Chocolate Lava Cake",
            description: "Warm chocolate cake with molten center and vanilla ice cream",
            price: 8.99,
            image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        },
        {
            id: 8,
            name: "Caprese Salad",
            description: "Fresh mozzarella, tomatoes, and basil with balsamic glaze",
            price: 12.99,
            image: "https://images.unsplash.com/photo-1551782450-17144efb9c50?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        },
        {
            id: 9,
            name: "Beef Burger",
            description: "Premium beef patty with special sauce and crispy fries",
            price: 14.99,
            image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        },
        {
            id: 10,
            name: "Margherita Pizza",
            description: "Classic pizza with fresh mozzarella and basil",
            price: 16.99,
            image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        }
    ];
    currentPage = 1;
    renderCurrentPage();
    updatePaginationControls();
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

    // For mobile navigation closing when clicking nav items
    document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
        item.addEventListener('click', function () {
            // Close the side menu on mobile after clicking
            if (window.innerWidth <= 1024) {
                menuBtn.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });

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

    // Order tracking modal
    const orderTrackingModal = document.getElementById('orderTrackingModal');
    const orderTrackingModalClose = document.getElementById('orderTrackingModalClose');
    const closeOrderTrack = document.getElementById('closeOrderTrack');

    // Add click event to the order tracking nav item
    document.querySelector('.nav-item[data-target="order-tracking"]').addEventListener('click', showOrderTrackingModal);

    // Close modal events
    orderTrackingModalClose.addEventListener('click', hideOrderTrackingModal);
    closeOrderTrack.addEventListener('click', hideOrderTrackingModal);

    orderTrackingModal.addEventListener('click', (e) => {
        if (e.target === orderTrackingModal) {
            hideOrderTrackingModal();
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
        button.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            const itemName = this.getAttribute('data-name');
            const itemPrice = parseFloat(this.getAttribute('data-price'));
            showOrderModal(itemId, itemName, itemPrice);
        });
    });
}

function setupPagination() {
    const pagination = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    // Initialize pagination as hidden
    //pagination.classList.add('hidden');
    //pagination.style.display = 'none';

    prevBtn.addEventListener('click', () => changePage(currentPage - 1));
    nextBtn.addEventListener('click', () => changePage(currentPage + 1));
    
    // Call update once to set initial state
    updatePaginationControls();
}

function changePage(page) {
    const totalPages = Math.ceil(allMenuItems.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderCurrentPage();
    updatePaginationControls();
}

function renderCurrentPage() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = allMenuItems.slice(startIndex, endIndex);
    
    renderMenuItems(currentItems);
}

function updatePaginationControls() {
    const pagination = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    const totalPages = Math.ceil(allMenuItems.length / itemsPerPage);
    
    // Show pagination only if we have more than one page
    if (totalPages > 1) {
        pagination.classList.remove('hidden');
        pagination.style.display = 'flex';
    } else {
        pagination.classList.add('hidden');
        pagination.style.display = 'none';
        return;
    }
    
    // Update page info
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    
    // Update button states
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    // Add/remove disabled styles
    prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
    nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
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
        case 'order-tracking':
            scrollToSection('order-tracking');
            orderTrack = document.getElementById('order-tracking');
            orderTrack.style.display = 'flex';
            break;
        case 'location':
            scrollToSection('location');
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
        <div style="text-align: center; margin-top: 30px;">
            <button id="closeGalleryBtn" class="card-btn">Close Gallery</button>
        </div>
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
                window.location.href = "admin.html";
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
            showToast(`Order placed successfully! Your Order ID: ${data.id}`);
            document.getElementById('orderModal').classList.remove('visible');
            document.getElementById('orderForm').reset();
            setTimeout(() => {
                document.getElementById('orderTrackingId').value = data.id;
            }, 500);
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

// Order tracking functionality
function setupOrderTracking() {
    document.getElementById('trackOrderBtn').addEventListener('click', trackOrder);
    document.getElementById('confirmDeliveryBtn').addEventListener('click', confirmDelivery);
}

function trackOrder() {
    const email = document.getElementById('orderTrackingEmail').value.trim();
    
    if (!email) {
        showToast('Please enter your email address');
        return;
    }
    
    // Fetch all orders and filter by email
    fetch(`${API_BASE}/admin/orders`)
        .then(response => response.json())
        .then(orders => {
            const userOrders = orders.filter(order => 
                order.customer_email.toLowerCase() === email.toLowerCase()
            );
            
            const resultDiv = document.getElementById('orderTrackingResult');
            resultDiv.style.display = 'block';
            resultDiv.style.color = '#333';
            
            if (userOrders.length === 0) {
                resultDiv.innerHTML = `
                    <p>No orders found for ${email}.</p>
                    <p>Please check your email address or place a new order.</p>
                `;
                document.getElementById('orderConfirmationSection').style.display = 'none';
                return;
            }
            
            // Show all orders for this email
            resultDiv.innerHTML = `
                <h4>Your Orders (${userOrders.length})</h4>
                ${userOrders.map(order => {
                    const items = JSON.parse(order.items);
                    const itemsText = items.map(item => `${item.name} (x${item.quantity})`).join(', ');
                    
                    return `
                        <div style="border: 1px solid #ccc; padding: 15px; margin: 10px 0; border-radius: 8px;">
                            <p><strong>Order #${order.id}</strong></p>
                            <p><strong>Items:</strong> ${itemsText}</p>
                            <p><strong>Total:</strong> M${order.total_amount}</p>
                            <p><strong>Status:</strong> <span class="status-${order.status}">${getStatusText(order.status)}</span></p>
                            <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                            ${order.status === 'out-for-delivery' ? 
                                `<button class="card-btn confirm-delivery-btn" data-order-id="${order.id}" 
                                    style="background: #27ae60; color: white; margin-top: 10px;">
                                    Confirm Delivery Received
                                </button>` : ''
                            }
                        </div>
                    `;
                }).join('')}
            `;
            
            // Add event listeners to confirm delivery buttons
            document.querySelectorAll('.confirm-delivery-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-order-id');
                    confirmDelivery(orderId);
                });
            });
        })
        .catch(error => {
            console.error('Error fetching orders:', error);
            showToast('Error finding orders. Please try again.');
        });
}

function confirmDelivery(orderId) {
    if (!orderId) {
        showToast('No order selected');
        return;
    }
    
    fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'delivered' })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Order delivery confirmed! Thank you for your order.');
            // Refresh the orders list
            trackOrder();
        } else {
            showToast('Error confirming delivery');
        }
    })
    .catch(error => {
        console.error('Error confirming delivery:', error);
        showToast('Error confirming delivery');
    });
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pending',
        'preparing': 'Being Prepared',
        'ready': 'Ready for Pickup',
        'out-for-delivery': 'Out for Delivery',
        'delivered': 'Delivered'
    };
    return statusMap[status] || status;
}

function showOrderTrackingModal() {
    const modal = document.getElementById('orderTrackingModal');
    document.body.classList.add('modal-open');
    modal.style.display = 'flex';
    modal.classList.add('visible');

    // Clear previous results
    document.getElementById('orderTrackingResult').style.display = 'none';
    document.getElementById('orderConfirmationSection').style.display = 'none';
    document.getElementById('orderTrackingId').value = '';
}

function hideOrderTrackingModal() {
    const modal = document.getElementById('orderTrackingModal');
    document.body.classList.remove('modal-open');
    modal.style.display = 'none';
    modal.classList.remove('visible');
}

function initializeLocationFeature() {
    // Load Google Maps API
    loadGoogleMaps();
    
    // Setup event listeners
    document.getElementById('getDirectionsBtn').addEventListener('click', openGoogleMaps);
    document.getElementById('useCurrentLocation').addEventListener('click', getCurrentLocation);
    document.getElementById('calculateRoute').addEventListener('click', calculateRoute);
}

function loadGoogleMaps() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

function initMap() {
    // Restaurant coordinates (example coordinates for Foodville)
    const restaurantLocation = { lat: -26.2041, lng: 28.0473 }; // Johannesburg coordinates
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: restaurantLocation,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'on' }]
            }
        ]
    });
    
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    
    // Add restaurant marker
    new google.maps.Marker({
        position: restaurantLocation,
        map: map,
        title: 'Savory Delights Restaurant',
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        }
    });
}

function getCurrentLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser');
        return;
    }
    
    showToast('Getting your location...');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            // Reverse geocode to get address
            reverseGeocode(userLocation);
            
            // Add/update user marker on map
            if (userMarker) {
                userMarker.setPosition(userLocation);
            } else {
                userMarker = new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: 'Your Location',
                    icon: {
                        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                    }
                });
            }
            
            // Center map on user location
            map.setCenter(userLocation);
            map.setZoom(13);
            
        },
        (error) => {
            console.error('Error getting location:', error);
            let errorMessage = 'Unable to get your location';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please enable location services.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out.';
                    break;
            }
            
            showToast(errorMessage);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );
}

function reverseGeocode(location) {
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ location: location }, (results, status) => {
        if (status === 'OK' && results[0]) {
            document.getElementById('userLocation').value = results[0].formatted_address;
        } else {
            document.getElementById('userLocation').value = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
        }
    });
}

function calculateRoute() {
    const userLocationInput = document.getElementById('userLocation').value.trim();
    
    if (!userLocationInput) {
        showToast('Please enter your location or use current location');
        return;
    }
    
    // Restaurant location (hardcoded for example)
    const restaurantLocation = { lat: -26.2041, lng: 28.0473 };
    
    const request = {
        origin: userLocationInput,
        destination: restaurantLocation,
        travelMode: google.maps.TravelMode.DRIVING
    };
    
    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            
            const route = result.routes[0].legs[0];
            const distance = route.distance.text;
            const duration = route.duration.text;
            
            document.getElementById('routeDetails').innerHTML = `
                <strong>Distance:</strong> ${distance}<br>
                <strong>Estimated Time:</strong> ${duration}<br>
                <strong>Address:</strong> 123 Gourmet Street, Foodville
            `;
            document.getElementById('routeInfo').style.display = 'block';
            
        } else {
            showToast('Unable to calculate route. Please check your location.');
        }
    });
}

function openGoogleMaps() {
    // Open Google Maps with restaurant location
    const url = `https://www.google.com/maps/dir/?api=1&destination=123+Gourmet+Street+Foodville`;
    window.open(url, '_blank');
}

function addLocationToNavigation() {
    const navItems = document.querySelector('.nav-items');
    const locationNavItem = document.createElement('div');
    locationNavItem.className = 'nav-item';
    locationNavItem.setAttribute('data-target', 'location');
    locationNavItem.innerHTML = `
        <div class="nav-icon"><i class="fas fa-map-marker-alt"></i></div>
        <div class="nav-text">Find Us</div>
    `;
    
    // Insert before the theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    navItems.insertBefore(locationNavItem, themeToggle);
    
    // Add click event
    locationNavItem.addEventListener('click', function() {
        handleNavItemClick('location');
    });
}