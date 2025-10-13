const addressData = '<%- JSON.stringify(address || []) %>';

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('addressModal');
    const closeModal = document.getElementById('closeModal');
    const modalTitle = document.getElementById('modalTitle');
    const saveAddressBtn = document.getElementById('saveAddress');
    const addressForm = document.getElementById('addressForm');
    const addressIdInput = document.getElementById('addressId');

    // Close modal
    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
        addressForm.reset();
        clearErrors(addressForm);
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            addressForm.reset();
            clearErrors(addressForm);
        }
    });

    // Handle form submission
    addressForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(addressForm);
        const jsonData = Object.fromEntries(formData);
        Object.keys(jsonData).forEach(key => {
            if (typeof jsonData[key] === 'string') {
                jsonData[key] = jsonData[key].trim();
            }
        });

        let errors = validateForm(jsonData);
        if (errors) {
            displayFormErrors(addressForm, errors);
            return;
        }

        const isUpdate = saveAddressBtn.textContent === 'Update Address';
        const url = isUpdate ? '/editAddress' : '/addAddress';
        const method = isUpdate ? 'PATCH' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                body: JSON.stringify(jsonData),
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            });
            const data = await response.json();

            if (!data.success) {
                if (data.errors) {
                    displayFormErrors(addressForm, data.errors);
                } else {
                    showNotification(
                        data.message || `Failed to ${isUpdate ? 'update' : 'add'} address.`,
                        'error'
                    );
                }
                return;
            }

            const tBody = document.getElementById('addressTable');
            const noRow = tBody.querySelector('tr td');
            if (noRow && noRow.innerText.includes('No Address')) {
                tBody.innerHTML = '';
            }

            if (isUpdate) {

                const existingRow = tBody.querySelector(`tr[data-id="${data.address._id}"]`);
                if (existingRow) {
                    existingRow.innerHTML = `
                        <td>
                            ${data.address.name}, ${data.address.streetAddress}, 
                            ${data.address.city}, ${data.address.state}, 
                            ${data.address.country}, ${data.address.pincode}
                        </td>
                        <td class="action-buttons">
                            <button class="btn-icon edit-btn" 
                                title="Edit" 
                                data-id="${data.address._id}" 
                                data-address='${JSON.stringify([data.address])}'>✏️</button>
                            <button class="btn-icon delete-btn" 
                                title="Delete" 
                                onclick="deleteAddress('${data.address._id}')">🗑️</button>
                        </td>
                    `;
                }
            } else {

                const newRow = document.createElement('tr');
                newRow.setAttribute('data-id', data.address._id);
                newRow.innerHTML = `
                    <td>
                        ${data.address.name}, ${data.address.streetAddress}, 
                        ${data.address.city}, ${data.address.state}, 
                        ${data.address.country}, ${data.address.pincode}
                    </td>
                    <td class="action-buttons">
                        <button class="btn-icon edit-btn" 
                            title="Edit" 
                            data-id="${data.address._id}" 
                            data-address='${JSON.stringify([data.address])}'>✏️</button>
                        <button class="btn-icon delete-btn" 
                            title="Delete" 
                            onclick="deleteAddress('${data.address._id}')">🗑️</button>
                    </td>
                `;
                tBody.appendChild(newRow);
            }

            showNotification(
                data.message || `Address ${isUpdate ? 'updated' : 'added'} successfully!`,
                'success'
            );

            modal.classList.remove('active');
            addressForm.reset();
        } catch (error) {
            console.error(`Error ${isUpdate ? 'updating' : 'adding'} address:`, error);
            return showNotification('Something went wrong. Try again later', 'error');
        }
    });


    function displayFormErrors(form, errors) {
        clearErrors(form);
        if (errors && typeof errors === 'object') {
            Object.entries(errors).forEach(([field, message]) => {
                const input = form.querySelector(`[name="${field}"]`);
                if (input) {
                    input.classList.add('is-invalid');
                    const feedback = input.parentElement.querySelector('.invalid-feedback');
                    if (feedback) {
                        feedback.textContent = message;
                    }
                }
            });
        }
    }

    function clearErrors(form) {
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        form.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
    }

    window.openAddModal = function () {
        modalTitle.textContent = 'Add Address';
        saveAddressBtn.textContent = 'Add Address';
        addressForm.reset();
        addressIdInput.value = '';
        modal.classList.add('active');
    };

    window.openEditModal = function (id) {
        modalTitle.textContent = 'Edit Address';
        saveAddressBtn.textContent = 'Update Address';

        const address = addressData.find(addr => addr._id == id);
        if (address) {
            addressIdInput.value = address._id;
            document.getElementById('name').value = address.name || '';
            document.getElementById('phone1').value = address.phone || '';
            document.getElementById('country').value = address.country || '';
            document.getElementById('city').value = address.city || '';
            document.getElementById('streetAddress').value = address.streetAddress || '';
            document.getElementById('apartment').value = address.landMark || address.apartment || '';
            document.getElementById('state').value = address.state || '';
            document.getElementById('district').value = address.district || '';
            document.getElementById('email').value = address.email || '';
            document.getElementById('pincode').value = address.pincode || '';
            document.getElementById('phone').value = address.altPhone || address.phone || '';

            const addressTypeRadio = document.querySelector(`input[name="addressType"][value="${address.addressType || 'home'}"]`);
            if (addressTypeRadio) {
                addressTypeRadio.checked = true;
            }
        } else {
            showNotification('Address is not found.', 'error')
            return;
        }

        modal.classList.add('active');
    };

    window.deleteAddress = async function (id) {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this address?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f9a826',
            cancelButtonColor: '#dc3545',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/deleteAddress/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
                });
                const data = await response.json();

                if (!data.success) {
                    showNotification(data.message || 'Failed to delete.', 'error')
                    return;
                }

                const row = document.querySelector(`tr[data-id=${id}]`)
                if (row) {
                    row.remove()
                }
                showNotification(data.message || 'Address deleted', 'success')
            } catch (error) {
                console.error('Error deleting address:', error);
                return showNotification('Something went wrong. Try again later', 'error');
            }
        }
    };

    function validateForm(data) {
        const namePattern = /^[a-zA-Z\s]+$/;
        const phonePattern = {
            'USA': /^\+1[2-9]\d{2}[2-9]\d{6}$/,
            'India': /^\+91[6-9]\d{9}$/,
            'UK': /^\+44\d{10}$/,
            'UAE': /^\+971\d{8,9}$/,
            'SAUDI ARABIA': /^\+966\d{8,9}$/
        };
        const pincodePattern = /^\d{5,10}$/;
        let errors = {};

        if (!data.name) {
            errors.name = "Name is required!";
        } else if (!namePattern.test(data.name)) {
            errors.name = "Name can only contain letters and spaces!";
        }

        // Phone
        if (data.phone) {
            if (data.country && phonePattern[data.country]) {
                if (!phonePattern[data.country].test(data.phone)) {
                    errors.phone = "Invalid phone number format!";
                }
            } else {
                errors.phone = "Unsupported country for phone validation!";
            }
        } else {
            errors.phone = "Phone number 1 is required!";
        }

        // Alternate Phone
        if (data.altPhone) {
            if (data.country && phonePattern[data.country]) {
                if (!phonePattern[data.country].test(data.altPhone)) {
                    errors.altPhone = "Invalid phone number format!";
                }
            } else {
                errors.altPhone = "Unsupported country for phone validation!";
            }
        } else {
            errors.altPhone = "Phone number 2 is required!";
        }

        if (!data.country) {
            errors.country = "Country is required!";
        }

        if (!data.city) {
            errors.city = "Town/City is required!";
        }

        if (!data.streetAddress) {
            errors.streetAddress = "Street address is required!";
        }

        if (!data.state) {
            errors.state = "State is required!";
        }

        if (!data.district) {
            errors.district = "District is required!";
        }

        if (!data.pincode) {
            errors.pincode = "Pincode is required!";
        } else if (!pincodePattern.test(data.pincode)) {
            errors.pincode = "Pincode must be 5-10 digits!";
        }

        return Object.keys(errors).length > 0 ? errors : null;
    }

    const search = document.getElementById('search');
    const clearButton = document.getElementById('clear-button');

    search.addEventListener('keypress', async (e) => {

        const searchValue = search.value.trim();

        if (searchValue && e.key === 'Enter') {
            console.log('search : ', searchValue);
            window.location = `/shop?search=${encodeURIComponent(searchValue)}`;
        }
    })

});

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
