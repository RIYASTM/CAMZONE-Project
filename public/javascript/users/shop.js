document.addEventListener("DOMContentLoaded", () => {
    const brandCheckboxes = document.querySelectorAll('.brand');
    const categoryCheckBoxes = document.querySelectorAll('.category');
    const filterPrices = document.querySelectorAll('.filterPrice');
    const sortNames = document.querySelectorAll('.sortName');
    const stockSort = document.querySelectorAll('.stock');
    const resetFilter = document.getElementById('reset-filter');
    const resetPrice = document.getElementById('reset-price');
    const resetavailability = document.getElementById('reset-availability');
    const resetCategory = document.getElementById('reset-category');
    const resetBrand = document.getElementById('reset-brand');
    const clearAllBtn = document.getElementById('clear-all');
    const search = document.getElementById('search')
    const clearButton = document.getElementById('clear-button')
    let searchValue = search?.value || ''

    // console.log('search : ', searchValue.toLowerCase().slice(0, -1))

    function applyFilters() {
        const selectedBrands = Array.from(brandCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        const selectedCategories = Array.from(categoryCheckBoxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        const selectedPrices = document.querySelector('input.filterPrice:checked')?.value || '';
        const selectedSortName = document.querySelector('input.sortName:checked')?.value || '';
        const selectedStockSort = document.querySelector('input.stock:checked')?.value || '';

        let queryParts = [];


        if (selectedBrands.length > 0) {
            queryParts.push(selectedBrands.map(b => `brand=${encodeURIComponent(b)}`).join('&'));
        }

        if (selectedCategories.length > 0) {
            queryParts.push(selectedCategories.map(c => `category=${encodeURIComponent(c)}`).join('&'));
        }

        if (selectedPrices) {
            queryParts.push(`price=${encodeURIComponent(selectedPrices)}`);
        }

        if (selectedSortName) {
            queryParts.push(`sortName=${encodeURIComponent(selectedSortName)}`);
        }

        if (selectedStockSort) {
            queryParts.push(`sortQuantity=${encodeURIComponent(selectedStockSort)}`);
        }

        if (search.value.trim()) {
            queryParts.push(`search=${encodeURIComponent(search.value.trim())}`);
        }

        // Preserve the current page if it exists
        const params = new URLSearchParams(window.location.search);
        console.log('params : ', params)
        const currentPage = params.get('page') || '1';
        queryParts.push(`page=${currentPage}`);

        const finalQuery = queryParts.join('&');

        console.log('Filters: ', finalQuery);

        if (finalQuery) {
            window.location.href = `/shop?${finalQuery}`;
        } else {
            window.location.href = '/shop';
        }
    }

    if (search) {
        search.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }

    // Clear button
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            search.value = "";
            applyFilters();
        });
    }
      
    brandCheckboxes.forEach(cb => {
        const labelName = cb.parentElement.textContent.trim().toLowerCase()
        const search = searchValue.trim().toLowerCase()
        if (labelName === search) {
            cb.checked = true
        }
        cb.addEventListener('change', applyFilters)
    });
    categoryCheckBoxes.forEach(cb => {
        const labelName = cb.parentElement.textContent.trim().toLowerCase()
        const search = searchValue.trim().toLowerCase()
        if (labelName === search || search === labelName.slice(0, -1)) {
            cb.checked = true
        }
        cb.addEventListener('change', applyFilters)
    });
    
    filterPrices.forEach(radio => radio.addEventListener('change', applyFilters));
    sortNames.forEach(radio => radio.addEventListener('change', applyFilters));
    stockSort.forEach(radio => radio.addEventListener('change', applyFilters));

    // Reset Filter Handlers
    resetFilter.addEventListener('click', (e) => {
        e.preventDefault();
        sortNames.forEach(cb => cb.checked = false);
        applyFilters();
    });

    resetPrice.addEventListener('click', (e) => {
        e.preventDefault();
        filterPrices.forEach(cb => cb.checked = false);
        applyFilters();
    });

    resetBrand.addEventListener('click', (e) => {
        e.preventDefault();
        brandCheckboxes.forEach(cb => cb.checked = false);
        applyFilters();
    });

    resetCategory.addEventListener('click', (e) => {
        e.preventDefault();
        categoryCheckBoxes.forEach(cb => cb.checked = false);
        applyFilters();
    });

    if (resetavailability) {
        resetavailability.addEventListener('click', (e) => {
            e.preventDefault();
            stockSort.forEach(cb => cb.checked = false);
            applyFilters();
        });
    }

    clearAllBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
            input.checked = false;
        });
        applyFilters()
    });

    // Parse URL query parameters and set the state of inputs
    const params = new URLSearchParams(window.location.search);

    // Set checkboxes for brands
    const selectedBrands = params.getAll('brand');
    brandCheckboxes.forEach(cb => {
        if (selectedBrands.includes(cb.value)) {
            cb.checked = true;
        }
    });

    // Set checkboxes for categories
    const selectedCategories = params.getAll('category');
    categoryCheckBoxes.forEach(cb => {
        if (selectedCategories.includes(cb.value)) {
            cb.checked = true;
        }
    });

    // Set radio for price filter
    const price = params.get('price');
    if (price) {
        const input = document.querySelector(`.filterPrice[value="${price}"]`); 
        if (input) input.checked = true;
    }

    // Set radio for sort name
    const sortName = params.get('sortName');
    if (sortName) {
        const input = document.querySelector(`.sortName[value="${sortName}"]`);
        if (input) input.checked = true;
    }

    // Update "Selected" counts in the UI
    document.querySelectorAll('.sidebar p').forEach(p => {
        if (p.textContent.includes('Selected')) {
            const sectionHeader = p.parentElement.querySelector('h2').textContent;
            let count = 0;
            if (sectionHeader === 'Filter') {
                count = document.querySelectorAll('input.sortName:checked').length;
            } else if (sectionHeader === 'Price') {
                count = document.querySelectorAll('input.filterPrice:checked').length;
            } else if (sectionHeader === 'Categories') {
                count = document.querySelectorAll('input.category:checked').length;
            } else if (sectionHeader === 'Brand') {
                count = document.querySelectorAll('input.brand:checked').length;
            }
            p.firstChild.textContent = `${count} Selected `;
        }
    });

    document.querySelectorAll(".wishlist-btn").forEach(button => {
        button.addEventListener("click", function (e) {
            e.stopPropagation();
            const productId = this.getAttribute("data-id");
            addtoWishlist(productId);
        });
    });
});


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

                // showNotification('Product added to Your Wishlist!', 'success');
                const icon = document.querySelector(`.wishlist-btn[data-id="${productId}"]`);

                if (icon) {
                    if (data.done === 'Added') {
                        icon.classList.add('active');
                    } else if (data.done === 'Removed') {
                        icon.classList.remove('active')
                    }
                }

            } else {
                showNotification(data.message || 'Failed to add to wishlist!', 'error');
            }
        }).catch(() => {
            showNotification('Request failed!', 'error');
        });
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
