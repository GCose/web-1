// DOM Elements
const userList = document.getElementById('userList');
const userDetails = document.getElementById('userDetails');
const userSearch = document.getElementById('userSearch');
const actionButtons = document.getElementById('actionButtons');
const favoriteButton = document.getElementById('favoriteButton');
const contactButton = document.getElementById('contactButton');
const themeSwitch = document.getElementById('theme-switch');
const toastContainer = document.getElementById('toastContainer');
const html = document.documentElement;

// App State
let users = [];
let activeUserId = null;
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    fetchUsers();
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    // Theme toggle
    themeSwitch.addEventListener('change', toggleTheme);

    // Search functionality
    userSearch.addEventListener('input', handleSearch);

    // Action buttons
    favoriteButton.addEventListener('click', toggleFavorite);
    contactButton.addEventListener('click', () => {
        const user = users.find(user => user.id === activeUserId);
        if (user) {
            showToast('success', 'Contact Initiated', `A message has been sent to ${user.name}.`);
        }
    });
}

// Initialize theme based on user preference or system preference
function initTheme() {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        html.setAttribute('data-theme', savedTheme);
        themeSwitch.checked = savedTheme === 'dark';
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        themeSwitch.checked = prefersDark;
    }
}

// Toggle between light and dark theme
function toggleTheme() {
    const newTheme = themeSwitch.checked ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Add animation effect to the particles
    const particles = document.querySelectorAll('.particle');
    particles.forEach(particle => {
        particle.style.transition = 'background var(--transition-medium)';
    });
}

// Handle user search
function handleSearch() {
    const searchTerm = userSearch.value.toLowerCase();

    const userItems = document.querySelectorAll('.user-item');
    userItems.forEach(item => {
        const userName = item.querySelector('.name').textContent.toLowerCase();
        const userUsername = item.querySelector('.username').textContent.toLowerCase();

        if (userName.includes(searchTerm) || userUsername.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Toggle favorite status for current user
function toggleFavorite() {
    if (!activeUserId) return;

    const isFavorite = favorites.includes(activeUserId);

    if (isFavorite) {
        // Remove from favorites
        favorites = favorites.filter(id => id !== activeUserId);
        favoriteButton.innerHTML = '<i class="far fa-star"></i><span>Favorite</span>';
        showToast('info', 'Removed from Favorites', 'User has been removed from your favorites.');
    } else {
        // Add to favorites
        favorites.push(activeUserId);
        favoriteButton.innerHTML = '<i class="fas fa-star"></i><span>Favorited</span>';
        showToast('success', 'Added to Favorites', 'User has been added to your favorites!');
    }

    // Save to localStorage
    localStorage.setItem('favorites', JSON.stringify(favorites));

    // Update the UI to reflect favorite status
    updateUserItemStyle(activeUserId);
}

// Update styling for user items to show favorite status
function updateUserItemStyle(userId) {
    const userItems = document.querySelectorAll('.user-item');
    userItems.forEach(item => {
        const itemId = parseInt(item.dataset.userId);
        const isFavorite = favorites.includes(itemId);

        // Add or remove favorite indicator
        const starIcon = item.querySelector('.favorite-star');
        if (isFavorite && !starIcon) {
            const star = document.createElement('span');
            star.className = 'favorite-star';
            star.innerHTML = '<i class="fas fa-star"></i>';
            star.style.marginLeft = 'auto';
            star.style.color = '#ffcc33';
            star.style.fontSize = '14px';
            item.appendChild(star);
        } else if (!isFavorite && starIcon) {
            item.removeChild(starIcon);
        }
    });
}

// Fetch users from API
async function fetchUsers() {
    try {
        // Show loading state for user list
        userList.innerHTML = getSkeletonUserList();
        userDetails.innerHTML = getSkeletonUserDetails();

        const response = await fetch('https://jsonplaceholder.typicode.com/users');

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        users = await response.json();
        displayUserList(users);

        // Reset user details to empty state
        userDetails.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-user-circle"></i>
                </div>
                <p>Select a user to view their profile</p>
            </div>
        `;

    } catch (error) {
        console.error('Fetch Error:', error);
        showToast('error', 'Failed to Load Users', error.message);

        // Show error state
        userList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <p>Could not load users</p>
                <button class="action-button" onclick="fetchUsers()">
                    <i class="fas fa-redo"></i>
                    <span>Try Again</span>
                </button>
            </div>
        `;
    }
}

// Display the list of users
function displayUserList(users) {
    userList.innerHTML = '';

    if (users.length === 0) {
        userList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-users"></i>
                </div>
                <p>No users found</p>
            </div>
        `;
        return;
    }

    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.classList.add('user-item');
        userElement.dataset.userId = user.id;

        // Get initials for avatar
        const initials = getInitials(user.name);

        userElement.innerHTML = `
            <div class="avatar">${initials}</div>
            <div class="user-info">
                <div class="name">${user.name}</div>
                <div class="username">@${user.username}</div>
            </div>
        `;

        // Add favorite star if user is in favorites
        if (favorites.includes(user.id)) {
            const star = document.createElement('span');
            star.className = 'favorite-star';
            star.innerHTML = '<i class="fas fa-star"></i>';
            star.style.marginLeft = 'auto';
            star.style.color = '#ffcc33';
            star.style.fontSize = '14px';
            userElement.appendChild(star);
        }

        userElement.addEventListener('click', () => {
            // Remove active class from all users
            document.querySelectorAll('.user-item').forEach(item => {
                item.classList.remove('active');
            });

            // Add active class to clicked user
            userElement.classList.add('active');

            // Show loading state
            userDetails.innerHTML = getSkeletonUserDetails();

            // Set active user ID
            activeUserId = user.id;

            // Simulate loading delay for better UX
            setTimeout(() => {
                // Display user details
                displayUserDetails(user);

                // Show action buttons
                actionButtons.classList.remove('hidden');

                // Update favorite button state
                if (favorites.includes(user.id)) {
                    favoriteButton.innerHTML = '<i class="fas fa-star"></i><span>Favorited</span>';
                } else {
                    favoriteButton.innerHTML = '<i class="far fa-star"></i><span>Favorite</span>';
                }
            }, 500);
        });

        userList.appendChild(userElement);
    });
}

// Display detailed information about a user
function displayUserDetails(user) {
    // Get initials for avatar
    const initials = getInitials(user.name);

    userDetails.innerHTML = `
        <div class="detail-card">
            <div class="profile-header">
                <div class="profile-avatar">${initials}</div>
                <div class="profile-title">
                    <h3>${user.name}</h3>
                    <div class="profile-subtitle">@${user.username}</div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Contact Information</h3>
                <div class="detail-item">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${user.email}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Phone</div>
                    <div class="detail-value">${user.phone}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Website</div>
                    <div class="detail-value">${user.website}</div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Address</h3>
                <div class="detail-item">
                    <div class="detail-label">Street</div>
                    <div class="detail-value">${user.address.street}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Suite</div>
                    <div class="detail-value">${user.address.suite}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">City</div>
                    <div class="detail-value">${user.address.city}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Zipcode</div>
                    <div class="detail-value">${user.address.zipcode}</div>
                </div>
                <div class="map-preview">
                    <i class="fas fa-map-marker-alt"></i> Map preview would appear here
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Company</h3>
                <div class="detail-item">
                    <div class="detail-label">Name</div>
                    <div class="detail-value">${user.company.name}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Catchphrase</div>
                    <div class="detail-value">${user.company.catchPhrase}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">BS</div>
                    <div class="detail-value">${user.company.bs}</div>
                </div>
            </div>
        </div>
    `;
}

// Show toast notification
function showToast(type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '';
    switch (type) {
        case 'error':
            icon = '<i class="fas fa-exclamation-circle icon"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle icon"></i>';
            break;
        case 'success':
            icon = '<i class="fas fa-check-circle icon"></i>';
            break;
        case 'info':
            icon = '<i class="fas fa-info-circle icon"></i>';
            break;
    }

    toast.innerHTML = `
        ${icon}
        <div class="content">
            <div class="title">${title}</div>
            <div class="message">${message}</div>
        </div>
        <button class="close">&times;</button>
    `;

    // Add event listener to close button
    toast.querySelector('.close').addEventListener('click', () => {
        toast.remove();
    });

    // Add toast to container
    toastContainer.appendChild(toast);

    // Remove toast after 5 seconds
    setTimeout(() => {
        if (toast.parentNode === toastContainer) {
            toast.remove();
        }
    }, 5000);
}

// Helper function to get initials from name
function getInitials(name) {
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Generate skeleton loading HTML for user list
function getSkeletonUserList() {
    let skeletonHtml = '';
    for (let i = 0; i < 6; i++) {
        skeletonHtml += `
            <div class="skeleton-item">
                <div class="skeleton circle"></div>
                <div class="skeleton-info">
                    <div class="skeleton" style="width: 70%;"></div>
                    <div class="skeleton" style="width: 50%;"></div>
                </div>
            </div>
        `;
    }
    return skeletonHtml;
}

// Generate skeleton loading HTML for user details
function getSkeletonUserDetails() {
    return `
        <div class="skeleton-card">
            <div class="skeleton-header">
                <div class="skeleton avatar"></div>
                <div>
                    <div class="skeleton title"></div>
                    <div class="skeleton" style="width: 120px;"></div>
                </div>
            </div>
            
            <div class="skeleton-section">
                <div class="skeleton" style="width: 40%; margin-bottom: 20px;"></div>
                <div class="skeleton" style="width: 90%;"></div>
                <div class="skeleton" style="width: 80%;"></div>
                <div class="skeleton" style="width: 85%;"></div>
            </div>
            
            <div class="skeleton-section">
                <div class="skeleton" style="width: 40%; margin-bottom: 20px;"></div>
                <div class="skeleton" style="width: 90%;"></div>
                <div class="skeleton" style="width: 80%;"></div>
                <div class="skeleton" style="width: 85%;"></div>
            </div>
        </div>
    `;
}