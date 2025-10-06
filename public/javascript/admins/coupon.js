document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const addCouponButton = document.getElementById('addCouponButton');
    const cancelAddCouponButton = document.getElementById('cancelAddCouponButton');
    const addCouponModal = document.getElementById('addCouponModal');
    const addCouponForm = document.getElementById('addCouponForm');
    const editCouponModal = document.getElementById('editCouponModal');
    const editCouponForm = document.getElementById('editCouponForm');
    const cancelEditCouponButton = document.getElementById('cancelEditCouponButton');
    const deleteCouponModal = document.getElementById('deleteCouponModal');
    const confirmDeleteButton = document.getElementById('confirmDeleteButton');
    const cancelDeleteButton = document.getElementById('cancelDeleteButton');
    const searchBar = document.getElementById('search');
    const sortBy = document.querySelector('.sort-by');
    const filter = document.querySelector('.filter');
    const clearButton = document.getElementById('clear-button');

    const couponMaxOrderInput = document.getElementById('maxOrder')
    const maxOrderValue = couponMaxOrderInput.value ? Number(couponMaxOrderInput.value) : 700000;
    couponMaxOrderInput.value = maxOrderValue

    let currentPages = 1; 

    // Modal close on outside click or Escape key
    [addCouponModal, editCouponModal, deleteCouponModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                if (modal === addCouponModal) addCouponForm.reset();
                if (modal === editCouponModal) editCouponForm.reset();
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            [addCouponModal, editCouponModal, deleteCouponModal].forEach(modal => {
                modal.style.display = 'none';
                if (modal === addCouponModal) addCouponForm.reset();
                if (modal === editCouponModal) editCouponForm.reset();
            });
        }
    });

    const searchValue = searchBar.value

    document.getElementById('search').addEventListener('keypress', function (e) {
        const searchValue = search.value

        if (e.key === 'Enter') {
            window.location.href = `?search=${searchValue}`
        }
    })

    if (searchValue) {

        document.getElementById('clear-button').addEventListener('click', function (e) {

            window.location.href = `/admin/coupons`
        })
    }

    
    const discountTypeEl = document.getElementById('discountType')
    const minOrderEl = document.getElementById('minOrder')
    const discountEl = document.getElementById('discount')

    discountTypeEl.addEventListener('change', updateMinOrder);
    discountEl.addEventListener('input', updateMinOrder);

    function updateMinOrder() {
        const discountType = discountTypeEl.value;
        const discount = parseFloat(discountEl.value) || 0;

        if (discountType === 'fixed') {
            minOrderEl.value = Math.ceil(discount * 1.2);
            minOrderEl.disabled = true;
        } else {
            minOrderEl.disabled = false;
            minOrderEl.value = ''; // optional: clear for percentage
        }
    }

    // Event Listeners
    addCouponButton.addEventListener('click', () => {
        clearErrors(addCouponForm);
        addCouponModal.style.display = 'block';
    });

    cancelAddCouponButton.addEventListener('click', () => {
        addCouponModal.style.display = 'none';
        addCouponForm.reset();
    });

    cancelEditCouponButton.addEventListener('click', () => {
        editCouponModal.style.display = 'none';
        editCouponForm.reset();
    });

    cancelDeleteButton.addEventListener('click', () => {
        deleteCouponModal.style.display = 'none';
    });


    document.querySelector('.coupons-table tbody').addEventListener('click', async (e) => {
        e.preventDefault();
        editCouponForm.reset()
        const button = e.target.closest('.editCouponButton, .deleteCoupon');
        if (!button) return;

        if (button.classList.contains('editCouponButton')) {
            clearErrors(editCouponForm);
            const couponId = button.dataset.couponId;
            try {
                const response = await fetch(`/admin/coupon/${couponId}`);
                const result = await response.json();
                if (result.success) {
                    const coupon = result.coupon;
                    editCouponForm.querySelector('#couponId').value = coupon.id;
                    editCouponForm.querySelector('#editCouponCode').value = coupon.couponCode;
                    editCouponForm.querySelector('#editCouponName').value = coupon.couponName;
                    editCouponForm.querySelector('#editCouponDescription').value = coupon.description;
                    editCouponForm.querySelector('#editDiscountType').value = coupon.discountType;
                    editCouponForm.querySelector('#editDiscount').value = coupon.discount;
                    // Setup dynamic minOrder behavior
                    const editDiscountTypeEl = editCouponForm.querySelector('#editDiscountType');
                    const editDiscountEl = editCouponForm.querySelector('#editDiscount');
                    const editMinOrderEl = editCouponForm.querySelector('#editMinOrder');

                    function updateEditMinOrder() {
                        const discountType = editDiscountTypeEl.value;
                        const discount = parseFloat(editDiscountEl.value) || 0;

                        if (discountType === 'fixed') {
                            editMinOrderEl.value = Math.ceil(discount * 1.2);
                            editMinOrderEl.readOnly = true;
                        } else {
                            editMinOrderEl.readOnly = false;
                            editMinOrderEl.value = coupon.minOrder || 60000;
                        }
                    }

                    editDiscountTypeEl.addEventListener('change', updateEditMinOrder);
                    editDiscountEl.addEventListener('input', updateEditMinOrder);

                    // Set initial minOrder
                    updateEditMinOrder();

                    editCouponForm.querySelector('#editMaxOrder').value = coupon.maxOrder || 700000;
                    editCouponForm.querySelector('#editValidFrom').value = new Date(coupon.validFrom).toISOString().split('T')[0];
                    editCouponForm.querySelector('#editValidUpto').value = new Date(coupon.validUpto).toISOString().split('T')[0];
                    editCouponForm.querySelector('#editCouponLimit').value = coupon.couponLimit || '';
                    editCouponForm.querySelector('#editDeactivateCoupon').checked = !coupon.isList;
                    editCouponModal.style.display = 'block';
                } else {
                    console.error('Failed to fetch coupon details!', error.message || error)
                    showNotification('Failed to fetch coupon details!')
                }
            } catch (error) {
                console.error(`Error fetching coupon: ${error.message}`)
            }
        } else if (button.classList.contains('deleteCoupon')) {
            const couponName = button.closest('tr').querySelector('td:first-child').textContent;
            deleteCouponModal.querySelector('#deleteCouponMessage').textContent = `Are you sure you want to delete the coupon "${couponName}"?`;
            deleteCouponModal.dataset.couponId = button.dataset.couponId;
            deleteCouponModal.style.display = 'block';
        }
    });

    searchBar.addEventListener('input', debounce(async () => {
        currentPages = 1;
        await fetchCoupons({ search: searchBar.value.trim(), sort: sortBy.value, filter: filter.value, page: currentPages });
    }, 300));

    sortBy.addEventListener('change', async () => {
        currentPages = 1;
        await fetchCoupons({sort: sortBy.value, filter: filter.value, page: currentPages });
    });

    filter.addEventListener('change', async () => {
        currentPages = 1;
        await fetchCoupons({  sort: sortBy.value, filter: filter.value, page: currentPages });
    });

    if (clearButton) {
        clearButton.addEventListener('click', async () => {
            searchBar.value = '';
            currentPages = 1;
            await fetchCoupons({ filter: filter.value, page: currentPages });
        });
    }

    addCouponForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(addCouponForm);
        const jsonData = {};
        formData.forEach((value, key) => {
            jsonData[key] = value;
        });
        Object.keys(jsonData).forEach(key => {
            if (typeof jsonData[key] === 'string') {
                jsonData[key] = jsonData[key].trim();
            }
        });

        const errors = validateCoupon(jsonData);
        if (errors) {
            displayFormError(addCouponForm, errors);
            return;
        }

        try {
            const response = await fetch('/admin/addCoupon', {
                method: 'POST',
                body: JSON.stringify(jsonData),
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            });
            const result = await response.json();
            if (!result.success) {
                showNotification(result.message || 'Coupon adding failed!', 'error')
                return;
            }else{
                showNotification('The new coupon has been successfully added!', 'success')
                addCouponModal.style.display = 'none';
                await fetchCoupons({ search: searchBar.value.trim(), sort: sortBy.value, filter: filter.value, page: currentPages });
            }
        } catch (error) {
            console.error(`Something went wrong while adding coupon: `,error.message)
        }
    });

    editCouponForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors(editCouponForm);

        const formData = new FormData(editCouponForm);
        const jsonData = {};
        formData.forEach((value, key) => {
            jsonData[key] = value;
        });
        Object.keys(jsonData).forEach(key => {
            if (typeof jsonData[key] === 'string') {
                jsonData[key] = jsonData[key].trim();
            }
        });

        const errors = validateCoupon(jsonData);
        if (errors) {
            displayFormError(editCouponForm, errors);
            return;
        }

        try {
            const response = await fetch('/admin/editCoupon', {
                method: 'POST',
                body: JSON.stringify(jsonData),
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            });
            const result = await response.json();
            if (!result.success) {
                showNotification(result.message || 'Coupon updating failed!', 'error')
                return;
            }else{
                showNotification('The coupon has been successfully updated!', 'success')
                editCouponModal.style.display = 'none';
                editCouponForm.reset();
                await fetchCoupons({ search: searchBar.value.trim(), sort: sortBy.value, filter: filter.value, page: currentPages });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Something went wrong while updating coupon: ${error.message}`
            });
        }
    });

    confirmDeleteButton.addEventListener('click', async () => {
        try {
            const couponId = deleteCouponModal.dataset.couponId;
            const response = await fetch(`/admin/deleteCoupon/${couponId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            });
            const result = await response.json();
            if (!result.success) {
                showNotification('Failed to delete coupon!!', 'error')
                return;
            }else{
                showNotification('Coupon has been deleted!!', 'success')
                deleteCouponModal.style.display = 'none';
                await fetchCoupons({ search: searchBar.value.trim(), sort: sortBy.value, filter: filter.value, page: currentPages });
            }
        } catch (error) {
            console.error('Something went wrong while deleting coupon : ', error.message || error)
        }
    });

    function clearErrors(form) {
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        form.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
    }

    function displayFormError(form, errors) {
        clearErrors(form);
        if (errors && typeof errors === 'object') {
            Object.entries(errors).forEach(([field, message]) => {
                const input = form.querySelector(`.${field}`);
                if (input) {
                    input.classList.add('is-invalid');
                    const feedback = input.nextElementSibling;
                    if (feedback && feedback.classList.contains('invalid-feedback')) {
                        feedback.textContent = message;
                    }
                }
            });
        }
    }

    function validateCoupon(data) {
        const namePattern = /^[a-zA-Z\s]+$/;
        const errors = {};

        if (!data.couponName || typeof data.couponName !== 'string' || !namePattern.test(data.couponName.trim())) {
            errors.couponName = 'Coupon name is required and must contain only letters and spaces';
        }

        if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
            errors.description = 'Description is required';
        }

        if (!data.discountType || !['percentage', 'fixed'].includes(data.discountType)) {
            errors.discountType = 'Discount type must be either "percentage" or "fixed"';
        }

        const discount = parseFloat(data.discount);
        if (isNaN(discount) || discount <= 0) {
            errors.discount = 'Discount is required and must be a positive number';
        } else if(discount > 60000) {
            errors.discount = 'Discount should under 60,000!!'
        } else if (data.discountType === 'percentage' &&  discount > 80) {
            errors.discount = 'Percentage discount must be between 1 and 80';
        }

        const minOrder = Math.floor(parseFloat(data.minOrder))
        if (isNaN(minOrder) || minOrder <= 0) {
            errors.minOrder = 'Minimum order amount is required and must be positive';
        } else if ( data.minOrder && data.discountType === 'fixed'){
            const minAmount = discount + (discount * 0.2)
            if(minOrder < minAmount)
            errors.minOrder = `Minimum order should be ${minAmount} or above!!`
        }

        const maxOrder = parseFloat(data.maxOrder)
        if (isNaN(maxOrder)){
            errors.maxOrder = 'Maximum order amount is required'
        } else if ( maxOrder <= minOrder){
            errors.maxOrder = 'Maximum order must be greater than Minimum Order'
        }

        const validFrom = new Date(data.validFrom);
        const validUpto = new Date(data.validUpto);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(validFrom.getTime())) {
            errors.validFrom = 'Valid from date is required and must be a valid date';
        } else if (validFrom < today) {
            errors.validFrom = `Valid from date shouldn't be earlier than today`;
        }

        if (isNaN(validUpto.getTime())) {
            errors.validUpto = 'Valid upto date is required and must be a valid date';
        } else if (validUpto <= validFrom) {
            errors.validUpto = 'Valid upto date must be after valid from date';
        }

        if (!data.couponLimit){
            errors.couponLimit = 'Coupon Limit is required!!'
        } else if (data.couponLimit && (isNaN(parseInt(data.couponLimit)) || parseInt(data.couponLimit) < 0)) {
            errors.couponLimit = 'Usage limit must be a non-negative number';
        } else if (data.couponLimit && data.couponLimit > 5) {
            errors.couponLimit = `Coupon shouldn't be able to use more than 5`
        }

        return Object.keys(errors).length > 0 ? errors : null;
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async function fetchCoupons({ sort, filter, page }) {
        try {
            let queryParts = []

            if(sort){
                queryParts.push(`sort=${sort}`)
            }
            if(filter){
                queryParts.push(`filter=${filter}`)
            }
            if(page){
                queryParts.push(`page=${page}`)
            }

            const finalQuery = queryParts.join('&');
            
            const response = await fetch(`/admin/coupons?${finalQuery}`, {
                method  : 'GET',
                headers : {
                    'Content-Type' : 'application/json',
                    'Accept' : 'application/json'
                }
            });
            const result = await response.json();
            if (result.success) {
                updateCouponTable(result.coupons);
            } else {
                console.log('Failed to fetch coupons : ', error.message || error)
            }
        } catch (error) {
            console.log('Something went wrong : ', error.message || error)
        }
    }

    function updateCouponTable(coupons) {
        const tbody = document.querySelector('.coupons-table tbody');
        tbody.innerHTML = '';
        if (coupons.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">No coupons found</td></tr>';
            return;
        }
        coupons.forEach(coupon => {
            const tr = document.createElement('tr'); 
            tr.innerHTML = `
                <td>${coupon.couponName}</td>
                <td>${coupon.couponCode}</td>
                <td>${coupon.discountType.charAt(0).toUpperCase() + coupon.discountType.slice(1)}</td>
                <td>${coupon.discountType === 'percentage' ? coupon.discount + '%' : '₹ ' + coupon.discount}</td>
                <td>₹ ${coupon.minOrder}</td>
                <td>₹ ${coupon.maxOrder}</td>
                <td>${new Date(coupon.validFrom).toLocaleDateString()}</td>
                <td>${new Date(coupon.validUpto).toLocaleDateString()}</td>
                <td>${coupon.couponLimit || 'N/A'}</td>
                <td>${new Date(coupon.validUpto) < new Date() ? 'Expired' : (coupon.isList ? 'Active' : 'Inactive')}</td>
                <td>
                    <a href="#" class="action-icon editCouponButton" data-coupon-id="${coupon._id}" aria-label="Edit coupon"><i class="fas fa-edit"></i></a>
                    <a href="#" class="action-icon deleteCoupon" data-coupon-id="${coupon._id}" aria-label="Delete coupon"><i class="fas fa-trash"></i></a>
                </td>
            `;
            tbody.appendChild(tr);
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
});