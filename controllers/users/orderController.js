const User = require("../../model/userModel")
const Order = require('../../model/orderModel')
const Products = require('../../model/productModel')
const Cart = require('../../model/cartModel')
const Coupon = require('../../model/couponModel')
const mongoose = require('mongoose')

const { addToWallet } = require('../../helpers/wallet')
const { cancelItem, orderCancel } = require('../../helpers/orderCancelling')
const { handleStatus } = require("../../helpers/status")


const loadOrderSuccess = async (req, res) => {
    try {

        const search = req.query.search || ''
        const userId = req.session.user
        const orderId = req.session.orderId

        if (!req.session.orderSuccess || req.session.orderSuccess === false) {
            return handleStatus(res, 402, 'There is not orders!');
        }

        const [user, userOrder] = await Promise.all([
            User.findById(userId),
            Order.findOne({ orderId })
                .populate('orderedItems.product')
        ]);

        if (!user) {
            return handleStatus(res, 401, 'User not found!!');
        }

        if (!userOrder) {
            return handleStatus(res, 401, 'Order not found!!');
        }

        if (req.session.orderSuccess = true) {
            res.render('orderSuccess', {
                order: userOrder,
                search,
                currentPage: 'orderSuccess'
            })
            return req.session.orderSuccess = false
        }

        return handleStatus(res, 402, 'Order not success');
    } catch (error) {
        console.log('Failed to render success : ', error)
        return handleStatus(res, 500);
    }
}

const loadMyOrders = async (req, res) => {
    try {

        const search = req.query.search || ''
        const userId = req.session.user

        const page = parseInt(req.query.page) || 1
        const limit = 6
        const skip = (page - 1) * limit

        const [user, cart, userOrders, totalOrders] = await Promise.all([
            User.findById(userId),
            Cart.findOne({ userId }),
            Order.find({ userId })
                .sort({ createdOn: -1 })
                .skip(skip)
                .limit(limit)
                .populate("orderedItems.product"),
            Order.find().countDocuments(),
            Order.updateMany(
                { expiresAt: { $lt: new Date() } },
                {
                    $set: {
                        status: 'Cancelled',
                        reason: 'Order Expired',
                        'orderedItems.$[].status': 'Cancelled',
                        'orderedItems.$[].reason': 'Order Expired'
                    }
                }
            )
        ])

        totalPages = Math.ceil(totalOrders / limit)

        return res.render('myOrders', {
            orders: userOrders,
            search,
            cart,
            user,
            currentPage: 'myOrders',
            currentPages: page,
            totalPages
        })

    } catch (error) {
        console.log('Error while load my Order page : ', error)
        return handleStatus(res, 500);
    }
}

const loadOrderDetails = async (req, res) => {
    try {

        const search = req.query.search || ''
        const userId = req.session.user

        const [user, cart, userOrders] = await Promise.all([
            User.findById(userId),
            Cart.findOne({ userId }),
            Order.find({ userId }).populate("orderedItems.product"),
            Order.updateMany(
                { expiresAt: { $lt: new Date() } },
                {
                    $set: {
                        status: 'Cancelled',
                        reason: 'Order Expired',
                        'orderedItems.$[].status': 'Cancelled',
                        'orderedItems.$[].reason': 'Order Expired'
                    }
                }
            )
        ])

        if (!userOrders) {
            return handleStatus(res, 401, 'User order not found!!')
        }

        const orderId = req.query.id

        let query = orderId

        if (mongoose.Types.ObjectId.isValid(orderId)) {
            query = { $or: [{ _id: orderId }, { orderId: orderId }] };
        } else {
            query = { orderId }
        }

        const order = await Order.findOne(query).populate("orderedItems.product");

        const isUser = order.userId.toString() === userId.toString()

        const totalOrderAmount = order.orderedItems.reduce((total, item) => total + item.price, 0)

        let finalAmount = order.shipping ? order.shipping + finalAmount : finalAmount

        if (!isUser) {
            return handleStatus(res, 401, 'Wrong order detailes!!');
        }

        return res.render('orderDetails', {
            order,
            search,
            user,
            cart,
            finalAmount,
            currentPage: 'orderDetails'
        })
    } catch (error) {
        console.log('failed to load the order details : ', error)
        return handleStatus(res, 500);
    }
}

const cancelOrder = async (req, res) => {
    try {
        const { reason, items, orderId } = req.body;
        const userId = req.session.user;

        const order = await Order.findById(orderId);
        if (!order) {
            return handleStatus(res, 404, 'Order not found!');
        }

        if (!['Confirmed', 'Pending', 'Processing', 'Shipped', 'Out of Delivery', 'Payment Failed'].includes(order.status)) {
            return handleStatus(res, 400, 'Your order cannot be canelled!!');
        }

        const cancelItemIds = items.map(id => id.toString());
        const orderedProductIds = order.orderedItems.map(item => String(item.product));

        const cancelItems = order.orderedItems.filter(item =>
            !['Cancelled', 'Return Request', 'Returned'].includes(item.itemStatus) &&
            cancelItemIds.includes(String(item.product))
        );
        if (!cancelItems.length) {
            return handleStatus(res, 400, 'No cancellable items found!!');
        }

        const isFullCancellation =
            orderedProductIds.length === cancelItemIds.length &&
            cancelItemIds.every(id => orderedProductIds.includes(id));

        let refundAmount = 0
        let refundReason = ''

        const allCancelled = order.orderedItems.every(item => item.itemStatus === 'Cancelled');

        if (isFullCancellation || allCancelled) {
            ({ refundAmount, refundReason } = orderCancel(order, reason))
        } else {
            ({ refundAmount, refundReason } = cancelItem(cancelItems, reason))
        }

        let finalPrice = order.finalAmount - refundAmount
        order.finalAmount -= refundAmount

        if (order.couponApplied && order.finalAmount > 0) {
            const couponCode = order.couponCode || ''
            const coupon = couponCode ? await Coupon.findOne({ couponCode }) : ''
            finalPrice += order.couponDiscount
            if (finalPrice < coupon.minOrder) {
                refundAmount -= coupon.discount
                order.finalAmount += coupon.discount
                order.couponApplied = false
            }
        }

        await order.save();

        if (['Razorpay', 'Wallet'].includes(order.paymentMethod) && (order.status === 'Confirmed' || order.paymentStatus === 'Paid')) {
            await addToWallet(userId, refundAmount, refundReason);
        }

        for (let item of cancelItems) {
            const product = await Products.findById(item.product);
            if (product) {
                product.quantity += item.quantity;
                await product.save();
            }
        }

        return handleStatus(res, 200, isFullCancellation
            ? 'Order successfully cancelled.'
            : 'Selected item(s) cancelled successfully.')
    } catch (error) {
        console.error('Cancel Order Error:', error);
        return handleStatus(res, 500);
    }
};

const returnRequest = async (req, res) => {
    try {

        const { orderId, reason, items } = req.body

        const order = await Order.findById(orderId);
        if (!order) {
            return handleStatus(res, 404, 'Order not found!!');
        }

        if (['Return Request', 'Returned', 'Cancelled'].includes(order.status)) {
            return handleStatus(res, 402, `This order already ${order.status}`)
        }
        if (order.status !== 'Delivered') {
            return handleStatus(res, 402, `Only delivered orders can be returned. Current status: ${order.status}`)
        }

        if (order.deliveredDate) {
            const deliveredTime = new Date(order.deliveredDate).getTime();
            const sevenDaysLater = deliveredTime + 7 * 24 * 60 * 60 * 1000;
            const now = Date.now();

            if (now > sevenDaysLater) {
                return handleStatus(res, 402, 'This order is past 7 days after delivery');
            }
        }

        const returnItemIds = items.map(id => id.toString());
        const orderedProducts = order.orderedItems.map(item => item.product.toString());

        const returnItems = order.orderedItems.filter(item =>
            returnItemIds.includes(item.product.toString())
        );

        const isFullReturn =
            orderedProducts.length === returnItemIds.length &&
            returnItemIds.every(id => orderedProducts.includes(id));

        if (isFullReturn) {
            order.status = 'Return Request';
            order.reason = reason
            order.orderedItems.forEach(item => {
                item.itemStatus = 'Return Request';
                item.reason = reason;
            });

        } else {
            returnItems.forEach(item => {
                item.itemStatus = 'Return Request';
                item.reason = reason;
            });
        }

        const everyItem = order.orderedItems.every(
            item => item.itemStatus && item.itemStatus.trim().toLowerCase() === "return request".toLowerCase().trim()
        );

        if (everyItem) {
            order.status = 'Return Request'
            order.reason = reason
        }

        await order.save();

        return handleStatus(res, 200, isFullReturn
            ? 'Successfully requested for Return Order.'
            : 'Successfully requested for Return Ordered Items.')

    } catch (error) {
        console.error('Return Order Error:', error);
        return handleStatus(res, 500)
    }
}

module.exports = {
    loadOrderSuccess,
    loadMyOrders,
    loadOrderDetails,
    cancelOrder,
    returnRequest
}