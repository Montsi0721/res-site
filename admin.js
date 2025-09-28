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

//https://res-site-backend.onrender.com/api

function loadReservations() {
    fetch('https://res-site-backend.onrender.com/api/admin/reservations')
        .then(response => response.json())
        .then(reservations => {
            const tbody = document.getElementById('reservationsBody');
            tbody.innerHTML = '';

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
                    <td>${reservation.status}</td>
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
    fetch('https://res-site-backend.onrender.com/api/admin/orders')
        .then(response => response.json())
        .then(orders => {
            const tbody = document.getElementById('ordersBody');
            tbody.innerHTML = '';

            orders.forEach(order => {
                const items = JSON.parse(order.items);
                const itemsText = items.map(item => `${item.name} (x${item.quantity})`).join(', ');

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.id}</td>
                    <td>${order.customer_name}</td>
                    <td>${order.customer_email}</td>
                    <td>${itemsText}</td>
                    <td>M${order.total_amount}</td>
                    <td>${order.status}</td>
                    <td>${new Date(order.created_at).toLocaleString()}</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            document.getElementById('ordersBody').innerHTML = `
                <tr><td colspan="7" style="text-align: center; color: #e74c3c;">Error loading orders</td></tr>
            `;
        });
}

function loadContacts() {
    fetch('https://res-site-backend.onrender.com/api/admin/contacts')
        .then(response => response.json())
        .then(contacts => {
            const tbody = document.getElementById('contactsBody');
            tbody.innerHTML = '';

            contacts.forEach(contact => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${contact.id}</td>
                    <td>${contact.name}</td>
                    <td>${contact.email}</td>
                    <td title="${contact.message}">${contact.message.substring(0, 50)}...</td>
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
    fetch('https://res-site-backend.onrender.com/api/admin/menu')
        .then(response => response.json())
        .then(menuItems => {
            const tbody = document.getElementById('menuBody');
            tbody.innerHTML = '';

            menuItems.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                    <td>${item.name}</td>
                    <td title="${item.description}">${item.description.substring(0, 50)}...</td>
                    <td>M${item.price}</td>
                    <td>
                        <button class="card-btn edit-btn" data-id="${item.id}">Edit</button>
                        <button class="card-btn delete-btn" data-id="${item.id}" style="background: #e74c3c;">Delete</button>
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
        document.getElementById('itemImage').value = item.image;
    } else {
        title.textContent = 'Add Menu Item';
        form.reset();
        document.getElementById('menuItemId').value = '';
    }

    modal.classList.add('visible');
}

function editMenuItem(itemId) {
    fetch('https://res-site-backend.onrender.com/api/admin/menu')
        .then(response => response.json())
        .then(menuItems => {
            const item = menuItems.find(i => i.id == itemId);
            if (item) {
                showMenuItemModal(item);
            }
        })
        .catch(error => {
            console.error('Error fetching menu item:', error);
            alert('Error loading menu item details');
        });
}

function deleteMenuItem(itemId) {
    if (confirm('Are you sure you want to delete this menu item?')) {
        fetch(`https://res-site-backend.onrender.com/api/admin/menu/${itemId}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Menu item deleted successfully');
                    loadMenu();
                } else {
                    alert('Error deleting menu item');
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
        image: document.getElementById('itemImage').value
    };

    const itemId = document.getElementById('menuItemId').value;
    const url = itemId ? `https://res-site-backend.onrender.com/api/admin/menu/${itemId}` : 'https://res-site-backend.onrender.com/api/admin/menu';
    const method = itemId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(itemId ? 'Menu item updated successfully' : 'Menu item added successfully');
                document.getElementById('menuItemModal').classList.remove('visible');
                loadMenu();
            } else {
                alert('Error saving menu item');
            }
        })
        .catch(error => {
            console.error('Error saving menu item:', error);
            alert('Error saving menu item');
        });
}

function loadSpecialOffers() {
    fetch('https://res-site-backend.onrender.com/api/admin/special-offers')
        .then(response => response.json())
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
                    <td>M${offer.original_price ? offer.original_price.toFixed(2) : '0.00'}</td>
                    <td>M${offer.discount_price ? offer.discount_price.toFixed(2) : '0.00'}</td>
                    <td>${offer.description || '-'}</td>
                    <td>
                        <span style="color: ${offer.is_active ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                            ${offer.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>
                        <button class="card-btn edit-offer-btn" data-id="${offer.id}">Edit</button>
                        <button class="card-btn delete-offer-btn" data-id="${offer.id}" style="background: #e74c3c; margin-left: 5px;">Delete</button>
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
    fetch('https://res-site-backend.onrender.com/api/admin/menu')
        .then(response => response.json())
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
                option.textContent = item.name;
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
    fetch('https://res-site-backend.onrender.com/api/admin/special-offers')
        .then(response => response.json())
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
        fetch(`https://res-site-backend.onrender.com/api/admin/special-offers/${offerId}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
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
    const url = offerId ? `https://res-site-backend.onrender.com/api/admin/special-offers/${offerId}` : 'https://res-site-backend.onrender.com/api/admin/special-offers';
    const method = offerId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
        .then(response => response.json())
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