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

const Config = {
    API_BASE: "https://res-site-backend.onrender.com/api",
    MAPS_API_KEY: "YOUR_GOOGLE_MAPS_API_KEY"
};

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

const Utils = {
    async fetchWithFallback(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('API call failed, using fallback:', error);
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

const MenuManager = {
    async fetchMenuItems() {
        DOM.menuContainer.innerHTML = this.createLoadingSpinner();

        const menuItems = await Utils.fetchWithFallback(`${Config.API_BASE}/menu`);

        if (menuItems && Array.isArray(menuItems)) {
            AppState.allMenuItems = menuItems;
            AppState.filteredMenuItems = menuItems;
            AppState.currentPage = 1;
            this.renderCurrentPage();
            Pagination.updateControls();
            CategoryFilters.initialize();
        } else {
            this.loadSampleMenu();
        }
    },

    loadSampleMenu() {
        DOM.menuContainer.innerHTML = this.createLoadingSpinner();

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
        AppState.currentPage = 1;
        this.renderCurrentPage();
        Pagination.updateControls();
        CategoryFilters.initialize();
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

        // Attach listeners AFTER rendering
        this.attachOrderButtonListeners();
        this.attachSeeMoreListeners(); // Attach see more button listeners
        SeeMore.truncateMenuDescriptions(); // Scoped: Apply truncation only to menu cards

        EnlargedImageManager.attachImageClickListeners();
    },

    createMenuItemCard(item) {
        return `
            <div class="card menu-card">
                <img src="${item.image}" alt="${item.name}" class="card-img">
                <div class="card-content">
                    <h3 class="card-title">${item.name}</h3>
                    <p class="card-text" id="desc-${item.id}">${item.description}</p>
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
            // Remove existing listeners to prevent duplicates (clone trick)
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener('click', () => {
                const itemId = newButton.getAttribute('data-id');
                const itemName = newButton.getAttribute('data-name');
                const itemPrice = parseFloat(newButton.getAttribute('data-price'));
                OrderModal.show(itemId, itemName, itemPrice);
            });
        });
    },

    // Attach listeners to dynamically created "see more" buttons
    attachSeeMoreListeners() {
        document.querySelectorAll('.see-more-btn').forEach(button => {
            button.addEventListener('click', () => SeeMore.toggleText(button));
        });
    }
};

const EnlargedImageManager = {
    setup() {
        // Create and append the modal to the body
        this.createModal();
        this.setupEventListeners();
    },

    createModal() {
        // Check if modal already exists
        if (document.getElementById('enlargedImageModal')) {
            return;
        }

        const modalHTML = `
            <div class="enlarged-image-modal" id="enlargedImageModal">
                <div class="enlarged-image-content">
                    <button class="enlarged-image-close" id="enlargedImageClose">
                        <i class="fas fa-times"></i>
                    </button>
                    <img class="enlarged-image" id="enlargedImage" src="" alt="Enlarged view">
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    setupEventListeners() {
        const modal = document.getElementById('enlargedImageModal');
        const closeBtn = document.getElementById('enlargedImageClose');
        const image = document.getElementById('enlargedImage');

        // Close modal when clicking close button
        closeBtn.addEventListener('click', () => this.hide());

        // Close modal when clicking outside the image
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hide();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('visible')) {
                this.hide();
            }
        });

        // Prevent closing when clicking on the image itself
        image.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    },

    show(imageSrc, imageAlt) {
        const modal = document.getElementById('enlargedImageModal');
        const image = document.getElementById('enlargedImage');

        image.src = imageSrc;
        image.alt = imageAlt || 'Enlarged menu item';

        modal.classList.add('visible');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    },

    hide() {
        const modal = document.getElementById('enlargedImageModal');
        const image = document.getElementById('enlargedImage');

        modal.classList.remove('visible');
        document.body.style.overflow = ''; // Restore scrolling

        // Clear the image source after transition
        setTimeout(() => {
            image.src = '';
        }, 300);
    },

    attachImageClickListeners() {
        // Attach click listeners to all menu card images
        document.querySelectorAll('.card-img').forEach(img => {
            // Remove any existing listeners to prevent duplicates
            img.removeEventListener('click', this.handleImageClick);
            // Add new listener
            img.addEventListener('click', this.handleImageClick.bind(this));
        });
    },

    handleImageClick(e) {
        const img = e.target;
        const src = img.src;
        const alt = img.alt;

        this.show(src, alt);
    }
};

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
        Utils.scrollToSection('menu');
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

const CategoryFilters = {
    initialize() {
        const categoryButtons = document.querySelectorAll('.category-btn');

        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.getAttribute('data-category');

                categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const categoryNames = {
                    'all': 'All Items',
                    'appetizers': 'Appetizers',
                    'main': 'Main Courses',
                    'beverages': 'Beverages',
                    'desserts': 'Desserts'
                };

                this.loadCategoryItems(category);
            });
        });
    },

    loadCategoryItems(category) {
        AppState.currentCategory = category;

        DOM.menuContainer.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>
        `;

        if (category === 'all') {
            AppState.filteredMenuItems = AppState.allMenuItems;
            AppState.currentPage = 1;
            MenuManager.renderCurrentPage();
            Pagination.updateControls();
        } else {
            fetch(`${Config.API_BASE}/menu/${category}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(items => {
                    AppState.filteredMenuItems = items;
                    AppState.currentPage = 1;
                    MenuManager.renderCurrentPage();
                    Pagination.updateControls();

                    if (items.length === 0) {
                        DOM.menuContainer.innerHTML = MenuManager.createNoResultsMessage();
                    }
                })
                .catch(error => {
                    console.error('Error loading category items:', error);
                    AppState.filteredMenuItems = AppState.allMenuItems.filter(item => item.category === category);
                    AppState.currentPage = 1;
                    MenuManager.renderCurrentPage();
                    Pagination.updateControls();
                });
        }
    }
};

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

    handleSearch(e) {
        const searchTerm = e.target.value.trim().toLowerCase();

        if (searchTerm.length === 0) {
            document.getElementById('search-results-container')?.remove();
            DOM.menuContainer.style.display = 'grid';
            CategoryFilters.loadCategoryItems(AppState.currentCategory);
            return;
        }

        if (searchTerm === 'admin') {
            e.target.value = '';
            const password = prompt('Enter admin password:');
            if (password === '1234') {
                localStorage.setItem('adminAuthenticated', 'true');
                window.location.href = "admin.html";
            } else {
                alert('Invalid admin password');
            }
            return;
        }

        const filteredItems = AppState.allMenuItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            (item.category && item.category.toLowerCase().includes(searchTerm))
        );

        AppState.filteredMenuItems = filteredItems;
        AppState.currentPage = 1;
        MenuManager.renderCurrentPage();
        Pagination.updateControls();

        this.displaySearchResults(filteredItems, searchTerm);

        const activeCategoryDisplay = document.querySelector('.active-category');
        activeCategoryDisplay.textContent = `Search Results: "${searchTerm}" (${filteredItems.length} items)`;
    },

    displaySearchResults(filteredItems, searchTerm) {
        DOM.menuContainer.style.display = 'none';
        document.getElementById('search-results-container')?.remove();

        const searchResultsContainer = document.createElement('div');
        searchResultsContainer.id = 'search-results-container';
        searchResultsContainer.className = 'search-results';

        if (filteredItems.length > 0) {
            searchResultsContainer.innerHTML = `
            <h3>Search Results for "${searchTerm}" (${filteredItems.length} items found)</h3>
            <div class="card-grid">
                ${filteredItems.map(item => {
                const highlightedName = Utils.highlightText(item.name, searchTerm);
                const highlightedDescription = Utils.highlightText(item.description, searchTerm);
                return `
                        <div class="card menu-card">
                            <img src="${item.image}" alt="${item.name}" class="card-img">
                            <div class="card-content">
                                <h3 class="card-title">${highlightedName}</h3>
                                <p class="card-text" id="desc-${item.id}">${highlightedDescription}</p>
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

        document.getElementById('menu').appendChild(searchResultsContainer);

        // Attach listeners AFTER rendering (scoped to menu/search)
        MenuManager.attachOrderButtonListeners();
        MenuManager.attachSeeMoreListeners();
        SeeMore.truncateMenuDescriptions(); // Scoped: Only menu cards

        EnlargedImageManager.attachImageClickListeners();
    }
};

const ModalManager = {
    show(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('visible');
    },

    hide(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('visible');
    },

    setupCloseListeners(modalId, closeButtonId) {
        const modal = document.getElementById(modalId);
        const closeBtn = document.getElementById(closeButtonId);

        closeBtn.addEventListener('click', () => this.hide(modalId));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hide(modalId);
        });
    }
};

const OrderModal = {
    show(itemId, itemName, itemPrice) {
        AppState.currentOrderItem = { id: itemId, name: itemName, price: itemPrice };

        const orderModalTitle = document.getElementById('orderModalTitle');
        const orderTotal = document.getElementById('orderTotal');

        orderModalTitle.textContent = `Order ${itemName}`;
        orderTotal.textContent = itemPrice.toFixed(2);

        const orderForm = document.getElementById('orderForm');
        orderForm.reset();
        document.getElementById('orderQuantity').value = 1;

        document.getElementById('orderQuantity').addEventListener('input', function () {
            const quantity = parseInt(this.value) || 1;
            orderTotal.textContent = (itemPrice * quantity).toFixed(2);
        });

        ModalManager.show('orderModal');
    },

    setup() {
        ModalManager.setupCloseListeners('orderModal', 'orderModalClose');
        document.getElementById('orderForm').addEventListener('submit', this.handleSubmit.bind(this));
    },

    async handleSubmit(e) {
        e.preventDefault();

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
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();
            Utils.showToast(`Order placed successfully! Your Order ID: ${data.id}`);
            ModalManager.hide('orderModal');
            document.getElementById('orderForm').reset();
            setTimeout(() => {
                document.getElementById('orderTrackingId').value = data.id;
            }, 500);
        } catch (error) {
            console.error('Error placing order:', error);
            Utils.showToast('Error placing order. Please try again.');
        }
    }
};

const ReservationModal = {
    setup() {
        document.getElementById('reservationBtn').addEventListener('click', () => ModalManager.show('reservationModal'));
        ModalManager.setupCloseListeners('reservationModal', 'modalClose');
        document.getElementById('reservationForm').addEventListener('submit', FormHandlers.handleReservation);
    }
};

const ContactForm = {
    setup() {
        document.getElementById('contactForm').addEventListener('submit', FormHandlers.handleContact);
    }
};

const Gallery = {
    show() {
        this.clearPreviousContainers();
        DOM.menuContainer.style.display = 'none';

        // Fetch gallery images from API
        fetch(`${Config.API_BASE}/gallery`)
            .then(response => response.json())
            .then(galleryImages => {
                const allGalleryImages = [
                    ...galleryImages.map(img => img.image_url),
                    ...AppState.allMenuItems.map(item => item.image)
                ];

                this.displayGallery(allGalleryImages);
            })
            .catch(error => {
                console.error('Error fetching gallery images:', error);
                // Fallback to default images
                const restaurantImages = [
                    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
                    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
                    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
                ];
                const allGalleryImages = [...restaurantImages, ...AppState.allMenuItems.map(item => item.image)];
                this.displayGallery(allGalleryImages);
            });
    },

    displayGallery(allGalleryImages) {
        this.clearPreviousContainers();
        DOM.menuContainer.style.display = 'none';

        const galleryContainer = document.createElement('div');
        galleryContainer.id = 'gallery-container';
        galleryContainer.className = 'search-results';
        galleryContainer.innerHTML = `
            <h3>Our Restaurant Gallery</h3>
            <div style="text-align: center; margin-top: 30px;">
                <button class="close-gallery-btn card-btn">Close Gallery</button>
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
                <button class="close-gallery-btn card-btn">Close Gallery</button>
            </div>
        `;

        document.getElementById('menu').appendChild(galleryContainer);

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
                    Gallery.showEnlargedImage(imgSrc);
                });
            });

            // Add close gallery button functionality
            document.querySelectorAll('.close-gallery-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    galleryContainer.remove();
                    DOM.menuContainer.style.display = 'grid';
                });
            });
        }, 100);

        galleryContainer.scrollIntoView({ behavior: 'smooth' });
    },

    showEnlargedImage(src) {
        EnlargedImageManager.show(src, 'Gallery image');

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
    },

    clearPreviousContainers() {
        document.getElementById('search-results-container')?.remove();
        document.getElementById('gallery-container')?.remove();
        document.getElementById('offers-container')?.remove();
    }
};

const SpecialOffers = {
    show() {
        const specialOffersSection = document.getElementById('special-offers');
        const originalHeading = specialOffersSection.querySelector('h2');
        originalHeading.style.display = 'block';

        this.clearPreviousContainers();
        DOM.menuContainer.style.display = 'none';

        fetch(`${Config.API_BASE}/special-offers`)
            .then(response => response.json())
            .then(specialOffers => {
                if (specialOffers.length === 0) {
                    specialOffers = AppState.allMenuItems.filter(item => item.price < 20);
                }

                this.displaySpecialOffers(specialOffers, specialOffersSection, originalHeading);
            })
            .catch(error => {
                console.error('Error fetching special offers:', error);
                const specialOffers = AppState.allMenuItems.filter(item => item.price < 20);
                this.displaySpecialOffers(specialOffers, specialOffersSection, originalHeading);
            });
    },

    displaySpecialOffers(specialOffers, section, heading) {
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

        section.insertBefore(offersContainer, heading.nextSibling);

        document.getElementById('closeOffersBtn').addEventListener('click', function () {
            offersContainer.remove();
            DOM.menuContainer.style.display = 'grid';
            heading.style.display = 'none';
        });

        MenuManager.attachOrderButtonListeners();

        offersContainer.scrollIntoView({ behavior: 'smooth' });
    },

    clearPreviousContainers() {
        document.getElementById('search-results-container')?.remove();
        document.getElementById('gallery-container')?.remove();
        document.getElementById('offers-container')?.remove();
    }
};

const OrderTracking = {
    setup() {
        document.getElementById('trackOrderBtn').addEventListener('click', this.trackOrder.bind(this));
        document.getElementById('confirmDeliveryBtn').addEventListener('click', this.confirmDelivery.bind(this));

        const orderTrackingModalClose = document.getElementById('orderTrackingModalClose');
        const closeOrderTrack = document.getElementById('closeOrderTrack');

        orderTrackingModalClose.addEventListener('click', this.hideModal.bind(this));
        closeOrderTrack.addEventListener('click', this.hideModal.bind(this));

        const orderTrackingModal = document.getElementById('orderTrackingModal');
        orderTrackingModal.addEventListener('click', (e) => {
            if (e.target === orderTrackingModal) {
                this.hideModal();
            }
        });
    },

    showModal() {
        const modal = document.getElementById('orderTrackingModal');
        document.body.classList.add('modal-open');
        modal.style.display = 'flex';
        modal.classList.add('visible');

        // Clear previous results
        document.getElementById('orderTrackingResult').style.display = 'none';
        document.getElementById('orderConfirmationSection').style.display = 'none';
        document.getElementById('orderTrackingId').value = '';
    },

    hideModal() {
        const modal = document.getElementById('orderTrackingModal');
        document.body.classList.remove('modal-open');
        modal.style.display = 'none';
        modal.classList.remove('visible');
    },

    trackOrder() {
        const email = document.getElementById('orderTrackingEmail').value.trim();

        if (!email) {
            Utils.showToast('Please enter your email address');
            return;
        }

        fetch(`${Config.API_BASE}/admin/orders`)
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
                                <p><strong>Status:</strong> <span class="status-${order.status}">${this.getStatusText(order.status)}</span></p>
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
                    btn.addEventListener('click', function () {
                        const orderId = this.getAttribute('data-order-id');
                        OrderTracking.confirmDelivery(orderId);
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching orders:', error);
                Utils.showToast('Error finding orders. Please try again.');
            });
    },

    confirmDelivery(orderId) {
        if (!orderId) {
            Utils.showToast('No order selected');
            return;
        }

        fetch(`${Config.API_BASE}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'delivered' })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Utils.showToast('Order delivery confirmed! Thank you for your order.');
                    // Refresh the orders list
                    this.trackOrder();
                } else {
                    Utils.showToast('Error confirming delivery');
                }
            })
            .catch(error => {
                console.error('Error confirming delivery:', error);
                Utils.showToast('Error confirming delivery');
            });
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

const LocationFeature = {
    initialize() {
        // Load Google Maps API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${Config.MAPS_API_KEY}&callback=initMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        // Setup event listeners
        document.getElementById('getDirectionsBtn').addEventListener('click', this.openGoogleMaps);
        document.getElementById('useCurrentLocation').addEventListener('click', this.getCurrentLocation);
        document.getElementById('calculateRoute').addEventListener('click', this.calculateRoute);
    },

    initMap() {
        // Restaurant coordinates (example coordinates for Foodville)
        const restaurantLocation = { lat: -26.2041, lng: 28.0473 }; // Johannesburg coordinates

        AppState.map = new google.maps.Map(document.getElementById('map'), {
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

        AppState.directionsService = new google.maps.DirectionsService();
        AppState.directionsRenderer = new google.maps.DirectionsRenderer();
        AppState.directionsRenderer.setMap(AppState.map);

        // Add restaurant marker
        new google.maps.Marker({
            position: restaurantLocation,
            map: AppState.map,
            title: 'Savory Delights Restaurant',
            icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }
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

                // Reverse geocode to get address
                this.reverseGeocode(userLocation);

                // Add/update user marker on map
                if (AppState.userMarker) {
                    AppState.userMarker.setPosition(userLocation);
                } else {
                    AppState.userMarker = new google.maps.Marker({
                        position: userLocation,
                        map: AppState.map,
                        title: 'Your Location',
                        icon: {
                            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                        }
                    });
                }

                // Center map on user location
                AppState.map.setCenter(userLocation);
                AppState.map.setZoom(13);
            },
            (error) => {
                console.error('Error getting location:', error);
                let errorMessage = 'Unable to get your location';

                switch (error.code) {
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

                Utils.showToast(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    },

    reverseGeocode(location) {
        const geocoder = new google.maps.Geocoder();

        geocoder.geocode({ location: location }, (results, status) => {
            if (status === 'OK' && results[0]) {
                document.getElementById('userLocation').value = results[0].formatted_address;
            } else {
                document.getElementById('userLocation').value = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
            }
        });
    },

    calculateRoute() {
        const userLocationInput = document.getElementById('userLocation').value.trim();

        if (!userLocationInput) {
            Utils.showToast('Please enter your location or use current location');
            return;
        }

        // Restaurant location (hardcoded for example)
        const restaurantLocation = { lat: -26.2041, lng: 28.0473 };

        const request = {
            origin: userLocationInput,
            destination: restaurantLocation,
            travelMode: google.maps.TravelMode.DRIVING
        };

        AppState.directionsService.route(request, (result, status) => {
            if (status === 'OK') {
                AppState.directionsRenderer.setDirections(result);

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
                Utils.showToast('Unable to calculate route. Please check your location.');
            }
        });
    },

    openGoogleMaps() {
        // Open Google Maps with restaurant location
        const url = `https://www.google.com/maps/dir/?api=1&destination=123+Gourmet+Street+Foodville`;
        window.open(url, '_blank');
    }
};

const Navigation = {
    handleItemClick(target) {
        DOM.menuBtn.classList.remove('active');
        DOM.navMenu.classList.remove('active');

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
                Utils.scrollToSection('welcome');
                break;
            case 'menu':
                Utils.scrollToSection('menu');
                break;
            case 'gallery':
                Gallery.show();
                loadGallery();
                setupGalleryUpload();
                break;
            case 'special-offers':
                SpecialOffers.show();
                break;
            case 'contact':
                Utils.scrollToSection('contact');
                break;
            case 'about':
                Utils.scrollToSection('about');
                break;
            case 'order-tracking':
                Utils.scrollToSection('order-tracking');
                const orderTrack = document.getElementById('order-tracking');
                orderTrack.style.display = 'flex';
                break;
            case 'location':
                Utils.scrollToSection('location');
                break;
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

        // Insert before the theme toggle
        const themeToggle = document.querySelector('.theme-toggle');
        navItems.insertBefore(locationNavItem, themeToggle);

        // Add click event
        locationNavItem.addEventListener('click', function () {
            Navigation.handleItemClick('location');
        });
    }
};

const EventListeners = {
    setup() {
        DOM.menuBtn.addEventListener('click', () => {
            const isOpening = !DOM.navMenu.classList.contains('active');
            DOM.navMenu.classList.toggle('active');
            DOM.menuBtn.classList.toggle('active');

            if (isOpening) {
                DOM.navMenu.style.removeProperty('right');
            }
        });

        // Theme toggle
        DOM.themeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        });

        // Check for saved dark mode preference
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
            DOM.themeToggle.checked = true;
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!DOM.navMenu.contains(e.target) && !DOM.menuBtn.contains(e.target)) {
                DOM.menuBtn.classList.remove('active');
                DOM.navMenu.classList.remove('active');
            }
        });

        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            if (!item.classList.contains('theme-toggle')) {
                item.addEventListener('click', () => {
                    const target = item.getAttribute('data-target');
                    Navigation.handleItemClick(target);
                    DOM.menuBtn.classList.remove('active');
                    DOM.navMenu.classList.remove('active');
                });
            }
        });

        // Order tracking nav item
        document.querySelector('.nav-item[data-target="order-tracking"]').addEventListener('click', OrderTracking.showModal);

        // Bottom navigation functionality
        const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
        bottomNavItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const target = item.getAttribute('data-target');
                Navigation.handleItemClick(target);

                // Update active state
                bottomNavItems.forEach(navItem => navItem.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // Set initial active state based on scroll position
        window.addEventListener('scroll', () => {
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

        // Reservation button
        document.getElementById('reservationBtn').addEventListener('click', () => ModalManager.show('reservationModal'));

        // Forms
        document.getElementById('reservationForm').addEventListener('submit', FormHandlers.handleReservation);
        document.getElementById('contactForm').addEventListener('submit', FormHandlers.handleContact);

        // Search functionality
        const searchInput = document.querySelector('.search-input');
        const searchContainer = document.querySelector('.search-container');
        const searchIcon = document.querySelector('.search-icon');

        searchIcon.addEventListener('click', () => {
            searchContainer.classList.add('expanded');
            searchInput.focus();
        });

        searchInput.addEventListener('input', SearchManager.handleSearch);

        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target) && searchInput.value.trim() === '') {
                searchContainer.classList.remove('expanded');
            }
        });

        // Scroll progress
        window.addEventListener('scroll', () => {
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollPercent = (scrollTop / scrollHeight) * 100;
            DOM.progressBar.style.width = scrollPercent + '%';
        });

        // Swipe-to-close functionality for nav menu
        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        DOM.navMenu.addEventListener('touchstart', (e) => {
            if (!DOM.navMenu.classList.contains('active')) return;
            startX = e.touches[0].clientX;
            isDragging = true;
            DOM.navMenu.style.transition = 'none'; // Disable transition for smooth drag
        });

        DOM.navMenu.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault(); // Prevent scrolling during drag
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            if (deltaX > 0) { // Only allow right swipe
                const translateX = Math.min(deltaX, -300); // Max swipe distance = menu width
                DOM.navMenu.style.right = `${translateX}px`;
            }
        });

        DOM.navMenu.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            const deltaX = currentX - startX;
            DOM.navMenu.style.transition = 'right 0.4s ease-in-out'; // Re-enable transition
            if (deltaX > 50) { // Threshold for closing (adjust as needed)
                DOM.navMenu.classList.remove('active');
                DOM.menuBtn.classList.remove('active');
                DOM.navMenu.style.right = '-300px'; // Ensure it slides fully out
            } else {
                DOM.navMenu.style.right = '0px'; // Snap back to open position
            }
            isDragging = false;

            // Clean up inline style after transition to let CSS class handle positioning
            setTimeout(() => {
                DOM.navMenu.style.removeProperty('right');
            }, 400);
        });
    }
};

const FormHandlers = {
    handleReservation(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            guests: document.getElementById('guests').value
        };

        fetch(`${Config.API_BASE}/reservations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                Utils.showToast('Reservation submitted successfully!');
                document.getElementById('reservationForm').reset();
                ModalManager.hide('reservationModal');
            })
            .catch(error => {
                console.error('Error submitting reservation:', error);
                Utils.showToast('Error submitting reservation. Please try again.');
            });
    },

    handleContact(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            message: document.getElementById('contactMessage').value
        };

        fetch(`${Config.API_BASE}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Utils.showToast('Your message has been sent successfully!');
                    document.getElementById('contactForm').reset();
                } else {
                    Utils.showToast('Error sending message. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error sending message:', error);
                Utils.showToast('Error sending message. Please try again.');
            });
    }
};

// Enhanced version with character limits (scoped to menu cards)
const SeeMore = {
    MOBILE_CHAR_LIMIT: 20,
    DESKTOP_CHAR_LIMIT: 120,

    init() {
        this.setupEventListeners();
        // Only truncate menu cards on init (static content doesn't need it)
        this.truncateMenuDescriptions();

        // Re-check on resize
        window.addEventListener('resize', this.debounce(() => {
            this.truncateMenuDescriptions();
        }, 250));
    },

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('see-more-btn')) {
                this.toggleText(e.target);
            }
        });
    },

    // Scoped: Only target menu cards
    truncateMenuDescriptions() {
        document.querySelectorAll('.menu-card .card-text').forEach(desc => {
            this.truncateDescription(desc);
        });
    },

    truncateDescription(desc) {
        const fullText = desc.getAttribute('data-full-text') || desc.textContent.trim();
        const charLimit = window.innerWidth <= 768 ? this.MOBILE_CHAR_LIMIT : this.DESKTOP_CHAR_LIMIT;

        if (fullText.length > charLimit) {
            const truncated = fullText.substring(0, charLimit) + '...';
            desc.textContent = truncated;
            desc.setAttribute('data-full-text', fullText);
            desc.classList.add('truncated');

            this.ensureSeeMoreButton(desc);
        } else {
            desc.classList.remove('truncated');
            this.removeSeeMoreButton(desc);
        }
    },

    ensureSeeMoreButton(desc) {
        // Remove any existing button first to prevent duplicates
        this.removeSeeMoreButton(desc);

        const button = document.createElement('button');
        button.className = 'see-more-btn';
        button.textContent = 'See more...';
        const descId = desc.id || `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Unique fallback ID
        button.setAttribute('data-target', descId);
        if (!desc.id) desc.id = descId;
        desc.parentNode.insertBefore(button, desc.nextSibling);
    },

    removeSeeMoreButton(desc) {
        let sibling = desc.nextElementSibling;
        while (sibling) {
            if (sibling.classList && sibling.classList.contains('see-more-btn')) {
                sibling.remove();
                break;
            }
            sibling = sibling.nextElementSibling;
        }
    },

    toggleText(button) {
        const descId = button.getAttribute('data-target');
        const desc = document.getElementById(descId);
        if (!desc) return; // Safety check

        const fullText = desc.getAttribute('data-full-text');

        if (desc.classList.contains('truncated')) {
            // Expand
            desc.textContent = fullText;
            desc.classList.remove('truncated');
            button.textContent = 'See less';
        } else {
            // Collapse
            this.truncateDescription(desc);
            button.textContent = 'See more...';
        }
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

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    MenuManager.fetchMenuItems();
    EnlargedImageManager.setup();
    SeeMore.init();
    EventListeners.setup();
    Pagination.setup();
    Navigation.addLocationToNavigation();
    LocationFeature.initialize();
    OrderModal.setup();
    ReservationModal.setup();
    ContactForm.setup();
    OrderTracking.setup();

    const specialOffersHeading = document.querySelector('#special-offers h2');
    if (specialOffersHeading) {
        specialOffersHeading.style.display = 'none';
    }

    Utils.showToast('Welcome to Savory Delights!');
});

// Gallery Management Functions
function loadGallery() {
    adminFetch('/gallery')
        .then(images => {
            const tbody = document.getElementById('galleryBody');
            tbody.innerHTML = '';

            if (images.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; color: #777;">
                            No gallery images found. Add your first image!
                        </td>
                    </tr>
                `;
                return;
            }

            images.forEach(image => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <img src="${image.image_url}" alt="${image.title}" 
                             style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px;">
                    </td>
                    <td>${image.title || 'Untitled'}</td>
                    <td>${image.description || '-'}</td>
                    <td>${image.category}</td>
                    <td>
                        <span style="color: ${image.is_active ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                            ${image.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>
                        <button class="card-btn toggle-gallery-btn" data-id="${image.id}" 
                                style="padding: 5px 10px; font-size: 12px; margin-right: 5px; 
                                       background: ${image.is_active ? '#e74c3c' : '#27ae60'}">
                            ${image.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="card-btn delete-gallery-btn" data-id="${image.id}" 
                                style="background: #e74c3c; padding: 5px 10px; font-size: 12px;">
                            Delete
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Add event listeners
            document.querySelectorAll('.toggle-gallery-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const imageId = this.getAttribute('data-id');
                    toggleGalleryImage(imageId);
                });
            });

            document.querySelectorAll('.delete-gallery-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const imageId = this.getAttribute('data-id');
                    deleteGalleryImage(imageId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading gallery images:', error);
            document.getElementById('galleryBody').innerHTML = `
                <tr><td colspan="6" style="text-align: center; color: #e74c3c;">Error loading gallery images</td></tr>
            `;
        });
}

function setupGalleryUpload() {
    const urlUploadBtn = document.getElementById('urlUploadBtn');
    const fileUploadBtn = document.getElementById('fileUploadBtn');
    const urlUploadForm = document.getElementById('urlUploadForm');
    const fileUploadForm = document.getElementById('fileUploadForm');
    const saveUrlImageBtn = document.getElementById('saveUrlImage');
    const uploadFileBtn = document.getElementById('uploadFileBtn');

    urlUploadBtn.addEventListener('click', () => {
        urlUploadForm.style.display = 'block';
        fileUploadForm.style.display = 'none';
        resetForms();
    });

    fileUploadBtn.addEventListener('click', () => {
        fileUploadForm.style.display = 'block';
        urlUploadForm.style.display = 'none';
        resetForms();
    });

    saveUrlImageBtn.addEventListener('click', saveUrlImage);
    uploadFileBtn.addEventListener('click', handleFileUpload);
}

function resetForms() {
    document.getElementById('imageUrl').value = '';
    document.getElementById('imageTitle').value = '';
    document.getElementById('imageDescription').value = '';
    document.getElementById('fileImageTitle').value = '';
    document.getElementById('fileImageDescription').value = '';
    document.getElementById('imageFile').value = '';
}

function saveUrlImage() {
    const imageUrl = document.getElementById('imageUrl').value;
    const title = document.getElementById('imageTitle').value;
    const description = document.getElementById('imageDescription').value;
    const category = document.getElementById('imageCategory').value;

    if (!imageUrl) {
        alert('Please enter an image URL');
        return;
    }

    const formData = {
        image_url: imageUrl,
        title: title,
        description: description,
        category: category
    };

    adminFetch('/gallery', {
        method: 'POST',
        body: JSON.stringify(formData)
    })
        .then(data => {
            if (data.success) {
                alert('Gallery image added successfully!');
                resetForms();
                loadGallery();
            } else {
                alert('Error adding gallery image: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error saving gallery image:', error);
            alert('Error adding gallery image');
        });
}

async function handleFileUpload() {
    const fileInput = document.getElementById('imageFile');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select an image file');
        return;
    }

    const title = document.getElementById('fileImageTitle').value;
    const description = document.getElementById('fileImageDescription').value;
    const category = document.getElementById('fileImageCategory').value;

    const formData = new FormData();
    formData.append('image', file);

    try {
        const progress = document.getElementById('uploadProgress');
        const progressBar = progress.querySelector('progress');
        const progressText = document.getElementById('progressText');

        progress.style.display = 'block';
        progressBar.value = 0;
        progressText.textContent = '0%';

        const response = await fetch(`${API_BASE}/admin/upload?password=1234`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            // Save the uploaded image to gallery
            const galleryData = {
                image_url: result.image_url,
                title: title,
                description: description,
                category: category
            };

            const saveResponse = await adminFetch('/gallery', {
                method: 'POST',
                body: JSON.stringify(galleryData)
            });

            if (saveResponse.success) {
                alert('Image uploaded and saved to gallery successfully!');
                resetForms();
                progress.style.display = 'none';
                loadGallery();
            } else {
                alert('Error saving image to gallery: ' + (saveResponse.error || 'Unknown error'));
            }
        } else {
            alert('Error uploading image: ' + result.error);
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading image');
    }
}

function toggleGalleryImage(imageId) {
    adminFetch(`/gallery/${imageId}/toggle`, { method: 'PUT' })
        .then(data => {
            if (data.success) {
                alert('Gallery image status updated successfully');
                loadGallery();
            } else {
                alert('Error updating gallery image: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error toggling gallery image:', error);
            alert('Error updating gallery image');
        });
}

function deleteGalleryImage(imageId) {
    if (confirm('Are you sure you want to delete this gallery image?')) {
        adminFetch(`/gallery/${imageId}`, { method: 'DELETE' })
            .then(data => {
                if (data.success) {
                    alert('Gallery image deleted successfully');
                    loadGallery();
                } else {
                    alert('Error deleting gallery image: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error deleting gallery image:', error);
                alert('Error deleting gallery image');
            });
    }
}