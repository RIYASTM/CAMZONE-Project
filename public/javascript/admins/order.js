


document.addEventListener('DOMContentLoaded', () => {
            const search = document.getElementById('search');
            const searchValue = search.value;

            document.getElementById('search').addEventListener('keypress', function(e) {
                const searchValue = search.value;
                if (e.key === 'Enter') {
                    window.location.href = `?search=${searchValue}`;
                }
            });

            if (searchValue) {
                document.getElementById('clear-button').addEventListener('click', function(e) {
                    window.location.href = `/admin/orders`;
                });
            }

            document.querySelectorAll('.order-details-btn').forEach(button => {
                button.addEventListener('click', async function() {
                    const orderId = this.getAttribute('data-order-id');
                    await openOrderModal(orderId);
                });
            });
        });

        async function openOrderModal(orderId) {
            try {
                const response = await fetch(`/admin/order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({orderId})
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch order details');
                }
                
                const { success, order } = await response.json();
                populateModal(order);
                
                const modal = document.getElementById('orderModal');
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            } catch (error) {
                Swal.fire('error','Error loading order details: ' + error.message);
            }
        }

        function openSalesReportModal() {
            document.getElementById('salesReportModal').classList.add('active');
            // Set default dates (last 30 days)
            const today = new Date();
            const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
            
            document.getElementById('endDate').value = today.toISOString().split('T')[0];
            document.getElementById('startDate').value = thirtyDaysAgo.toISOString().split('T')[0];
        }

        function closeSalesReportModal() {
            document.getElementById('salesReportModal').classList.remove('active');
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
                    ? `/uploads/products/${item.product.productImage[0]}`
                    : '/images/placeholder.jpg';
                row.innerHTML = `
                    <td>
                        <div class="product-info" style="display: flex; align-items: center; gap: 10px;">
                            <img src="${imageSrc}" alt="${item.product.productName}" class="product-image" style="width: 40px; height: 40px; object-fit: cover;">
                            ${item.product.productName}
                        </div>
                    </td>
                    <td>₹${item.price.toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>${item.itemStatus || '-'}</td>
                    <td>₹${(item.price * item.quantity).toFixed(2)}</td>
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


            document.getElementById('modal-subtotal').textContent = `₹${order.totalPrice}`;
            document.getElementById('modal-shipping').textContent = '₹0';
            document.getElementById('modal-discount').textContent = order.discount ? `-₹${order.discount}` : '₹0';
            document.getElementById('modal-total').textContent = `₹${order.totalPrice}`;
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
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                if (data.success) {
                    Swal.fire('success','Order status updated successfully!');
                    closeModal();
                    window.location.reload();
                } else {
                    Swal.fire('error',data.message || 'Failed to update status!');
                }
            } catch (error) {
                Swal.fire('error','Error updating status: ' + error.message);
            }
        }
        
        async function handleReturnDecision(orderId , productId , newStatus , reason) {
            try {
                const response = await fetch('/admin/handleStatus', {
                    method: 'POST',
                    body: JSON.stringify({ orderId, productId, newStatus, reason }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                if (data.success) {
                    Swal.fire('success',`Order status updated to ${newStatus} successfully!` )
                    closeModal();
                    window.location.reload();
                } else {
                    Swal.fire('error',data.message || 'Failed to update status!');
                }
            } catch (error) {
                Swal.fire('error','Error updating status: ' + error.message);
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

        document.getElementById('orderModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
        }); 