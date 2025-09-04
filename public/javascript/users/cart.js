document.addEventListener('DOMContentLoaded', function () {

    const cartCount = document.querySelector('.cart-count');
    console.log('cartCount : ', cartCount.textContent)

    // Quantity buttons
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', async function () {
            const productId = this.getAttribute('data-id');
            const input = this.parentElement.querySelector(`.quantity-input[data-product-id="${productId}"]`);
            let quantity = parseInt(input.value);
            const originalQuantity = quantity;
            const stock = parseInt(this.parentElement.querySelector('.plus').getAttribute('data-stock'));

            if (this.classList.contains('minus') && quantity > 1) {
                quantity--;
            } else if (this.classList.contains('plus') && quantity < stock) {
                quantity++;
            }

            if (quantity !== originalQuantity) {
                input.value = quantity;
                await updateCartItem(productId, quantity, input, originalQuantity);
            }
        });
    });

    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', async () => {
            const productId = button.dataset.id;
            await removeCartItem(productId);
        });
    });

    document.querySelectorAll('.wishlist-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const productId = button.dataset.id;
            await removeCartItem(productId)
            await addtoWishlist(productId)
        })
    })


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

                const itemSubtotalElement = itemRow.querySelector('.cart-subtotal');
                if (itemSubtotalElement && data.values.itemSubTotal) {
                    itemSubtotalElement.querySelector('.item-subtotal').innerText = data.values.itemSubTotal.toLocaleString('en-IN');
                }

                const grandTotalElement = document.querySelector('.grand-total span:last-child');
                if (grandTotalElement && data.values.cartTotal) {
                    grandTotalElement.innerText = `₹ ${data.values.cartTotal.toLocaleString('en-IN')}`;
                }
                const subtotalElement = document.querySelector('.subtotal span:last-child');
                if (subtotalElement && data.values.cartTotal) {
                    subtotalElement.innerText = `₹ ${data.values.cartTotal.toLocaleString('en-IN')}`;
                }

                const savedAmountElement = document.querySelector('.saved-amount');
                if (savedAmountElement && data.values.discountAmount !== undefined) {
                    savedAmountElement.innerText = `-₹ ${data.values.discountAmount.toLocaleString('en-IN')}`;
                }

                const minusButton = itemRow.querySelector('.quantity-btn.minus');
                const plusButton = itemRow.querySelector('.quantity-btn.plus');
                const stock = parseInt(plusButton.getAttribute('data-stock'));

                minusButton.disabled = quantity <= 1;
                plusButton.disabled = quantity >= stock;

                // cartCount.textContent = data.cartCount

            } else {
                input.value = originalQuantity;
                Swal.fire('Error', data.message || 'Failed to update cart item.', 'error');
            }
        } catch (error) {
            input.value = originalQuantity;
            console.error('Error updating cart:', error);
            Swal.fire('Error', 'Something went wrong while updating the cart.', 'error');
        }
    }

    async function addtoWishlist(productId) {
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
            if (result.isConfirmed) {
                try {
                    const response = await fetch('/cartTowishlist', {
                        method: 'PATCH',
                        body: JSON.stringify({ productId }),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })

                    const data = await response.json()
                    if (data.success) {
                        Swal.fire('Success', data.message || 'Successfully moved to wishlist', 'success');
                        const itemRow = document.querySelector(`.cart-item .wishlist-btn[data-id="${productId}"]`)
                            ?.closest('.cart-item');
                        if (itemRow) itemRow.remove();
                        const cartItems = data.cartItems
                        const subTotal = data.subTotal
                        const totalOfferedPrice = data.totalOfferedPrice
                        const cartTotal = data.cartTotal
                        console.log('cart : ', cartItems)

                        const grandTotalElement = document.querySelector('.grand-total span:last-child');
                        if (grandTotalElement && cartTotal) {
                            grandTotalElement.innerText = `₹ ${cartTotal.toLocaleString('en-IN')}`;
                        }
                        const subtotalElement = document.querySelector('.subtotal span:last-child');
                        if (subtotalElement && cartTotal) {
                            subtotalElement.innerText = `₹ ${cartTotal.toLocaleString('en-IN')}`;
                        }

                        const savedAmountElement = document.querySelector('.saved-amount');
                        if (savedAmountElement && totalOfferedPrice !== undefined) {
                            savedAmountElement.innerText = `-₹ ${totalOfferedPrice.toLocaleString('en-IN')}`;
                        }
                        cartCount.textContent = data.cartCount
                    } else {
                        Swal.fire('Oops', data.message || 'Something went wrong', 'error');
                    }
                } catch (error) {
                    console.error(error);
                    Swal.fire('Oops', 'Something went wrong', 'error');
                }
            }
        })
    }

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
            if (result.isConfirmed) {
                try {
                    const response = await fetch('/cartRemove', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId })
                    });

                    console.log('Remove cart response status:', response.status);
                    const data = await response.json();
                    console.log('Remove cart response data:', data);

                    if (data.success) {

                        const itemRow = document.querySelector(`.cart-item .remove-item[data-id="${productId}"]`)
                            ?.closest('.cart-item');
                        if (itemRow) itemRow.remove();

                        const cartItems = data.cartItems
                        const subTotal = data.subTotal
                        const totalOfferedPrice = data.totalOfferedPrice
                        const cartTotal = data.cartTotal
                        console.log('cart : ', cartItems)

                        const grandTotalElement = document.querySelector('.grand-total span:last-child');
                        if (grandTotalElement && cartTotal) {
                            grandTotalElement.innerText = `₹ ${cartTotal.toLocaleString('en-IN')}`;
                        }
                        const subtotalElement = document.querySelector('.subtotal span:last-child');
                        if (subtotalElement && cartTotal) {
                            subtotalElement.innerText = `₹ ${cartTotal.toLocaleString('en-IN')}`;
                        }

                        const savedAmountElement = document.querySelector('.saved-amount');
                        if (savedAmountElement && totalOfferedPrice !== undefined) {
                            savedAmountElement.innerText = `-₹ ${totalOfferedPrice.toLocaleString('en-IN')}`;
                        }

                        cartCount.textContent = data.cartCount

                    } else {
                        Swal.fire('Error', data.message || 'Failed to remove item from cart.', 'error');
                    }
                } catch (error) {
                    console.error('Error removing item:', error);
                    Swal.fire('Error', 'Something went wrong while removing the item.', 'error');
                }
            }
        });
    }

})