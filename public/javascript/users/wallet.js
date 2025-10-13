document.addEventListener('DOMContentLoaded', function () {


    const moneyButton = document.getElementById('addMoney')
    const closeButton = document.getElementById('closeButton')
    const cancelButton = document.getElementById('CancelButton')
    const addMoneyModal = document.getElementById('addMoneyModal')
    const addMoneyButton = document.getElementById('addMoneyButton')
    const moneyInput = document.getElementById('amount')


    const filterDropdown = document.querySelector('.filter-dropdown');
    const transactions = filterDropdown.dataset.transactions


    if (filterDropdown) {
        filterDropdown.addEventListener('change', function (e) {
            const filter = e.target.value;
            const rows = document.querySelectorAll('.transaction-table tbody tr');

            rows.forEach(row => {
                const typeElement = row.querySelector('.transaction-type');
                const statusElement = row.querySelector('.transaction-status');

                if (filter === 'all') {
                    row.style.display = '';
                } else if (filter === 'credit' && typeElement && typeElement.textContent.toLowerCase().includes('credit')) {
                    row.style.display = '';
                } else if (filter === 'debit' && typeElement && typeElement.textContent.toLowerCase().includes('debit')) {
                    row.style.display = '';
                } else if (filter === 'pending' && statusElement && statusElement.textContent.toLowerCase().includes('pending')) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    document.querySelectorAll('.balance-card').forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
        });
    });

    document.querySelectorAll('.quick-amount-btn').forEach(btn => {
        const amount = btn.dataset.amount
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.quick-amount-btn').forEach(b => b.disabled = true)
            addMoneyButton.disabled = true
            e.preventDefault()

            moneyInput.value = amount
            addAmount(amount)

            setTimeout(() => {
                document.querySelectorAll('.quick-amount-btn').forEach(b => b.disabled = false)
                addMoneyButton.disabled = false
            }, 5000);
        })
    })

    addMoneyModal.addEventListener('submit', (e) => {
        e.preventDefault()

        addMoneyButton.disabled = true
        const amount = moneyInput.value

        setTimeout(() => {
            addMoneyButton.disabled = false
        }, 5000);

        addAmount(amount)
    })

    async function addAmount(amount) {
        try {

            const response = await fetch('/addtoWallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ amount })
            })

            const data = await response.json()

            if (data.success && data.message === 'Razorpay Order Created!') {

                closeAddMoneyModal()
                const { razorpayOrder, user } = data

                const options = {
                    key: 'rzp_test_t9knqvOVCcMCfu',
                    amount: data.amount * 100,
                    currency: 'INR',
                    name: 'CAMZONE',
                    description: 'Add Money to Wallet',
                    order_id: razorpayOrder.id,
                    handler: async function (response) {
                        try {
                            const verifyRes = await fetch('/verify-Amount', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                                body: JSON.stringify({
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpaySignature: response.razorpay_signature,
                                    amount
                                })
                            });
                            const verifyData = await verifyRes.json();
                            if (verifyData.success) {
                                window.location.href = `/wallet`;
                            } else {
                                showNotification(verifyData.message || 'Payment verification failed!!', 'error');
                            }
                        } catch (error) {
                            console.error('Payment verification error:', error);
                            return showNotification('Something went wrong. Try again later', 'error');
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
                showNotification(data.message || 'failed to adding money to your Wallet', 'error')
            }

        } catch (error) {
            console.error('Order failed : ', error);
            return showNotification('Something went wrong. Try again later', 'error');
        }
    }

    cancelButton.addEventListener('click', () => {
        closeAddMoneyModal()
    })

    closeButton.addEventListener('click', () => {
        closeAddMoneyModal()
    })

    moneyButton.addEventListener('click', () => {
        openAddMoneyModal()
    })


    function closeAddMoneyModal() {
        addMoneyModal.style.display = 'none'
    }

    function openAddMoneyModal() {
        addMoneyModal.style.display = 'block'
    }


    const search = document.getElementById('search')
    const clearButton = document.getElementById('clear-button')

    search.addEventListener('keypress', async (e) => {

        const searchValue = search.value.trim()

        if (searchValue && e.key === 'Enter') {
            console.log('search : ', searchValue)
            // window.location = `/shop?search=${searchValue}`
            window.location = `/shop?search=${encodeURIComponent(searchValue)}`;
        }
    })

});

// Show notification function
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
