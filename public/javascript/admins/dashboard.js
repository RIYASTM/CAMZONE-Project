let generatingReport = false;

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

        window.chartsInitialized = false;
        window.updatingCharts = false;

        const customDateRange = document.getElementById('customDateRange');
        const reportBtn = document.querySelector('.generate-report-btn')
        reportBtn.style.display = 'none'
        customDateRange.style.display = 'none';

        debouncedGenerateReport()
        updateCustomerInsights(users);

        requestAnimationFrame(() => {
            initializeCharts();
        });

    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showNotification('Something went wrong. Try again later...', 'error');
    }
});

let debounceTimeout = null;

function debounce(func, delay) {
    return function (...args) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => func.apply(this, args), delay);
    };
}

const debouncedGenerateReport = debounce(() => {
    if (!generatingReport && window.orders) {
        generateReport();
    }
}, 500);

let isProgrammaticChange = false;

function setInputValue(element, value) {
    isProgrammaticChange = true;
    element.value = value;
    isProgrammaticChange = false;
}

const reportTypeSelect = document.getElementById('reportType');
const customDateRange = document.getElementById('customDateRange');
const reportBtn = document.querySelector('.generate-report-btn')
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');

if (reportTypeSelect) {
    reportTypeSelect.addEventListener('change', () => {
        if (isProgrammaticChange) return;
        const isCustom = reportTypeSelect.value === 'custom';

        customDateRange.style.display = isCustom ? 'block' : 'none'
        reportBtn.style.display = isCustom ? 'block' : 'none'
        if (!isCustom) {
            debouncedGenerateReport();
        }
    });
}

function updateDashboard(filteredOrders) {
    if (!filteredOrders || !Array.isArray(filteredOrders)) {
        console.error('Invalid orders data provided to updateDashboard');
        return;
    }

    updateTopBrands(filteredOrders);
    updateTopProducts(filteredOrders);
    updateSalesSummary(filteredOrders);
    updateRecentOrders(filteredOrders);
    updateTopCategories(filteredOrders);
    updatePaymentMethods(filteredOrders);
}

function updateSalesSummary(orders) {
    if (!orders || !Array.isArray(orders)) return;

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const growthValue = calcGrowth(orders);
    const activeUser = activeUsers(orders)

    const growthValueEl = document.getElementById('growthRate');
    const totalOrdersEl = document.getElementById('totalOrders');
    const activeUsersEl = document.getElementById('activeUsers');
    const totalRevenueEl = document.getElementById('totalRevenue');
    const avgOrderValueEl = document.getElementById('avgOrderValue');

    if (growthValueEl) growthValueEl.textContent = growthValue + '%';
    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
    if (totalRevenueEl) totalRevenueEl.textContent = `₹${totalRevenue.toFixed(2)}`;
    if (avgOrderValueEl) avgOrderValueEl.textContent = `₹${avgOrderValue.toFixed(2)}`;
    if (activeUsersEl) activeUsersEl.textContent = activeUser;
}

function calcGrowth(orders) {
    if (!window.orders || !Array.isArray(window.orders)) return 0;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    const recentOrders = window.orders.filter(o => {
        const date = new Date(o.createdOn);
        return date >= sevenDaysAgo && date <= now;
    });

    const olderOrders = window.orders.filter(o => {
        const date = new Date(o.createdOn);
        return date < sevenDaysAgo;
    });

    if (olderOrders.length === 0) return 100;

    const growth = ((recentOrders.length - olderOrders.length) / olderOrders.length) * 100;
    return Math.round(growth * 100) / 100; // Round to 2 decimal places
}

function activeUsers(orders) {
    if(!orders || !Array.isArray(orders)) return;

    const users = window.users
    const now = new Date()
    const twoMonthsAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000))

    const recentOrders = orders.filter( order => {
        const date = new Date(order.createdOn);
        return date >= twoMonthsAgo && date <= now;
    })

    const userIds = recentOrders.map(order => order.userId);

    const uniqeIds = [...new Set(userIds.map(id => id.toString()))]

    return uniqeIds.length

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
                <td>₹ ${p.revenue.toFixed(2)}</td>
                <td>--</td>
            </tr>
        `).join('');
    }
}

function updateTopCategories(orders) {
    if (!orders || !Array.isArray(orders)) return;

    const categories = JSON.parse(document.getElementById('categoryData').value);
    const categoryMap = {};

    orders.forEach(order => {
        if (!order.orderedItems || !Array.isArray(order.orderedItems)) return;

        order.orderedItems.forEach(item => {
            if (!item || ['Cancelled', 'Returned'].includes(item.itemStatus)) return;

            const id = item.product?.category?._id || item.product?.category?.toString() || 'unknown';

            // Initialize if not exists
            if (!categoryMap[id]) {
                const catObj = categories.find(c => c._id.toString() === id.toString());
                categoryMap[id] = {
                    name: catObj ? catObj.name : 'unknown',
                    revenue: 0,
                    quantity: 0
                };
            }

            const price = item.productPrice || 0;
            const quantity = item.quantity || 0;

            categoryMap[id].revenue += price * quantity;
            categoryMap[id].quantity += quantity;
        });
    });

    const topCategories = Object.values(categoryMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    const tbody = document.getElementById('topCategoriesTable');
    if (tbody) {
        tbody.innerHTML = topCategories.map((c, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${c.name}</td>
                <td>${c.quantity.toLocaleString()}</td>
                <td>₹ ${c.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td>--</td>
            </tr>
        `).join('');
    }
}

function updateTopBrands(orders){
    if(!orders || !Array.isArray(orders)) return;

    const brands = JSON.parse(document.getElementById('brandData').value);
    const brandMap = {}

    orders.forEach( order => {
        if(!order.orderedItems || !Array.isArray(order.orderedItems)) return;

        order.orderedItems.forEach( item => {
            if(!item || ['Cancelled', 'Returned'].includes(item.itemStatus)) return;

            const id = item.product?.brand?._id || item.product?.brand?.toString() || 'Unknown';
            if(!brandMap[id]){
                const brandObj = brands.find( brand => brand._id.toString() === id.toString());
                brandMap[id] = {
                    name : brandObj ? brandObj.brandName : 'Unknown',
                    revenue : 0,
                    quantity : 0
                }
            }

            const price = item.productPrice || 0;
            const quantity = item.quantity || 0;

            brandMap[id].revenue += price * quantity;
            brandMap[id].quantity += quantity
        })
    })

    const topBrands = Object.values(brandMap).sort((a,b) => b.revenue - a.revenue ).slice(0,5);

    const tbody = document.getElementById('topBrandsTable');
    if(tbody){
        tbody.innerHTML = topBrands.map((brand, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${brand.name}</td>
                <td>${brand.quantity.toLocaleString()}</td>
                <td>₹ ${brand.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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
                <td>₹ ${amount.toFixed(2)}</td>
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
    if (generatingReport || !window.orders) {
        return;
    }

    generatingReport = true;

    try {
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
                        showNotification('Invalid dates provided!!', 'error')
                        console.error('Invalid dates provided');
                        return;
                    }

                    if (startDate > now) {
                        console.log('Start date over than today!!')
                        showNotification('Start date should lessthatn today..', 'error')
                        return
                    }

                    if (startDate > endDate) {
                        showNotification('Start date cannot be later than end date', 'error')
                        console.error('Start date cannot be later than end date');
                        return;
                    }
                } else {
                    showNotification('Custom date range requires both start and end dates', 'error')
                    console.error('Custom date range requires both start and end dates');
                    return;
                }
                break;

            case 'All Time':
            case 'alltime':
            case 'all':
                updateDashboard(filteredOrders);
                if (window.chartsInitialized) {
                    throttledUpdateCharts(filteredOrders);
                }
                return;

            default:
                console.warn('Unknown report type:', reportType, 'defaulting to weekly');
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

        if (window.chartsInitialized && !window.updatingCharts) {
            throttledUpdateCharts(filteredOrders);
        }

    } catch (error) {
        console.error('Error in generateReport:', error);
    } finally {
        generatingReport = false;
    }
}

let salesTrendChart = null;
let orderStatusChart = null;

function initializeCharts() {
    if (window.chartsInitialized) {
        return;
    }

    window.chartsInitialized = true;

    try {
        initializeSalesChart();
        initializeOrderStatusChart();
    } catch (error) {
        console.error('Error initializing charts:', error);
        window.chartsInitialized = false; // Reset on error
    }
}

function initializeSalesChart() {
    const ctx = document.getElementById('salesTrendChart');
    if (!ctx) {
        console.warn('Sales trend chart canvas not found');
        return;
    }

    // Destroy existing chart
    if (salesTrendChart) {
        salesTrendChart.destroy();
        salesTrendChart = null;
    }

    const salesData = prepareSalesTrendData(window.orders || []);

    salesTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: salesData.labels,
            datasets: [{
                label: 'Revenue',
                data: salesData.revenue,
                borderColor: '#FCA311',
                backgroundColor: 'rgba(252, 163, 17, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#FCA311',
                pointBorderColor: '#FCA311',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#888',
                        font: {
                            size: 12
                        },
                        callback: function (value) {
                            return '₹' + (value >= 1000 ? (value / 1000) + 'K' : value);
                        }
                    },
                    grid: {
                        color: '#333',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#888',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: '#333',
                        drawBorder: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function initializeOrderStatusChart() {
    const ctx = document.getElementById('orderStatusChart');
    if (!ctx) {
        console.warn('Order status chart canvas not found');
        return;
    }

    if (orderStatusChart) {
        orderStatusChart.destroy();
        orderStatusChart = null;
    }

    const statusData = prepareOrderStatusData(window.orders || []);

    orderStatusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: statusData.labels,
            datasets: [{
                data: statusData.values,
                backgroundColor: [
                    '#FCA311',
                    '#2ecc71',
                    '#e74c3c',
                    '#3498db',
                    '#f39c12',
                    '#9b59b6'
                ],
                borderWidth: 2,
                borderColor: '#1e1e1e'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#fff',
                        font: {
                            size: 12
                        },
                        padding: 20,
                        usePointStyle: true
                    }
                }
            },
            cutout: '60%'
        }
    });

}

function prepareSalesTrendData(orders) {
    const last7Days = [];
    const revenueByDay = {};

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        const displayDate = date.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric'
        });

        last7Days.push(displayDate);
        revenueByDay[dateKey] = 0;
    }

    orders.forEach(order => {
        if (!order.createdOn) return;

        const orderDate = new Date(order.createdOn);
        const dateKey = orderDate.toISOString().split('T')[0];

        if (revenueByDay.hasOwnProperty(dateKey)) {
            revenueByDay[dateKey] += order.finalAmount || 0;
        }
    });

    return {
        labels: last7Days,
        revenue: Object.values(revenueByDay)
    };
}

function prepareOrderStatusData(orders) {
    const statusCount = {
        'Delivered': 0,
        'Processing': 0,
        'Cancelled': 0,
        'Shipped': 0,
        'Pending': 0,
        'Others': 0
    };

    orders.forEach(order => {
        const status = order.status || 'Others';
        if (statusCount.hasOwnProperty(status)) {
            statusCount[status]++;
        } else {
            statusCount['Others']++;
        }
    });

    const labels = [];
    const values = [];

    Object.entries(statusCount).forEach(([status, count]) => {
        if (count > 0) {
            labels.push(status);
            values.push(count);
        }
    });

    return { labels, values };
}

const throttle = (func, limit) => {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};

const throttledUpdateCharts = throttle(updateChartsWithFilteredData, 500);

function updateChartsWithFilteredData(filteredOrders) {
    if (!filteredOrders || window.updatingCharts || !window.chartsInitialized) {
        return;
    }

    window.updatingCharts = true;

    try {
        if (salesTrendChart && salesTrendChart.data) {
            const salesData = prepareSalesTrendData(filteredOrders);
            salesTrendChart.data.labels = salesData.labels;
            salesTrendChart.data.datasets[0].data = salesData.revenue;
            salesTrendChart.update('none');
        }

        if (orderStatusChart && orderStatusChart.data) {
            const statusData = prepareOrderStatusData(filteredOrders);
            orderStatusChart.data.labels = statusData.labels;
            orderStatusChart.data.datasets[0].data = statusData.values;
            orderStatusChart.update('none');
        }
    } catch (error) {
        console.error('Error updating charts:', error);
    } finally {
        window.updatingCharts = false;
    }
}

function initializeDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
        const menu = dropdown.querySelector('.dropdown-menu');
        const currentFilter = dropdown.querySelector('span[data-filter]');

        if (!menu || !currentFilter) return;

        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdowns.forEach(d => {
                if (d !== dropdown) {
                    const otherMenu = d.querySelector('.dropdown-menu');
                    if (otherMenu) otherMenu.style.display = 'none';
                }
            });

            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        });

        const items = menu.querySelectorAll('.dropdown-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const filter = item.getAttribute('data-filter');
                currentFilter.textContent = item.textContent;
                currentFilter.setAttribute('data-filter', filter);
                menu.style.display = 'none';

                debouncedApplyChartFilter(dropdown.id, filter);
            });
        });
    });

    document.addEventListener('click', () => {
        dropdowns.forEach(dropdown => {
            const menu = dropdown.querySelector('.dropdown-menu');
            if (menu) menu.style.display = 'none';
        });
    });
}

const debouncedApplyChartFilter = debounce((dropdownId, filter) => {
    applyChartFilter(dropdownId, filter);
}, 500);

function applyChartFilter(dropdownId, filter) {
    if (!window.orders || window.updatingCharts) return;

    let filteredOrders = [...window.orders];
    const now = new Date();
    let startDate;

    switch (filter) {
        case 'week':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            break;
        case 'month':
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case 'all':
            startDate = null;
            break;
        default:
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
    }

    if (startDate) {
        filteredOrders = filteredOrders.filter(order => {
            if (!order.createdOn) return false;
            const orderDate = new Date(order.createdOn);
            return orderDate >= startDate && orderDate <= now;
        });
    }

    if (dropdownId === 'salesTrendFilter' || dropdownId === 'orderStatusFilter') {
        throttledUpdateCharts(filteredOrders);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeDropdowns();
    }, 1500);
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