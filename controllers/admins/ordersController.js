const { options } = require("sanitize-html");
const Order = require("../../model/orderModel");
const Product = require('../../model/productModel')
const {addToWallet} = require('../../helpers/user/wallet')



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
      item.itemStatus = status;
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

const returnRequest = async (req, res) => {
    try {
        const { orderId, productId, status, reason } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found...' });
        }

        const productIds = Array.isArray(productId) ? productId.map(id => id.toString()) : [productId.toString()];
        const products = order.orderedItems.map(item => item.product.toString());

        const returnItems = order.orderedItems.filter(item =>
            productIds.includes(item.product.toString())
        );

        const isFullReturn = products.length === productIds.length &&
            productIds.every(id => products.includes(id));

        const isFullRetured = order.orderedItems.every(item => item.itemStatus === 'Returned')

        let refundAmount = 0

        if (returnItems && returnItems.length > 0) {
            if (isFullReturn || isFullRetured) {
                order.status = status;
                order.reason = reason;
                order.orderedItems.forEach(item => {
                    item.itemStatus = status;
                    item.reason = reason;
                    order.totalPrice -= item.price * item.quantity;
                    refundAmount += item.price * item.quantity
                });
            } else {
                returnItems.forEach(item => {
                    item.itemStatus = status;
                    item.reason = reason;
                    order.totalPrice -= item.price * item.quantity;
                    refundAmount += item.price * item.quantity
                });
            }

            for (let item of returnItems) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.quantity += item.quantity;
                    await product.save();
                }
            }

            await order.save();

            const refundReason = 'Refund for Returned Item(s)';

            const userId = order.userId
            console.log('userId : ', userId)

            if (status === 'Returned' && refundAmount > 0) {
                console.log('hi')
                await addToWallet(userId, refundAmount, refundReason);
            }

            const message = status !== 'Returned'
                ? 'Return request rejected.'
                : isFullReturn
                    ? 'Order returned successfully.'
                    : 'Selected items returned successfully.';

            return res.status(200).json({ success: true, message });

        } else {
            order.status = status;
            order.reason = reason;
            order.orderedItems.forEach(item => {
                item.itemStatus = status;
                item.reason = reason;
            });

            // await order.save();

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
    returnRequest
}