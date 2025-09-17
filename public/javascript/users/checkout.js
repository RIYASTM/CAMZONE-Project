document.addEventListener("DOMContentLoaded", () => {

    const totalAmountEl = document.getElementById('totalAmount')
    const savedAmountEl = document.getElementById('saved')
    const subtotalEl = document.getElementById('subtotal')

    const totalAmount = Number(totalAmountEl.textContent.replace(/[₹,\s]/g, ''))
    const savedAmount = Number(savedAmountEl.textContent.replace(/[-₹,\s]/g, ''))
    const subtotal = Number(subtotalEl.textContent.replace(/[₹,\s]/g, ''))

    if (savedAmount) {
        const total = totalAmount + savedAmount
        subtotalEl.textContent = `₹ ${total.toLocaleString('en-IN')}`
    }

    const addressInput = document.querySelectorAll('input[name="address"]')
    console.log("addresses : ", addressInput)
    const shippingInput = document.getElementById('shipping')
    const addresses = JSON.parse(document.querySelector('.address-list').dataset.address)
    const gstEl = document.getElementById('gst')
    const couponEl = document.getElementById('couponDiscount')

    const couponAmount = Number(couponEl.textContent.replace(/[-₹,\s]/g, '')) || 0

    addressInput.forEach(input => {
        input.addEventListener('change', () => {
            const selectedId = document.querySelector('input[name="address"]:checked').value;

            const selectedAddress = addresses.find(add => add._id.toString() === selectedId.toString())

            let shippingCharge = 0
            let shippingGst = 0

            if (selectedAddress) {
                if (selectedAddress.country.toString().trim().toLowerCase() === 'india') {
                    if (selectedAddress.state.toString().trim().toLowerCase() !== 'kerala') {
                        shippingCharge = 250
                    }
                } else {
                    shippingCharge = 12500
                }
                shippingGst = Math.floor((shippingCharge * 18) / 118)
            }

            const total = couponAmount ? totalAmount + shippingCharge - couponAmount : totalAmount + shippingCharge
            const totalGst = Math.floor((total * 18) / 118)

            shippingInput.textContent = `₹ ${shippingCharge.toLocaleString('en-IN')}`
            gstEl.textContent = `₹ ${totalGst.toLocaleString('en-IN')}`
            totalAmountEl.textContent = `₹ ${total.toLocaleString('en-IN')}`

        })
    })

    if (couponAmount) {
        const total = totalAmount - couponAmount
        const totalGst = Math.floor((total * 18) / 118)

        gstEl.textContent = `₹ ${totalGst.toLocaleString('en-IN')}`
        totalAmountEl.textContent = `₹ ${total.toLocaleString('en-IN')}`
    }

    const newAddressButton = document.getElementById('newAddressBtn')
    if(addressInput.length > 3 && newAddressButton ){
        // newAddressButton.disabled = true
        newAddressButton.style.display = 'none'
    }

    document.getElementById('openCouponModal').onclick = () => {
        document.getElementById('couponModal').style.display = 'block';
    };
    document.getElementById('closeCouponModal').onclick = () => {
        document.getElementById('couponModal').style.display = 'none';
    };
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.onclick = function () {
            const code = this.getAttribute('data-code');
            document.getElementById('couponCode').value = code;
            document.getElementById('couponModal').style.display = 'none';
            document.getElementById('applyCoupon').click();
        };
    });


    const amountText = document.getElementById('totalAmount').innerText;
    const finalAmount = amountText.replace(/[₹]/, '').replaceAll(/,/g, '').trim()


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

    //Retry Payment Modal
    const razorpayButton = document.getElementById('razorpayButton')
    const codButton = document.getElementById('codButton')
    const walletButton = document.getElementById('walletButton')

    if (finalAmount > 50000) {
        codButton.disabled = true
        const note = document.createElement('small')
        note.style.marginLeft = '4px'
        note.style.color = 'red'
        note.textContent = 'Not available for orders above 50,000'
    }

    if (finalAmount > 500000) {
        razorpayButton.disabled = true
        const note = document.createElement('small')
        note.style.marginLeft = '4px'
        note.style.color = 'red'
        note.textContent = 'Not available for orders above 5,00,000'
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
    const shippingEl = document.getElementById('shipping')
    applyButton.addEventListener('click', (e) => {
        e.preventDefault()

        const shippingCharge = Number(shippingEl.textContent.replace(/[-₹,]/g, '')) || 0
        const couponCode = couponInput.value || 0
        if (applyButton.textContent.trim() === 'Apply') {
            applyCoupon(couponCode, shippingCharge)
        } else {
            removeCoupon(shippingCharge)
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

        const formData = Object.fromEntries(new FormData(addressForm));
        const mode = formData.formMode;
        delete formData.formMode;

        const countryCode = countryCodes[formData.country] || '+91';
        formData.phone = `${countryCode}${formData.phone}`;
        if (formData.altPhone) {
            formData.altPhone = `${countryCode}${formData.altPhone}`;
        }
        const errors = validateAddressForm(formData);
        if (errors) {
            displayFormErrors(addressForm, errors);
            return;
        }

        addAddressBtn.disabled = true;
        addAddressBtn.textContent = 'Adding...';

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
                showNotification(data.message || 'Failed to add address', 'error')
            }
        } catch (error) {
            console.error('Something went wrong : ', error)
        } finally {
            addAddressBtn.disabled = false;
            addAddressBtn.textContent = 'Add Address';
        }
    });

    // Update Address Button Handling
    updateAddressBtn.addEventListener('click', async () => {

        const formData = Object.fromEntries(new FormData(editAddressForm));
        const mode = formData.formMode;
        delete formData.formMode;

        const countryCode = countryCodes[formData.country] || '+91';
        formData.phone = `${countryCode}${formData.phone}`;
        if (formData.altPhone) {
            formData.altPhone = `${countryCode}${formData.altPhone}`;
        }

        const errors = validateAddressForm(formData);
        if (errors) {
            displayFormErrors(editAddressForm, errors);
            return;
        }

        updateAddressBtn.disabled = true;
        updateAddressBtn.textContent = 'Updating...';

        try {
            const response = await fetch('/editAddress', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

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
            setTimeout(()=>{
                placeOrderBtn.disabled = false
            },2000)
            return;
        }
        
        if (!paymentMethod) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Payment Method',
                text: 'Please select a payment method.'
            });
            placeOrderBtn.disabled = true;
            setTimeout(()=>{
                placeOrderBtn.disabled = false
            },2000)
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
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Payment Verification failed!!',
                                        text: verifyData.message || 'Something went wrong!!'
                                    });
                                }
                            } catch (error) {
                                console.error('Payment verification error:', error);
                                // Swal.fire({
                                //     icon: 'error',
                                //     title: 'Verification Error',
                                //     text: 'Failed to verify payment. Please contact support.'
                                // });
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
                showNotification(data.message || 'Failed to place order.')
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
            title: 'Payment Failed.',
            text: 'Your order will be placed after completing your payment.',
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
                window.location.href = '/'
            });

            window.retryPayment = function (method, currentOrderId = orderId, oldMethod = 'Razorpay') {
                handleRetryPayment(method, currentOrderId, oldMethod, amount, user);
            };
        }
    }

    async function handleRetryPayment(method, orderId, oldMethod, amount, user) {

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
                                // Swal.fire({
                                //     icon: 'success',
                                //     title: 'Success',
                                //     text: verifyData.message || 'Payment completed successfully!'
                                // }).then(() => {
                                //     window.location.href = '/orderSuccess';
                                // });
                                showNotification(verifyData.message || 'Payment completed successfully!')
                                window.location.href = '/orderSuccess'
                            } else {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Payment Verification Failed',
                                    text: verifyData.message || 'Something went wrong!'
                                });
                            }
                        } catch (verifyError) {
                            console.error('Retry payment verification error:', verifyError);
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
        }
    }


    //Validations
    function validateAddressForm(form) {
        const namePattern = /^[a-zA-Z\s]+$/;
        const phonePattern = {
            'USA': /^\+1[2-9]\d{2}[2-9]\d{6}$/,
            'India': /^\+91[6-9]\d{9}$/,
            'UK': /^\+44\d{10}$/,
            'UAE': /^\+971\d{8,9}$/,
            'SAUDI ARABIA': /^\+966\d{8,9}$/
        };
        const pincodePatterns = {
            'India': /^\d{6}$/,
            'USA': /^\d{5}$/,
            'UK': /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/,
            'UAE': /^\d{3,6}$/,
            'SAUDI ARABIA': /^[1-8]\d{4}$/
        };

        let errors = {};
        console.log('name : ', form.name, '  ', form.name.length)

        if (!form.name) {
            errors.name = "Name is required!";
        } else if (!namePattern.test(form.name)) {
            errors.name = "Name can only contain letters and spaces!";
        }

        // Phone
        if (form.phone) {
            if (form.country && phonePattern[form.country]) {
                if (!phonePattern[form.country].test(form.phone)) {
                    errors.phone = "Invalid phone number format!";
                }
            } else {
                errors.phone = "Unsupported country for phone validation!";
            }
        } else {
            errors.phone = "Phone number 1 is required!";
        }

        // Alternate Phone
        if (form.altPhone) {
            if (form.country && phonePattern[form.country]) {
                if (!phonePattern[form.country].test(form.altPhone)) {
                    errors.altPhone = "Invalid phone number format!";
                }
            } else {
                errors.altPhone = "Unsupported country for phone validation!";
            }
        } else {
            errors.altPhone = "Phone number 2 is required!";
        }

        if (!form.country) {
            errors.country = "Country is required!";
        }

        if (!form.landMark) {
            errors.landMark = 'Apartment or LandMark is required!'
        }

        if (!form.city) {
            errors.city = "Town/City is required!";
        }

        if (!form.streetAddress) {
            errors.streetAddress = "Street address is required!";
        }

        if (!form.state) {
            errors.state = "State is required!";
        }

        if (!form.district) {
            errors.district = "District is required!";
        }

        if (!form.pincode) {
            errors.pincode = "Pincode is required!";
        } else if (form.country && pincodePatterns[form.country]) {
            if (!pincodePatterns[form.country].test(form.pincode)) {
                errors.pincode = `Invalid pincode format for ${form.country}!`;
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


    //Coupon Sections
    async function applyCoupon(couponCode, shippingCharge) {
        Swal.fire({
            title: 'Applying Coupon...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            // timeOut : 1500
        });

        try {
            const response = await fetch('/applyCoupon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ couponCode, shippingCharge })
            });

            const data = await response.json();
            Swal.close()

            if (data.success) {
                showNotification(data.message || 'Coupon applied successfully..', 'success')


                const discount = data.discount || 0;
                const finalAmount = data.finalAmount || 0
                const gst = data.totalGst

                document.getElementById('couponDiscount').textContent = `-₹ ${discount.toLocaleString('en-IN')}`;
                document.getElementById('gst').textContent = `₹ ${gst.toLocaleString('en-IN')}`
                document.getElementById('totalAmount').textContent = `₹ ${finalAmount.toLocaleString('en-IN')}`;
                applyButton.textContent = 'Remove'

            } else {
                showNotification(data.message || 'Coupon applying failed', 'error')
            }
        } catch (error) {
            Swal.close()
            console.log('something went wrong : ', error)
        }
    }

    async function removeCoupon(shippingCharge) {
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
                },
                body: JSON.stringify({ shippingCharge })
            });

            const data = await response.json();

            Swal.close()

            if (data.success) {
                showNotification(data.message || 'Coupon has been removed!!', 'success')

                const finalAmount = data.finalAmount || 0;
                const gst = data.totalGst || 0;

                // Reset coupon UI values
                document.getElementById('couponDiscount').textContent = `-₹ 0`;
                document.getElementById('gst').textContent = `₹ ${gst.toLocaleString('en-IN')}`;
                document.getElementById('totalAmount').textContent = `₹ ${finalAmount.toLocaleString('en-IN')}`;

                couponInput.value = '';
                applyButton.textContent = 'Apply';

            } else {
                showNotification(data.message || 'Failed to remove coupon', 'error')
            }

        } catch (error) {
            Swal.close()
            console.error('Something went wrong : ', error)
        }
    }


    const search = document.getElementById('search')
    const clearButton = document.getElementById('clear-button')
    
    search.addEventListener('keypress', async (e)=> {

        const searchValue = search.value.trim()

        if( searchValue && e.key === 'Enter' ){
            console.log('search : ',searchValue)
            // window.location = `/shop?search=${searchValue}`
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
