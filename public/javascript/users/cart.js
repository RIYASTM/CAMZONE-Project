document.addEventListener('DOMContentLoaded', function () {

    const cartCount = document.querySelector('.cart-count');
    const subtotalElement = document.querySelector('.subtotal span:last-child');
    const grandTotalElement = document.querySelector('.grand-total span:last-child');
    const savedAmountElement = document.querySelector('.saved-amount');

    // Utility: Parse amount safely
    function parseAmount(text, allowNegative = false) {
        if (!text) return 0;
        const cleaned = text.replace(allowNegative ? /[-₹,\s]/g : /[₹,\s]/g, '');
        return Number(cleaned) || 0;
    }

    // Utility: Update subtotal + saved amount
    function updateTotals(cartTotal, discountAmount = 0) {
        if (grandTotalElement) {
            grandTotalElement.innerText = `₹ ${cartTotal.toLocaleString('en-IN')}`;
        }
        if (subtotalElement) {
            const total = cartTotal + discountAmount;
            subtotalElement.innerText = `₹ ${total.toLocaleString('en-IN')}`;
        }
        if (savedAmountElement) {
            savedAmountElement.innerText = `-₹ ${discountAmount.toLocaleString('en-IN')}`;
        }
    }

    // Initial setup
    const subtotalAmount = parseAmount(grandTotalElement?.textContent);
    const savedAmount = parseAmount(savedAmountElement?.textContent, true);
    updateTotals(subtotalAmount, savedAmount);

    // Quantity buttons
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', async function () {
            const productId = this.dataset.id;
            const input = this.parentElement.querySelector(`.quantity-input[data-product-id="${productId}"]`);
            let quantity = parseInt(input.value);
            const originalQuantity = quantity;
            const stock = parseInt(this.parentElement.querySelector('.plus').dataset.stock);

            if (this.classList.contains('minus') && quantity > 1) quantity--;
            else if (this.classList.contains('plus') && quantity < stock) quantity++;

            if (quantity !== originalQuantity) {
                input.value = quantity;
                await updateCartItem(productId, quantity, input, originalQuantity);
            }
        });
    });

    // Remove item
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', () => removeCartItem(button.dataset.id));
    });

    // Wishlist move
    document.querySelectorAll('.wishlist-btn').forEach(button => {
        button.addEventListener('click', async () => {
            await removeCartItem(button.dataset.id);
            await addToWishlist(button.dataset.id);
        });
    });

    // Update cart item
    async function updateCartItem(productId, quantity, input, originalQuantity) {
        try {
            const response = await fetch('/updateCart', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, quantity })
            });
            const data = await response.json();

            if (data.success) {
                const itemRow = input.closest('.cart-item');
                const itemSubtotalElement = itemRow.querySelector('.cart-subtotal .item-subtotal');
                if (itemSubtotalElement && data.values.itemSubTotal) {
                    itemSubtotalElement.innerText = data.values.itemSubTotal.toLocaleString('en-IN');
                }

                updateTotals(data.values.cartTotal, data.values.discountAmount || 0);

                const minusButton = itemRow.querySelector('.quantity-btn.minus');
                const plusButton = itemRow.querySelector('.quantity-btn.plus');
                const stock = parseInt(plusButton.dataset.stock);
                minusButton.disabled = quantity <= 1;
                plusButton.disabled = quantity >= stock;

            } else {
                input.value = originalQuantity;
                showNotification(data.message || 'Failed to update cart item!', 'error');
            }
        } catch (error) {
            input.value = originalQuantity;
            console.error('Error updating cart:', error);
            showNotification(data.message || 'Something went wrong while updating the cart!', 'error');
        }
    }

    // Add to wishlist
    async function addToWishlist(productId) {
        Swal.fire({
            title: 'Add to wishlist?',
            text: 'This item will be removed from the cart..',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Move it',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const response = await fetch('/cartTowishlist', {
                    method: 'PATCH',
                    body: JSON.stringify({ productId }),
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json(); 

                if (data.success) {
                    showNotification(data.message || 'Successfully moved to wishlist!', 'success');
                    document.querySelector(`.cart-item .wishlist-btn[data-id="${productId}"]`)
                        ?.closest('.cart-item')
                        ?.remove();

                    updateTotals(data.cartTotal, data.totalOfferedPrice || 0);
                    if (cartCount) cartCount.textContent = data.cartCount;

                } else {
                    showNotification(data.message || 'Something went wrong!', 'error');
                }
            } catch (error) {
                console.error(error);
                showNotification(data.message || 'Something went wrong!', 'error');
            }
        });
    }

    // Remove cart item
    async function removeCartItem(productId) {
        Swal.fire({
            title: 'Remove item from cart?',
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, remove it',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const response = await fetch('/cartRemove', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId })
                });
                const data = await response.json();

                if (data.success) {
                    document.querySelector(`.cart-item .remove-item[data-id="${productId}"]`)
                        ?.closest('.cart-item')
                        ?.remove();

                    updateTotals(data.cartTotal, data.totalOfferedPrice || 0);
                    if (cartCount) cartCount.textContent = data.cartCount;

                } else {
                    showNotification(data.message || 'Failed to remove item from cart!', 'error');
                }
            } catch (error) {
                console.error('Error removing item:', error);
                showNotification(data.message || 'Something went wrong while removing the item!', 'error');
            }
        });
    }

    //Proceed to checkout
    const ProceedButton = document.querySelector('.proceed-checkout')
    ProceedButton.addEventListener('click', () => toCheckout())

    const search = document.getElementById('search')
    const clearButton = document.getElementById('clear-button')
    
    search.addEventListener('keypress', async (e)=> {

        const searchValue = search.value.trim()

        if( searchValue && e.key === 'Enter' ){
            console.log('search : ',searchValue)
            window.location = `/shop?search=${encodeURIComponent(searchValue)}`;
        }
    })

});

async function toCheckout() {
    try {
        const response = await fetch('/toCheckout', {
            method : 'POST',
             headers: {
                'Content-Type': 'application/json'
            }
        })

        const data = await response.json()

        if(data.success){
            window.location.href = data.redirectUrl
        }else{
            showNotification(data.message || 'Failed to proceed', 'error')
            if(data.productId){
                const itemRow = document.querySelector(`.cart-item [data-id="${data.productId}"]`)?.closest('.cart-item');
                if(itemRow){
                    itemRow.classList.add('error-highlight');
                    itemRow.scrollIntoView({ behavior : 'smooth', block : "center"})

                    setTimeout(() => itemRow.classList.remove('error-highlight'), 2000);
                }
            }
        }
    } catch (error) {
        console.log("Something went wrong to proceed...", error)
        showNotification('Something went wrong', 'error')
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
