
document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('search');
    const sortBy = document.querySelector('.sort-by');
    const filter = document.querySelector('.filter');
    const clearButton = document.getElementById('clear-button');

    const paginationDiv = document.querySelector('.pagination');

    let currentState = {
        search: searchBar.value.trim(),
        sort: sortBy.value,
        filter: filter.value,
        page: 1
    }; 

    // Debounce helper
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    // Fetch orders
    async function fetchOrders({ search, sort, filter, page }) {
        try {
            let queryParts = [];
            if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
            if (sort) queryParts.push(`sort=${sort}`);
            if (filter) queryParts.push(`filter=${filter}`);
            if (page) queryParts.push(`page=${page}`);

            const finalQuery = queryParts.join('&');

            const response = await fetch(`/admin/orders?${finalQuery}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                updateOrdersTable(result.orders, parseInt(result.currentPages));
                updatePagination(parseInt(result.currentPages), parseInt(result.totalPages));
            } else {
                console.error('Failed to fetch orders:', result.message);
            }
        } catch (error) {
            console.error('Something went wrong:', error);
            return showNotification('Something went wrong. Try again later', 'error');
        }
    }

    
    document.querySelectorAll('.order-details-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            // e.preventDefault()
            console.log('clicked')
            const orderId = button.dataset.orderId
            console.log('orderId : ', orderId)
            openOrderModal(orderId);
        });
    });
    

    // Attach pagination button listeners
    paginationDiv.querySelectorAll('.pagination-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (!isNaN(page) && page >= 1) {
                currentState.page = page;
                fetchOrders({ ...currentState });
            }
        });
    });

    // Search bar
    searchBar.addEventListener('input', debounce(async () => {
        currentState.search = searchBar.value.trim();
        currentState.page = 1;
        await fetchOrders({ ...currentState });
    }, 300));

    // Enter key triggers search
    searchBar.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            currentState.search = searchBar.value.trim();
            currentState.page = 1;
            await fetchOrders({ ...currentState });
        }
    });

    // Sort and filter
    sortBy.addEventListener('change', async () => {
        currentState.sort = sortBy.value;
        currentState.page = 1;
        await fetchOrders({ ...currentState });
    });

    filter.addEventListener('change', async () => {
        currentState.filter = filter.value;
        currentState.page = 1;
        await fetchOrders({ ...currentState });
    });

    // Clear button
    if (clearButton) {
        clearButton.addEventListener('click', async () => {
            currentState.search = '';
            currentState.page = 1;
            searchBar.value = '';
            await fetchOrders({ ...currentState });
        });
    }
    
    // Update pagination dynamically
    function updatePagination(currentPages, totalPages) {
        const paginationDiv = document.querySelector('.pagination');
        if (!paginationDiv) return;
    
        paginationDiv.innerHTML = `
            <span>${currentPages} of ${totalPages}</span>
            <div class="pagination-controls">
                <button class="pagination-button" data-page="1" ${currentPages === 1 ? 'disabled' : ''}>
                    <i class="fas fa-angle-double-left"></i>
                </button>
                <button class="pagination-button" data-page="${currentPages - 1}" ${currentPages === 1 ? 'disabled' : ''}>
                    <i class="fas fa-angle-left"></i>
                </button>
                <span> - </span>
                <button class="pagination-button" data-page="${currentPages + 1}" ${currentPages === totalPages ? 'disabled' : ''}>
                    <i class="fas fa-angle-right"></i>
                </button>
                <button class="pagination-button" data-page="${totalPages}" ${currentPages === totalPages ? 'disabled' : ''}>
                    <i class="fas fa-angle-double-right"></i>
                </button>
            </div>
        `;
    
        // Attach pagination button listeners
        paginationDiv.querySelectorAll('.pagination-button').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (!isNaN(page) && page >= 1) {
                    currentState.page = page;
                    fetchOrders({ ...currentState });
                }
            });
        });
    }
});

// Update orders table
function updateOrdersTable(orders, currentPages) {
    const tbody = document.querySelector('.orders-table tbody');
    tbody.innerHTML = '';
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No orders found</td></tr>';
        return;
    }

    orders.forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${order.orderId}</td>
            <td>${order.address.name}</td>
            <td>${new Date(order.createdOn).toDateString().split(' ').slice(1, 4).join(' ')}</td>
            <td>₹${order.finalAmount}</td>
            <td>${order.paymentMethod}</td>
            <td>${order.status}</td>
            <td>
                <button class="filter order-details-btn" data-order-id="${order._id}">
                    Order Details
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Reattach order-details button listeners
    document.querySelectorAll('.order-details-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            // e.preventDefault()
            console.log('clicked')
            const orderId = button.dataset.orderId
            console.log('orderId : ', orderId)
            openOrderModal(orderId);
        });
    });
}

async function openOrderModal(orderId) { 
    try {
        const response = await fetch(`/admin/order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ orderId })
        });

        const { success, order } = await response.json();
        populateModal(order);

        const modal = document.getElementById('orderModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error loading order detailes : ', error);
        return showNotification('Something went wrong. Try again later', 'error');
    }
}

function populateModal(order) {
    const createDate = new Date(order.createdOn);
    const formattedDate = createDate.toString().split(' ').splice(1, 3).join(' ');
    document.getElementById('modal-order-id').textContent = order.orderId;
    document.getElementById('modal-order-date').textContent = formattedDate;
    document.getElementById('modal-payment-method').textContent = order.paymentMethod;
    document.getElementById('modal-phone').textContent = order.address.phone || '-';
    const statusDropdown = document.getElementById('modal-order-status');

    if (order.status === 'Cancelled' || order.status === 'Returned') {
        statusDropdown.value = order.status;
        statusDropdown.disabled = true;
    } else {
        statusDropdown.value = order.status || 'Pending';
        statusDropdown.disabled = false;
    }

    document.getElementById('modal-customer-name').textContent = order.address.name;
    document.getElementById('modal-address').textContent = order.address.streetAddress;
    document.getElementById('modal-city').textContent = order.address.city || '-';
    document.getElementById('modal-state').textContent = order.address.state || '-';
    document.getElementById('modal-pincode').textContent = order.address.pincode || '-';

    const orderItemsContainer = document.getElementById('modal-order-items');
    orderItemsContainer.innerHTML = '';

    let hasReturnRequest = order.status === 'Return Request';
    let returnReason = '-';

    order.orderedItems.forEach(item => {
        const row = document.createElement('tr');
        const imageSrc = item.product.productImage?.[0]
            ? `${item.product.productImage[0]}`
            : '/images/placeholder.jpg';
        row.innerHTML = `
                    <td>
                        <div class="product-info" style="display: flex; align-items: center; gap: 10px;">
                            <img src="${imageSrc}" alt="${item.product.productName}" class="product-image" style="width: 40px; height: 40px; object-fit: cover;">
                            ${item.product.productName}
                        </div>
                    </td>
                    <td>₹${item.productPrice.toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>${item.itemStatus || '-'}</td>
                    <td>₹${item.price.toFixed(2)}</td>
                `;
        orderItemsContainer.appendChild(row);

        if (item.itemStatus === 'Return Request') {
            hasReturnRequest = true;
            returnReason = item.returnReason || returnReason;
        }
    });

    const returnReminder = document.getElementById('return-reminder');
    const returnName = document.getElementById('order-info')
    const returnRequestText = document.getElementById('return-request');
    const returnReasonText = document.getElementById('return-reason');
    const acceptBtn = document.getElementById('accept-return');
    const rejectBtn = document.getElementById('reject-return');

    if (hasReturnRequest) {
        returnReminder.style.display = 'block';

        const returnItems = order.orderedItems.filter(item => item.itemStatus === 'Return Request');

        if (returnItems.length > 0) {
            returnItems.forEach(item => {
                const wrapper = document.createElement('div');
                wrapper.classList.add('return-item');

                const productName = item.product?.productName || 'Unknown Product';
                const returnReason = item.reason || 'No reason provided.';
                const reason = returnReason.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ').replace('Other', 'Other (Please Specify)')

                wrapper.innerHTML = `
                            <div class="return-info">
                                <p><strong class="return-name">${productName}</strong> is in Return Request.</p>
                                <p>Reason: <span class="return-reason">${reason}</span></p>
                            </div>
                            <div class="return-buttons">
                                <button class="accept-btn">Accept</button>
                                <button class="reject-btn">Reject</button>
                            </div>
                        `;

                document.getElementById('return-reminder').appendChild(wrapper);

                const acceptBtn = wrapper.querySelector('.accept-btn');
                const rejectBtn = wrapper.querySelector('.reject-btn');

                acceptBtn.onclick = () => handleReturnDecision(order._id, item.product._id, 'Returned', reason);
                rejectBtn.onclick = () => handleReturnDecision(order._id, item.product._id, 'Return Request Rejected', null);
            });

        } else {
            const wrapper = document.createElement('div');
            wrapper.classList.add('return-item');

            const returnReason = order.reason || 'No reason provided.';
            const reason = returnReason.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ').replace('Other', 'Other (Please Specify)')
            const orderId = order.orderId;

            wrapper.innerHTML = `
                        <div class="return-info">
                            <p><strong>${orderId}</strong> is in Return Request.</p>
                            <p>Reason: <span>${reason}</span></p>
                        </div>
                        <div class="return-buttons">
                            <button class="accept-btn">Accept</button>
                            <button class="reject-btn">Reject</button>
                        </div>
                    `;

            document.getElementById('return-reminder').appendChild(wrapper);

            const acceptBtn = wrapper.querySelector('.accept-btn');
            const rejectBtn = wrapper.querySelector('.reject-btn');

            acceptBtn.onclick = () => handleReturnDecision(order._id, null, 'Returned', reason);
            rejectBtn.onclick = () => handleReturnDecision(order._id, null, 'Return Request Rejected', null);
        }


    } else {
        returnReminder.style.display = 'none';
    }

    let itemsTotal = order.orderedItems.reduce((sum, item) => sum + item.price, 0);

    let total = Math.round(order.discount 
        ? itemsTotal + order.discount
        : itemsTotal);


    document.getElementById('modal-subtotal').textContent = `₹${total}`;
    document.getElementById('modal-shipping').textContent = `₹${order.shipping ? order.shipping : 0}`;
    document.getElementById('modal-discount').textContent = order.discount ? `-₹${order.discount}` : '₹0';
    document.getElementById('modal-total').textContent = `₹${order.finalAmount}`;
}

function closeModal() {
    const modal = document.getElementById('orderModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

async function updateOrderStatus() {
    const statusDropdown = document.getElementById('modal-order-status');
    const orderIdElement = document.getElementById('modal-order-id');
    const newStatus = statusDropdown.value;
    const orderId = orderIdElement.textContent.trim();

    try {
        const response = await fetch('/admin/updateStatus', {
            method: 'POST',
            body: JSON.stringify({ status: newStatus, orderId }),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        if (data.success) {
            showNotification('Order status updated!!', 'success')
            closeModal();
            window.location.reload();
        } else {
            showNotification(data.message || 'Failed to update status!!', 'error')
        }
    } catch (error) {
        console.error('Error on updating status : ', error);
        return showNotification('Something went wrong. Try again later', 'error');
    }
}

async function handleReturnDecision(orderId, productId, newStatus, reason) {
    try {
        const response = await fetch('/admin/handleStatus', {
            method: 'POST',
            body: JSON.stringify({ orderId, productId, newStatus, reason }),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        if (data.success) {
            showNotification(`Order status updated to ${newStatus} successfully!`, 'success')
            closeModal();
            window.location.reload();
        } else {
            showNotification( data.message || 'Failed to update status!', 'error')
        }
    } catch (error) {
        console.error('Error on update :  ', error);
        return showNotification('Something went wrong. Try again later', 'error');
    }
}

function printOrder() {
    const printContent = document.querySelector('.modal-content').innerHTML;
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
                <html>
                    <head>
                        <title>Order Details</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .modal-header { background: #f39c12; color: #000; padding: 20px; text-align: center; }
                            .order-section { margin-bottom: 20px; }
                            .order-detail { display: flex; justify-content: space-between; margin-bottom: 10px; }
                            table { width: 100%; border-collapse: collapse; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            .close-btn, .modal-footer { display: none; }
                            .return-reminder { display: none; }
                        </style>
                    </head>
                    <body>${printContent}</body>
                </html>
            `);
    printWindow.document.close();
    printWindow.print();
}

document.getElementById('orderModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeModal();
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeModal();
    }
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
