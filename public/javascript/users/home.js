


document.addEventListener("DOMContentLoaded", () => {

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
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Added to Cart!',
                            text: 'This item has been successfully added to your cart.',
                            position: 'center',
                            showConfirmButton: true,
                            confirmButtonText: 'OK',
                            timer: 2000,
                            timerProgressBar: true,
                        });

                        cartCount.textContent = data.cartCount
                        const icon = document.querySelector(`.wishlist-btn[data-id="${productId}"]`);
                        if(icon){
                            icon.classList.remove('active')
                        }

                    } else {
                        Swal.fire('Oops', data.message || 'Product adding to cart failed', 'error');
                    }
                })
                .catch(() => {
                    Swal.fire('Oops', 'Product adding to cart failed', 'error');
                });
        }
    }


    document.querySelectorAll(".wishlist-btn").forEach(button => {
        button.addEventListener("click", function (e) {
            e.stopPropagation(); // Prevents clicking the surrounding card
            const productId = this.getAttribute("data-id");
            addtoWishlist(productId);
        });
    });

})


function addtoWishlist(productId) {
    fetch('/addtowishlist', {
        method: 'POST',
        body: JSON.stringify({ productId }),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
        .then(data => {
            if (data.success) {

                const icon = document.querySelector(`.wishlist-btn[data-id="${productId}"]`);

                if (icon) {
                    if (data.done === 'Added') {
                        icon.classList.add('active');
                    } else if (data.done === 'Removed') {
                        icon.classList.remove('active')
                    }
                }

            } else {
                Swal.fire('Oops', data.message || 'Something went wrong', 'error');
            }
        }).catch(() => {
            Swal.fire('Oops', 'Request failed', 'error');
        });
}