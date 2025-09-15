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
    if (cartButton) {
        cartButton.addEventListener('click', () => {
            const productId = cartButton.dataset.id;
            addToCart(productId);
        });
    }

    // Quantity decrease
    if (minusBtn) {
        minusBtn.addEventListener('click', () => {
            let quantity = parseInt(quantityInput.value);
            if (quantity > 1) {
                quantityInput.value = quantity - 1;
            }
        });
    }

    // Quantity increase
    if (plusBtn) {
        plusBtn.addEventListener('click', () => {
            let quantity = parseInt(quantityInput.value);
            quantityInput.value = quantity + 1;
        });
    }

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

    // Thumbnail Carousel Logic
    const thumbnailWrapper = document.getElementById('thumbnailWrapper');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const mainImage = document.getElementById('mainImage');
    
    let currentOffset = 0;
    let activeIndex = 0;
    const visibleThumbnails = 3;
    const thumbnailWidth = 130; // 120px width + 10px gap

    // Initialize carousel
    if (thumbnails.length > 0) {
        initializeThumbnailCarousel();
    }

    function initializeThumbnailCarousel() {
        // Show only 3 thumbnails initially
        updateCarouselPosition();
        
        // Add event listeners to thumbnails
        thumbnails.forEach((thumbnail, index) => {
            thumbnail.addEventListener('click', () => {
                selectThumbnail(index);
            });
        });

        // Navigation buttons (only if more than 3 images)
        if (thumbnails.length > visibleThumbnails) {
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    navigateCarousel(-1);
                });
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    navigateCarousel(1);
                });
            }
        }
    }

    function selectThumbnail(index) {
        // Remove active class from all thumbnails
        thumbnails.forEach(t => t.classList.remove('active'));
        
        // Add active class to selected thumbnail
        thumbnails[index].classList.add('active');
        
        // Update main image
        const newSrc = thumbnails[index].getAttribute('data-src');
        mainImage.src = newSrc;
        
        // Update active index
        activeIndex = index;
        
        // Adjust carousel position to keep selected image centered
        adjustCarouselForActiveImage();
    }

    function adjustCarouselForActiveImage() {
        if (thumbnails.length <= visibleThumbnails) {
            return; // No need to adjust if all images are visible
        }

        let newOffset = currentOffset;

        // If active image is the first one, show from beginning
        if (activeIndex === 0) {
            newOffset = 0;
        }
        // If active image is the last one, show last 3 images
        else if (activeIndex === thumbnails.length - 1) {
            newOffset = thumbnails.length - visibleThumbnails;
        }
        // Otherwise, try to center the active image
        else {
            newOffset = Math.max(0, Math.min(activeIndex - 1, thumbnails.length - visibleThumbnails));
        }

        currentOffset = newOffset;
        updateCarouselPosition();
        updateNavigationButtons();
    }

    function navigateCarousel(direction) {
        const maxOffset = Math.max(0, thumbnails.length - visibleThumbnails);
        
        currentOffset += direction;
        currentOffset = Math.max(0, Math.min(currentOffset, maxOffset));
        
        updateCarouselPosition();
        updateNavigationButtons();
    }

    function updateCarouselPosition() {
        if (thumbnailWrapper) {
            const translateX = -currentOffset * thumbnailWidth;
            thumbnailWrapper.style.transform = `translateX(${translateX}px)`;
        }
    }

    function updateNavigationButtons() {
        if (!prevBtn || !nextBtn || thumbnails.length <= visibleThumbnails) {
            return;
        }

        const maxOffset = thumbnails.length - visibleThumbnails;
        
        prevBtn.disabled = currentOffset === 0;
        nextBtn.disabled = currentOffset >= maxOffset;
        
        prevBtn.style.opacity = currentOffset === 0 ? '0.3' : '0.8';
        nextBtn.style.opacity = currentOffset >= maxOffset ? '0.3' : '0.8';
    }

    // Zoom functionality
    const mainImageContainer = document.querySelector('.main-image-container');
    const zoomLens = document.getElementById('zoomLens');

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

    // Tab functionality
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const tabContent = document.getElementById(tab.dataset.tab);
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });

    // Search functionality
    const search = document.getElementById('search')
    const clearButton = document.getElementById('clear-button')
    
    if (search) {
        search.addEventListener('keypress', async (e)=> {
            const searchValue = search.value.trim()

            if( searchValue && e.key === 'Enter' ){
                console.log('search : ',searchValue)
                window.location = `/shop?search=${encodeURIComponent(searchValue)}`;
            }
        })
    }

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