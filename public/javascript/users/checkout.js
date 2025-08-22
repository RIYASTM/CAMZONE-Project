
document.addEventListener("DOMContentLoaded", () => {

    const amountText = document.getElementById('totalAmount').innerText;
    const finalAmount = amountText.replace(/[₹]/, '').replaceAll(/,/g, '').trim()

    console.log('Final amount:', finalAmount);

    if (finalAmount > 50000) {
        const codInput = document.querySelector('input[value="COD"]');
        if (codInput) {
            codInput.disabled = true;
            codInput.checked = false;

            const codLabel = codInput.closest('label');
            if (codLabel) {
                const note = document.createElement('small')
                note.style.marginLeft = '4px'
                note.style.color = 'red'
                note.textContent = 'Not available for orders above 50,000'
                codLabel.appendChild(note)
            }
        }
    }

    if (finalAmount > 500000) {
        const razorpayInput = document.querySelector('input[value="Razorpay"]');
        if (razorpayInput) {
            razorpayInput.disabled = true;
            razorpayInput.checked = false;

            const razorpayLabel = razorpayInput.closest('label');
            if (razorpayLabel) {
                const note = document.createElement('small');
                note.style.marginLeft = '4px'
                note.style.color = 'red';
                note.textContent = 'Not available for orders above ₹5,00,000';
                razorpayLabel.appendChild(note);
            }
        }
    }

    const razorpayButton = document.getElementById('razorpayButton')
    const codButton = document.getElementById('codButton')
    const walletButton = document.getElementById('walletButton')

    if (finalAmount > 50000) {
        codButton.disabled = true
        const note = document.createElement('small')
        note.style.marginLeft = '4px'
        note.style.color = 'red'
        note.textContent = 'Not availabe for orders above 50,000'
    }

    if (finalAmount > 500000) {
        razorpayButton.disabled = true
        const note = document.createElement('small')
        note.style.marginLeft = '4px'
        note.style.color = 'red'
        note.textContent = 'Not availabe for orders above 5,00,000'
    }



    // Modal Elements
    const addAddressModal = document.getElementById('addAddressModal');
    const editAddressModal = document.getElementById('editAddressModal');
    const closeAddModalBtn = document.getElementById('closeAddModalBtn');
    const closeEditModalBtn = document.getElementById('closeEditModalBtn');
    const cancelAddModalBtn = document.getElementById('cancelAddModalBtn');
    const cancelEditModalBtn = document.getElementById('cancelEditModalBtn');

    // Form Elements
    const addressForm = document.getElementById('addressForm');
    const editAddressForm = document.getElementById('editAddressForm');
    const addAddressBtn = document.getElementById('addAddressBtn');
    const updateAddressBtn = document.getElementById('updateAddressBtn');

    // Address Radio Button Handling
    const addressRadios = document.querySelectorAll('.address-radio');
    const newAddressRadio = document.getElementById('newAddressRadio');
    let triggeringElement = null;

    //Coupons
    const applyButton = document.getElementById('applyCoupon')
    const couponInput = document.getElementById('couponCode')

    applyButton.addEventListener('click', (e) => {
        e.preventDefault()

        const couponCode = couponInput.value || 0
        console.log('couponCode : ', couponCode)
        if (applyButton.textContent.trim() === 'Apply') {
            applyCoupon(couponCode)
        } else {
            removeCoupon(couponCode)
        }

    })

    // Predefined state options and country codes
    const stateOptions = {
        India: [
            { value: "Kerala", text: "Kerala" },
            { value: "Karnataka", text: "Karnataka" },
            { value: "Tamil Nadu", text: "Tamil Nadu" }
        ],
        USA: [
            { value: "California", text: "California" },
            { value: "New York", text: "New York" },
            { value: "Texas", text: "Texas" }
        ],
        UK: [
            { value: "England", text: "England" },
            { value: "Scotland", text: "Scotland" },
            { value: "Wales", text: "Wales" }
        ]
    };

    const countryCodes = {
        India: "+91",
        USA: "+1",
        UK: "+44"
    };

    function updateStateOptions(countrySelect, stateSelectId) {
        const country = countrySelect.value;
        const stateSelect = document.getElementById(stateSelectId);
        stateSelect.innerHTML = '<option value="">Select your State</option>';

        if (country && stateOptions[country]) {
            stateOptions[country].forEach(state => {
                const option = document.createElement('option');
                option.value = state.value;
                option.textContent = state.text;
                stateSelect.appendChild(option);
            });
        }

        const isEditModal = stateSelectId === 'editState';
        const countryCode1 = document.getElementById(isEditModal ? 'editCountryCode1' : 'countryCode1');
        const countryCode2 = document.getElementById(isEditModal ? 'editCountryCode2' : 'countryCode2');
        const newCode = country && countryCodes[country] ? countryCodes[country] : '+91';
        countryCode1.textContent = newCode;
        countryCode2.textContent = newCode;
    }

    // Add event listeners for country selects
    const countrySelect = document.getElementById('country');
    const editCountrySelect = document.getElementById('editCountry');

    countrySelect.addEventListener('change', () => updateStateOptions(countrySelect, 'state'));
    editCountrySelect.addEventListener('change', () => updateStateOptions(editCountrySelect, 'editState'));

    function handleAddressRadioChange(e) {
        if (newAddressRadio.checked) {
            triggeringElement = e.target;
            addAddressModal.style.display = 'block';
            addAddressModal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            document.getElementById('phone').focus();
        }
    }

    addressRadios.forEach(radio => {
        radio.addEventListener('change', handleAddressRadioChange);
    });

    // Modal Close Functions
    function closeAddModal() {
        addAddressModal.style.display = 'none';
        addAddressModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        addressForm.reset();
        clearFormErrors(addressForm);
        newAddressRadio.checked = false;
        if (triggeringElement) {
            triggeringElement.focus();
        }
    }

    function closeEditModal() {
        editAddressModal.style.display = 'none';
        editAddressModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        editAddressForm.reset();
        clearFormErrors(editAddressForm);
        if (triggeringElement) {
            triggeringElement.focus();
        }
    }

    closeAddModalBtn.addEventListener('click', closeAddModal);
    cancelAddModalBtn.addEventListener('click', closeAddModal);
    closeEditModalBtn.addEventListener('click', closeEditModal);
    cancelEditModalBtn.addEventListener('click', closeEditModal);

    // Esc Key Support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (addAddressModal.style.display === 'block') {
                closeAddModal();
            }
            if (editAddressModal.style.display === 'block') {
                closeEditModal();
            }
        }
    });

    // Edit Address Button Handling
    const editAddressButtons = document.querySelectorAll('.edit-address-btn');
    editAddressButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            triggeringElement = e.target;
            const addressData = JSON.parse(button.getAttribute('data-address'));
            editAddressModal.style.display = 'block';
            editAddressModal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            document.getElementById('editPhone').focus();

            document.getElementById('editAddressId').value = addressData._id;
            document.getElementById('editName').value = addressData.name || '';
            document.getElementById('editPhone').value = addressData.phone ? addressData.phone.replace('+91', '') : '';
            document.getElementById('editAltPhone').value = addressData.altPhone ? addressData.altPhone.replace('+91', '') : '';
            document.getElementById('editCountry').value = addressData.country || '';
            document.getElementById('editCity').value = addressData.city || '';
            document.getElementById('editStreetAddress').value = addressData.streetAddress || '';
            document.getElementById('editLandMark').value = addressData.landMark || '';
            document.getElementById('editState').value = addressData.state || '';
            document.getElementById('editDistrict').value = addressData.district || '';
            document.getElementById('editPincode').value = addressData.pincode || '';

            const addressTypeRadios = document.getElementsByName('addressType');
            addressTypeRadios.forEach(radio => {
                radio.checked = radio.value === (addressData.addressType || 'home');
            });

            updateStateOptions(document.getElementById('editCountry'), 'editState');
            document.getElementById('editState').value = addressData.state || '';
        });
    });

    // Add Address Button Handling
    addAddressBtn.addEventListener('click', async () => {
        const errors = validateAddressForm(addressForm);
        if (errors) {
            displayFormErrors(addressForm, errors);
            return;
        }

        const formData = Object.fromEntries(new FormData(addressForm));
        console.log('Address data : ', formData)
        const mode = formData.formMode;
        delete formData.formMode;

        const countryCode = countryCodes[formData.country] || '+91';
        formData.phone = `${countryCode}${formData.phone}`;
        if (formData.altPhone) {
            formData.altPhone = `${countryCode}${formData.altPhone}`;
        }

        addAddressBtn.disabled = true;
        addAddressBtn.textContent = 'Adding...';
        // const URL = '/addAddress'


        try {
            const response = await fetch('/addAddress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            if (data.success) {
                closeAddModal();
                window.location.reload();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed',
                    text: data.message || `Failed to add address.`
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: navigator.onLine
                    ? `Error adding address: ${error.message}`
                    : 'No internet connection. Please check your network and try again.'
            });
        } finally {
            addAddressBtn.disabled = false;
            addAddressBtn.textContent = 'Add Address';
        }
    });

    // Update Address Button Handling
    updateAddressBtn.addEventListener('click', async () => {
        const errors = validateAddressForm(editAddressForm);
        if (errors) {
            displayFormErrors(editAddressForm, errors);
            return;
        }

        const formData = Object.fromEntries(new FormData(editAddressForm));
        const mode = formData.formMode;
        delete formData.formMode;

        const countryCode = countryCodes[formData.country] || '+91';
        formData.phone = `${countryCode}${formData.phone}`;
        if (formData.altPhone) {
            formData.altPhone = `${countryCode}${formData.altPhone}`;
        }

        updateAddressBtn.disabled = true;
        updateAddressBtn.textContent = 'Updating...';

        try {
            const response = await fetch('editAddress', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            if (data.success) {
                closeEditModal();
                window.location.reload();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed',
                    text: data.message || 'Failed to update address.'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: navigator.onLine
                    ? 'Error updating address: ' + error.message
                    : 'No internet connection. Please check your network and try again.'
            });
        } finally {
            updateAddressBtn.disabled = false;
            updateAddressBtn.textContent = 'Update Address';
        }
    });

    // Place Order Button
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    placeOrderBtn.addEventListener('click', () => placeOrder())

    async function placeOrder() {
        const selectedAddress = document.querySelector('input[name="address"]:checked');
        const paymentMethod = document.querySelector('input[name="payment"]:checked');
        const user = JSON.parse(placeOrderBtn.dataset.user)

        if (!selectedAddress) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Address',
                text: 'Please select a delivery address.'
            });
            placeOrderBtn.disabled = true;
            return;
        }

        if (!paymentMethod) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Payment Method',
                text: 'Please select a payment method.'
            });
            placeOrderBtn.disabled = true;
            return;
        }

        const addressData = { addressId: selectedAddress.value };
        const paymentData = { method: paymentMethod.value };
        const gst = document.getElementById('gst').textContent
        const couponCode = couponInput?.value || ''

        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = 'Processing...';

        try {
            const response = await fetch('/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ addressId: addressData, payment: paymentData, gst, couponCode })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                if (data.message === 'Razorpay Order Created!') {

                    const { razorpayOrder, amount, orderId } = data;

                    const options = {
                        key: 'rzp_test_t9knqvOVCcMCfu',
                        amount: amount * 100,
                        currency: 'INR',
                        name: 'CAMZONE',
                        description: 'Order Payment',
                        order_id: razorpayOrder.id,
                        handler: async function (response) {
                            try {
                                const verifyRes = await fetch('/verify-payment', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        razorpayPaymentId: response.razorpay_payment_id,
                                        razorpayOrderId: response.razorpay_order_id,
                                        razorpaySignature: response.razorpay_signature,
                                        orderId: orderId
                                    })
                                });
                                const verifyData = await verifyRes.json();
                                if (verifyData.success) {
                                    window.location.href = `/orderSuccess`;
                                } else {
                                    console.log('Razorpay responses : ', response)
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Payment Verification failed!!',
                                        text: verifyData.message || 'Something went wrong!!'
                                    });
                                }
                            } catch (error) {
                                console.error('Payment verification error:', error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Verification Error',
                                    text: 'Failed to verify payment. Please contact support.'
                                });
                            }
                        },
                        modal: {
                            ondismiss: function () {
                                handlePaymentDismiss(orderId, amount, user);
                            }
                        },
                        prefill: {
                            name: user.name,
                            email: user.email,
                            contact: user.phone
                        },
                        theme: {
                            color: '#3399cc'
                        }
                    };

                    if (amount > 100000) {
                        options.method = {
                            netbanking: true,
                            card: true,
                            upi: false
                        };

                        await Swal.fire({
                            icon: 'info',
                            title: 'Payment Method Restriction',
                            text: "UPI not available for orders above ₹1,00,000. Card and Net Banking are available.",
                            confirmButtonText: 'OK'
                        })
                    }

                    const rzp = new Razorpay(options);
                    rzp.open();
                } else {
                    window.location.href = data.redirectUrl || '/orderSuccess';
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Order Failed',
                    text: data.message || 'Failed to place order.'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: navigator.onLine
                    ? 'Error placing order: ' + error.message
                    : 'No internet connection. Please check your network and try again.'
            });
        } finally {
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Place Order';
        }
    }

    function handlePaymentDismiss(orderId, amount, user) {
        Swal.fire({
            icon: 'info',
            title: 'Your order is saved.',
            text: 'But it will be confirmed after completing your payment.',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: 'Retry Payment',
            denyButtonText: 'View Order',
            cancelButtonText: 'Back to Home',
            reverseButtons: true,
            allowOutsideClick: false,
        }).then((result) => {
            if (result.isConfirmed) {
                showRetryPaymentModal(orderId, amount, user);
            } else if (result.isDenied) {
                window.location.href = `/orderDetails/?id=${orderId}`;
            } else {
                window.location.href = '/';
            }
        });
    }

    function showRetryPaymentModal(orderId, amount, user) {
        const retryPaymentModal = document.getElementById('retryPaymentModal');
        const closeButton = document.getElementById('retryPaymentClose');

        if (retryPaymentModal && closeButton) {
            retryPaymentModal.style.display = 'block';

            closeButton.addEventListener('click', () => {
                retryPaymentModal.style.display = 'none';
            });

            window.retryPayment = function (method, currentOrderId = orderId, oldMethod = 'Razorpay') {
                handleRetryPayment(method, currentOrderId, oldMethod, amount, user);
            };
        }
    }

    async function handleRetryPayment(method, orderId, oldMethod, amount, user) {
        console.log('Payment Method:', method);
        console.log('orderId:', orderId);
        console.log('Old Method:', oldMethod);

        if (method === 'COD' && amount > 10000) {
            Swal.fire({
                icon: 'error',
                title: 'Payment Method Not Available',
                text: 'Cash on Delivery is not available for orders above ₹10,000.'
            });
            return;
        }

        if (method === 'Razorpay' && amount > 500000) {
            Swal.fire({
                icon: 'error',
                title: 'Payment Method Not Available',
                text: 'Razorpay is not available for orders above ₹5,00,000.'
            });
            return;
        }

        try {
            if (method !== oldMethod) {
                const result = await Swal.fire({
                    title: 'Are you sure?',
                    text: 'Do you want to change the payment method?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, change it!',
                    cancelButtonText: 'No, keep current'
                });

                if (!result.isConfirmed) return;
            }

            const res = await fetch('/retryPayment', {
                method: 'POST',
                body: JSON.stringify({ method, orderId, oldMethod }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await res.json();

            if (!response.success) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: response.message || 'Failed to retry payment'
                });
                return;
            }

            if (response.message === 'Razorpay Order Created!') {
                const { razorpayOrder, amount: retryAmount, orderId: retryOrderId } = response;

                if (retryAmount > 500000) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Payment Method Not Available',
                        text: "Razorpay not available for orders above ₹5,00,000. Please choose another method."
                    });
                    return;
                }

                const options = {
                    key: 'rzp_test_t9knqvOVCcMCfu',
                    amount: retryAmount * 100,
                    currency: 'INR',
                    name: 'CAMZONE',
                    description: 'Order Payment',
                    order_id: razorpayOrder.id,
                    handler: async function (razorpayResponse) {
                        try {
                            const verifyRes = await fetch('/verify-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpayPaymentId: razorpayResponse.razorpay_payment_id,
                                    razorpayOrderId: razorpayResponse.razorpay_order_id,
                                    razorpaySignature: razorpayResponse.razorpay_signature,
                                    orderId: retryOrderId
                                })
                            });

                            const verifyData = await verifyRes.json();
                            if (verifyData.success) {
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Success',
                                    text: verifyData.message || 'Payment completed successfully!'
                                }).then(() => {
                                    window.location.href = '/orderSuccess';
                                });
                            } else {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Payment Verification Failed',
                                    text: verifyData.message || 'Something went wrong!'
                                });
                            }
                        } catch (verifyError) {
                            console.error('Retry payment verification error:', verifyError);
                            Swal.fire({
                                icon: 'error',
                                title: 'Verification Error',
                                text: 'Failed to verify payment. Please contact support.'
                            });
                        }
                    },
                    prefill: {
                        name: user.name,
                        email: user.email,
                        contact: user.phone
                    },
                    theme: {
                        color: '#3399cc'
                    }
                };

                if (retryAmount > 100000) {
                    options.method = {
                        netbanking: true,
                        card: true,
                        upi: false
                    };

                    await Swal.fire({
                        icon: 'info',
                        title: 'Payment Method Restriction',
                        text: "UPI not available for orders above ₹1,00,000. Card and Net Banking are available.",
                        confirmButtonText: 'OK'
                    });
                }

                const rzp = new Razorpay(options);
                rzp.open();

            } else {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: response.message || `Payment method changed to ${method} successfully!`
                }).then(() => {
                    window.location.reload();
                });
            }

        } catch (error) {
            console.error('Retry payment error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Unexpected error occurred during retry payment.'
            });
        }
    }

    function validateAddressForm(form) {
        const formData = Object.fromEntries(new FormData(form));
        const namePattern = /^[a-zA-Z\s]+$/;
        const phonePatterns = {
            India: /^\d{10}$/,
            USA: /^\d{10}$/,
            UK: /^\d{10}$/
        };
        const pincodePatterns = {
            India: /^\d{6}$/,
            USA: /^\d{5}$/,
            UK: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/
        };

        let errors = {};

        if (!formData.name) {
            errors.name = "Name is required!";
        } else if (!namePattern.test(formData.name)) {
            errors.name = "Name can only contain letters and spaces!";
        }

        if (!formData.phone) {
            errors.phone = "Phone number is required!";
        } else if (formData.country && phonePatterns[formData.country]) {
            if (!phonePatterns[formData.country].test(formData.phone)) {
                errors.phone = `Phone number must be exactly 10 digits for ${formData.country}!`;
            }
        } else {
            errors.phone = "Phone number format not supported for this country!";
        }

        if (formData.altPhone && formData.country && phonePatterns[formData.country]) {
            if (!phonePatterns[formData.country].test(formData.altPhone)) {
                errors.altPhone = `Alternate phone number must be exactly 10 digits for ${formData.country}!`;
            }
        }

        if (!formData.country) {
            errors.country = "Country is required!";
        }

        if (!formData.landMark) {
            errors.landMark = 'Apartment or LandMark is required!'
        }

        if (!formData.city) {
            errors.city = "Town/City is required!";
        }

        if (!formData.streetAddress) {
            errors.streetAddress = "Street address is required!";
        }

        if (!formData.state) {
            errors.state = "State is required!";
        }

        if (!formData.district) {
            errors.district = "District is required!";
        }

        if (!formData.pincode) {
            errors.pincode = "Pincode is required!";
        } else if (formData.country && pincodePatterns[formData.country]) {
            if (!pincodePatterns[formData.country].test(formData.pincode)) {
                errors.pincode = `Invalid pincode format for ${formData.country}!`;
            }
        } else {
            errors.pincode = "Pincode format not supported for this country!";
        }

        return Object.keys(errors).length > 0 ? errors : null;
    }

    function displayFormErrors(form, errors) {
        clearFormErrors(form);
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

    function clearFormErrors(form) {
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        form.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
    }

    async function applyCoupon(couponCode) {
        Swal.fire({
            title: 'Applying Coupon...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            const response = await fetch('/applyCoupon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ couponCode })
            });

            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: data.message || 'Coupon applied successfully...'
                })


                const discount = data.discount || 0;
                const finalAmount = data.finalAmount || 0
                const gst = data.totalGst

                document.getElementById('couponDiscount').textContent = `-₹ ${discount.toLocaleString('en-IN')}`;
                document.getElementById('gst').textContent = `₹ ${gst.toLocaleString('en-IN')}`
                document.getElementById('totalAmount').textContent = `₹ ${finalAmount.toLocaleString('en-IN')}`;
                applyButton.textContent = 'Remove'

            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'Coupon applying failed.'
                })
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Something went wrong..'
            })
        }
    }

    async function removeCoupon() {
        Swal.fire({
            title: 'Removing Coupon...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            const response = await fetch('/removeCoupon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Coupon Removed',
                    text: data.message || 'Coupon has been removed.'
                });

                const finalAmount = data.finalAmount || 0;
                const gst = data.totalGst || 0;

                // Reset coupon UI values
                document.getElementById('couponDiscount').textContent = `-₹ 0`;
                document.getElementById('gst').textContent = `₹ ${gst.toLocaleString('en-IN')}`;
                document.getElementById('totalAmount').textContent = `₹ ${finalAmount.toLocaleString('en-IN')}`;

                couponInput.value = '';
                applyButton.textContent = 'Apply';

            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'Failed to remove coupon.'
                });
            }

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Something went wrong.'
            });
        }
    }



});
