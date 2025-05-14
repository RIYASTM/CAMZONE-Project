


const loadOrders = async (req,res) => {
    try {

        const orders = [
            { item: 'RF70-200mm f2.8L IS USM Z', customer: 'Anoop M', date: '2025-01-31', total: '₹95,992', method: 'Cash on delivery', status: 'Processing' },
            { item: 'EOS R6 Mark II', customer: 'Alex John', date: '2025-01-23', total: '₹17,995', method: 'UPI', status: 'Shipped' },
            { item: 'CANON EOS R5 MARK II', customer: 'Fulana Begam', date: '2025-01-18', total: '₹5,995', method: 'Cash on delivery', status: 'Delivered' },
            { item: 'CANON EOS R5 MARK II', customer: 'Shefin N', date: '2025-01-18', total: '₹5,995', method: 'Debit/Credit Card', status: 'Cancelled' },
            { item: 'Alfa 9 III', customer: 'Kabeer', date: '2025-01-15', total: '₹10,992', method: 'Net Banking', status: 'Delivered' }
        ];

        return res.render('orders',{
            pageTitle : 'All Orders',
            currentPage:'orders',
            orders: orders,
            currentPages : 1,
            totalPages : 10,
            iconClass: 'fa-shopping-cart'
        })
    } catch (error) {
        
        console.log('======================================');
        console.log('failed to load orders',error);
        console.log('======================================');
        res.status(500).send("Server Error")
    }
}


module.exports = {
    loadOrders
}