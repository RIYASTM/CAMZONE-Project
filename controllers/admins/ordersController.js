const { options } = require("sanitize-html");
const Order = require("../../model/orderModel");
const Product = require('../../model/productModel')
const Coupon = require('../../model/couponModel')

const { returnItem, orderReturn } = require('../../helpers/orderReturn')
const { addToWallet } = require('../../helpers/wallet')



const loadOrders = async (req, res) => {
    try {

        const { search = '', sort = 'all', filter = 'all', page = 1 } = req.query;

        const limit = 8
        const skip = (page - 1) * limit

        let query = {};

        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { 'address.name': { $regex: search, $options: 'i' } },
                !isNaN(search) ? { finalAmount: Number(search) } : null,
                { paymentMethod: { $regex: search, $options: 'i' } }
            ].filter(Boolean);
        }


        if (filter && filter !== 'all') {
            console.log('status : ', filter)
            query.status = filter
        }

        let sortOption;

        switch (sort) {
            case 'all':
                sortOption = { createdOn: -1 };
                break;
            case 'date':
                sortOption = { createdOn: 1 };
                break;
            case 'total':
                sortOption = { finalAmount: -1 };
                break;
            case 'name':
                sortOption = { 'address.name': 1 };
                break;
            default:
                sortOption = { createdOn: -1 };
        }

        const products = await Product.find()

        const orders = await Order.find(query)
            .populate('orderedItems.product')
            .sort(sortOption)
            .collation({ locale: "en", strength: 1 })
            .skip(skip)
            .limit(limit)

        await Order.updateMany(
            { expiresAt: { $lt: new Date() } },
            {
                $set: {
                    status: 'Cancelled',
                    reason: 'Order Expired',
                    'orderedItems.$[].status': 'Cancelled',
                    'orderedItems.$[].reason': 'Order Expired'
                }
            }
        );

        const totalOrders = await Order.countDocuments(query)

        const totalPages = Math.ceil(totalOrders / limit)

        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({
                success: true,
                orders,
                currentPages: parseInt(page),
                totalPages,
                search,
                sort,
                filter
            });
        }

        return res.render('orders', {
            search,
            pageTitle: 'All Orders',
            currentPage: 'orders',
            orders: orders,
            currentPages: page,
            totalPages,
            iconClass: 'fa-shopping-cart',
            sort,
            filter
        })
    } catch (error) {

        console.log('======================================');
        console.log('failed to load orders', error);
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

        if (['Cancelled', 'Returned'].includes(order.status)) {
            return res.status(401).json({ success: false, message: `This order is already ${order.status}` })
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

const currentOrder = async (req, res) => {
    try {

        const { orderId } = req.body

        const order = await Order.findById(orderId).populate('orderedItems.product')

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order Not found...' })
        }

        return res.status(200).json({ success: true, message: 'Order found...', order })

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

        if (order.status === 'Returned') {
            return res.status(401).json({ success: false, message: 'This order already returned...' })
        }

        const productIds = Array.isArray(productId) ? productId.map(id => id.toString()) : [productId.toString()];
        const products = order.orderedItems.map(item => item.product.toString());

        const returnItems = order.orderedItems.filter(item =>
            productIds.includes(item.product.toString())
        );

        const alreadyReturned = returnItems.some(item => item.itemStatus === 'Returned')

        if (alreadyReturned) {
            return res.status(401).json({ success: false, message: 'This items is already returned...' })
        }

        const isFullReturn = products.length === productIds.length &&
            productIds.every(id => products.includes(id));

        if (returnItems && returnItems.length > 0) {

            let { refundAmount, refundReason } = returnItem(returnItems, reason, newStatus)

            const isFullReturned = order.orderedItems.every(item => item.itemStatus === 'Returned')

            if (isFullReturn || isFullReturned) {
                ({ refundAmount, refundReason } = orderReturn(order, reason, newStatus))
            }

            const bulkOps = returnItems.map(item => ({
                updateOne: {
                    filter: { _id: item.product },
                    update: { $inc: { quantity: item.quantity } }
                }
            }));

            await Product.bulkWrite(bulkOps);


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


            if (newStatus === 'Returned' && refundAmount > 0) {
                const userId = order.userId
                await addToWallet(userId, refundAmount, refundReason);
            }

            const message = newStatus !== 'Returned'
                ? 'Return request rejected.'
                : isFullReturn
                    ? 'Order returned successfully.'
                    : 'Selected items returned successfully.';

            return res.status(200).json({ success: true, message });

        } else {

            let { refundAmount, refundReason } = orderReturn(order, reason, newStatus)

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

            if (newStatus === 'Returned' && refundAmount > 0) {
                const userId = order.userId
                await addToWallet(userId, refundAmount, refundReason);
            }

            const bulkOps = returnItems.map(item => ({
                updateOne: {
                    filter: { _id: item.product },
                    update: { $inc: { quantity: item.quantity } }
                }
            }));
            await Product.bulkWrite(bulkOps);


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