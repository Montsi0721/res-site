// Global State
const AppState = {
    allMenuItems: [],
    currentOrderItem: null,
    currentCategory: 'all',
    filteredMenuItems: [],
    currentPage: 1,
    itemsPerPage: 6,
    
    // Location State
    map: null,
    directionsService: null,
    directionsRenderer: null,
    userMarker: null
};

// Configuration
const Config = {
    API_BASE: "https://res-site-backend.onrender.com/api",
    MAPS_API_KEY: "YOUR_GOOGLE_MAPS_API_KEY"
};

// DOM Elements Cache
const DOM = {
    get menuBtn() { return document.getElementById('menuBtn'); },
    get navMenu() { return document.getElementById('navMenu'); },
    get themeToggle() { return document.getElementById('themeToggle'); },
    get menuContainer() { return document.getElementById('menu-items'); },
    get pagination() { return document.getElementById('pagination'); },
    get prevBtn() { return document.getElementById('prevPage'); },
    get nextBtn() { return document.getElementById('nextPage'); },
    get pageInfo() { return document.getElementById('pageInfo'); },
    get progressBar() { return document.getElementById('progressBar'); },
    get toast() { return document.getElementById('toast'); }
};

// Utility Functions
const Utils = {
    async fetchWithFallback(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.log('API call failed, using fallback:', error);
            return null;
        }
    },

    showToast(message) {
        const toast = DOM.toast;
        toast.querySelector('span').textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },

    scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    highlightText(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Menu Management
const MenuManager = {
    async fetchMenuItems() {
        DOM.menuContainer.innerHTML = this.createLoadingSpinner();
        
        const menuItems = await Utils.fetchWithFallback(`${Config.API_BASE}/menu`);
        
        if (menuItems && Array.isArray(menuItems)) {
            AppState.allMenuItems = menuItems;
            AppState.filteredMenuItems = menuItems;
            this.renderCurrentPage();
            Pagination.updateControls();
            CategoryFilters.initialize();
        } else {
            this.loadSampleMenu();
        }
    },

    loadSampleMenu() {
        const sampleMenu = [
            {
                id: 1,
                name: "Grilled Salmon",
                description: "Fresh Atlantic salmon with lemon butter sauce, served with seasonal vegetables",
                price: 24.99,
                image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                category: "main"
            },
            {
                id: 2,
                name: "Filet Mignon",
                description: "8oz premium beef tenderloin with red wine reduction and garlic mashed potatoes",
                price: 32.99,
                image: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                category: "main"
            },
            {
                id: 3,
                name: "Mushroom Risotto",
                description: "Creamy arborio rice with wild mushrooms and parmesan cheese",
                price: 18.99,
                image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
                category: "desserts"
            }
        ];

        AppState.allMenuItems = sampleMenu;
        AppState.filteredMenuItems = sampleMenu;
        this.renderCurrentPage();
        Pagination.updateControls();
        CategoryFilters.initialize();
        Utils.showToast('Sample menu loaded');
    },

    createLoadingSpinner() {
        return `
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>
        `;
    },

    renderCurrentPage() {
        const startIndex = (AppState.currentPage - 1) * AppState.itemsPerPage;
        const endIndex = startIndex + AppState.itemsPerPage;
        const currentItems = AppState.filteredMenuItems.slice(startIndex, endIndex);
        this.renderMenuItems(currentItems);
    },

    renderMenuItems(items) {
        if (!items || items.length === 0) {
            DOM.menuContainer.innerHTML = this.createNoResultsMessage();
            return;
        }

        DOM.menuContainer.innerHTML = items.map(item => this.createMenuItemCard(item)).join('');
        this.attachOrderButtonListeners();
    },

    createMenuItemCard(item) {
        return `
            <div class="card">
                <img src="${item.image}" alt="${item.name}" class="card-img">
                <div class="card-content">
                    <h3 class="card-title">${item.name}</h3>
                    <p class="card-text">${item.description}</p>
                    <div class="card-footer">
                        <p class="price">M${item.price.toFixed(2)}</p>
                        <button class="card-btn order-btn" 
                                data-id="${item.id}" 
                                data-name="${item.name}" 
                                data-price="${item.price}">
                            Order Now
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    createNoResultsMessage() {
        return `
            <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-search" style="font-size: 48px; margin-bottom: 20px; color: #ccc;"></i>
                <h3>No menu items found</h3>
                <p>Please try again later or check back soon</p>
            </div>
        `;
    },

    attachOrderButtonListeners() {
        document.querySelectorAll('.order-btn').forEach(button => {
            button.addEventListener('click', () => {
                const itemId = button.getAttribute('data-id');
                const itemName = button.getAttribute('data-name');
                const itemPrice = parseFloat(button.getAttribute('data-price'));
                OrderModal.show(itemId, itemName, itemPrice);
            });
        });
    }
};

// Pagination Management
const Pagination = {
    setup() {
        DOM.prevBtn.addEventListener('click', () => this.changePage(AppState.currentPage - 1));
        DOM.nextBtn.addEventListener('click', () => this.changePage(AppState.currentPage + 1));
        this.updateControls();
    },

    changePage(page) {
        const totalPages = Math.ceil(AppState.filteredMenuItems.length / AppState.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        
        AppState.currentPage = page;
        MenuManager.renderCurrentPage();
        this.updateControls();
    },

    updateControls() {
        const totalPages = Math.ceil(AppState.filteredMenuItems.length / AppState.itemsPerPage);
        
        if (totalPages > 1) {
            DOM.pagination.classList.remove('hidden');
            DOM.pagination.style.display = 'flex';
        } else {
            DOM.pagination.classList.add('hidden');
            DOM.pagination.style.display = 'none';
            return;
        }
        
        DOM.pageInfo.textContent = `Page ${AppState.currentPage} of ${totalPages}`;
        DOM.prevBtn.disabled = AppState.currentPage === 1;
        DOM.nextBtn.disabled = AppState.currentPage === totalPages;
        DOM.prevBtn.style.opacity = DOM.prevBtn.disabled ? '0.5' : '1';
        DOM.nextBtn.style.opacity = DOM.nextBtn.disabled ? '0.5' : '1';
    }
};

// Category Filter Management
const CategoryFilters = {
    initialize() {
        const categoryButtons = document.querySelectorAll('.category-btn');
        const activeCategoryDisplay = document.querySelector('.active-category');
        
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.getAttribute('data-category');
                
                // Update active button
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update display
                const categoryNames = {
                    'all': 'All Items',
                    'appetizers': 'Appetizers',
                    'main': 'Main Courses',
                    'beverages': 'Beverages',
                    'desserts': 'Desserts'
                };
                activeCategoryDisplay.textContent = `Showing: ${categoryNames[category]}`;
                
                // Load category
                this.loadCategoryItems(category);
            });
        });
    },

    async loadCategoryItems(category) {
        AppState.currentCategory = category;
        DOM.menuContainer.innerHTML = MenuManager.createLoadingSpinner();
        
        if (category === 'all') {
            AppState.filteredMenuItems = AppState.allMenuItems;
            MenuManager.renderCurrentPage();
            Pagination.updateControls();
        } else {
            try {
                const items = await Utils.fetchWithFallback(`${Config.API_BASE}/menu/${category}`);
                AppState.filteredMenuItems = items || AppState.allMenuItems.filter(item => item.category === category);
                MenuManager.renderCurrentPage();
                Pagination.updateControls();
            } catch (error) {
                console.error('Error loading category items:', error);
                AppState.filteredMenuItems = AppState.allMenuItems.filter(item => item.category === category);
                MenuManager.renderCurrentPage();
                Pagination.updateControls();
            }
        }
    }
};

// Search Functionality
const SearchManager = {
    init() {
        const searchInput = document.querySelector('.search-input');
        const searchContainer = document.querySelector('.search-container');
        const searchIcon = document.querySelector('.search-icon');

        searchIcon.addEventListener('click', () => {
            searchContainer.classList.add('expanded');
            searchInput.focus();
        });

        searchInput.addEventListener('input', Utils.debounce(this.handleSearch.bind(this), 300));

        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target) && searchInput.value.trim() === '') {
                searchContainer.classList.remove('expanded');
            }
        });
    },

    handleSearch() {
        const searchTerm = this.value.trim().toLowerCase();

        if (searchTerm.length === 0) {
            this.clearSearchResults();
            return;
        }

        // Admin access check
        if (searchTerm === 'admin') {
            this.handleAdminAccess();
            return;
        }

        const searchResults = AppState.allMenuItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            (item.category && item.category.toLowerCase().includes(searchTerm))
        );

        AppState.filteredMenuItems = searchResults;
        AppState.currentPage = 1;
        MenuManager.renderCurrentPage();
        Pagination.updateControls();
        this.displaySearchResults(searchResults, searchTerm);
    },

    clearSearchResults() {
        document.getElementById('search-results-container')?.remove();
        DOM.menuContainer.style.display = 'grid';
        CategoryFilters.loadCategoryItems(AppState.currentCategory);
    },

    handleAdminAccess() {
        this.value = '';
        const password = prompt('Enter admin password:');
        if (password === '1234') {
            localStorage.setItem('adminAuthenticated', 'true');
            window.location.href = "admin.html";
        } else {
            alert('Invalid admin password');
        }
    },

    displaySearchResults(results, searchTerm) {
        DOM.menuContainer.style.display = 'none';
        document.getElementById('search-results-container')?.remove();

        const searchResultsContainer = document.createElement('div');
        searchResultsContainer.id = 'search-results-container';
        searchResultsContainer.className = 'search-results';

        if (results.length > 0) {
            searchResultsContainer.innerHTML = `
                <h3>Search Results for "${searchTerm}" (${results.length} items found)</h3>
                <div class="card-grid">
                    ${results.map(item => this.createSearchResultCard(item, searchTerm)).join('')}
                </div>
            `;
        } else {
            searchResultsContainer.innerHTML = `
                <p class="no-results">No menu items found for "${searchTerm}". Try different keywords.</p>
            `;
        }

        document.getElementById('menu').appendChild(searchResultsContainer);
        MenuManager.attachOrderButtonListeners();
    },

    createSearchResultCard(item, searchTerm) {
        const highlightedName = Utils.highlightText(item.name, searchTerm);
        const highlightedDescription = Utils.highlightText(item.description, searchTerm);

        return `
            <div class="card">
                <img src="${item.image}" alt="${item.name}" class="card-img">
                <div class="card-content">
                    <h3 class="card-title">${highlightedName}</h3>
                    <p class="card-text">${highlightedDescription}</p>
                    <div class="card-footer">
                        <p class="price">M${item.price.toFixed(2)}</p>
                        <button class="card-btn order-btn" 
                                data-id="${item.id}" 
                                data-name="${item.name}" 
                                data-price="${item.price}">
                            Order Now
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
};

// Modal Management
const ModalManager = {
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('visible');
    },

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('visible');
    },

    setupModal(modalId, closeButtonId) {
        const modal = document.getElementById(modalId);
        const closeBtn = document.getElementById(closeButtonId);

        closeBtn.addEventListener('click', () => this.hideModal(modalId));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideModal(modalId);
        });
    }
};

// Order Modal
const OrderModal = {
    show(itemId, itemName, itemPrice) {
        AppState.currentOrderItem = { id: itemId, name: itemName, price: itemPrice };

        const orderModal = document.getElementById('orderModal');
        const orderModalTitle = document.getElementById('orderModalTitle');
        const orderTotal = document.getElementById('orderTotal');

        orderModalTitle.textContent = `Order ${itemName}`;
        orderTotal.textContent = itemPrice.toFixed(2);

        const orderForm = document.getElementById('orderForm');
        orderForm.reset();
        document.getElementById('orderQuantity').value = 1;

        // Quantity change handler
        document.getElementById('orderQuantity').addEventListener('input', function () {
            const quantity = parseInt(this.value) || 1;
            orderTotal.textContent = (itemPrice * quantity).toFixed(2);
        });

        ModalManager.showModal('orderModal');
    },

    setup() {
        ModalManager.setupModal('orderModal', 'orderModalClose');
        
        document.getElementById('orderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleOrderSubmit();
        });
    },

    async handleOrderSubmit() {
        if (!AppState.currentOrderItem) return;

        const orderData = {
            customer_name: document.getElementById('orderName').value,
            customer_email: document.getElementById('orderEmail').value,
            customer_phone: document.getElementById('orderPhone').value,
            items: [{
                id: AppState.currentOrderItem.id,
                name: AppState.currentOrderItem.name,
                price: AppState.currentOrderItem.price,
                quantity: parseInt(document.getElementById('orderQuantity').value) || 1
            }],
            total_amount: AppState.currentOrderItem.price * (parseInt(document.getElementById('orderQuantity').value) || 1)
        };

        try {
            const response = await fetch(`${Config.API_BASE}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            
            const data = await response.json();
            Utils.showToast(`Order placed successfully! Your Order ID: ${data.id}`);
            ModalManager.hideModal('orderModal');
            document.getElementById('orderForm').reset();
        } catch (error) {
            console.error('Error placing order:', error);
            Utils.showToast('Error placing order. Please try again.');
        }
    }
};

// Form Handlers
const FormHandlers = {
    async handleReservation(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            guests: document.getElementById('guests').value
        };

        try {
            const response = await fetch(`${Config.API_BASE}/reservations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            await response.json();
            Utils.showToast('Reservation submitted successfully!');
            document.getElementById('reservationForm').reset();
            ModalManager.hideModal('reservationModal');
        } catch (error) {
            console.error('Error submitting reservation:', error);
            Utils.showToast('Error submitting reservation. Please try again.');
        }
    },

    async handleContact(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            message: document.getElementById('contactMessage').value
        };

        try {
            const response = await fetch(`${Config.API_BASE}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            if (data.success) {
                Utils.showToast('Your message has been sent successfully!');
                document.getElementById('contactForm').reset();
            } else {
                Utils.showToast('Error sending message. Please try again.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            Utils.showToast('Error sending message. Please try again.');
        }
    }
};

// Navigation Management
const NavigationManager = {
    handleNavItemClick(target) {
        DOM.menuBtn.classList.remove('active');
        DOM.navMenu.classList.remove('active');

        this.updateBottomNavActiveState(target);

        switch (target) {
            case 'welcome':
            case 'menu':
            case 'contact':
            case 'about':
            case 'location':
                Utils.scrollToSection(target);
                break;
            case 'gallery':
                Gallery.show();
                break;
            case 'special-offers':
                SpecialOffers.show();
                break;
            case 'order-tracking':
                OrderTracking.showModal();
                break;
        }
    },

    updateBottomNavActiveState(target) {
        if (window.innerWidth <= 1024) {
            const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
            bottomNavItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-target') === target) {
                    item.classList.add('active');
                }
            });
        }
    },

    addLocationToNavigation() {
        const navItems = document.querySelector('.nav-items');
        const locationNavItem = document.createElement('div');
        locationNavItem.className = 'nav-item';
        locationNavItem.setAttribute('data-target', 'location');
        locationNavItem.innerHTML = `
            <div class="nav-icon"><i class="fas fa-map-marker-alt"></i></div>
            <div class="nav-text">Find Us</div>
        `;
        
        const themeToggle = document.querySelector('.theme-toggle');
        navItems.insertBefore(locationNavItem, themeToggle);
        
        locationNavItem.addEventListener('click', () => {
            this.handleNavItemClick('location');
        });
    }
};

// Gallery Management
const Gallery = {
    show() {
        this.clearPreviousContainers();
        DOM.menuContainer.style.display = 'none';

        const restaurantImages = [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
        ];

        const allGalleryImages = [...restaurantImages, ...AppState.allMenuItems.map(item => item.image)];

        const galleryContainer = document.createElement('div');
        galleryContainer.id = 'gallery-container';
        galleryContainer.className = 'search-results';
        galleryContainer.innerHTML = this.createGalleryHTML(allGalleryImages);

        document.getElementById('menu').appendChild(galleryContainer);
        this.attachGalleryEventListeners(galleryContainer);
        galleryContainer.scrollIntoView({ behavior: 'smooth' });
    },

    createGalleryHTML(images) {
        return `
            <h3>Our Restaurant Gallery</h3>
            <div style="text-align: center; margin-top: 30px;">
                <button id="closeGalleryBtn" class="card-btn">Close Gallery</button>
            </div>
            <p style="text-align: center; margin-bottom: 30px;">Take a visual tour of our restaurant and delicious dishes</p>
            <div class="gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin: 30px 0;">
                ${images.map((image, index) => `
                    <div class="gallery-item" style="border-radius: 12px; overflow: hidden; box-shadow: 0 6px 12px rgba(0,0,0,0.1); transition: transform 0.3s ease; cursor: pointer;">
                        <img src="${image}" alt="Gallery image ${index + 1}" style="width: 100%; height: 200px; object-fit: cover;">
                    </div>
                `).join('')}
            </div>
            <div style="text-align: center; margin-top: 30px;">
                <button id="closeGalleryBtn" class="card-btn">Close Gallery</button>
            </div>
        `;
    },

    attachGalleryEventListeners(container) {
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'scale(1.05)';
                item.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'scale(1)';
                item.style.boxShadow = '0 6px 12px rgba(0,0,0,0.1)';
            });

            item.addEventListener('click', () => {
                const imgSrc = item.querySelector('img').src;
                this.showEnlargedImage(imgSrc);
            });
        });

        document.getElementById('closeGalleryBtn').addEventListener('click', () => {
            container.remove();
            DOM.menuContainer.style.display = 'grid';
        });
    },

    showEnlargedImage(src) {
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

        overlay.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
    },

    clearPreviousContainers() {
        document.getElementById('search-results-container')?.remove();
        document.getElementById('gallery-container')?.remove();
        document.getElementById('offers-container')?.remove();
    }
};

// Special Offers Management
const SpecialOffers = {
    async show() {
        this.clearPreviousContainers();
        DOM.menuContainer.style.display = 'none';

        try {
            const response = await fetch(`${Config.API_BASE}/special-offers`);
            let specialOffers = await response.json();
            
            if (!specialOffers.length) {
                specialOffers = AppState.allMenuItems.filter(item => item.price < 20);
            }

            this.displaySpecialOffers(specialOffers);
        } catch (error) {
            console.error('Error fetching special offers:', error);
            const specialOffers = AppState.allMenuItems.filter(item => item.price < 20);
            this.displaySpecialOffers(specialOffers);
        }
    },

    displaySpecialOffers(offers) {
        const offersContainer = document.createElement('div');
        offersContainer.id = 'offers-container';
        offersContainer.className = 'search-results';
        offersContainer.innerHTML = this.createOffersHTML(offers);

        const specialOffersSection = document.getElementById('special-offers');
        const originalHeading = specialOffersSection.querySelector('h2');
        specialOffersSection.insertBefore(offersContainer, originalHeading.nextSibling);

        this.attachOffersEventListeners(offersContainer, originalHeading);
        offersContainer.scrollIntoView({ behavior: 'smooth' });
    },

    createOffersHTML(offers) {
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0;">Special Offers</h3>
                <button id="closeOffersBtn" class="card-btn" style="background: #e74c3c;">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
            <p style="text-align: center; margin-bottom: 20px;">Enjoy our specially priced menu items!</p>
            <div class="card-grid">
                ${offers.map(offer => `
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
    },

    attachOffersEventListeners(container, originalHeading) {
        document.getElementById('closeOffersBtn').addEventListener('click', () => {
            container.remove();
            DOM.menuContainer.style.display = 'grid';
            originalHeading.style.display = 'none';
        });

        MenuManager.attachOrderButtonListeners();
    },

    clearPreviousContainers() {
        document.getElementById('search-results-container')?.remove();
        document.getElementById('gallery-container')?.remove();
        document.getElementById('offers-container')?.remove();
    }
};

// Order Tracking
const OrderTracking = {
    setup() {
        document.getElementById('trackOrderBtn').addEventListener('click', this.trackOrder.bind(this));
        document.getElementById('confirmDeliveryBtn').addEventListener('click', this.confirmDelivery.bind(this));
        ModalManager.setupModal('orderTrackingModal', 'orderTrackingModalClose');
    },

    showModal() {
        document.body.classList.add('modal-open');
        const modal = document.getElementById('orderTrackingModal');
        modal.style.display = 'flex';
        modal.classList.add('visible');

        // Clear previous results
        document.getElementById('orderTrackingResult').style.display = 'none';
        document.getElementById('orderConfirmationSection').style.display = 'none';
        document.getElementById('orderTrackingId').value = '';
    },

    hideModal() {
        document.body.classList.remove('modal-open');
        const modal = document.getElementById('orderTrackingModal');
        modal.style.display = 'none';
        modal.classList.remove('visible');
    },

    async trackOrder() {
        const email = document.getElementById('orderTrackingEmail').value.trim();
        
        if (!email) {
            Utils.showToast('Please enter your email address');
            return;
        }
        
        try {
            const response = await fetch(`${Config.API_BASE}/admin/orders`);
            const orders = await response.json();
            const userOrders = orders.filter(order => 
                order.customer_email.toLowerCase() === email.toLowerCase()
            );
            
            this.displayOrderResults(userOrders, email);
        } catch (error) {
            console.error('Error fetching orders:', error);
            Utils.showToast('Error finding orders. Please try again.');
        }
    },

    displayOrderResults(userOrders, email) {
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
        
        resultDiv.innerHTML = `
            <h4>Your Orders (${userOrders.length})</h4>
            ${userOrders.map(order => this.createOrderCard(order)).join('')}
        `;
        
        this.attachDeliveryConfirmationListeners();
    },

    createOrderCard(order) {
        const items = JSON.parse(order.items);
        const itemsText = items.map(item => `${item.name} (x${item.quantity})`).join(', ');
        const canConfirmDelivery = order.status === 'out-for-delivery';
        
        return `
            <div style="border: 1px solid #ccc; padding: 15px; margin: 10px 0; border-radius: 8px;">
                <p><strong>Order #${order.id}</strong></p>
                <p><strong>Items:</strong> ${itemsText}</p>
                <p><strong>Total:</strong> M${order.total_amount}</p>
                <p><strong>Status:</strong> <span class="status-${order.status}">${this.getStatusText(order.status)}</span></p>
                <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                ${canConfirmDelivery ? 
                    `<button class="card-btn confirm-delivery-btn" data-order-id="${order.id}" 
                        style="background: #27ae60; color: white; margin-top: 10px;">
                        Confirm Delivery Received
                    </button>` : ''
                }
            </div>
        `;
    },

    attachDeliveryConfirmationListeners() {
        document.querySelectorAll('.confirm-delivery-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = btn.getAttribute('data-order-id');
                this.confirmDelivery(orderId);
            });
        });
    },

    async confirmDelivery(orderId) {
        if (!orderId) {
            Utils.showToast('No order selected');
            return;
        }
        
        try {
            const response = await fetch(`${Config.API_BASE}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'delivered' })
            });
            
            const data = await response.json();
            if (data.success) {
                Utils.showToast('Order delivery confirmed! Thank you for your order.');
                this.trackOrder();
            } else {
                Utils.showToast('Error confirming delivery');
            }
        } catch (error) {
            console.error('Error confirming delivery:', error);
            Utils.showToast('Error confirming delivery');
        }
    },

    getStatusText(status) {
        const statusMap = {
            'pending': 'Pending',
            'preparing': 'Being Prepared',
            'ready': 'Ready for Pickup',
            'out-for-delivery': 'Out for Delivery',
            'delivered': 'Delivered'
        };
        return statusMap[status] || status;
    }
};

// Location Services
const LocationService = {
    init() {
        this.loadGoogleMaps();
        
        document.getElementById('getDirectionsBtn').addEventListener('click', this.openGoogleMaps);
        document.getElementById('useCurrentLocation').addEventListener('click', this.getCurrentLocation);
        document.getElementById('calculateRoute').addEventListener('click', this.calculateRoute);
    },

    loadGoogleMaps() {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${Config.MAPS_API_KEY}&callback=LocationService.initMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    },

    initMap() {
        const restaurantLocation = { lat: -26.2041, lng: 28.0473 };
        
        AppState.map = new google.maps.Map(document.getElementById('map'), {
            zoom: 15,
            center: restaurantLocation
        });
        
        AppState.directionsService = new google.maps.DirectionsService();
        AppState.directionsRenderer = new google.maps.DirectionsRenderer();
        AppState.directionsRenderer.setMap(AppState.map);
        
        // Add restaurant marker
        new google.maps.Marker({
            position: restaurantLocation,
            map: AppState.map,
            title: 'Savory Delights Restaurant',
            icon: { url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' }
        });
    },

    getCurrentLocation() {
        if (!navigator.geolocation) {
            Utils.showToast('Geolocation is not supported by your browser');
            return;
        }
        
        Utils.showToast('Getting your location...');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                this.reverseGeocode(userLocation);
                this.updateUserMarker(userLocation);
                AppState.map.setCenter(userLocation);
                AppState.map.setZoom(13);
            },
            (error) => {
                const errorMessage = this.getGeolocationError(error);
                Utils.showToast(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    },

    getGeolocationError(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                return 'Location access denied. Please enable location services.';
            case error.POSITION_UNAVAILABLE:
                return 'Location information unavailable.';
            case error.TIMEOUT:
                return 'Location request timed out.';
            default:
                return 'Unable to get your location';
        }
    },

    reverseGeocode(location) {
        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({ location }, (results, status) => {
            if (status === 'OK' && results[0]) {
                document.getElementById('userLocation').value = results[0].formatted_address;
            } else {
                document.getElementById('userLocation').value = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
            }
        });
    },

    updateUserMarker(location) {
        if (AppState.userMarker) {
            AppState.userMarker.setPosition(location);
        } else {
            AppState.userMarker = new google.maps.Marker({
                position: location,
                map: AppState.map,
                title: 'Your Location',
                icon: { url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' }
            });
        }
    },

    calculateRoute() {
        const userLocationInput = document.getElementById('userLocation').value.trim();
        
        if (!userLocationInput) {
            Utils.showToast('Please enter your location or use current location');
            return;
        }
        
        const restaurantLocation = { lat: -26.2041, lng: 28.0473 };
        
        const request = {
            origin: userLocationInput,
            destination: restaurantLocation,
            travelMode: google.maps.TravelMode.DRIVING
        };
        
        AppState.directionsService.route(request, (result, status) => {
            if (status === 'OK') {
                AppState.directionsRenderer.setDirections(result);
                this.displayRouteInfo(result);
            } else {
                Utils.showToast('Unable to calculate route. Please check your location.');
            }
        });
    },

    displayRouteInfo(result) {
        const route = result.routes[0].legs[0];
        const distance = route.distance.text;
        const duration = route.duration.text;
        
        document.getElementById('routeDetails').innerHTML = `
            <strong>Distance:</strong> ${distance}<br>
            <strong>Estimated Time:</strong> ${duration}<br>
            <strong>Address:</strong> 123 Gourmet Street, Foodville
        `;
        document.getElementById('routeInfo').style.display = 'block';
    },

    openGoogleMaps() {
        const url = `https://www.google.com/maps/dir/?api=1&destination=123+Gourmet+Street+Foodville`;
        window.open(url, '_blank');
    }
};

// Theme Management
const ThemeManager = {
    init() {
        DOM.themeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        });

        // Check for saved theme preference
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
            DOM.themeToggle.checked = true;
        }
    }
};

// Event Listeners Setup
const EventManager = {
    setup() {
        this.setupNavigation();
        this.setupModals();
        this.setupForms();
        this.setupScrollEvents();
        this.setupMenuButton();
        SearchManager.init();
    },

    setupNavigation() {
        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            if (!item.classList.contains('theme-toggle')) {
                item.addEventListener('click', () => {
                    const target = item.getAttribute('data-target');
                    NavigationManager.handleNavItemClick(target);
                    DOM.menuBtn.classList.remove('active');
                    DOM.navMenu.classList.remove('active');
                });
            }
        });

        // Bottom navigation
        const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
        bottomNavItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const target = item.getAttribute('data-target');
                NavigationManager.handleNavItemClick(target);

                // Update active state
                bottomNavItems.forEach(navItem => navItem.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // Mobile navigation closing
        document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    DOM.menuBtn.classList.remove('active');
                    DOM.navMenu.classList.remove('active');
                }
            });
        });
    },

    setupModals() {
        ModalManager.setupModal('reservationModal', 'modalClose');
        OrderModal.setup();
        OrderTracking.setup();

        // Reservation button
        document.getElementById('reservationBtn').addEventListener('click', () => {
            ModalManager.showModal('reservationModal');
        });
    },

    setupForms() {
        document.getElementById('reservationForm').addEventListener('submit', FormHandlers.handleReservation);
        document.getElementById('contactForm').addEventListener('submit', FormHandlers.handleContact);
    },

    setupScrollEvents() {
        window.addEventListener('scroll', () => {
            this.updateProgressBar();
            this.updateBottomNavOnScroll();
        });
    },

    updateProgressBar() {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercent = (scrollTop / scrollHeight) * 100;
        DOM.progressBar.style.width = scrollPercent + '%';
    },

    updateBottomNavOnScroll() {
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

            const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
            bottomNavItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-target') === currentSection) {
                    item.classList.add('active');
                }
            });
        }
    },

    setupMenuButton() {
        DOM.menuBtn.addEventListener('click', () => {
            DOM.menuBtn.classList.toggle('active');
            DOM.navMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!DOM.navMenu.contains(e.target) && !DOM.menuBtn.contains(e.target)) {
                DOM.menuBtn.classList.remove('active');
                DOM.navMenu.classList.remove('active');
            }
        });
    }
};

// Main Initialization
document.addEventListener('DOMContentLoaded', function () {
    // Initialize all modules
    MenuManager.fetchMenuItems();
    EventManager.setup();
    Pagination.setup();
    OrderTracking.setup();
    NavigationManager.addLocationToNavigation();
    LocationService.init();
    ThemeManager.init();

    // Hide special offers heading
    const specialOffersHeading = document.querySelector('#special-offers h2');
    if (specialOffersHeading) {
        specialOffersHeading.style.display = 'none';
    }

    // Show welcome toast
    Utils.showToast('Welcome to Savory Delights!');
});