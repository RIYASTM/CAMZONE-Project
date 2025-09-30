
// Wishlist functionality
document.addEventListener('DOMContentLoaded', function () {

    const cartCount = document.querySelector('.cart-count');

    console.log("cartCount : ", cartCount.textContent)

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.removeEventListener('click', handleAddToCart);
        button.addEventListener('click', handleAddToCart);
    });

    function handleAddToCart( event) {
        const button = event.currentTarget;
        const productId = button.dataset.id;
        addToCart(productId, button);
    }

    function addToCart(productId, button) {
        const quantity = 1;

        fetch('/addtocart', {
            method: "POST",
            body: JSON.stringify({ productId, quantity }),
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    button.classList.remove('active');

                    if (window.location.pathname === '/wishlist') {
                        const productCard = button.closest('.product-card');
                        if (productCard) {
                            productCard.remove();
                            checkEmptyWishlist();
                        }
                    }

                    showNotification('Product added to Your Cart!', 'success');
                    cartCount.textContent = data.cartCount;
                } else {
                    showNotification(data.message || 'Product adding to cart failed', 'error');
                }
            })
            .catch((error) => {
                console.error(error);
                showNotification('Something went wrong', 'error');
            });
    }



    const wishlistButtons = document.querySelectorAll('.wishlist-btn');

    wishlistButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const productId = this.dataset.productId;
            const isActive = this.classList.contains('active');

            removeFromWishlist(productId, this);
        });
    });


    // Remove from wishlist function
    function removeFromWishlist(productId, button) {
        fetch('/removeFromWishList', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ productId: productId })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    button.classList.remove('active');
                    if (window.location.pathname === '/wishlist') {
                        const productCard = button.closest('.product-card');
                        if (productCard) {
                            productCard.remove();
                            checkEmptyWishlist();
                        }
                    }
                    showNotification('Product removed from wishlist!', 'success');
                } else {
                    showNotification(data.message || 'Failed to remove from wishlist', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Something went wrong', 'error');
            });
    }

    // Check if wishlist is empty and show message
    function checkEmptyWishlist() {
        const wishlistSection = document.querySelector('.wishlist-section');
        const productGrid = wishlistSection.querySelector('.product-grid');
        const productCards = productGrid.querySelectorAll('.product-card');

        if (productCards.length === 0) {
            productGrid.innerHTML = `
                <div class="empty-wishlist">
                    <p>Your wishlist is empty</p>
                    <a href="/shop" class="btn-primary">Browse Products</a>
                </div>
            `;
        }
    }

    // Show notification function
    function showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Add styles
        notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 5px;
                    color: white;
                    font-weight: 500;
                    z-index: 1000;
                    animation: slideIn 0.3s ease;
                    ${type === 'success' ? 'background-color: #4CAF50;' : 'background-color: #f44336;'}
                `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
                    @keyframes slideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                    @keyframes slideOut {
                        from {
                            transform: translateX(0);
                            opacity: 1;
                        }
                        to {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                    }
                `;

        if (!document.querySelector('style[data-notification]')) {
            style.setAttribute('data-notification', 'true');
            document.head.appendChild(style);
        }

        // Add to page
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Handle newsletter subscription
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value.trim();

            if (email) {
                // Make AJAX request to subscribe
                fetch('/api/newsletter/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email: email })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            showNotification('Successfully subscribed to newsletter!', 'success');
                            emailInput.value = '';
                        } else {
                            showNotification(data.message || 'Failed to subscribe', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showNotification('Something went wrong', 'error');
                    });
            }
        });
    }

    const search = document.getElementById('search')
    const clearButton = document.getElementById('clear-button')
    
    search.addEventListener('keypress', async (e)=> {

        const searchValue = search.value.trim()

        if( searchValue && e.key === 'Enter' ){
            console.log('search : ',searchValue)
            // window.location = `/shop?search=${searchValue}`
            window.location = `/shop?search=${encodeURIComponent(searchValue)}`;
        }
    })

});