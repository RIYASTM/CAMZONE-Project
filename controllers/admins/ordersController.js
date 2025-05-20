const Order = require("../../model/orderModel");



const loadOrders = async (req,res) => {
    try {

        // const orders = [  
        //     { item: 'RF70-200mm f2.8L IS USM Z', customer: 'Anoop M', date: '2025-01-31', total: '₹95,992', method: 'Cash on delivery', status: 'Processing' },
        //     { item: 'EOS R6 Mark II', customer: 'Alex John', date: '2025-01-23', total: '₹17,995', method: 'UPI', status: 'Shipped' },
        //     { item: 'CANON EOS R5 MARK II', customer: 'Fulana Begam', date: '2025-01-18', total: '₹5,995', method: 'Cash on delivery', status: 'Delivered' },
        //     { item: 'CANON EOS R5 MARK II', customer: 'Shefin N', date: '2025-01-18', total: '₹5,995', method: 'Debit/Credit Card', status: 'Cancelled' },
        //     { item: 'Alfa 9 III', customer: 'Kabeer', date: '2025-01-15', total: '₹10,992', method: 'Net Banking', status: 'Delivered' }
        // ];
        
        const orders = await Order.find().populate("orderedItems.product")


        
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

const updateStatus = async (req,res) => {
    try {
        
        // const {status , orderId} = req.body

        // console.log(`Order Id : ${orderId}, New Status : ${status}`)

        // const order = await Order.findOneAndUpdate({ _id : orderId},{$set : { status }})

        // if(!order){
        //     return res.status(401).json({ success : false , message : 'Status updating failed!!'})
        // }

        // console.log('Updating order : ',order)

        // return res.satus(200).json({ success : true , message : 'Staus updated!!'})

        const { orderId, status } = req.body;
        await Order.findByIdAndUpdate(orderId, { status });

        return res.json({ success: true });

    } catch (error) {
         console.error('Update status error:', error);
        return res.json({ success: false, message: 'Internal server error' });
    }
}


module.exports = {
    loadOrders,
    updateStatus
}