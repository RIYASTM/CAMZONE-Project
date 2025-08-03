
document.addEventListener('DOMContentLoaded', () => {
    try {
        const ordersElement = document.getElementById('salesReportData');
        const usersElement = document.getElementById('usersData');
        
        if (!ordersElement || !usersElement) {
            console.error('Required data elements not found');
            return;
        }
        
        const orders = JSON.parse(ordersElement.value.replace(/&#39;/g, "'"));
        const users = JSON.parse(usersElement.value.replace(/&#39;/g, "'"));

        window.orders = orders;
        window.users = users;

        generateReport(); 
        updateCustomerInsights(users);
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
});

const reportTypeSelect = document.getElementById('reportType');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');

if (reportTypeSelect) {
    reportTypeSelect.addEventListener('change', () => {
        const isCustom = reportTypeSelect.value === 'custom';
        
        if (startDateInput) startDateInput.disabled = !isCustom;
        if (endDateInput) endDateInput.disabled = !isCustom;

        if (!isCustom) {
            generateReport(); 
        }
    });
}

if (startDateInput && endDateInput) {
    generateReport()   
}

function updateDashboard(filteredOrders) {
    if (!filteredOrders || !Array.isArray(filteredOrders)) {
        console.error('Invalid orders data provided to updateDashboard');
        return;
    }
    
    updateSalesSummary(filteredOrders);
    updateTopProducts(filteredOrders);
    updateRecentOrders(filteredOrders);
    updatePaymentMethods(filteredOrders);
}

function updateSalesSummary(orders) {
    if (!orders || !Array.isArray(orders)) return;
    
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const totalOrdersEl = document.getElementById('totalOrders');
    const totalRevenueEl = document.getElementById('totalRevenue');
    const avgOrderValueEl = document.getElementById('avgOrderValue');

    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
    if (totalRevenueEl) totalRevenueEl.textContent = `₹${totalRevenue.toFixed(2)}`;
    if (avgOrderValueEl) avgOrderValueEl.textContent = `₹${avgOrderValue.toFixed(2)}`;
}

function updateTopProducts(orders) {
    if (!orders || !Array.isArray(orders)) return;
    
    const productMap = {};

    orders.forEach(order => {
        if (!order.orderedItems || !Array.isArray(order.orderedItems)) return;
        
        order.orderedItems.forEach(item => {
            if (!item || ['Cancelled', 'Returned'].includes(item.itemStatus)) return;

            const id = item.product?._id || item.product?.toString() || 'unknown';
            if (!productMap[id]) {
                productMap[id] = {
                    name: item.product?.productName || 'Unknown',
                    revenue: 0,
                    quantity: 0
                };
            }

            const price = item.productPrice || 0;
            const quantity = item.quantity || 0;
            
            productMap[id].revenue += price * quantity;
            productMap[id].quantity += quantity;
        });
    });

    const topProducts = Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);

    const tbody = document.getElementById('topProductsTable');
    if (tbody) {
        tbody.innerHTML = topProducts.map((p, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${p.name}</td>
                <td>${p.quantity}</td>
                <td>₹${p.revenue.toFixed(2)}</td>
                <td>--</td>
            </tr>
        `).join('');
    }
}

function updateRecentOrders(orders) {
    if (!orders || !Array.isArray(orders)) return;
    
    const sorted = [...orders]
        .filter(order => order && order.createdOn) 
        .sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn))
        .slice(0, 8);
    
    const tbody = document.getElementById('recentOrdersTable');
    if (!tbody) return;
    
    tbody.innerHTML = sorted.map(order => {
        const date = new Date(order.createdOn).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        const productName = order.orderedItems?.[0]?.product?.productName || 'Unknown';
        const customerName = order.address?.name || 'N/A';
        const amount = order.finalAmount || 0;
        const status = order.status || 'Unknown';

        return `
            <tr>
                <td>${date}</td>
                <td>${productName}</td>
                <td>${customerName}</td>
                <td>₹${amount.toFixed(2)}</td>
                <td>${status}</td>
            </tr>
        `;
    }).join('');
}

function updatePaymentMethods(orders) {
    if (!orders || !Array.isArray(orders)) return;
    
    const total = orders.length;
    if (total === 0) return;
    
    const methods = { COD: 0, RAZORPAY: 0, WALLET: 0 };

    orders.forEach(order => {
        const method = order.paymentMethod?.toUpperCase();
        if (methods.hasOwnProperty(method)) {
            methods[method]++;
        }
    });

    const cod = Math.round((methods.COD / total) * 100) || 0;
    const razorpay = Math.round((methods.RAZORPAY / total) * 100) || 0;
    const wallet = Math.round((methods.WALLET / total) * 100) || 0;

    const codProgress = document.querySelector('.cod-progress');
    const codPercentage = document.getElementById('codPercentage');
    if (codProgress) codProgress.style.width = `${cod}%`;
    if (codPercentage) codPercentage.textContent = `${cod}%`;

    const onlineProgress = document.querySelector('.online-progress');
    const onlinePercentage = document.getElementById('onlinePercentage');
    if (onlineProgress) onlineProgress.style.width = `${razorpay}%`;
    if (onlinePercentage) onlinePercentage.textContent = `${razorpay}%`;

    const walletProgress = document.querySelector('.wallet-progress');
    const walletPercentage = document.getElementById('walletPercentage');
    if (walletProgress) walletProgress.style.width = `${wallet}%`;
    if (walletPercentage) walletPercentage.textContent = `${wallet}%`;
}

function updateCustomerInsights(users) {
    if (!users || !Array.isArray(users)) return;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const newUsers = users.filter(u => {
        if (!u.createdOn) return false;
        const created = new Date(u.createdOn);
        return created >= thirtyDaysAgo;
    });

    const returning = users.filter(u => u.orders?.length > 1);
    const retentionRate = users.length > 0 ? (returning.length / users.length) * 100 : 0;

    const newCustomersEl = document.getElementById('newCustomers');
    const returningCustomersEl = document.getElementById('returningCustomers');
    const customerRetentionEl = document.getElementById('customerRetention');

    if (newCustomersEl) newCustomersEl.textContent = newUsers.length;
    if (returningCustomersEl) returningCustomersEl.textContent = returning.length;
    if (customerRetentionEl) customerRetentionEl.textContent = `${retentionRate.toFixed(1)}%`;
}

function generateReport() {
    if (!window.orders) {
        console.error('Orders data not available');
        return;
    }
    
    const reportType = reportTypeSelect?.value || 'weekly';
    const startInput = startDateInput?.value;
    const endInput = endDateInput?.value;

    let filteredOrders = [...window.orders];
    const now = new Date();
    let startDate, endDate;

    switch (reportType) {
        case 'daily':
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            break;
            
        case 'weekly': 
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            endDate = new Date();
            break;
            
        case 'monthly': 
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            endDate = new Date();
            break;
            
        case 'yearly': 
            startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            endDate = new Date();
            break;
            
        case 'custom':
            if (startInput && endInput) {
                startDate = new Date(startInput);
                endDate = new Date(endInput);
                endDate.setHours(23, 59, 59, 999);
                
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Please select valid dates!'
                        });
                    } else {
                        alert('Please select valid dates!');
                    }
                    return;
                }
                
                if (startDate > endDate) {
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Start date cannot be later than end date!'
                        });
                    } else {
                        alert('Start date cannot be later than end date!');
                    }
                    return;
                }
            } else {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Please select both start and end dates!'
                    });
                } else {
                    alert('Please select both start and end dates!');
                }
                return;
            }
            break;
            
        case 'All Time':
        case 'alltime':
            updateDashboard(filteredOrders);
            return;

        default:
            console.warn('Unknown report type:', reportType);
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            endDate = new Date();
            break;
    }

    filteredOrders = filteredOrders.filter(order => {
        if (!order.createdOn) return false;
        
        const orderDate = new Date(order.createdOn);
        if (isNaN(orderDate.getTime())) return false;
        
        return orderDate >= startDate && orderDate <= endDate;
    });

    updateDashboard(filteredOrders);
}