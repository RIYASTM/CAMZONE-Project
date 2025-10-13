let generatingReport = false

document.addEventListener('DOMContentLoaded', () => {

    const orders = JSON.parse(document.getElementById('orders').value)

    const modalOpenButton = document.querySelector('.sales-report-btn');
    const modalCloseButton1 = document.querySelector('.close-btn-sales')
    const modalCloseButton2 = document.querySelector('.close')
    const salesReportModal = document.getElementById('salesReportModal');

    function openSalesReportModal() {
        salesReportModal.classList.add('active');
        generateReport(orders)
    }

    function closeSalesReportModal() {
        salesReportModal.classList.remove('active');
    }

    if (modalOpenButton && modalCloseButton1 && modalCloseButton2) {
        modalOpenButton.addEventListener('click', openSalesReportModal);
        modalCloseButton1.addEventListener('click', closeSalesReportModal);
        modalCloseButton2.addEventListener('click', closeSalesReportModal);
    }

    // Close on click outside modal content
    salesReportModal.addEventListener('click', (e) => {
        if (e.target === salesReportModal) {
            closeSalesReportModal();
        }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && salesReportModal.classList.contains('active')) {
            closeSalesReportModal();
        }
    });

    const reportTypeSelect = document.getElementById('reportType');
    const customDateRange = document.getElementById('customDateRange');
    const reportGenerateBtn = document.querySelector('.generate-report-btn');

    if (customDateRange) customDateRange.style.display = 'none';
    if (reportGenerateBtn) reportGenerateBtn.style.display = 'none';

    if (reportTypeSelect) {
        reportTypeSelect.addEventListener('change', () => {
            const isCustom = reportTypeSelect.value === 'custom'

            if (!isCustom) {
                setTimeout(async () => {
                    await generateReport(orders)
                }, 1000)
            } else {
                if (customDateRange) customDateRange.style.display = 'block';
                if (reportGenerateBtn) reportGenerateBtn.style.display = 'block';
                reportGenerateBtn.addEventListener('click', async () => {
                    let success = await generateReport(orders)
                    if (success) {
                        reportGenerateBtn.textContent = 'Generating...'
                        reportGenerateBtn.disabled = true
                        setTimeout(() => {
                            reportGenerateBtn.disabled = false
                            reportGenerateBtn.innerHTML = `<i class="fa-solid fa-chart-line"></i> Generate Report`
                        }, 2500)
                    } else {
                        reportGenerateBtn.disabled = false
                        reportGenerateBtn.innerHTML = `<i class="fa-solid fa-chart-line"></i> Generate Report`
                    }
                })
            }
        })
    }

    statusFilter.addEventListener('change', applyFilters);
    paymentFilter.addEventListener('change', applyFilters);
    couponFilter.addEventListener('change', applyFilters);

    const exportPdfBtn = document.getElementById('exportPdf');
    const exportExcelBtn = document.getElementById('exportExcel')

    exportPdfBtn.addEventListener('click', () => {
        generatePdfReport()
        exportPdfBtn.disabled = true
        setTimeout(() => {
            exportPdfBtn.disabled = false
        }, 2500)
    })
    exportExcelBtn.addEventListener('click', () => {
        generateExcelReport()
        exportExcelBtn.disabled = true
        setTimeout(() => {
            exportExcelBtn.disabled = false
        }, 2500)
    })

})

function updateDashboard(orders) {
    if (!orders || !Array.isArray(orders)) {
        return console.log("invalid orders...");
    }

    updateSummery(orders);
    updateTable(orders);
}

async function generateReport(orders) {
    if (generatingReport || !orders) {
        return console.log('Report is generating')
    }

    generatingReport = true

    try {

        const reportTypeSelect = document.getElementById('reportType')
        const startDateInput = document.getElementById('startDate')
        const endDateInput = document.getElementById('endDate')

        const reportType = reportTypeSelect?.value || 'all'
        const startInput = startDateInput?.value;
        const endInput = endDateInput?.value

        let startDate, endDate
        let today = new Date()

        switch (reportType) {
            case 'daily':
                startDate = new Date()
                startDate.setHours(0, 0, 0, 0)
                endDate = new Date()
                break;
            case 'weekly':
                {
                    let dayOfWeek = today.getDay();
                    let diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;

                    startDate = new Date(today);
                    startDate.setDate(today.getDate() + diffToMonday);

                    endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + 6);
                }
                break;
            case 'monthly':
                {
                    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                }
                break;
            case 'yearly':
                {
                    startDate = new Date(today.getFullYear(), 0, 1);
                    endDate = new Date(today.getFullYear(), 11, 31);
                }
                break;
            case 'custom':
                if (startInput && endInput) {
                    startDate = new Date(startInput)
                    endDate = new Date(endInput)
                    endDate.setHours(23, 59, 59, 999)

                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        console.error('Invalid dates provided');
                        showNotification('Invalid Dates', 'error');
                        return;
                    }

                    if (startDate > endDate) {
                        console.log("Start Date cannot be greater than End Date")
                        showNotification('Start should lessthan End Date..', 'error')
                        return;
                    }

                    if (startDate > today) {
                        console.log('Start date over than today!!')
                        showNotification('Start date should lessthatn today..', 'error')
                        return
                    }
                } else {
                    console.error('Custom date range requires both start and end dates')
                    showNotification('Custom date range requires both start and end dates', 'error')
                    return
                }
                break;
            case 'all':
            default:
                updateDashboard(orders)
                return true
        }

        filteredOrders = orders.filter(order => {
            if (!order.createdOn) return false;

            const orderDate = new Date(order.createdOn)
            if (isNaN(orderDate.getTime())) return false

            return orderDate >= startDate && orderDate <= endDate
        })

        updateDashboard(filteredOrders)
        return true

    } catch (error) {
        console.error('Error in generate Report : ', error);
        showNotification('Something went while Generating Report', 'error');
        return false;
    } finally {
        generatingReport = false
    }

}

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const paymentFilter = document.getElementById('paymentFilter');
    const couponFilter = document.getElementById('couponFilter');
    const salesTableBody = document.getElementById('salesTableBody');

    const statusValue = statusFilter.value.toLowerCase();
    const paymentValue = paymentFilter.value.toLowerCase();
    const couponValue = couponFilter.value.toLowerCase();
    const rows = salesTableBody.getElementsByTagName('tr');

    for (let row of rows) {
        const status = row.querySelector('td:nth-child(8)')?.textContent.trim().toLowerCase();
        const payment = row.querySelector('td:nth-child(5)')?.textContent.trim().toLowerCase();
        const coupon = row.querySelector('td:nth-child(6)')?.textContent.trim().toLowerCase();

        const statusMatch = !statusValue || status === statusValue;
        const paymentMatch = !paymentValue || payment === paymentValue;
        let couponMatch = true;
        if (couponValue === 'yes') {
            couponMatch = coupon && coupon !== 'no';
        } else if (couponValue === 'no') {
            couponMatch = !coupon || coupon === 'no';
        }

        row.style.display = (statusMatch && paymentMatch && couponMatch) ? '' : 'none';
    }
}

function updateSummery(orders) {
    if (!orders || !Array.isArray(orders)) return;

    const totalOrdersEl = document.getElementById('totalOrders')
    const totalRevenueEl = document.getElementById('totalRevenue')
    const avegOrderValEl = document.getElementById('avgOrderValue')
    const cancelledOrdersEl = document.getElementById('cancelledOrders')
    const totalCouponEl = document.getElementById('totalCouponsUsed')
    const totalCouponAmountEl = document.getElementById('totalCouponDiscount')

    const totalOrders = orders.filter(order => order.status !== 'Cancelled' && order.status !== 'Returned')
    const totalRevenue = Math.floor(totalOrders.reduce((total, order) => total + order.finalAmount, 0))
    const avgOrderValue = orders.length > 0 ? (totalRevenue / orders.length) : 0
    const cancelledOrders = orders.filter(order => order.status === 'Cancelled')
    const couponUsed = orders.filter(order => order.couponApplied)
    const totalCouponAmount = couponUsed.reduce((total, order) => total + (order.couponDiscount || 0), 0)

    totalOrdersEl.textContent = orders.length
    cancelledOrdersEl.textContent = cancelledOrders.length
    totalRevenueEl.textContent = `₹ ${totalRevenue}`
    avegOrderValEl.textContent = `₹ ${avgOrderValue.toFixed(2)}`
    totalCouponEl.textContent = couponUsed.length
    totalCouponAmountEl.textContent = `₹ ${totalCouponAmount}`

}

function updateTable(orders) {
    if (!orders || !Array.isArray(orders)) return;

    const sorted = [...orders]
        .filter(order => order && order.createdOn)
        .sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn))
        .slice(0, 20)


    const tableBody = document.getElementById('salesTableBody')

    tableBody.innerHTML = sorted.map(order => {

        const date = new Date(order.createdOn).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })

        const orderId = order.orderId || 'N/A';
        const customerName = order.address?.name || 'N/A';
        const products = order.orderedItems?.length > 1
            ? `${order.orderedItems[0]?.product?.productName.slice(0, 17)} & ${order.orderedItems.length - 1} more...`
            : order.orderedItems?.[0]?.product?.productName || "No Products";
        const couponApplied = order.couponApplied ? '₹ ' + order.couponDiscount.toLocaleString('en-IN') : 'No'
        const totalDiscount = order.discount ? order.discount : 0
        const paymentMethod = order.paymentMethod || 'Unknown';
        const status = order.status || 'Unknown';
        const amount = order.finalAmount || 0;

        return `
            <tr>
                <td>${orderId}</td>
                <td>${date}</th>
                <td>${customerName}</th>
                <td>${products}</th>
                <td>${paymentMethod}</th>
                <td>${couponApplied}</th>
                <td>₹ ${totalDiscount.toLocaleString('en-IN')}</th>
                <td>${status}</th>
                <td>₹ ${amount.toLocaleString('en-IN')}</th>
            </tr>
        `;
    }).join('');
}

// Utility function to format currency in Indian format
function formatIndianCurrency(amount) {
    return `Rs. ${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Utility function to get detailed product list
function getDetailedProductList(orderedItems) {
    if (!orderedItems || !Array.isArray(orderedItems)) return "No Products";

    return orderedItems.map(item => {
        const productName = item.product?.productName || 'Unknown Product';
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        return `${productName}
        (Qty: ${quantity}, Price: Rs. ${price.toLocaleString('en-IN')})`;
    }).join('\n');
}

// Show notification function
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

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

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function generatePdfReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    // Get current date and report type
    const currentDate = new Date().toLocaleDateString('en-IN');
    const reportType = document.getElementById('reportType')?.value || 'all';

    let reportLabel = "";
    let startDate, endDate;
    const today = new Date();

    switch (reportType) {
        case "daily":
            startDate = new Date(today);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today);
            reportLabel = `${startDate.toLocaleDateString('en-IN')}`;
            break;

        case "weekly":
            {
                const dayOfWeek = today.getDay();
                const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
                startDate = new Date(today);
                startDate.setDate(today.getDate() + diffToMonday);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                reportLabel = `${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')}`;
            }
            break;

        case "monthly":
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            const monthName = startDate.toLocaleString('en-US', { month: 'long' });
            reportLabel = `${monthName} ${today.getFullYear()} (${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')})`;
            break;

        case "yearly":
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear(), 11, 31);
            reportLabel = `${today.getFullYear()} (${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')})`;
            break;

        case "custom":
            startDate = new Date(document.getElementById('startDate')?.value);
            endDate = new Date(document.getElementById('endDate')?.value);
            reportLabel = `${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')}`;
            break;

        default:
            reportLabel = "All Reports";
            break;
    }

    // Use this in PDF


    console.log('report Type : ', reportType)
    console.log('report Laber : ', reportLabel)

    // return


    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("SALES REPORT", 120, 15);

    doc.setFontSize(12);
    doc.setFont(undefined, "normal");
    doc.text(`Report Range : ${reportLabel}`, 15, 30);
    doc.text(`Generated on : ${currentDate}`, 210, 30);

    // Summary section
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("SUMMARY", 15, 50);

    const summary = [
        { label: "Total Orders", value: document.getElementById('totalOrders').textContent },
        { label: "Total Revenue", value: document.getElementById('totalRevenue').textContent.replace('₹', 'Rs.') },
        { label: "Average Order Value", value: document.getElementById('avgOrderValue').textContent.replace('₹', 'Rs.') },
        { label: "Cancelled Orders", value: document.getElementById('cancelledOrders').textContent },
        { label: "Coupons Used", value: document.getElementById('totalCouponsUsed').textContent },
        { label: "Coupon Discount", value: document.getElementById('totalCouponDiscount').textContent.replace('₹', 'Rs.') },
    ];

    // Grid layout for summary boxes
    const boxWidth = 85;
    const boxHeight = 25;
    const startX = 15;
    const startY = 65;
    const spacing = 10;

    doc.setFont(undefined, "normal");
    doc.setFontSize(10);

    summary.forEach((item, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = startX + col * (boxWidth + spacing);
        const y = startY + row * (boxHeight + spacing);

        // Draw background & border
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'S');

        // Add label
        doc.setFont(undefined, "normal");
        doc.setFontSize(9);
        doc.text(item.label, x + 5, y + 10);

        // Add value
        doc.setFont(undefined, "bold");
        doc.setFontSize(12);
        doc.text(item.value, x + 5, y + 20);
    });

    // Orders table
    const tableStartY = startY + 2 * (boxHeight + spacing) + 20;

    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("ORDER DETAILS", 15, tableStartY - 10);

    // Collect table data
    const table = document.getElementById("salesTableBody");
    const orders = JSON.parse(document.getElementById('orders').value);

    const rows = Array.from(table.querySelectorAll("tr:not([style*='none'])")).map(tr => {
        const cells = Array.from(tr.querySelectorAll("td")).map(td => td.textContent.trim());
        const orderId = cells[0];
        const order = orders.find(o => o.orderId === orderId);

        return [
            cells[0], // Order ID
            cells[1], // Date
            cells[2], // Customer
            order ? getDetailedProductList(order.orderedItems) : cells[3], // Products
            cells[4], // Payment
            cells[5].replace('₹', 'Rs.'),
            cells[6].replace('₹', 'Rs.'),
            cells[7], // Status
            cells[8].replace('₹', 'Rs.'),
        ];
    });

    const headers = [["Order ID", "Date", "Customer", "Products (Qty, Price)", "Payment", "Coupon", "Discount", "Status", "Amount"]];

    doc.autoTable({
        startY: tableStartY,
        head: headers,
        body: rows,
        styles: {
            fontSize: 8,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [52, 73, 94],
            textColor: 255,
            fontStyle: 'bold'
        },
        columnStyles: {
            3: { cellWidth: 75 }, // fix only Products column
        },
        tableWidth: 'auto',   // let others adjust automatically
        margin: { left: 15, right: 15 },
        alternateRowStyles: { fillColor: [249, 249, 249] },
        didDrawPage: function (data) {
            const pageCount = doc.internal.getNumberOfPages();
            const pageSize = doc.internal.pageSize;
            doc.setFontSize(10);
            doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageSize.getWidth() - 40, pageSize.getHeight() - 10);
        }
    });

    // Footer
    const pageSize = doc.internal.pageSize;
    doc.setFontSize(10);
    doc.setFont(undefined, "italic");
    doc.text("Generated by Sales Management System - CAMZONE", 15, pageSize.getHeight() - 10);

    doc.save(`camzone_sales_report_${reportType}_${currentDate.replace(/\//g, '-')}.pdf`);
}

function generateExcelReport() {
    const wb = XLSX.utils.book_new();
    const currentDate = new Date().toLocaleDateString('en-IN');
    const reportType = document.getElementById('reportType')?.value || 'all';

    let reportLabel = "";
    let startDate, endDate;
    const today = new Date();

    switch (reportType) {
        case "daily":
            startDate = new Date(today);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today);
            reportLabel = `${startDate.toLocaleDateString('en-IN')}`;
            break;

        case "weekly":
            {
                const dayOfWeek = today.getDay();
                const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
                startDate = new Date(today);
                startDate.setDate(today.getDate() + diffToMonday);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                reportLabel = `${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')}`;
            }
            break;

        case "monthly":
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            const monthName = startDate.toLocaleString('en-US', { month: 'long' });
            reportLabel = `${monthName} ${today.getFullYear()} (${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')})`;
            break;

        case "yearly":
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear(), 11, 31);
            reportLabel = `${today.getFullYear()} (${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')})`;
            break;

        case "custom":
            startDate = new Date(document.getElementById('startDate')?.value);
            endDate = new Date(document.getElementById('endDate')?.value);
            reportLabel = `${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')}`;
            break;

        default:
            reportLabel = "All Reports";
            break;
    }


    // Summary Sheet
    const summaryData = [
        ['SALES REPORT SUMMARY'],
        ['Generated on:', currentDate],
        ['Report Type:', reportLabel],
        [''],
        ['Metric', 'Value'],
        ['Total Orders', document.getElementById('totalOrders').textContent],
        ['Total Revenue', document.getElementById('totalRevenue').textContent],
        ['Average Order Value', document.getElementById('avgOrderValue').textContent],
        ['Cancelled Orders', document.getElementById('cancelledOrders').textContent],
        ['Coupons Used', document.getElementById('totalCouponsUsed').textContent],
        ['Total Coupon Discount', document.getElementById('totalCouponDiscount').textContent],
    ];

    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);

    // Style the summary sheet
    summaryWS['!cols'] = [{ wch: 25 }, { wch: 20 }];

    // Orders Sheet with detailed information
    const table = document.getElementById("salesTableBody");
    const orders = JSON.parse(document.getElementById('orders').value);

    const headers = ["Order ID", "Date", "Customer Name", "Customer Email", "Customer Phone", "Address", "Products Details", "Payment Method", "Coupon Applied", "Coupon Discount", "Other Discount", "Status", "Final Amount"];

    const detailedRows = Array.from(table.querySelectorAll("tr:not([style*='none'])")).map(tr => {
        const orderId = tr.querySelector('td:nth-child(1)').textContent.trim();
        const order = orders.find(o => o.orderId === orderId);

        if (!order) return null;

        return [
            order.orderId || 'N/A',
            new Date(order.createdOn).toLocaleDateString('en-IN'),
            order.address?.name || 'N/A',
            order.address?.email || 'N/A',
            order.address?.mobile || 'N/A',
            `${order.address?.houseName || ''}, ${order.address?.area || ''}, ${order.address?.city || ''}, ${order.address?.state || ''} - ${order.address?.pincode || ''}`,
            getDetailedProductList(order.orderedItems),
            order.paymentMethod || 'Unknown',
            order.couponApplied ? 'Yes' : 'No',
            order.couponDiscount || 0,
            order.discount || 0,
            order.status || 'Unknown',
            order.finalAmount || 0
        ];
    }).filter(row => row !== null);

    const ordersData = [headers, ...detailedRows];
    const ordersWS = XLSX.utils.aoa_to_sheet(ordersData);

    // Auto-fit columns
    const maxWidths = headers.map((_, colIndex) => {
        return Math.max(
            headers[colIndex].length,
            ...detailedRows.map(row => String(row[colIndex] || '').length)
        );
    });

    ordersWS['!cols'] = maxWidths.map(w => ({ wch: Math.min(w + 2, 50) }));

    // Product Details Sheet
    const productData = [['Product Analysis'], [''], ['Product Name', 'Total Quantity Sold', 'Total Revenue', 'Orders Count']];

    const productStats = {};
    orders.forEach(order => {
        if (order.orderedItems && Array.isArray(order.orderedItems)) {
            order.orderedItems.forEach(item => {
                const productName = item.product?.productName || 'Unknown Product';
                const quantity = item.quantity || 0;
                const revenue = (item.price || 0) * quantity;

                if (!productStats[productName]) {
                    productStats[productName] = { quantity: 0, revenue: 0, orders: 0 };
                }

                productStats[productName].quantity += quantity;
                productStats[productName].revenue += revenue;
                productStats[productName].orders += 1;
            });
        }
    });

    Object.entries(productStats).forEach(([productName, stats]) => {
        productData.push([productName, stats.quantity, stats.revenue, stats.orders]);
    });

    const productWS = XLSX.utils.aoa_to_sheet(productData);
    productWS['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

    // Add all sheets to workbook
    XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");
    XLSX.utils.book_append_sheet(wb, ordersWS, "Detailed Orders");
    XLSX.utils.book_append_sheet(wb, productWS, "Product Analysis");

    // Save file
    XLSX.writeFile(wb, `camzone_sales_report_detailed_${reportType}_${currentDate.replace(/\//g, '-')}.xlsx`);
}