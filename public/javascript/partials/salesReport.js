


document.addEventListener('DOMContentLoaded', () => {

    const orders = JSON.parse(document.getElementById('salesReportData').value);

    const totalOrders = orders.length;

    const totalRevenue = orders.reduce((sum, order) => sum + order.finalAmount, 0);

    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

    console.log('total Orders : ', totalOrders)
    console.log('total Revenue : ', totalRevenue)
    console.log('average Order : ', avgOrderValue)


    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('totalRevenue').textContent = `₹${totalRevenue.toFixed(2)}`;
    document.getElementById('avgOrderValue').textContent = `₹${avgOrderValue.toFixed(2)}`;

    const growthRate = 12.3; // You can make this dynamic later

    document.getElementById('growthRate').textContent = `${growthRate.toFixed(1)}%`

    // Group orders by date
    const dailySales = {};

    orders.forEach(order => {
        const date = new Date(order.createdAt).toISOString().split('T')[0]; // yyyy-mm-dd
        if (!dailySales[date]) dailySales[date] = 0;
        dailySales[date] += order.finalAmount || 0;
    });

    // Prepare data for chart
    const labels = Object.keys(dailySales).sort();
    const data = labels.map(date => dailySales[date]);

    const ctx = document.getElementById('salesTrendChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Revenue',
                data,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                title: { display: true, text: 'Daily Revenue Trend' }
            }
        }
    });



    // const productSalesMap = {};

    // orders.forEach(order => {
    // order.items.forEach(item => {
    //     const { productName, quantity, price } = item;
    //     if (!productSalesMap[productName]) {
    //     productSalesMap[productName] = { quantity: 0, revenue: 0 };
    //     }
    //     productSalesMap[productName].quantity += quantity;
    //     productSalesMap[productName].revenue += quantity * price;
    // });
    // });

    // const sortedProducts = Object.entries(productSalesMap)
    // .sort((a, b) => b[1].quantity - a[1].quantity)
    // .slice(0, 5);

    // const topProductsTable = document.getElementById('topProductsTable');
    // topProductsTable.innerHTML = '';

    // sortedProducts.forEach(([name, stats], index) => {
    //     topProductsTable.innerHTML += `
    //         <tr>
    //         <td>${index + 1}</td>
    //         <td>${name}</td>
    //         <td>${stats.quantity}</td>
    //         <td>₹${stats.revenue.toFixed(2)}</td>
    //         <td>--</td>
    //         </tr>
    //     `;
    // });




})

function generateSalesReport() {
    // Add your API call to generate report data
    console.log('Generating sales report...');
}

function exportReport(format) {
    // Add export functionality
    console.log(`Exporting report as ${format}`);
}

function printReport() {
    window.print();
}