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

        generateReport();
        updateCustomerInsights(users);

        setTimeout(() => {
            initializeDropdowns();
        }, 100);

    } catch (error) {
        console.error('Error initializing reports:', error);
    }
});

// Get form elements
const reportTypeSelect = document.getElementById('reportType');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');

// Add debouncing to prevent rapid fire events
let debounceTimeout = null;

function debounce(func, delay) {
    return function (...args) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Use debounced version of generateReport
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

// Event listeners for report filters
if (reportTypeSelect) {
    reportTypeSelect.addEventListener('change', () => {
        if (isProgrammaticChange) return;
        const isCustom = reportTypeSelect.value === 'custom';

        if (startDateInput) startDateInput.disabled = !isCustom;
        if (endDateInput) endDateInput.disabled = !isCustom;

        if (!isCustom) {
            debouncedGenerateReport();
        }
    });
}

if (startDateInput && endDateInput) {
    startDateInput.addEventListener('change', () => {
        if (isProgrammaticChange) return;
        if (reportTypeSelect?.value === 'custom') {
            debouncedGenerateReport();
        }
    });
    endDateInput.addEventListener('change', () => {
        if (isProgrammaticChange) return;
        if (reportTypeSelect?.value === 'custom') {
            debouncedGenerateReport();
        }
    });
}

function updateDashboard(filteredOrders) {
    if (!filteredOrders || !Array.isArray(filteredOrders)) {
        console.error('Invalid orders data provided to updateDashboard');
        return;
    }

    updateSalesSummary(filteredOrders);
    updateTopProducts(filteredOrders);
    updateTopCategories(filteredOrders)
    updateRecentOrders(filteredOrders);
    updatePaymentMethods(filteredOrders);
}

function updateSalesSummary(orders) {
    if (!orders || !Array.isArray(orders)) return;

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const growthValue = calcGrowth(orders);

    const growthValueEl = document.getElementById('growthRate');
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalRevenueEl = document.getElementById('totalRevenue');
    const avgOrderValueEl = document.getElementById('avgOrderValue');

    if (growthValueEl) growthValueEl.textContent = growthValue + '%';
    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders.toLocaleString();
    if (totalRevenueEl) totalRevenueEl.textContent = `₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if (avgOrderValueEl) avgOrderValueEl.textContent = `₹${avgOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
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
    return Math.round(growth * 100) / 100;
}

function updateTopCategories(orders) {
    if (!orders || !Array.isArray(orders)) return;

    const categories = JSON.parse(document.getElementById('categoryFilter').dataset.items);
    const categoryMap = {};

    orders.forEach(order => {
        if (!order.orderedItems || !Array.isArray(order.orderedItems)) return;

        order.orderedItems.forEach(item => {
            if (!item || ['Cancelled', 'Returned'].includes(item.itemStatus)) return;

            const id = item.product?.category?._id || item.product?.category?.toString() || 'unknown';
            if (!categoryMap[id]) {
                // lookup category name from `categories` array (passed from EJS)
                const catObj = categories.find(c => c._id.toString() === id.toString());
                categoryMap[id] = {
                    name: catObj ? catObj.name : 'Unknown',
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
        .slice(0, 15); // Show top 15 categories

    const tbody = document.getElementById('topCategoriesTable');
    if (tbody) {
        tbody.innerHTML = topCategories.map((c, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${c.name}</td>
                <td>${c.quantity.toLocaleString()}</td>
                <td>₹${c.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td>--</td>
            </tr>
        `).join('');
    }
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
        .slice(0, 15); // Show more products in reports

    const tbody = document.getElementById('topProductsTable');
    if (tbody) {
        tbody.innerHTML = topProducts.map((p, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${p.name}</td>
                <td>${p.quantity.toLocaleString()}</td>
                <td>₹${p.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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
        .slice(0, 20); // Show more orders in reports

    const tbody = document.getElementById('recentOrdersTable');
    if (!tbody) return;

    tbody.innerHTML = sorted.map(order => {
        const date = new Date(order.createdOn).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const productName = order.orderedItems?.[0]?.product?.productName || 'Unknown';
        const customerName = order.address?.name || 'N/A';
        const amount = order.finalAmount || 0;
        const status = order.status || 'Unknown';
        const paymentMethod = order.paymentMethod || 'N/A';
        const orderId = order.orderId || 'N/A';

        return `
            <tr>
                <td>${date}</td>
                <td>${orderId}</td>
                <td>${customerName}</td>
                <td>${productName}</td>
                <td>₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td>${paymentMethod}</td>
                <td><span class="status ${status.toLowerCase().replace(/\s+/g, '-')}">${status}</span></td>
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

    // Update COD
    const codProgress = document.querySelector('.cod-progress');
    const codPercentage = document.getElementById('codPercentage');
    const codCount = document.getElementById('codCount');
    if (codProgress) codProgress.style.width = `${cod}%`;
    if (codPercentage) codPercentage.textContent = `${cod}%`;
    if (codCount) codCount.textContent = `(${methods.COD} orders)`;

    // Update Online Payment
    const onlineProgress = document.querySelector('.online-progress');
    const onlinePercentage = document.getElementById('onlinePercentage');
    const onlineCount = document.getElementById('onlineCount');
    if (onlineProgress) onlineProgress.style.width = `${razorpay}%`;
    if (onlinePercentage) onlinePercentage.textContent = `${razorpay}%`;
    if (onlineCount) onlineCount.textContent = `(${methods.RAZORPAY} orders)`;

    // Update Wallet
    const walletProgress = document.querySelector('.wallet-progress');
    const walletPercentage = document.getElementById('walletPercentage');
    const walletCount = document.getElementById('walletCount');
    if (walletProgress) walletProgress.style.width = `${wallet}%`;
    if (walletPercentage) walletPercentage.textContent = `${wallet}%`;
    if (walletCount) walletCount.textContent = `(${methods.WALLET} orders)`;
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

    // Calculate average customer value
    const totalRevenue = window.orders ? window.orders.reduce((sum, o) => sum + (o.finalAmount || 0), 0) : 0;
    const avgCustomerValue = users.length > 0 ? totalRevenue / users.length : 0;

    const newCustomersEl = document.getElementById('newCustomers');
    const returningCustomersEl = document.getElementById('returningCustomers');
    const customerRetentionEl = document.getElementById('customerRetention');
    const avgCustomerValueEl = document.getElementById('avgCustomerValue');

    if (newCustomersEl) newCustomersEl.textContent = newUsers.length.toLocaleString();
    if (returningCustomersEl) returningCustomersEl.textContent = returning.length.toLocaleString();
    if (customerRetentionEl) customerRetentionEl.textContent = `${retentionRate.toFixed(1)}%`;
    if (avgCustomerValueEl) avgCustomerValueEl.textContent = `₹${avgCustomerValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function generateReport() {
    if (generatingReport || !window.orders) {
        return;
    }

    generatingReport = true;

    try {
        const reportType = reportTypeSelect?.value || 'all';
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
                        console.error('Invalid dates provided');
                        showAlert('Invalid dates provided', 'error');
                        return;
                    }

                    if (startDate > endDate) {
                        console.error('Start date cannot be later than end date');
                        showAlert('Start date cannot be later than end date', 'error');
                        return;
                    }
                } else {
                    console.error('Custom date range requires both start and end dates');
                    showAlert('Please select both start and end dates for custom range', 'warning');
                    return;
                }
                break;

            case 'all':
            default:
                updateDashboard(filteredOrders);
                return;
        }

        filteredOrders = filteredOrders.filter(order => {
            if (!order.createdOn) return false;

            const orderDate = new Date(order.createdOn);
            if (isNaN(orderDate.getTime())) return false;

            return orderDate >= startDate && orderDate <= endDate;
        });

        updateDashboard(filteredOrders);

    } catch (error) {
        console.error('Error in generateReport:', error);
        showAlert('Error generating report', 'error');
    } finally {
        generatingReport = false;
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

            // Close other dropdowns
            dropdowns.forEach(d => {
                if (d !== dropdown) {
                    const otherMenu = d.querySelector('.dropdown-menu');
                    if (otherMenu) {
                        otherMenu.style.display = 'none';
                        d.classList.remove('open');
                    }
                }
            });

            // Toggle current dropdown
            const isOpen = menu.style.display === 'block';
            menu.style.display = isOpen ? 'none' : 'block';
            dropdown.classList.toggle('open', !isOpen);
        });

        const items = menu.querySelectorAll('.dropdown-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const filter = item.getAttribute('data-filter');
                currentFilter.textContent = item.textContent;
                currentFilter.setAttribute('data-filter', filter);
                menu.style.display = 'none';
                dropdown.classList.remove('open');

                debouncedApplyFilter(dropdown.id, filter);
            });
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        dropdowns.forEach(dropdown => {
            const menu = dropdown.querySelector('.dropdown-menu');
            if (menu) {
                menu.style.display = 'none';
                dropdown.classList.remove('open');
            }
        });
    });
}

const debouncedApplyFilter = debounce((dropdownId, filter) => {
    applyFilter(dropdownId, filter);
}, 300);

function applyFilter(dropdownId, filter) {
    if (!window.orders) return;

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

    // Apply filter based on dropdown
    switch (dropdownId) {
        case 'productsFilter':
            updateTopProducts(filteredOrders);
            break;
        case 'ordersFilter':
            updateRecentOrders(filteredOrders);
            break;
        default:
            updateDashboard(filteredOrders);
    }
}

// Main Export function with modal/dropdown options
function exportReport() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Export Sales Report',
            text: 'Choose export format:',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-file-excel"></i> Excel',
            cancelButtonText: '<i class="fas fa-file-pdf"></i> PDF',
            reverseButtons: true,
            customClass: {
                confirmButton: 'btn btn-success',
                cancelButton: 'btn btn-danger'
            },
            buttonsStyling: false
        }).then((result) => {
            if (result.isConfirmed) {
                exportToExcel();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                exportToPDF();
            }
        });
    } else {
        // Fallback if SweetAlert is not available
        const format = confirm('Choose export format:\nOK = Excel\nCancel = PDF');
        if (format) {
            exportToExcel();
        } else {
            exportToPDF();
        }
    }
}

// Excel Export Functions
function exportToExcel() {
    showAlert('Generating Excel report...', 'info');

    try {
        // Create workbook
        const wb = XLSX.utils.book_new();

        // Add Summary Sheet
        const summaryData = getSummaryDataForExcel();
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

        // Add Products Sheet
        const productsData = getProductsData();
        const productsWs = XLSX.utils.aoa_to_sheet(productsData);
        XLSX.utils.book_append_sheet(wb, productsWs, 'Top Products');

        // Add Orders Sheet
        const ordersData = getOrdersData();
        const ordersWs = XLSX.utils.aoa_to_sheet(ordersData);
        XLSX.utils.book_append_sheet(wb, ordersWs, 'Recent Orders');

        // Add Payment Methods Sheet
        const paymentData = getPaymentData();
        const paymentWs = XLSX.utils.aoa_to_sheet(paymentData);
        XLSX.utils.book_append_sheet(wb, paymentWs, 'Payment Methods');

        // Add Customer Insights Sheet
        const customerData = getCustomerData();
        const customerWs = XLSX.utils.aoa_to_sheet(customerData);
        XLSX.utils.book_append_sheet(wb, customerWs, 'Customer Insights');

        // Save file
        const fileName = `sales-report-${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        showAlert('Excel report exported successfully!', 'success');
    } catch (error) {
        console.error('Excel export error:', error);
        showAlert('Error exporting Excel report. Please ensure XLSX library is loaded.', 'error');
    }
}

function exportToPDF() {
    showAlert('Generating PDF report...', 'info');

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Set document properties
        doc.setProperties({
            title: 'Sales Report',
            subject: 'Business Analytics Report',
            author: 'Sales Dashboard',
            creator: 'Sales Dashboard System'
        });

        let yPosition = 20;

        // Title
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Sales Report', 20, yPosition);
        yPosition += 15;

        // Generated date
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 20, yPosition);
        yPosition += 20;

        // Summary Section
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Summary', 20, yPosition);
        yPosition += 10;

        const summaryData = getSummaryDataForPDF();
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        summaryData.forEach(item => {
            doc.text(`${item.label}: ${item.value}`, 20, yPosition);
            yPosition += 8;
        });
        yPosition += 10;

        // Top Products Section
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Top Products', 20, yPosition);
        yPosition += 10;

        const productsData = getProductsData();
        if (productsData.length > 1) {
            doc.autoTable({
                head: [productsData[0]],
                body: productsData.slice(1, 11), // Top 10 products for PDF
                startY: yPosition,
                theme: 'striped',
                styles: { fontSize: 10 }
            });
            yPosition = doc.lastAutoTable.finalY + 15;
        }

        // Payment Methods Section
        if (yPosition > 200) {
            doc.addPage();
            yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Payment Methods', 20, yPosition);
        yPosition += 10;

        const paymentData = getPaymentData();
        if (paymentData.length > 1) {
            doc.autoTable({
                head: [paymentData[0]],
                body: paymentData.slice(1),
                startY: yPosition,
                theme: 'striped',
                styles: { fontSize: 12 }
            });
            yPosition = doc.lastAutoTable.finalY + 15;
        }

        // Customer Insights Section
        if (yPosition > 200) {
            doc.addPage();
            yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Customer Insights', 20, yPosition);
        yPosition += 10;

        const customerData = getCustomerData();
        if (customerData.length > 1) {
            doc.autoTable({
                head: [customerData[0]],
                body: customerData.slice(1),
                startY: yPosition,
                theme: 'striped',
                styles: { fontSize: 12 }
            });
        }

        // Save PDF
        const fileName = `sales-report-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        showAlert('PDF report exported successfully!', 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        showAlert('Error exporting PDF report. Please ensure jsPDF library is loaded.', 'error');
    }
}

// Individual export functions for specific sections
function exportProductsReport() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Export Products Report',
            text: 'Choose export format:',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Excel',
            cancelButtonText: 'PDF',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                exportProductsToExcel();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                exportProductsToPDF();
            }
        });
    } else {
        const format = confirm('Choose format: OK = Excel, Cancel = PDF');
        if (format) {
            exportProductsToExcel();
        } else {
            exportProductsToPDF();
        }
    }
}

function exportOrdersReport() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Export Orders Report',
            text: 'Choose export format:',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Excel',
            cancelButtonText: 'PDF',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                exportOrdersToExcel();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                exportOrdersToPDF();
            }
        });
    } else {
        const format = confirm('Choose format: OK = Excel, Cancel = PDF');
        if (format) {
            exportOrdersToExcel();
        } else {
            exportOrdersToPDF();
        }
    }
}

function exportPaymentReport() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Export Payment Report',
            text: 'Choose export format:',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Excel',
            cancelButtonText: 'PDF',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                exportPaymentToExcel();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                exportPaymentToPDF();
            }
        });
    } else {
        const format = confirm('Choose format: OK = Excel, Cancel = PDF');
        if (format) {
            exportPaymentToExcel();
        } else {
            exportPaymentToPDF();
        }
    }
}

function exportCustomerReport() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Export Customer Report',
            text: 'Choose export format:',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Excel',
            cancelButtonText: 'PDF',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                exportCustomerToExcel();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                exportCustomerToPDF();
            }
        });
    } else {
        const format = confirm('Choose format: OK = Excel, Cancel = PDF');
        if (format) {
            exportCustomerToExcel();
        } else {
            exportCustomerToPDF();
        }
    }
}

// Individual Excel export functions
function exportProductsToExcel() {
    try {
        const data = getProductsData();
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Top Products');
        XLSX.writeFile(wb, `top-products-report-${new Date().toISOString().split('T')[0]}.xlsx`);
        showAlert('Products Excel report exported!', 'success');
    } catch (error) {
        showAlert('Error exporting products Excel report', 'error');
    }
}

function exportOrdersToExcel() {
    try {
        const data = getOrdersData();
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Recent Orders');
        XLSX.writeFile(wb, `orders-report-${new Date().toISOString().split('T')[0]}.xlsx`);
        showAlert('Orders Excel report exported!', 'success');
    } catch (error) {
        showAlert('Error exporting orders Excel report', 'error');
    }
}

function exportPaymentToExcel() {
    try {
        const data = getPaymentData();
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Payment Methods');
        XLSX.writeFile(wb, `payment-methods-report-${new Date().toISOString().split('T')[0]}.xlsx`);
        showAlert('Payment Excel report exported!', 'success');
    } catch (error) {
        showAlert('Error exporting payment Excel report', 'error');
    }
}

function exportCustomerToExcel() {
    try {
        const data = getCustomerData();
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Customer Insights');
        XLSX.writeFile(wb, `customer-insights-report-${new Date().toISOString().split('T')[0]}.xlsx`);
        showAlert('Customer Excel report exported!', 'success');
    } catch (error) {
        showAlert('Error exporting customer Excel report', 'error');
    }
}

// Individual PDF export functions
function exportProductsToPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Top Products Report', 20, 20);

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 20, 35);

        const productsData = getProductsData();
        if (productsData.length > 1) {
            doc.autoTable({
                head: [productsData[0]],
                body: productsData.slice(1),
                startY: 45,
                theme: 'striped',
                styles: { fontSize: 10 }
            });
        }

        doc.save(`top-products-report-${new Date().toISOString().split('T')[0]}.pdf`);
        showAlert('Products PDF report exported!', 'success');
    } catch (error) {
        showAlert('Error exporting products PDF report', 'error');
    }
}

function exportOrdersToPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l'); // Landscape for orders table

        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Recent Orders Report', 20, 20);

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 20, 35);

        const ordersData = getOrdersData();
        if (ordersData.length > 1) {
            doc.autoTable({
                head: [ordersData[0]],
                body: ordersData.slice(1),
                startY: 45,
                theme: 'striped',
                styles: { fontSize: 8 },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 50 },
                    4: { cellWidth: 30 },
                    5: { cellWidth: 30 },
                    6: { cellWidth: 25 }
                }
            });
        }

        doc.save(`orders-report-${new Date().toISOString().split('T')[0]}.pdf`);
        showAlert('Orders PDF report exported!', 'success');
    } catch (error) {
        showAlert('Error exporting orders PDF report', 'error');
    }
}

function exportPaymentToPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Payment Methods Report', 20, 20);

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 20, 35);

        const paymentData = getPaymentData();
        if (paymentData.length > 1) {
            doc.autoTable({
                head: [paymentData[0]],
                body: paymentData.slice(1),
                startY: 45,
                theme: 'striped',
                styles: { fontSize: 12 }
            });
        }

        doc.save(`payment-methods-report-${new Date().toISOString().split('T')[0]}.pdf`);
        showAlert('Payment PDF report exported!', 'success');
    } catch (error) {
        showAlert('Error exporting payment PDF report', 'error');
    }
}

function exportCustomerToPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Customer Insights Report', 20, 20);

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 20, 35);

        const customerData = getCustomerData();
        if (customerData.length > 1) {
            doc.autoTable({
                head: [customerData[0]],
                body: customerData.slice(1),
                startY: 45,
                theme: 'striped',
                styles: { fontSize: 12 }
            });
        }

        doc.save(`customer-insights-report-${new Date().toISOString().split('T')[0]}.pdf`);
        showAlert('Customer PDF report exported!', 'success');
    } catch (error) {
        showAlert('Error exporting customer PDF report', 'error');
    }
}

// Helper functions for data extraction
function getSummaryData() {
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalRevenueEl = document.getElementById('totalRevenue');
    const avgOrderValueEl = document.getElementById('avgOrderValue');
    const growthRateEl = document.getElementById('growthRate');

    return {
        totalOrders: totalOrdersEl?.textContent || '0',
        totalRevenue: totalRevenueEl?.textContent || '₹0',
        averageOrderValue: avgOrderValueEl?.textContent || '₹0',
        growthRate: growthRateEl?.textContent || '0%'
    };
}

function getSummaryDataForExcel() {
    const summary = getSummaryData();
    return [
        ['Metric', 'Value'],
        ['Total Orders', summary.totalOrders],
        ['Total Revenue', summary.totalRevenue],
        ['Average Order Value', summary.averageOrderValue],
        ['Growth Rate (7 days)', summary.growthRate],
        ['', ''],
        ['Report Generated', new Date().toLocaleDateString('en-IN')],
        ['Report Time', new Date().toLocaleTimeString('en-IN')]
    ];
}

function getSummaryDataForPDF() {
    const summary = getSummaryData();
    return [
        { label: 'Total Orders', value: summary.totalOrders },
        { label: 'Total Revenue', value: summary.totalRevenue },
        { label: 'Average Order Value', value: summary.averageOrderValue },
        { label: 'Growth Rate (7 days)', value: summary.growthRate }
    ];
}

function getProductsData() {
    const table = document.getElementById('topProductsTable');
    const rows = table?.querySelectorAll('tr') || [];

    const headers = ['Rank', 'Product Name', 'Units Sold', 'Revenue', 'Growth'];
    const data = [headers];

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            data.push(Array.from(cells).map(cell => cell.textContent.trim()));
        }
    });

    return data;
}

function getOrdersData() {
    const table = document.getElementById('recentOrdersTable');
    const rows = table?.querySelectorAll('tr') || [];

    const headers = ['Order Date', 'Order ID', 'Customer', 'Item', 'Order Total', 'Payment Method', 'Order Status'];
    const data = [headers];

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            data.push(Array.from(cells).map(cell => {
                // Remove status styling for export
                const statusSpan = cell.querySelector('.status');
                return statusSpan ? statusSpan.textContent.trim() : cell.textContent.trim();
            }));
        }
    });

    return data;
}

function getPaymentData() {
    const codEl = document.getElementById('codPercentage');
    const onlineEl = document.getElementById('onlinePercentage');
    const walletEl = document.getElementById('walletPercentage');
    const codCountEl = document.getElementById('codCount');
    const onlineCountEl = document.getElementById('onlineCount');
    const walletCountEl = document.getElementById('walletCount');

    return [
        ['Payment Method', 'Percentage', 'Order Count'],
        ['Cash on Delivery', codEl?.textContent || '0%', codCountEl?.textContent || '(0 orders)'],
        ['Online Payment', onlineEl?.textContent || '0%', onlineCountEl?.textContent || '(0 orders)'],
        ['Wallet', walletEl?.textContent || '0%', walletCountEl?.textContent || '(0 orders)']
    ];
}

function getCustomerData() {
    const newCustomersEl = document.getElementById('newCustomers');
    const returningCustomersEl = document.getElementById('returningCustomers');
    const retentionEl = document.getElementById('customerRetention');
    const avgValueEl = document.getElementById('avgCustomerValue');

    return [
        ['Metric', 'Value'],
        ['New Customers (30 days)', newCustomersEl?.textContent || '0'],
        ['Returning Customers', returningCustomersEl?.textContent || '0'],
        ['Customer Retention Rate', retentionEl?.textContent || '0%'],
        ['Average Customer Value', avgValueEl?.textContent || '₹0']
    ];
}

// Keep CSV download function for backward compatibility
function downloadCSV(data, filename) {
    const csv = data.map(row =>
        row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showAlert(message, type = 'info') {
    if (typeof Swal !== 'undefined') {
        const icon = type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info';
        Swal.fire({
            title: message,
            icon: icon,
            timer: 3000,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            background: '#333',
            color: '#fff'
        });
    } else {
        alert(message);
    }
}