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

    updateTopBrands(filteredOrders);
    updateTopProducts(filteredOrders);
    updateRecentOrders(filteredOrders);
    updateSalesSummary(filteredOrders);
    updateTopCategories(filteredOrders)
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

    const categories = JSON.parse(document.getElementById('categoryData').value);
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
        .slice(0, 15);

    const tbody = document.getElementById('topProductsTable');
    if (tbody) {
        tbody.innerHTML = topProducts.map((p, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${p.name}</td>
                <td>${p.quantity.toLocaleString()}</td>
                <td>₹ ${p.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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
                <td>₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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

// ==============================================
// MAIN EXPORT FUNCTIONS (Export entire report)
// ==============================================

function exportReport() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Export Complete Sales Report',
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
                exportCompleteReportToExcel();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                exportCompleteReportToPDF();
            }
        });
    } else {
        const format = confirm('Export Complete Report\nOK = Excel\nCancel = PDF');
        if (format) {
            exportCompleteReportToExcel();
        } else {
            exportCompleteReportToPDF();
        }
    }
}

// Complete Excel Export (All sections)
function exportCompleteReportToExcel() {
    showAlert('Generating complete Excel report...', 'info');

    try {
        const wb = XLSX.utils.book_new();

        // Summary Sheet
        const summaryData = [
            ['CAMZONE Sales Report', ''],
            ['Generated On', new Date().toLocaleDateString('en-IN')],
            ['Report Period', getFilterInfo()],
            ['', ''],
            ['Key Metrics', 'Values'],
            ['Total Orders', document.getElementById('totalOrders')?.textContent || '0'],
            ['Total Revenue', document.getElementById('totalRevenue')?.textContent || '₹0'],
            ['Average Order Value', document.getElementById('avgOrderValue')?.textContent || '₹0'],
            ['Growth Rate', document.getElementById('growthRate')?.textContent || '0%']
        ];
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

        // Top Products Sheet
        const productsData = getTableData('topProductsTable', ['Rank', 'Product Name', 'Units Sold', 'Revenue', 'Growth']);
        if (productsData.length > 1) {
            const productsWs = XLSX.utils.aoa_to_sheet(productsData);
            XLSX.utils.book_append_sheet(wb, productsWs, 'Top Products');
        }

        // Top Categories Sheet
        const categoriesData = getTableData('topCategoriesTable', ['Rank', 'Category Name', 'Units Sold', 'Revenue', 'Growth']);
        if (categoriesData.length > 1) {
            const categoriesWs = XLSX.utils.aoa_to_sheet(categoriesData);
            XLSX.utils.book_append_sheet(wb, categoriesWs, 'Top Categories');
        }

        // Top Brands Sheet
        const brandsData = getTableData('topBrandsTable', ['Rank', 'Brand Name', 'Units Sold', 'Revenue', 'Growth']);
        if (brandsData.length > 1) {
            const brandsWs = XLSX.utils.aoa_to_sheet(brandsData);
            XLSX.utils.book_append_sheet(wb, brandsWs, 'Top Brands');
        }

        // Recent Orders Sheet
        const ordersData = getTableData('recentOrdersTable', ['Order Date', 'Order ID', 'Customer', 'Item', 'Order Total', 'Payment Method', 'Order Status']);
        if (ordersData.length > 1) {
            const ordersWs = XLSX.utils.aoa_to_sheet(ordersData);
            XLSX.utils.book_append_sheet(wb, ordersWs, 'Recent Orders');
        }

        // Payment Methods Sheet
        const paymentData = getPaymentMethodsData();
        if (paymentData.length > 1) {
            const paymentWs = XLSX.utils.aoa_to_sheet(paymentData);
            XLSX.utils.book_append_sheet(wb, paymentWs, 'Payment Methods');
        }

        // Customer Analytics Sheet
        const customerData = getCustomerAnalyticsData();
        if (customerData.length > 1) {
            const customerWs = XLSX.utils.aoa_to_sheet(customerData);
            XLSX.utils.book_append_sheet(wb, customerWs, 'Customer Analytics');
        }

        const fileName = `camzone-complete-sales-report-${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        showAlert('Complete Excel report exported successfully!', 'success');
    } catch (error) {
        console.error('Excel export error:', error);
        showAlert('Error exporting Excel report', 'error');
    }
}

// Complete PDF Export (All sections)
function exportCompleteReportToPDF() {
    showAlert('Generating complete PDF report...', 'info');

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let yPosition = 20;

        // Title Page
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('CAMZONE Sales Report', 20, yPosition);
        yPosition += 15;

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`, 20, yPosition);
        doc.text(`Report Period: ${getFilterInfo()}`, 20, yPosition + 10);
        yPosition += 30;

        // Summary Section
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        const summaryStartY = yPosition;
        doc.text('Executive Summary', 20, yPosition);
        yPosition += 10;

        // Replace ₹ with INR in summary
        const replaceSymbol = (text) => (text ? text.replace(/₹/g, 'INR ') : text);

        const summaryData = [
            ['Total Orders', document.getElementById('totalOrders')?.textContent || '0'],
            ['Total Revenue', replaceSymbol(document.getElementById('totalRevenue')?.textContent || 'INR 0')],
            ['Average Order Value', replaceSymbol(document.getElementById('avgOrderValue')?.textContent || 'INR 0')],
            ['Growth Rate', document.getElementById('growthRate')?.textContent || '0%']
        ];

        doc.autoTable({
            body: summaryData,
            startY: yPosition,
            theme: 'striped',
            styles: { fontSize: 12 },
            headStyles: { fillColor: [64, 133, 126] }
        });
        yPosition = doc.lastAutoTable.finalY + 15;

        // Draw box around Summary Section
        const summaryHeight = doc.lastAutoTable.finalY - summaryStartY + 10;
        doc.setLineWidth(0.5);
        doc.setDrawColor(64, 133, 126);
        doc.rect(15, summaryStartY - 5, 180, summaryHeight, 'S');

        // Sections with tables (Top Products, Categories, Brands, Payments, Customers)
        if (yPosition > 200) { doc.addPage(); yPosition = 20; }
        addSectionToPDF(doc, 'Top Products', getTableData('topProductsTable', ['Rank', 'Product Name', 'Units Sold', 'Revenue', 'Growth']), yPosition, 10, replaceSymbol);
        yPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : yPosition + 50;

        if (yPosition > 200) { doc.addPage(); yPosition = 20; }
        addSectionToPDF(doc, 'Top Categories', getTableData('topCategoriesTable', ['Rank', 'Category Name', 'Units Sold', 'Revenue', 'Growth']), yPosition, 10, replaceSymbol);
        yPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : yPosition + 50;

        if (yPosition > 200) { doc.addPage(); yPosition = 20; }
        addSectionToPDF(doc, 'Top Brands', getTableData('topBrandsTable', ['Rank', 'Brand Name', 'Units Sold', 'Revenue', 'Growth']), yPosition, 10, replaceSymbol);
        yPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : yPosition + 50;

        if (yPosition > 200) { doc.addPage(); yPosition = 20; }
        addPaymentMethodsToPDF(doc, yPosition, replaceSymbol);
        yPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : yPosition + 50;

        if (yPosition > 200) { doc.addPage(); yPosition = 20; }
        addCustomerAnalyticsToPDF(doc, yPosition, replaceSymbol);

        // Add page numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
        }

        const fileName = `camzone-complete-sales-report-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        showAlert('Complete PDF report exported successfully!', 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        showAlert('Error exporting PDF report', 'error');
    }
}


// ==============================================
// INDIVIDUAL SECTION EXPORT FUNCTIONS
// ==============================================

// Products Report Export
function exportProductsReport() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Export Products Report',
            text: 'Choose export format:',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Excel',
            cancelButtonText: 'PDF'
        }).then((result) => {
            if (result.isConfirmed) {
                exportSingleSectionToExcel('Products', 'topProductsTable', ['Rank', 'Product Name', 'Units Sold', 'Revenue', 'Growth']);
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                exportSingleSectionToPDF('Top Products', 'topProductsTable', ['Rank', 'Product Name', 'Units Sold', 'Revenue', 'Growth']);
            }
        });
    }
}

// Categories Report Export
function exportCategoryReport() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Export Categories Report',
            text: 'Choose export format:',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Excel',
            cancelButtonText: 'PDF'
        }).then((result) => {
            if (result.isConfirmed) {
                exportSingleSectionToExcel('Categories', 'topCategoriesTable', ['Rank', 'Category Name', 'Units Sold', 'Revenue', 'Growth']);
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                exportSingleSectionToPDF('Top Categories', 'topCategoriesTable', ['Rank', 'Category Name', 'Units Sold', 'Revenue', 'Growth']);
            }
        });
    }
}

// Brands Report Export
function exportBrandReport() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Export Brands Report',
            text: 'Choose export format:',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Excel',
            cancelButtonText: 'PDF'
        }).then((result) => {
            if (result.isConfirmed) {
                exportSingleSectionToExcel('Brands', 'topBrandsTable', ['Rank', 'Brand Name', 'Units Sold', 'Revenue', 'Growth']);
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                exportSingleSectionToPDF('Top Brands', 'topBrandsTable', ['Rank', 'Brand Name', 'Units Sold', 'Revenue', 'Growth']);
            }
        });
    }
}

// Orders Report Export
function exportOrdersReport() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Export Orders Report',
            text: 'Choose export format:',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Excel',
            cancelButtonText: 'PDF'
        }).then((result) => {
            if (result.isConfirmed) {
                exportSingleSectionToExcel('Orders', 'recentOrdersTable', ['Order Date', 'Order ID', 'Customer', 'Item', 'Order Total', 'Payment Method', 'Order Status']);
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                exportSingleSectionToPDF('Recent Orders', 'recentOrdersTable', ['Order Date', 'Order ID', 'Customer', 'Item', 'Order Total', 'Payment Method', 'Order Status']);
            }
        });
    }
}

// Payment Methods Report Export
function exportPaymentReport() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Export Payment Report',
            text: 'Choose export format:',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Excel',
            cancelButtonText: 'PDF'
        }).then((result) => {
            if (result.isConfirmed) {
                exportPaymentMethodsToExcel();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                exportPaymentMethodsToPDF();
            }
        });
    }
}

// Customer Analytics Report Export
function exportCustomerReport() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Export Customer Report',
            text: 'Choose export format:',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Excel',
            cancelButtonText: 'PDF'
        }).then((result) => {
            if (result.isConfirmed) {
                exportCustomerAnalyticsToExcel();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                exportCustomerAnalyticsToPDF();
            }
        });
    }
}

// ==============================================
// HELPER FUNCTIONS FOR INDIVIDUAL EXPORTS
// ==============================================

// Generic Single Section Excel Export
function exportSingleSectionToExcel(sectionName, tableId, headers) {
    try {
        const data = getTableData(tableId, headers);
        if (data.length <= 1) {
            showAlert(`No ${sectionName.toLowerCase()} data to export`, 'warning');
            return;
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([
            [`CAMZONE ${sectionName} Report`],
            [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
            [''],
            ...data
        ]);
        
        XLSX.utils.book_append_sheet(wb, ws, sectionName);
        XLSX.writeFile(wb, `camzone-${sectionName.toLowerCase()}-report-${new Date().toISOString().split('T')[0]}.xlsx`);
        showAlert(`${sectionName} Excel report exported!`, 'success');
    } catch (error) {
        showAlert(`Error exporting ${sectionName.toLowerCase()} Excel report`, 'error');
    }
}

// Generic Single Section PDF Export
function exportSingleSectionToPDF(sectionName, tableId, headers) {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text(`CAMZONE ${sectionName} Report`, 20, 20);

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`, 20, 35);

        const data = getTableData(tableId, headers);

        // Replace ₹ only in amount fields
        const fixedData = data.map(row =>
            row.map(cell => {
                if (typeof cell === "string" && cell.includes("₹")) {
                    // Convert "₹3,050" → "INR 3,050"
                    return cell.replace(/₹/g, "INR ");
                }
                return cell;
            })
        );

        if (fixedData.length > 1) {
            doc.autoTable({
                head: [fixedData[0]],
                body: fixedData.slice(1),
                startY: 50,
                theme: 'striped',
                styles: { fontSize: 10 },
                headStyles: { fillColor: [64, 133, 126] }
            });
        } else {
            doc.text(`No ${sectionName.toLowerCase()} data available`, 20, 50);
        }

        doc.save(`camzone-${sectionName.toLowerCase().replace(' ', '-')}-report-${new Date().toISOString().split('T')[0]}.pdf`);
        showAlert(`${sectionName} PDF report exported!`, 'success');
    } catch (error) {
        showAlert(`Error exporting ${sectionName.toLowerCase()} PDF report`, 'error');
    }
}

// Payment Methods Individual Export Functions
function exportPaymentMethodsToExcel() {
    try {
        const data = getPaymentMethodsData();
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([
            ['CAMZONE Payment Methods Report'],
            [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
            [''],
            ...data
        ]);
        
        XLSX.utils.book_append_sheet(wb, ws, 'Payment Methods');
        XLSX.writeFile(wb, `camzone-payment-methods-${new Date().toISOString().split('T')[0]}.xlsx`);
        showAlert('Payment Methods Excel report exported!', 'success');
    } catch (error) {
        showAlert('Error exporting payment methods Excel report', 'error');
    }
}

function exportPaymentMethodsToPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('CAMZONE Payment Methods Report', 20, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 20, 35);

        const data = getPaymentMethodsData();
        doc.autoTable({
            head: [data[0]],
            body: data.slice(1),
            startY: 50,
            theme: 'striped',
            styles: { fontSize: 12 },
            headStyles: { fillColor: [64, 133, 126] }
        });

        doc.save(`camzone-payment-methods-${new Date().toISOString().split('T')[0]}.pdf`);
        showAlert('Payment Methods PDF report exported!', 'success');
    } catch (error) {
        showAlert('Error exporting payment methods PDF report', 'error');
    }
}

// Customer Analytics Individual Export Functions
function exportCustomerAnalyticsToExcel() {
    try {
        const data = getCustomerAnalyticsData();
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([
            ['CAMZONE Customer Analytics Report'],
            [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
            [''],
            ...data
        ]);
        
        XLSX.utils.book_append_sheet(wb, ws, 'Customer Analytics');
        XLSX.writeFile(wb, `camzone-customer-analytics-${new Date().toISOString().split('T')[0]}.xlsx`);
        showAlert('Customer Analytics Excel report exported!', 'success');
    } catch (error) {
        showAlert('Error exporting customer analytics Excel report', 'error');
    }
}

function exportCustomerAnalyticsToPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('CAMZONE Customer Analytics Report', 20, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 20, 35);

        const data = getCustomerAnalyticsData();
        doc.autoTable({
            head: [data[0]],
            body: data.slice(1),
            startY: 50,
            theme: 'striped',
            styles: { fontSize: 12 },
            headStyles: { fillColor: [64, 133, 126] }
        });

        doc.save(`camzone-customer-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
        showAlert('Customer Analytics PDF report exported!', 'success');
    } catch (error) {
        showAlert('Error exporting customer analytics PDF report', 'error');
    }
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

// Generic table data extraction
function getTableData(tableId, headers) {
    const table = document.getElementById(tableId);
    const rows = table?.querySelectorAll('tr') || [];
    
    const data = [headers];
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const rowData = Array.from(cells).map(cell => {
                const statusSpan = cell.querySelector('.status');
                let text = statusSpan ? statusSpan.textContent.trim() : cell.textContent.trim();
                return text.replace(/\s+/g, ' ');
            });
            data.push(rowData);
        }
    });
    
    return data;
}

// Payment methods data extraction
function getPaymentMethodsData() {
    return [
        ['Payment Method', 'Percentage', 'Order Count'],
        ['Cash on Delivery', document.getElementById('codPercentage')?.textContent || '0%', document.getElementById('codCount')?.textContent?.replace(/[()]/g, '') || '0 orders'],
        ['Online Payment', document.getElementById('onlinePercentage')?.textContent || '0%', document.getElementById('onlineCount')?.textContent?.replace(/[()]/g, '') || '0 orders'],
        ['Wallet', document.getElementById('walletPercentage')?.textContent || '0%', document.getElementById('walletCount')?.textContent?.replace(/[()]/g, '') || '0 orders']
    ];
}

// Customer analytics data extraction
function getCustomerAnalyticsData() {
    return [
        ['Metric', 'Value', 'Description'],
        ['New Customers', document.getElementById('newCustomers')?.textContent || '0', 'Last 30 days'],
        ['Returning Customers', document.getElementById('returningCustomers')?.textContent || '0', 'Multiple orders'],
        ['Customer Retention', document.getElementById('customerRetention')?.textContent || '0%', 'Return rate'],
        ['Average Customer Value', document.getElementById('avgCustomerValue')?.textContent || '₹0', 'Per customer']
    ];
}

// PDF helper functions
function addSectionToPDF(doc, title, data, yPosition, maxRows = null) {
    if (typeof title !== 'string' || !title) {
        console.error('Invalid title:', title);
        throw new Error('Title must be a non-empty string');
    }
    if (typeof yPosition !== 'number' || isNaN(yPosition) || yPosition < 0) {
        console.error('Invalid yPosition:', yPosition);
        throw new Error('yPosition must be a valid number');
    }

    const startY = yPosition;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(title, 20, yPosition);
    
    if (data && Array.isArray(data) && data.length > 1) {
        const bodyData = maxRows ? data.slice(1, maxRows + 1) : data.slice(1);
        doc.autoTable({
            head: [data[0]],
            body: bodyData,
            startY: yPosition + 10,
            theme: 'striped',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [64, 133, 126] }
        });
        // Draw box around the section
        const sectionHeight = doc.lastAutoTable.finalY - startY + 10;
        doc.setLineWidth(0.5);
        doc.setDrawColor(64, 133, 126); // Match headStyles color
        doc.rect(15, startY - 5, 180, sectionHeight, 'S'); // 'S' for stroke (border only)
    } else {
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`No ${title.toLowerCase()} data available`, 20, yPosition + 15);
        // Draw box around the "no data" message
        doc.setLineWidth(0.5);
        doc.setDrawColor(64, 133, 126);
        doc.rect(15, startY - 5, 180, 25, 'S'); // Fixed height for "no data"
    }
}

function addPaymentMethodsToPDF(doc, yPosition) {
    const startY = yPosition;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Payment Methods Distribution', 20, yPosition);
    
    const data = getPaymentMethodsData();
    doc.autoTable({
        head: [data[0]],
        body: data.slice(1),
        startY: yPosition + 10,
        theme: 'striped',
        styles: { fontSize: 11 },
        headStyles: { fillColor: [64, 133, 126] }
    });

    // Draw box around the section
    const sectionHeight = doc.lastAutoTable.finalY - startY + 10;
    doc.setLineWidth(0.5);
    doc.setDrawColor(64, 133, 126);
    doc.rect(15, startY - 5, 180, sectionHeight, 'S');
}

function addCustomerAnalyticsToPDF(doc, yPosition) {
    const startY = yPosition;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Customer Analytics', 20, yPosition);
    
    const data = getCustomerAnalyticsData();
    doc.autoTable({
        head: [data[0]],
        body: data.slice(1),
        startY: yPosition + 10,
        theme: 'striped',
        styles: { fontSize: 11 },
        headStyles: { fillColor: [64, 133, 126] }
    });

    // Draw box around the section
    const sectionHeight = doc.lastAutoTable.finalY - startY + 10;
    doc.setLineWidth(0.5);
    doc.setDrawColor(64, 133, 126);
    doc.rect(15, startY - 5, 180, sectionHeight, 'S');
}

// Get current filter information
function getFilterInfo() {
    const reportType = document.getElementById('reportType')?.value || 'all';
    switch (reportType) {
        case 'daily': return 'Today';
        case 'weekly': return 'Last 7 days';
        case 'monthly': return 'Last 30 days';
        case 'yearly': return 'Last 365 days';
        case 'custom':
            const startDate = document.getElementById('startDate')?.value;
            const endDate = document.getElementById('endDate')?.value;
            return startDate && endDate ? `${startDate} to ${endDate}` : 'Custom range';
        default: return 'All time';
    }
}

// Alert function
function showAlert(message, type = 'info') {
    if (typeof Swal !== 'undefined') {
        const icon = type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info';
        Swal.fire({
            title: message,
            icon: icon,
            timer: 3000,
            toast: true,
            position: 'top-end',
            showConfirmButton: false
        });
    } else {
        alert(message);
    }
}