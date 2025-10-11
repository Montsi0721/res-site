// Admin JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is authenticated
    if (!localStorage.getItem('adminAuthenticated')) {
        window.location.href = '/';
        return;
    }

    // Setup event listeners
    setupAdminEventListeners();

    // Load initial data
    loadReservations();
});

const API_BASE = "https://res-site-backend.onrender.com/api";

// Helper function for admin API calls
async function adminFetch(endpoint, options = {}) {
    const url = `${API_BASE}/admin${endpoint}?password=1234`;

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Admin API error:', error);
        throw error;
    }
}

function setupAdminEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            // Remove active class from all buttons
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');

            // Hide all sections
            document.querySelectorAll('.admin-section').forEach(section => {
                section.classList.remove('active');
            });

            // Show target section
            const targetSection = this.getAttribute('data-section');
            const sectionElement = document.getElementById(targetSection + 'Section');

            // Check if section exists before trying to show it
            if (sectionElement) {
                sectionElement.classList.add('active');

                // Load data for the section
                switch (targetSection) {
                    case 'reservations':
                        loadReservations();
                        break;
                    case 'orders':
                        loadOrders();
                        break;
                    case 'contacts':
                        loadContacts();
                        break;
                    case 'menu':
                        loadMenu();
                        break;
                    case 'specialOffers':
                        loadSpecialOffers();
                        break;
                    case 'gallery':
                        loadGallery();
                        setupGalleryUpload();
                        break;
                    case 'analytics':
                        setupAnalyticsDashboard();
                        break;
                }
            } else {
                console.error('Section not found:', targetSection + 'Section');
            }
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function () {
        localStorage.removeItem('adminAuthenticated');
        window.location.href = '/';
    });

    // Add menu item button
    document.getElementById('addMenuItemBtn').addEventListener('click', function () {
        showMenuItemModal();
    });

    // Menu item modal
    const menuItemModal = document.getElementById('menuItemModal');
    if (menuItemModal) {
        document.getElementById('modalClose').addEventListener('click', function () {
            menuItemModal.classList.remove('visible');
        });

        document.getElementById('cancelMenuItemBtn').addEventListener('click', function () {
            menuItemModal.classList.remove('visible');
        });

        menuItemModal.addEventListener('click', function (e) {
            if (e.target === menuItemModal) {
                menuItemModal.classList.remove('visible');
            }
        });
    }

    // Special offers functionality
    const addSpecialOfferBtn = document.getElementById('addSpecialOfferBtn');
    if (addSpecialOfferBtn) {
        addSpecialOfferBtn.addEventListener('click', function () {
            showSpecialOfferModal();
        });
    }

    // Special offer modal
    const specialOfferModal = document.getElementById('specialOfferModal');
    if (specialOfferModal) {
        document.getElementById('specialOfferModalClose').addEventListener('click', function () {
            specialOfferModal.classList.remove('visible');
        });

        document.getElementById('cancelSpecialOfferBtn').addEventListener('click', function () {
            specialOfferModal.classList.remove('visible');
        });

        specialOfferModal.addEventListener('click', function (e) {
            if (e.target === specialOfferModal) {
                specialOfferModal.classList.remove('visible');
            }
        });
    }

    // Menu item form
    const menuItemForm = document.getElementById('menuItemForm');
    if (menuItemForm) {
        menuItemForm.addEventListener('submit', handleMenuItemSubmit);
    }

    // Special offer form
    const specialOfferForm = document.getElementById('specialOfferForm');
    if (specialOfferForm) {
        specialOfferForm.addEventListener('submit', handleSpecialOfferSubmit);
    }
}

function loadReservations() {
    adminFetch('/reservations')
        .then(reservations => {
            const tbody = document.getElementById('reservationsBody');
            tbody.innerHTML = '';

            if (reservations.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" style="text-align: center; color: #777;">
                            No reservations found
                        </td>
                    </tr>
                `;
                return;
            }

            reservations.forEach(reservation => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${reservation.id}</td>
                    <td>${reservation.name}</td>
                    <td>${reservation.email}</td>
                    <td>${reservation.phone}</td>
                    <td>${new Date(reservation.date).toLocaleDateString()}</td>
                    <td>${reservation.time}</td>
                    <td>${reservation.guests}</td>
                    <td>
                        <span class="status-badge status-${reservation.status}">
                            ${reservation.status}
                        </span>
                    </td>
                    <td>${new Date(reservation.created_at).toLocaleString()}</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading reservations:', error);
            document.getElementById('reservationsBody').innerHTML = `
                <tr><td colspan="9" style="text-align: center; color: #e74c3c;">Error loading reservations</td></tr>
            `;
        });
}

function loadOrders() {
    adminFetch('/orders')
        .then(orders => {
            const tbody = document.getElementById('ordersBody');
            tbody.innerHTML = '';

            if (orders.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; color: #777;">
                            No orders found
                        </td>
                    </tr>
                `;
                return;
            }

            orders.forEach(order => {
                let items;
                try {
                    items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                } catch (e) {
                    items = [{ name: 'Error parsing items', quantity: 1 }];
                }

                const itemsText = items.map(item => `${item.name} (x${item.quantity})`).join(', ');

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.id}</td>
                    <td>${order.customer_name}</td>
                    <td>${order.customer_email}</td>
                    <td title="${itemsText}">${itemsText.substring(0, 50)}${itemsText.length > 50 ? '...' : ''}</td>
                    <td>M${parseFloat(order.total_amount).toFixed(2)}</td>
                    <td>
                        <select class="status-select" data-order-id="${order.id}" style="padding: 5px; border-radius: 4px; border: 1px solid #ccc;">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                            <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready for Pickup</option>
                            <option value="out-for-delivery" ${order.status === 'out-for-delivery' ? 'selected' : ''}>Out for Delivery</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        </select>
                    </td>
                    <td>${new Date(order.created_at).toLocaleString()}</td>
                    <td>
                        <button class="card-btn update-status-btn" data-order-id="${order.id}" style="background: #3498db; color: white; padding: 5px 10px; font-size: 12px;">
                            Update
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Add event listeners to update buttons
            document.querySelectorAll('.update-status-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const orderId = this.getAttribute('data-order-id');
                    const select = document.querySelector(`.status-select[data-order-id="${orderId}"]`);
                    const newStatus = select.value;
                    updateOrderStatus(orderId, newStatus);
                });
            });
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            document.getElementById('ordersBody').innerHTML = `
                <tr><td colspan="8" style="text-align: center; color: #e74c3c;">Error loading orders</td></tr>
            `;
        });
}

function loadContacts() {
    adminFetch('/contacts')
        .then(contacts => {
            const tbody = document.getElementById('contactsBody');
            tbody.innerHTML = '';

            if (contacts.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; color: #777;">
                            No contact messages found
                        </td>
                    </tr>
                `;
                return;
            }

            contacts.forEach(contact => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${contact.id}</td>
                    <td>${contact.name}</td>
                    <td>${contact.email}</td>
                    <td title="${contact.message}">${contact.message.substring(0, 50)}${contact.message.length > 50 ? '...' : ''}</td>
                    <td>${new Date(contact.created_at).toLocaleString()}</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading contacts:', error);
            document.getElementById('contactsBody').innerHTML = `
                <tr><td colspan="5" style="text-align: center; color: #e74c3c;">Error loading contacts</td></tr>
            `;
        });
}

function loadMenu() {
    adminFetch('/menu')
        .then(menuItems => {
            const tbody = document.getElementById('menuBody');
            tbody.innerHTML = '';

            if (menuItems.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; color: #777;">
                            No menu items found
                        </td>
                    </tr>
                `;
                return;
            }

            menuItems.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">` : 'No Image'}
                    </td>
                    <td>${item.name}</td>
                    <td title="${item.description}">${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''}</td>
                    <td>M${parseFloat(item.price).toFixed(2)}</td>
                    <td>
                        <button class="card-btn edit-btn" data-id="${item.id}" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                            Edit
                        </button>
                        <button class="card-btn delete-btn" data-id="${item.id}" style="background: #e74c3c; padding: 5px 10px; font-size: 12px;">
                            Delete
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Add event listeners to edit and delete buttons
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const itemId = this.getAttribute('data-id');
                    editMenuItem(itemId);
                });
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const itemId = this.getAttribute('data-id');
                    deleteMenuItem(itemId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading menu:', error);
            document.getElementById('menuBody').innerHTML = `
                <tr><td colspan="5" style="text-align: center; color: #e74c3c;">Error loading menu items</td></tr>
            `;
        });
}

function showMenuItemModal(item = null) {
    const modal = document.getElementById('menuItemModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('menuItemForm');

    if (item) {
        title.textContent = 'Edit Menu Item';
        document.getElementById('menuItemId').value = item.id;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemDescription').value = item.description;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemImage').value = item.image || '';
        document.getElementById('itemCategory').value = item.category || 'main';
    } else {
        title.textContent = 'Add Menu Item';
        form.reset();
        document.getElementById('menuItemId').value = '';
    }

    modal.classList.add('visible');
}

function editMenuItem(itemId) {
    adminFetch('/menu')
        .then(menuItems => {
            const item = menuItems.find(i => i.id == itemId);
            if (item) {
                showMenuItemModal(item);
            } else {
                alert('Menu item not found');
            }
        })
        .catch(error => {
            console.error('Error fetching menu item:', error);
            alert('Error loading menu item details');
        });
}

function deleteMenuItem(itemId) {
    if (confirm('Are you sure you want to delete this menu item?')) {
        adminFetch(`/menu/${itemId}`, { method: 'DELETE' })
            .then(data => {
                if (data.success) {
                    alert('Menu item deleted successfully');
                    loadMenu();
                } else {
                    alert('Error deleting menu item: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error deleting menu item:', error);
                alert('Error deleting menu item');
            });
    }
}

function handleMenuItemSubmit(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('itemName').value,
        description: document.getElementById('itemDescription').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        image: document.getElementById('itemImage').value,
        category: document.getElementById('itemCategory').value
    };

    const itemId = document.getElementById('menuItemId').value;
    const method = itemId ? 'PUT' : 'POST';
    const endpoint = itemId ? `/menu/${itemId}` : '/menu';

    adminFetch(endpoint, {
        method: method,
        body: JSON.stringify(formData)
    })
        .then(data => {
            if (data.success) {
                alert(itemId ? 'Menu item updated successfully' : 'Menu item added successfully');
                document.getElementById('menuItemModal').classList.remove('visible');
                loadMenu();
            } else {
                alert('Error saving menu item: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error saving menu item:', error);
            alert('Error saving menu item');
        });
}

function loadSpecialOffers() {
    adminFetch('/special-offers')
        .then(offers => {
            const tbody = document.getElementById('specialOffersBody');
            if (!tbody) {
                console.error('Special offers table body not found');
                return;
            }

            tbody.innerHTML = '';

            if (offers.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; color: #777;">
                            No special offers found. Create your first special offer!
                        </td>
                    </tr>
                `;
                return;
            }

            offers.forEach(offer => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        ${offer.item_image ? `<img src="${offer.item_image}" alt="${offer.item_name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 10px;">` : ''}
                        ${offer.item_name || 'N/A'}
                    </td>
                    <td>M${offer.original_price ? parseFloat(offer.original_price).toFixed(2) : '0.00'}</td>
                    <td>M${offer.discount_price ? parseFloat(offer.discount_price).toFixed(2) : '0.00'}</td>
                    <td>${offer.description || '-'}</td>
                    <td>
                        <span style="color: ${offer.is_active ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                            ${offer.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>
                        <button class="card-btn edit-offer-btn" data-id="${offer.id}" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                            Edit
                        </button>
                        <button class="card-btn delete-offer-btn" data-id="${offer.id}" style="background: #e74c3c; padding: 5px 10px; font-size: 12px;">
                            Delete
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Add event listeners to edit buttons
            document.querySelectorAll('.edit-offer-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const offerId = this.getAttribute('data-id');
                    editSpecialOffer(offerId);
                });
            });

            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-offer-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const offerId = this.getAttribute('data-id');
                    deleteSpecialOffer(offerId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading special offers:', error);
            const tbody = document.getElementById('specialOffersBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; color: #e74c3c;">
                            Error loading special offers. Please try again.
                        </td>
                    </tr>
                `;
            }
        });
}

function showSpecialOfferModal(offer = null) {
    const modal = document.getElementById('specialOfferModal');
    if (!modal) {
        console.error('Special offer modal not found');
        return;
    }

    const title = document.getElementById('specialOfferModalTitle');

    // Load menu items for dropdown
    adminFetch('/menu')
        .then(menuItems => {
            const select = document.getElementById('offerMenuItem');
            if (!select) {
                console.error('Offer menu item select not found');
                return;
            }

            select.innerHTML = '<option value="">Select a menu item</option>';
            menuItems.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = `${item.name} - M${item.price}`;
                select.appendChild(option);
            });

            if (offer) {
                title.textContent = 'Edit Special Offer';
                document.getElementById('specialOfferId').value = offer.id;
                document.getElementById('offerMenuItem').value = offer.menu_item_id;
                document.getElementById('originalPrice').value = offer.original_price;
                document.getElementById('discountPrice').value = offer.discount_price;
                document.getElementById('offerDescription').value = offer.description || '';
            } else {
                title.textContent = 'Add Special Offer';
                document.getElementById('specialOfferForm').reset();
                document.getElementById('specialOfferId').value = '';
            }

            modal.classList.add('visible');
        })
        .catch(error => {
            console.error('Error loading menu items for special offer:', error);
            alert('Error loading menu items. Please try again.');
        });
}

function editSpecialOffer(offerId) {
    adminFetch('/special-offers')
        .then(offers => {
            const offer = offers.find(o => o.id == offerId);
            if (offer) {
                showSpecialOfferModal(offer);
            } else {
                alert('Special offer not found');
            }
        })
        .catch(error => {
            console.error('Error fetching special offer:', error);
            alert('Error loading special offer details');
        });
}

function deleteSpecialOffer(offerId) {
    if (confirm('Are you sure you want to delete this special offer?')) {
        adminFetch(`/special-offers/${offerId}`, { method: 'DELETE' })
            .then(data => {
                if (data.success) {
                    alert('Special offer deleted successfully');
                    loadSpecialOffers();
                } else {
                    alert('Error deleting special offer: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error deleting special offer:', error);
                alert('Error deleting special offer');
            });
    }
}

function handleSpecialOfferSubmit(e) {
    e.preventDefault();

    const formData = {
        menu_item_id: parseInt(document.getElementById('offerMenuItem').value),
        original_price: parseFloat(document.getElementById('originalPrice').value),
        discount_price: parseFloat(document.getElementById('discountPrice').value),
        description: document.getElementById('offerDescription').value
    };

    if (!formData.menu_item_id || !formData.original_price || !formData.discount_price) {
        alert('Please fill in all required fields');
        return;
    }

    const offerId = document.getElementById('specialOfferId').value;
    const method = offerId ? 'PUT' : 'POST';
    const endpoint = offerId ? `/special-offers/${offerId}` : '/special-offers';

    adminFetch(endpoint, {
        method: method,
        body: JSON.stringify(formData)
    })
        .then(data => {
            if (data.success) {
                alert(offerId ? 'Special offer updated successfully' : 'Special offer added successfully');
                document.getElementById('specialOfferModal').classList.remove('visible');
                loadSpecialOffers();
            } else {
                alert('Error saving special offer: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error saving special offer:', error);
            alert('Error saving special offer');
        });
}

function updateOrderStatus(orderId, status) {
    adminFetch(`/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: status })
    })
        .then(data => {
            if (data.success) {
                alert(`Order status updated to "${status}"`);
                loadOrders();
            } else {
                alert('Error updating order status: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error updating order status:', error);
            alert('Error updating order status');
        });
}

// Load gallery images
function loadGallery() {
    adminFetch('/gallery')
        .then(images => {
            const tbody = document.getElementById('galleryBody');
            tbody.innerHTML = '';

            if (images.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                            <i class="fas fa-images" style="font-size: 48px; margin-bottom: 10px; display: block; color: #ddd;"></i>
                            No gallery images found.<br>
                            <small>Add your first image using the upload form above.</small>
                        </td>
                    </tr>
                `;
                return;
            }

            images.forEach(image => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <img src="${image.image_url}" alt="${image.title || 'Gallery Image'}" 
                             style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;">
                    </td>
                    <td>
                        <strong>${image.title || 'Untitled'}</strong>
                    </td>
                    <td>
                        ${image.description ?
                        `<span title="${image.description}">${image.description.substring(0, 50)}${image.description.length > 50 ? '...' : ''}</span>` :
                        '<em>No description</em>'
                    }
                    </td>
                    <td>
                        <span class="category-badge">${image.category}</span>
                    </td>
                    <td>
                        <span class="${image.is_active ? 'status-active' : 'status-inactive'}">
                            ${image.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn btn-toggle" data-id="${image.id}" 
                                    title="${image.is_active ? 'Deactivate' : 'Activate'}">
                                <i class="fas ${image.is_active ? 'fa-eye-slash' : 'fa-eye'}"></i>
                            </button>
                            <button class="action-btn btn-delete" data-id="${image.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Add event listeners
            document.querySelectorAll('.btn-toggle').forEach(btn => {
                btn.addEventListener('click', function () {
                    const imageId = this.getAttribute('data-id');
                    toggleGalleryImage(imageId);
                });
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', function () {
                    const imageId = this.getAttribute('data-id');
                    deleteGalleryImage(imageId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading gallery images:', error);
            document.getElementById('galleryBody').innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #e74c3c; padding: 20px;">
                        <i class="fas fa-exclamation-triangle"></i> Error loading gallery images
                    </td>
                </tr>
            `;
        });
}

function resetForms() {
    document.getElementById('imageUrl').value = '';
    document.getElementById('imageTitle').value = '';
    document.getElementById('imageDescription').value = '';
    document.getElementById('fileImageTitle').value = '';
    document.getElementById('fileImageDescription').value = '';
    document.getElementById('imageFile').value = '';

    const progress = document.getElementById('uploadProgress');
    progress.style.display = 'none';
}

async function handleFileUpload() {
    const fileInput = document.getElementById('imageFile');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select an image file');
        return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
    }

    const title = document.getElementById('fileImageTitle').value.trim() || 'Untitled';
    const description = document.getElementById('fileImageDescription').value.trim() || '';
    const category = document.getElementById('fileImageCategory').value || 'restaurant';

    const formData = new FormData();
    formData.append('image', file);

    // Use XMLHttpRequest for progress
    const xhr = new XMLHttpRequest();
    const progress = document.getElementById('uploadProgress');
    const progressBar = progress.querySelector('progress');
    const progressText = document.getElementById('progressText');

    progress.style.display = 'block';
    progressBar.value = 0;
    progressText.textContent = '0%';

    return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progressBar.value = percent;
                progressText.textContent = `${percent}%`;
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const result = JSON.parse(xhr.responseText);
                if (result.success) {
                    // Save to gallery
                    const galleryData = {
                        image_url: result.image_url,
                        title,
                        description,
                        category
                    };

                    adminFetch('/gallery', {
                        method: 'POST',
                        body: JSON.stringify(galleryData)
                    }).then(saveResponse => {
                        if (saveResponse.success) {
                            alert('✅ Image uploaded and saved to gallery successfully!');
                            resetForms();
                            progress.style.display = 'none';
                            loadGallery();
                            resolve();
                        } else {
                            reject(new Error(saveResponse.error || 'Save failed'));
                        }
                    }).catch(reject);
                } else {
                    reject(new Error(result.error || 'Upload failed'));
                }
            } else {
                reject(new Error(`Upload failed: ${xhr.status}`));
            }
        });

        xhr.addEventListener('error', reject);
        xhr.addEventListener('abort', reject);

        xhr.open('POST', `${API_BASE}/admin/upload?password=1234`);
        xhr.send(formData);
    }).catch(error => {
        console.error('Error uploading file:', error);
        alert('❌ Error uploading image: ' + error.message);
        progress.style.display = 'none';
    });
}

// Upload image functions
function setupGalleryUpload() {
    const urlUploadBtn = document.getElementById('urlUploadBtn');
    const fileUploadBtn = document.getElementById('fileUploadBtn');
    const urlUploadForm = document.getElementById('urlUploadForm');
    const fileUploadForm = document.getElementById('fileUploadForm');
    const saveUrlImageBtn = document.getElementById('saveUrlImage');
    const uploadFileBtn = document.getElementById('uploadFileBtn');

    // Default to URL
    urlUploadForm.style.display = 'block';
    fileUploadForm.style.display = 'none';
    urlUploadBtn.classList.add('active');
    fileUploadBtn.classList.remove('active');

    urlUploadBtn.addEventListener('click', () => {
        urlUploadBtn.classList.add('active');
        fileUploadBtn.classList.remove('active');
        urlUploadForm.style.display = 'block';
        fileUploadForm.style.display = 'none';
        resetForms(); // Clear file-specific fields
    });

    fileUploadBtn.addEventListener('click', () => {
        fileUploadBtn.classList.add('active');
        urlUploadBtn.classList.remove('active');
        fileUploadForm.style.display = 'block';
        urlUploadForm.style.display = 'none';
        resetForms(); // Clear URL field
    });

    // Listeners
    if (saveUrlImageBtn) saveUrlImageBtn.addEventListener('click', saveUrlImage);
    if (uploadFileBtn) uploadFileBtn.addEventListener('click', handleFileUpload);

    // Optional: Auto-trigger on file change (but button is primary)
    document.getElementById('imageFile').addEventListener('change', () => {
        if (fileUploadBtn.classList.contains('active')) {
            handleFileUpload(); // Trigger upload on select if in file mode
        }
    });
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

// Save URL image to gallery
async function saveUrlImage() {
    const imageUrl = document.getElementById('imageUrl').value.trim();
    const title = document.getElementById('imageTitle').value.trim();
    const description = document.getElementById('imageDescription').value.trim();
    const category = document.getElementById('imageCategory').value;

    if (!imageUrl) {
        alert('Please enter a valid image URL');
        return;
    }

    // Optional: Basic URL validation
    try {
        new URL(imageUrl);
    } catch {
        alert('Please enter a valid URL');
        return;
    }

    const galleryData = {
        image_url: imageUrl,
        title: title || 'Untitled',
        description: description || '',
        category: category || 'restaurant'
    };

    try {
        const saveResponse = await adminFetch('/gallery', {
            method: 'POST',
            body: JSON.stringify(galleryData)
        });

        if (saveResponse.success) {
            alert('✅ Image saved to gallery successfully!');
            resetForms();
            loadGallery();
        } else {
            alert('❌ Error saving image: ' + (saveResponse.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving URL image:', error);
        alert('❌ Error saving image: ' + error.message);
    }
}

// Google Analytics 4 API Integration
class AnalyticsDashboard {
    constructor() {
        this.accessToken = null;
        this.propertyId = 'YOUR_GA4_PROPERTY_ID'; // Replace with your GA4 property ID
        this.metrics = {
            users: 'totalUsers',
            pageviews: 'screenPageViews',
            sessions: 'sessions',
            engagementRate: 'engagementRate',
            averageSessionDuration: 'averageSessionDuration',
            bounceRate: 'bounceRate'
        };
    }

    async init() {
        await this.authenticate();
        this.setupEventListeners();
        this.loadInitialData();
        this.startRealtimeUpdates();
    }

    setupEventListeners() {
        document.getElementById('dateRange').addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                document.getElementById('customDateRange').style.display = 'flex';
            } else {
                document.getElementById('customDateRange').style.display = 'none';
                this.loadAnalyticsData();
            }
        });

        document.getElementById('applyCustomRange').addEventListener('click', () => {
            this.loadAnalyticsData();
        });

        document.getElementById('refreshAnalytics').addEventListener('click', () => {
            this.loadAnalyticsData();
        });

        // Auto-refresh every 5 minutes
        setInterval(() => {
            this.loadAnalyticsData();
        }, 300000);
    }

    async authenticate() {
        // For demo purposes - in production, use proper OAuth2 flow
        // You'll need to set up Google OAuth2 credentials
        try {
            // This is a placeholder - implement proper authentication
            this.accessToken = await this.getAccessToken();
        } catch (error) {
            console.error('GA4 Authentication failed:', error);
            this.showError('Analytics authentication failed. Please check GA4 configuration.');
        }
    }

    async loadInitialData() {
        await this.loadOverviewMetrics();
        await this.loadTrafficSources();
        await this.loadDeviceData();
        await this.loadGeographicData();
        await this.loadPopularPages();
        await this.loadUserInteractions();
    }

    async loadOverviewMetrics() {
        const dateRange = this.getDateRange();
        
        try {
            const response = await this.runReport({
                dimensions: [{ name: 'date' }],
                metrics: [
                    { name: this.metrics.users },
                    { name: this.metrics.pageviews },
                    { name: this.metrics.sessions },
                    { name: this.metrics.averageSessionDuration },
                    { name: this.metrics.engagementRate }
                ],
                dateRanges: [dateRange]
            });

            this.updateOverviewMetrics(response);
        } catch (error) {
            console.error('Error loading overview metrics:', error);
            this.showMockData(); // Fallback to mock data for demo
        }
    }

    async loadTrafficSources() {
        try {
            const response = await this.runReport({
                dimensions: [{ name: 'sessionSource' }],
                metrics: [{ name: this.metrics.sessions }],
                dateRanges: [this.getDateRange()],
                limit: 10
            });

            this.updateTrafficSources(response);
        } catch (error) {
            console.error('Error loading traffic sources:', error);
            this.showMockTrafficData();
        }
    }

    async loadDeviceData() {
        try {
            const response = await this.runReport({
                dimensions: [{ name: 'deviceCategory' }],
                metrics: [{ name: this.metrics.users }],
                dateRanges: [this.getDateRange()]
            });

            this.updateDeviceData(response);
        } catch (error) {
            console.error('Error loading device data:', error);
            this.showMockDeviceData();
        }
    }

    async loadGeographicData() {
        try {
            const response = await this.runReport({
                dimensions: [{ name: 'country' }],
                metrics: [{ name: this.metrics.users }],
                dateRanges: [this.getDateRange()],
                limit: 15
            });

            this.updateGeographicData(response);
        } catch (error) {
            console.error('Error loading geographic data:', error);
            this.showMockGeographicData();
        }
    }

    async loadPopularPages() {
        try {
            const response = await this.runReport({
                dimensions: [{ name: 'pageTitle' }],
                metrics: [{ name: this.metrics.pageviews }],
                dateRanges: [this.getDateRange()],
                limit: 10
            });

            this.updatePopularPages(response);
        } catch (error) {
            console.error('Error loading popular pages:', error);
            this.showMockPageData();
        }
    }

    async loadUserInteractions() {
        try {
            const response = await this.runReport({
                dimensions: [{ name: 'eventName' }],
                metrics: [{ name: 'eventCount' }],
                dateRanges: [this.getDateRange()],
                limit: 10
            });

            this.updateUserInteractions(response);
        } catch (error) {
            console.error('Error loading user interactions:', error);
            this.showMockInteractionData();
        }
    }

    updateOverviewMetrics(data) {
        // Update the overview metrics cards with real data
        const metrics = this.calculateMetrics(data);
        
        document.getElementById('totalUsers').textContent = this.formatNumber(metrics.totalUsers);
        document.getElementById('totalPageviews').textContent = this.formatNumber(metrics.totalPageviews);
        document.getElementById('avgSessionDuration').textContent = this.formatDuration(metrics.avgSessionDuration);
        document.getElementById('bounceRate').textContent = this.formatPercentage(metrics.bounceRate);
    }

    updateTrafficSources(data) {
        const sources = data.rows || [];
        const chartData = sources.map(row => ({
            source: row.dimensionValues[0].value || 'direct',
            sessions: parseInt(row.metricValues[0].value)
        }));

        this.renderTrafficChart(chartData);
    }

    updateDeviceData(data) {
        const devices = data.rows || [];
        const chartData = devices.map(row => ({
            device: row.dimensionValues[0].value,
            users: parseInt(row.metricValues[0].value)
        }));

        this.renderDeviceChart(chartData);
    }

    updateGeographicData(data) {
        const locations = data.rows || [];
        const chartData = locations.map(row => ({
            country: row.dimensionValues[0].value,
            users: parseInt(row.metricValues[0].value)
        }));

        this.renderGeographicChart(chartData);
    }

    updatePopularPages(data) {
        const pages = data.rows || [];
        const html = pages.map(row => `
            <div style="display: flex; justify-content: between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                <div style="flex: 1;">
                    <div style="font-weight: 500;">${row.dimensionValues[0].value}</div>
                    <div style="font-size: 12px; color: #666;">${this.formatNumber(row.metricValues[0].value)} views</div>
                </div>
            </div>
        `).join('');
        
        document.getElementById('popularPages').innerHTML = html;
    }

    updateUserInteractions(data) {
        const interactions = data.rows || [];
        const html = interactions.map(row => `
            <div style="display: flex; justify-content: between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                <div style="flex: 1;">
                    <div style="font-weight: 500;">${this.formatEventName(row.dimensionValues[0].value)}</div>
                    <div style="font-size: 12px; color: #666;">${this.formatNumber(row.metricValues[0].value)} times</div>
                </div>
            </div>
        `).join('');
        
        document.getElementById('userInteractions').innerHTML = html;
    }

    // Helper methods
    getDateRange() {
        const range = document.getElementById('dateRange').value;
        const now = new Date();
        
        switch(range) {
            case 'today':
                return { startDate: this.formatDate(now), endDate: this.formatDate(now) };
            case 'yesterday':
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                return { startDate: this.formatDate(yesterday), endDate: this.formatDate(yesterday) };
            case '7days':
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return { startDate: this.formatDate(weekAgo), endDate: this.formatDate(now) };
            case '30days':
                const monthAgo = new Date(now);
                monthAgo.setDate(monthAgo.getDate() - 30);
                return { startDate: this.formatDate(monthAgo), endDate: this.formatDate(now) };
            case 'custom':
                const start = document.getElementById('startDate').value;
                const end = document.getElementById('endDate').value;
                return { startDate: start, endDate: end };
            default:
                return { startDate: '7daysAgo', endDate: 'today' };
        }
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    formatNumber(num) {
        return parseInt(num).toLocaleString();
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    }

    formatPercentage(decimal) {
        return `${(decimal * 100).toFixed(1)}%`;
    }

    formatEventName(eventName) {
        return eventName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // Mock data for demonstration (remove in production)
    showMockData() {
        document.getElementById('totalUsers').textContent = '1,247';
        document.getElementById('totalPageviews').textContent = '3,892';
        document.getElementById('avgSessionDuration').textContent = '2m 45s';
        document.getElementById('bounceRate').textContent = '42.3%';
    }

    showMockTrafficData() {
        const mockData = [
            { source: 'Google', sessions: 845 },
            { source: 'Direct', sessions: 432 },
            { source: 'Facebook', sessions: 298 },
            { source: 'Instagram', sessions: 156 },
            { source: 'Twitter', sessions: 87 }
        ];
        this.renderTrafficChart(mockData);
    }

    // Add similar mock data methods for other charts...

    startRealtimeUpdates() {
        // Simulate real-time updates
        setInterval(() => {
            const activeUsers = Math.floor(Math.random() * 50) + 10;
            const pageviewsMin = Math.floor(Math.random() * 20) + 5;
            
            document.getElementById('activeUsers').textContent = activeUsers;
            document.getElementById('pageviewsMin').textContent = pageviewsMin;
        }, 10000);
    }

    async runReport(request) {
        // This would make actual API calls to Google Analytics Data API
        // For now, return mock data structure
        return await this.getMockReportData(request);
    }

    async getMockReportData(request) {
        // Return structured mock data matching GA4 API response format
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    rows: this.generateMockRows(request)
                });
            }, 1000);
        });
    }

    generateMockRows(request) {
        // Generate realistic mock data based on the request
        // Implementation depends on what metrics/dimensions are requested
        return [];
    }
}

// Initialize analytics dashboard when section is active
function setupAnalyticsDashboard() {
    const analyticsDashboard = new AnalyticsDashboard();
    analyticsDashboard.init();
}