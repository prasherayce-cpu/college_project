// Global functionality for TravelX Hub

document.addEventListener('DOMContentLoaded', () => {
    // Inject Navbar dynamically if an element with id="navAuth" is present
    const navAuth = document.getElementById('navAuth');
    const user = getStoredUser();
    const isLoggedIn = !!user;
    
    if (navAuth) {
        if (isLoggedIn) {
            // Create user profile dropdown menu
            navAuth.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="position: relative;">
                        <button id="userDropdownBtn" class="btn" style="
                            background: var(--primary);
                            color: white;
                            padding: 10px 20px;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            transition: all 0.3s ease;
                        ">
                            <span style="font-size: 18px;">👤</span>
                            <span id="userDisplayName">${user.name.split(' ')[0]}</span>
                            <span style="font-size: 12px;">▼</span>
                        </button>
                        
                        <div id="userDropdown" style="
                            position: absolute;
                            top: 100%;
                            right: 0;
                            background: white;
                            border: 1px solid #e0e0e0;
                            border-radius: 8px;
                            margin-top: 5px;
                            min-width: 200px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                            display: none;
                            z-index: 1000;
                        ">
                            <div style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; color: #666;">
                                <small>Logged in as</small><br>
                                <strong>${user.email}</strong>
                            </div>
                            <a href="home.html" style="
                                display: block;
                                padding: 12px 16px;
                                color: #333;
                                text-decoration: none;
                                border-bottom: 1px solid #e0e0e0;
                                transition: background 0.3s ease;
                            " onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='white'">
                                🏠 Home
                            </a>
                            <a href="my-bookings.html" style="
                                display: block;
                                padding: 12px 16px;
                                color: #333;
                                text-decoration: none;
                                border-bottom: 1px solid #e0e0e0;
                                transition: background 0.3s ease;
                            " onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='white'">
                                📋 My Bookings
                            </a>
                            ${user.role === 'admin' ? `
                            <a href="admin.html" style="
                                display: block;
                                padding: 12px 16px;
                                color: #333;
                                text-decoration: none;
                                border-bottom: 1px solid #e0e0e0;
                                transition: background 0.3s ease;
                            " onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='white'">
                                🛠 Admin Panel
                            </a>
                            ` : ''}
                            <div id="dropdownBookings" style="
                                padding: 10px 12px;
                                border-bottom: 1px solid #e0e0e0;
                                max-height: 220px;
                                overflow-y: auto;
                                background: #fafafa;
                            ">
                                <div style="font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 700;">Recent Bookings</div>
                                <div style="font-size: 12px; color: #666;">Loading...</div>
                            </div>
                            <button id="dropdownLogoutBtn" style="
                                width: 100%;
                                text-align: left;
                                padding: 12px 16px;
                                border: none;
                                background: white;
                                cursor: pointer;
                                color: #e74c3c;
                                font-weight: 600;
                                transition: background 0.3s ease;
                            " onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='white'">
                                🚪 Logout
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Toggle dropdown menu
            const userDropdownBtn = document.getElementById('userDropdownBtn');
            const userDropdown = document.getElementById('userDropdown');
            const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
            
            userDropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                userDropdown.style.display = 'none';
            });
            
            // Logout from dropdown
            dropdownLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });

            // Load recent bookings inside dropdown
            const dropdownBookings = document.getElementById('dropdownBookings');
            if (dropdownBookings) {
                const token = localStorage.getItem('token');
                fetch(`${API_BASE_URL}/bookings/my`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (!data.success || !Array.isArray(data.bookings)) {
                            throw new Error('Could not load bookings');
                        }

                        const topBookings = data.bookings.slice(0, 3);
                        if (topBookings.length === 0) {
                            dropdownBookings.innerHTML = `
                                <div style="font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 700;">Recent Bookings</div>
                                <div style="font-size: 12px; color: #666;">No bookings yet</div>
                            `;
                            return;
                        }

                        dropdownBookings.innerHTML = `
                            <div style="font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 700;">Recent Bookings</div>
                            ${topBookings.map((booking) => `
                                <a href="my-bookings.html" style="display: block; text-decoration: none; color: #333; padding: 8px; border-radius: 6px; margin-bottom: 6px; background: white; border: 1px solid #eee;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='white'">
                                    <div style="font-size: 12px; font-weight: 700;">${booking.destination}</div>
                                    <div style="font-size: 11px; color: #666;">${booking.status} • ${booking.nights} night(s)</div>
                                </a>
                            `).join('')}
                        `;
                    })
                    .catch(() => {
                        dropdownBookings.innerHTML = `
                            <div style="font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 700;">Recent Bookings</div>
                            <div style="font-size: 12px; color: #a94442;">Unable to load bookings</div>
                        `;
                    });
            }
        } else {
            // Show login and signup buttons when not logged in
            navAuth.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <a href="login.html" class="nav-links" style="
                        padding: 10px 20px;
                        color: var(--primary);
                        text-decoration: none;
                        font-weight: 600;
                        border: 1px solid var(--primary);
                        border-radius: 8px;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='var(--primary)'; this.style.color='white';" onmouseout="this.style.background='transparent'; this.style.color='var(--primary)';">
                        🔐 Login
                    </a>
                    <a href="signup.html" class="btn btn-primary" style="
                        padding: 10px 20px;
                        background: var(--primary);
                        color: white;
                        text-decoration: none;
                        font-weight: 600;
                        border-radius: 8px;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.opacity='0.9';" onmouseout="this.style.opacity='1';">
                        ✨ Sign Up
                    </a>
                </div>
            `;
        }
    }

    // Modal Utility
    const modals = document.querySelectorAll('.modal-overlay');
    const closeBtns = document.querySelectorAll('.close-modal');
    
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modals.forEach(m => m.classList.remove('active'));
            document.body.style.overflow = 'auto';
        });
    });

    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if(e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    });
});

