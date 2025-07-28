const { options } = require("sanitize-html");
const Order = require("../../model/orderModel");
const Product = require('../../model/productModel')

const {returnItem,orderReturn} = require('../../helpers/orderReturn')
const {addToWallet} = require('../../helpers/wallet')



const loadOrders = async (req,res) => {
    try {

        const search = req.query.search || ''
        if (search) {
            console.log( 'Searched value in orders : ' , search)
        }

        const page = parseInt(req.query.page) || 1
        const limit = 10
        const skip = (page - 1 ) * limit

        const products = await Product.find()
                
        const orders = await Order.find({
            $or: [
                { orderId: { $regex: search, $options: 'i' } },
                { 'address.name': { $regex: search, $options: 'i' } }
            ]
            })
            .populate('orderedItems.product')
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit)

            const totalOrders = await Order.countDocuments({
            $or: [
                { orderId: { $regex: search, $options: 'i' } },
                { 'address.name': { $regex: search, $options: 'i' } }
            ]
            })

        const totalPages = Math.ceil(totalOrders / limit)

        
        return res.render('orders',{
            search,
            pageTitle : 'All Orders',
            currentPage:'orders',
            orders: orders,
            currentPages : page,
            totalPages ,
            iconClass: 'fa-shopping-cart'
        })
    } catch (error) {
        
        console.log('======================================');
        console.log('failed to load orders',error);
        console.log('======================================');
        res.status(500).send("Server Error")
    }
}

const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;

    order.orderedItems.forEach(item => {
        if (!['Cancelled', 'Return Request', 'Returned'].includes(item.itemStatus)) {
            item.itemStatus = status;
        }
    });

    await order.save();

    return res.status(200).json({ success: true, message: 'Status updated successfully' });

  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const currentOrder = async (req,res) => {
    try {
        
        const {orderId} = req.body

        const order = await Order.findById(orderId).populate('orderedItems.product')

        if(!order){
            return res.status(404).json({success : false, message : 'Order Not found...'})
        }

        return res.status(200).json({success : true , message : 'Order found...', order})

    } catch (error) {
        console.log('Some thing went wrong : ', error)
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

const returnOrder = async (req, res) => {
    try { 
        const { orderId, productId, newStatus, reason } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found...' });
        }

        console.log('order found ')

        const productIds = Array.isArray(productId) ? productId.map(id => id.toString()) : [productId.toString()];
        console.log('productIds found')
        const products = order.orderedItems.map(item => item.product.toString());
        console.log('products found')

        const returnItems = order.orderedItems.filter(item =>
            productIds.includes(item.product.toString())
        );
        console.log('returnItems found')

        const isFullReturn = products.length === productIds.length &&
            productIds.every(id => products.includes(id));

        console.log('isFullReturn found', isFullReturn)
            
            
        if (returnItems && returnItems.length > 0) {
                
            let { refundAmount, refundReason } = returnItem(returnItems, reason, newStatus)

            const isFullReturned = order.orderedItems.every(item => item.itemStatus === 'Returned')

            console.log('isFullReturned', isFullReturned)
            
            if (isFullReturn || isFullReturned) {
                ({ refundAmount, refundReason } = orderReturn(order, reason, newStatus))
            } 

            for (let item of returnItems) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.quantity += item.quantity;
                    console.log('quantity changed')
                    await product.save();
                }
            }

            await order.save();
            console.log('order saved')

            
            if (newStatus === 'Returned' && refundAmount > 0) {
                const userId = order.userId
                console.log('userId : ', userId)
                await addToWallet(userId, refundAmount, refundReason);
                console.log('added to wallet')
            }

            const message = newStatus !== 'Returned'
                ? 'Return request rejected.'
                : isFullReturn
                    ? 'Order returned successfully.'
                    : 'Selected items returned successfully.';

            return res.status(200).json({ success: true, message });

        } else {
            order.status = newStatus;
            order.reason = reason;
            order.orderedItems.forEach(item => {
                item.itemStatus = newStatus;
                item.reason = reason;
            });

            await order.save();

            return res.status(200).json({ success: true, message: 'Order updated with return status.' });
        }

    } catch (error) {
        console.log('Error in returnRequest:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


module.exports = {
    loadOrders,
    currentOrder,
    updateStatus,
    returnOrder
}