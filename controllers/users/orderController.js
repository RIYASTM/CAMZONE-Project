const User = require("../../model/userModel")
const Order = require('../../model/orderModel')
const Products = require('../../model/productModel')
const Cart = require('../../model/cartModel')
const { search } = require("../../routes/userRouter")

const {addToWallet} = require('../../helpers/wallet')
const {cancelItem,orderCancel} = require('../../helpers/orderCancelling')


const loadOrderSuccess = async (req,res) => { 
    try {

        const search = req.query.search || ''

        const userId = req.session.user

        if(!userId){
            return res.status(401).json({ success :false , message : 'User not authenticated!'})
        }

        const user = await User.findById(userId)

        if(!user){
            return res.status(401).json({ success : false , message : 'User not found!'})
        }

        const orderId = req.session.orderId

        const userOrder = await Order.findOne({orderId})
             .populate("orderedItems.product")
        // console.log('Order : ', userOrder)

        if(!userOrder){
            return res.status(401).json({ success : false , message : 'Order not found!'})
        }
        
        console.log("Order ID from session:", orderId);

        return res.render('orderSuccess',{
            order : userOrder,
            search,
            currentPage : 'orderSuccess'
        })

    } catch (error) {
        console.log('Failed to render success : ',error )
    }
}

const loadMyOrders = async (req,res) => {
    try {

        const search = req.query.search || ''

        const page = parseInt(req.query.page) || 1
        const limit = 6
        const skip = (page -1) * limit
        const totalOrders = await Order.find().countDocuments()
        totalPages = Math.ceil(totalOrders / limit)
        
        const userId = req.session.user
        const usermail = req.session.usermail;
        
        const user = await User.findById(userId)
        const cart = await Cart.findOne({userId})

        const userOrders = await Order.find({userId})
                                        .sort({createdOn : -1})
                                        .skip(skip)
                                        .limit(limit)
                                        .populate("orderedItems.product")

        // console.log('User Orders : ', userOrders)

        return res.render('myOrders',{
            orders : userOrders,
            search,
            cart ,
            user ,
            currentPage : 'myOrders',
            currentPages : page,
            totalPages
        })

    } catch (error) {
        console.log('Error while load my Order page : ', error)
    }
}

const loadOrderDetails = async (req,res) => {

    try {

        const userId = req.session.user
        const usermail = req.session.usermail;
        
        const user = await User.findById(userId);
        const cart = await Cart.findOne({userId})

        const search = req.query.search || ''
        
        if(!userId){
            return res.status(401).json({ success : false , message : 'User not authenticated!'})
        }
        
        const userOrders = await Order.find({userId}).populate("orderedItems.product")
        
        if(!userOrders){
            return res.status(401).json({ success : false , message : 'User Orders not found!!'})
        }

        const orderId = req.query.id

        const order = await Order.findById(orderId).populate("orderedItems.product")

        // console.log('selected order : ',order)

        return res.render('orderDetails',{
            order ,
            search,
            user,
            cart,
            currentPage : 'orderDetails'
        })



    } catch (error) {
        console.log('failed to load the order details : ', error)
        return res.status(500).json({ success : false , message : 'An error occurred while loading the order details!!'})        
    }
}

const loadOrderCancelled = async (req,res) => {}

const loadOrderPending = async (req,res) => {}

const loadOrderDelivered = async (req,res) => {}

const loadOrderReturned = async (req,res) => {}

const cancelOrder = async (req, res) => {
    try {
        const { reason, items, orderId } = req.body;
        const userId = req.session.user;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        if (!['Pending', 'Processing', 'Shipped', 'Out of Delivery'].includes(order.status)) {
            return res.status(400).json({ success: false, message: 'Order cannot be cancelled anymore.' });
        }

        const cancelItemIds = items.map(id => id.toString());
        const orderedProductIds = order.orderedItems.map(item => String(item.product));

        const cancelItems = order.orderedItems.filter(item =>
            cancelItemIds.includes(String(item.product))
        );

        const isFullCancellation =
            orderedProductIds.length === cancelItemIds.length &&
            cancelItemIds.every(id => orderedProductIds.includes(id));

        let {refundAmount , refundReason} =  cancelItem(cancelItems , reason)


        const allCancelled = order.orderedItems.every(item => item.itemStatus === 'Cancelled');
        
       

        if (isFullCancellation || allCancelled) {   
            ({refundAmount,refundReason} = orderCancel(order, reason))
        }

        order.totalPrice -= refundAmount
        
        await order.save();

        
        if (['Razorpay', 'Wallet'].includes(order.paymentMethod)) {
            console.log('userID : ', userId)
            await addToWallet(userId, refundAmount, refundReason);
        }

        for (let item of cancelItems) {
            const product = await Products.findById(item.product);
            if (product) {
                product.quantity += item.quantity;
                await product.save();
            }
        }

        

        return res.status(200).json({
            success: true,
            message: isFullCancellation
                ? 'Order successfully cancelled.'
                : 'Selected item(s) cancelled successfully.'
        });

    } catch (error) {
        console.error('Cancel Order Error:', error);
        return res.status(500).json({ success: false, message: 'Server error during cancellation.' });
    }
};



const returnRequest = async (req,res) => {
    try {

        const {orderId , reason , items} = req.body

         const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found...' });
        }

        if (order.status !== 'Delivered') {
            return res.status(400).json({ success: false, message: 'This order cannot be cancelled anymore.' });
        }

        const returnItemIds = items.map(id => id.toString());
        const orderedProducts = order.orderedItems.map(item => item.product.toString());

        const returnItems = order.orderedItems.filter(item =>
            returnItemIds.includes(item.product.toString())
        );

        let refundAmount

        const isFullReturn = 
            orderedProducts.length === returnItemIds.length &&
            returnItemIds.every(id => orderedProducts.includes(id));

        if (isFullReturn) {
            order.status = 'Return Request';
            order.reason = reason
            order.orderedItems.forEach(item => {
                item.itemStatus = 'Return Request';
            });
        } else {
            returnItems.forEach(item => {
                item.itemStatus = 'Return Request';
                item.reason = reason
            });
        }

        await order.save();


        return res.status(200).json({
            success: true,
            message: isFullReturn
                ? 'Successfully requested for Return Order.'
                : 'Successfully requested for Return Ordered Items.'
        });

        
    } catch (error) {
        console.error('Return Order Error:', error);
        return res.status(500).json({ success: false, message: 'Server error during return request.' });
    }
}

module.exports = {
    loadOrderSuccess,
    loadMyOrders,
    loadOrderDetails,
    loadOrderCancelled,
    loadOrderDelivered,
    loadOrderPending,
    loadOrderReturned,
    cancelOrder,
    returnRequest
}