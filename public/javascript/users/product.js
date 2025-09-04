
document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.product-card').forEach(btn => {
        const productId = btn.dataset.id
        btn.addEventListener('click', ()=> {
            window.location.href = `/product?id=${productId}`
        })
    })

    const minusBtn = document.querySelector('.quantity-btn.minus');
    const plusBtn = document.querySelector('.quantity-btn.plus');
    const quantityInput = document.querySelector('#quantity-input');
    const cartButton = document.getElementById('addtoCart');

    // Add to Cart Button
    cartButton.addEventListener('click', () => {
        const productId = cartButton.dataset.id;
        addToCart(productId);
    });

    // Quantity decrease
    minusBtn.addEventListener('click', () => {
        let quantity = parseInt(quantityInput.value);
        if (quantity > 1) {
            quantityInput.value = quantity - 1;
        }
    });

    // Quantity increase
    plusBtn.addEventListener('click', () => {
        let quantity = parseInt(quantityInput.value);
        quantityInput.value = quantity + 1;
    });

    async function addToCart(productId) {
        const quantity = document.querySelector('#quantity-input').value;

        if (quantity > 0) {
            const response = await fetch('/addtocart', {
                method: "POST",
                body: JSON.stringify({ productId, quantity }),
                headers: { 'Content-Type': 'application/json' }
            })

            const data = await response.json()

            if(data.success){
                Swal.fire('Success', data.message || 'Product added to cart successfully', 'success');
                window.location.replace(data.redirectUrl);
                const icon = document.querySelector(`.wishlist-btn`);
                if (icon) icon.classList.remove('active');
            }else{
                Swal.fire('Error', data.message || 'Product adding to cart failed', 'error');
            }
        }
    }


    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImageContainer = document.querySelector('.main-image-container');
    const zoomLens = document.getElementById('zoomLens');
    const zoomResult = document.getElementById('zoomResult');

    // Thumbnail switching
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', () => {
            const newSrc = thumbnail.getAttribute('data-src');
            mainImage.src = newSrc;

            thumbnails.forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');

            zoomResult.style.backgroundImage = `url('${newSrc}')`;
        });
    });

    // Zoom setup
    // Zoom Lens (magnifier following cursor)
    if (mainImage && zoomLens) {
        const zoomRatio = 2; // zoom level

        mainImageContainer.addEventListener('mousemove', (e) => {
            const rect = mainImage.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            let lensX = x - zoomLens.offsetWidth / 2;
            let lensY = y - zoomLens.offsetHeight / 2;

            // Keep lens inside the image
            const maxX = rect.width - zoomLens.offsetWidth;
            const maxY = rect.height - zoomLens.offsetHeight;
            lensX = Math.max(0, Math.min(lensX, maxX));
            lensY = Math.max(0, Math.min(lensY, maxY));

            zoomLens.style.left = `${lensX}px`;
            zoomLens.style.top = `${lensY}px`;

            // Apply zoom effect inside lens
            zoomLens.style.backgroundImage = `url(${mainImage.src})`;
            zoomLens.style.backgroundSize = `${rect.width * zoomRatio}px ${rect.height * zoomRatio}px`;

            const bgX = -(x * zoomRatio - zoomLens.offsetWidth / 2);
            const bgY = -(y * zoomRatio - zoomLens.offsetHeight / 2);

            zoomLens.style.backgroundPosition = `${bgX}px ${bgY}px`;
        });

        mainImageContainer.addEventListener('mouseenter', () => {
            zoomLens.style.opacity = '1';
        });

        mainImageContainer.addEventListener('mouseleave', () => {
            zoomLens.style.opacity = '0';
        });
    }



    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

}); // DOMContentLoaded Ends

function addtoWishlist(productId) {
    fetch('/addtowishlist', {
        method: 'POST',
        body: JSON.stringify({ productId }),
        headers: { 'Content-Type': 'application/json' }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const icon = document.querySelector(`.wishlist-btn`);
                if (icon) {
                    if (data.done === 'Added') icon.classList.add('active');
                    else if (data.done === 'Removed') icon.classList.remove('active');
                }
            } else {
                Swal.fire('Oops', data.message || 'Something went wrong', 'error');
            }
        })
        .catch(() => {
            Swal.fire('Oops', 'Request failed', 'error');
        });
}