

        const addressData = '<%- JSON.stringify(address || []) %>';
        console.log('Address Data : ', addressData)

        const countryCodeMap = {
            "India": "+91",
            "USA": "+1",
            "UK": "+44"
        };

        document.addEventListener('DOMContentLoaded', () => {
            const modal = document.getElementById('addressModal');
            const closeModal = document.getElementById('closeModal');
            const modalTitle = document.getElementById('modalTitle');
            const saveAddressBtn = document.getElementById('saveAddress');
            const addressForm = document.getElementById('addressForm');
            const addressIdInput = document.getElementById('addressId');
            const countrySelect = document.getElementById('country');
            const countryCode1 = document.getElementById('countryCode1');
            const countryCode2 = document.getElementById('countryCode2');

            // Update country code based on selected country
            countrySelect.addEventListener('change', (e) => {
                const code = countryCodeMap[e.target.value] || "+91";
                countryCode1.textContent = code;
                countryCode2.textContent = code;
            });

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

                const isUpdate = saveAddressBtn.textContent === 'Update Address'
                const url = isUpdate ? '/editAddress' : '/addAddress'
                const method = isUpdate ? 'PATCH' : 'POST'

                try {
                    const response = await fetch(url, {
                        method: method,
                        body: JSON.stringify(jsonData),
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await response.json();

                    if (!data.success) {
                        if (data.errors) {
                            displayFormErrors(addressForm, data.errors);
                        } else {
                            Swal.fire('Error', data.message || `Failed to ${isUpdate ? 'update' : 'add'} address.`, 'error');
                        }
                        return;
                    }

                    Swal.fire('Success', data.message || `Address ${isUpdate ? 'updated' : 'added'} successfully!`, 'success')
                        .then(() => {
                            modal.classList.remove('active');
                            addressForm.reset();
                            window.location.reload();
                        });
                } catch (error) {
                    console.error(`Error ${isUpdate ? 'updating' : 'adding'} address:`, error);
                    Swal.fire('Error', `Something went wrong while ${isUpdate ? 'updating' : 'adding'} the address.`, 'error');
                }
            })

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

            window.openAddModal = function() {
                modalTitle.textContent = 'Add Address';
                saveAddressBtn.textContent = 'Add Address';
                addressForm.reset();
                addressIdInput.value = '';
                countryCode1.textContent = '+91';
                countryCode2.textContent = '+91';
                modal.classList.add('active');
            };

            window.openEditModal = function(id) {
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

                    const countryCode = countryCodeMap[address.country] || '+91';
                    countryCode1.textContent = countryCode;
                    countryCode2.textContent = countryCode;
                } else {
                    Swal.fire('Error', 'Address not found.', 'error');
                    return;
                }
                
                modal.classList.add('active');
            };

            window.deleteAddress = async function(id) {
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
                            headers: { 'Content-Type': 'application/json' }
                        });
                        const data = await response.json();

                        if (!data.success) {
                            Swal.fire('Error', data.message || 'Failed to delete address.', 'error');
                            return;
                        }

                        Swal.fire('Deleted!', data.message || 'Address deleted successfully.', 'success')
                            .then(() => {
                                window.location.reload();
                            });
                    } catch (error) {
                        console.error('Error deleting address:', error);
                        Swal.fire('Error', 'Something went wrong while deleting the address.', 'error');
                    }
                }
            };
        

            function validateForm(data) {
                const namePattern = /^[a-zA-Z\s]+$/;
                const phonePattern = /^\+?\d{1,4}[\s-]?\d{6,14}$/;
                const pincodePattern = /^\d{5,10}$/;
                let errors = {};

                if (!data.name) {
                    errors.name = "Name is required!";
                } else if (!namePattern.test(data.name)) {
                    errors.name = "Name can only contain letters and spaces!";
                }

                if (!data.phone1) {
                    errors.phone1 = "Phone number 1 is required!";
                } else if (!phonePattern.test(data.phone1)) {
                    errors.phone1 = "Invalid phone number format!";
                }

                if (!data.phone) {
                    errors.phone = "Phone number 2 is required!";
                } else if (!phonePattern.test(data.phone)) {
                    errors.phone = "Invalid phone number format!";
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
        });