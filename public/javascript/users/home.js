document.addEventListener("DOMContentLoaded", () => {

    const newProducts = JSON.parse(document.getElementById('newProducts').value);
    const featured = JSON.parse(document.getElementById('featured').value);
    const arrivals = JSON.parse(document.getElementById('newArrivals').value);

    highlightStock(newProducts);
    highlightStock(featured);
    highlightStock(arrivals);

    const cartCount = document.querySelector('.cart-count');

    document.querySelectorAll('.add-to-cart').forEach(button => {

        button.removeEventListener('click', handleAddToCart);
        button.addEventListener('click', handleAddToCart);
    });

    function handleAddToCart(event) {
        const productId = event.currentTarget.dataset.id;
        addToCart(productId);
    }


    function addToCart(productId) {
        const quantity = 1;

        if (quantity > 0) {
            console.log(quantity);

            fetch('/addtocart', {
                method: "POST",
                body: JSON.stringify({ productId, quantity }),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showNotification(data.message || 'Product added to Your Cart!', 'success');

                        cartCount.textContent = data.cartCount
                        const icon = document.querySelector(`.wishlist-btn[data-id="${productId}"]`);
                        if (icon) {
                            icon.classList.remove('active')
                        }

                    } else {
                        showNotification(data.message || 'Product adding to cart failed!', 'error');
                    }
                })
                .catch((error) => {
                    console.error('Something went wrong : ',error);
                    return showNotification('Something went wrong. Try again later', 'error');
                });
        }
    }


    document.querySelectorAll(".wishlist-btn").forEach(button => {
        button.addEventListener("click", function (e) {
            e.stopPropagation();
            const productId = this.getAttribute("data-id");
            addtoWishlist(productId);
        });
    });

    const search = document.getElementById('search')
    const clearButton = document.getElementById('clear-button')

    search.addEventListener('keypress', async (e) => {

        const searchValue = search.value.trim()

        if (searchValue && e.key === 'Enter') {
            console.log('search : ', searchValue)
            window.location = `/shop?search=${encodeURIComponent(searchValue)}`;
        }
    })

})

function highlightStock(products) {
    products.forEach(product => {
        const status = product.status?.toLowerCase();
        let message = '';

        if (status === 'out of stock') {
            message = `This item is out of stock`;
        } else if (status === 'discontinued') {
            message = `This item is discontinued`;
        }

        if (message) {
            const productCard = document.querySelector(`.product-card[data-id="${product._id}"]`);
            if (productCard) {
                productCard.classList.add('dimmed');

                const messageDiv = document.createElement('div');
                messageDiv.className = 'stock-message';
                messageDiv.textContent = message;
                productCard.appendChild(messageDiv);
            }
        }
    });
}

async function addtoWishlist(productId) {
    try {

        const response = await fetch('/addtowishlist', {
            method: 'POST',
            body: JSON.stringify({ productId }),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })

        const data = await response.json()

        console.log("data : ", data)

        if (data.success) {
            const icons = document.querySelectorAll(`.wishlist-btn[data-id="${productId}"]`);
            console.log(icons)

            if (icons) {
                icons.forEach(icon => {
                    if (data.done === 'Added') {
                        icon.classList.add('active');
                    } else if (data.done === 'Removed') {
                        icon.classList.remove('active')
                    }
                })
            }
        } else {
            showNotification(data.message || 'Failed to add to wishlist!', 'error');
        }
    } catch (error) {
        console.log("something went wrong : ", error);
        return showNotification('Something went wrong. Try again later', 'error');
    }
}

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