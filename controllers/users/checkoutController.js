require('dotenv').config();

const crypto = require('crypto');

const Cart = require('../../model/cartModel');
const User = require('../../model/userModel');
const Order = require('../../model/orderModel');
const Coupon = require('../../model/couponModel');
const Wallet = require('../../model/walletModal');
const Address = require('../../model/addressModel');
const Products = require('../../model/productModel');

const { fromWallet } = require('../../helpers/wallet');
const { handleStatus } = require('../../helpers/status');
const { createOrderId } = require('../../helpers/orderId');
const { confirmOrder } = require('../../helpers/conformOrder');
const { validateAddress } = require('../../helpers/validations');
const { calculateAmounts } = require('../../helpers/productOffer');
const { updateInventory } = require('../../helpers/updateInventory');
const { generateRazorpayCheckout } = require('../../helpers/razorpay');
const { couponUpdate } = require('../../helpers/couponUpdate');


const loadCheckout = async (req, res) => {
    try {
        const search = req.query.search || '';
        const userId = req.session.user;

        req.session.appliedCoupon = null;

        const [coupons, user, addressDoc, cart] = await Promise.all([
            Coupon.find({ isList: true }) || [],
            User.findById(userId),
            Address.findOne({ userId }),
            Cart.findOne({ userId }).populate('items.productId')
        ]);

        await Promise.all(coupons.map(async coupon => {
            const now = new Date();
            if (coupon.couponLimit === 0) {
                coupon.status = 'Unavailable';
            } else {
                const expiryDate = new Date(coupon.validUpto);
                if (isNaN(expiryDate)) {
                    coupon.status = 'Unavailable';
                } else if (expiryDate < now) {
                    coupon.status = 'Expired';
                }
            }
            await coupon.save();
        }));

        const filteredCoupon = coupons.filter(coupon => coupon.status === 'Available');

        let cartItems = [];
        if (cart && Array.isArray(cart.items)) {
            cartItems = cart.items.filter(item => !item.isDeleted && item.productId !== null);
        }

        if (cartItems.length === 0) {
            return handleStatus(res, 401, 'Cart is empty!!');
        }

        const addresses = addressDoc ? addressDoc.address.filter(add => !add.isDeleted) : [];

        const finalTotal = Math.floor(cartItems.reduce((total, item) => total + item.totalPrice, 0));
        const withoutOffer = cartItems.reduce((total, item) => total + (item.itemPrice * item.quantity), 0);
        const totalOffer = withoutOffer - finalTotal || 0;
        const gst = Math.floor(cart.GST || 0);
        const withoutGst = withoutOffer - gst;

        return res.render('checkout', {
            user,
            currentPage: 'checkout',
            address: addresses,
            cart,
            search,
            totalOffer,
            withoutGst,
            gst,
            finalTotal,
            coupons: filteredCoupon
        });

    } catch (error) {
        console.error('Checkout Load Error:', error.message, error.stack);
        return handleStatus(res, 500);
    }
};


const checkout = async (req, res) => {
    try {
        const userId = req.session.user;

        const [user, userAddress, cartDoc] = await Promise.all([
            User.findById(userId),
            Address.findOne({ userId }),
            Cart.findOne({ userId }).populate('items.productId')
        ]);

        if (!user) {
            return handleStatus(res, 401, 'User not found!!');
        }

        const data = req.body;
        const paymentMethod = data.payment.method;
        const addressId = data.addressId?.addressId || '';

        const orderAddress = userAddress?.address.find(add => add._id.toString() === addressId);
        if (!orderAddress) {
            return handleStatus(res, 400, 'Invalid Address!!');
        }

        let errors = validateAddress(orderAddress);

        if (errors) {
            return handleStatus(res, 401, 'Addresss validation failed!!', { errors });
        }

        if (!cartDoc || !cartDoc.items.length) {
            return handleStatus(res, 401, 'Your cart is empty!!');
        }

        const cartItems = cartDoc.items;

        const productIds = cartItems.map(item => item.productId._id);
        const products = await Products.find({ _id: { $in: productIds } });

        for (let item of cartItems) {
            const product = products.find(product => product._id.toString() === item.productId._id.toString());
            if (!product || product.status !== 'Available') {
                return handleStatus(res, 401, 'One of the items is not available');
            }
            if (item.quantity > product.quantity) {
                return handleStatus(res, 400, 'Not available in this quantity!!');
            }
        }

        let shippingCharge = 0;
        if (orderAddress?.country !== 'India') {
            shippingCharge = 12500;
        } else if (orderAddress?.state !== 'Kerala') {
            shippingCharge = 250;
        }

        //Order ID
        const orderId = await createOrderId()

        let totalAmount = shippingCharge ? shippingCharge : 0

        for (let item of cartItems) {
            const product = item.productId;
            item.itemGST = (product.gst || 0) * item.quantity;
            totalAmount += item.totalPrice;
        }

        const couponCode = data.couponCode

        const { finalAmount, totalOfferedPrice, totalGST, priceWithoutGST, coupon, couponDiscount, message } = await calculateAmounts(couponCode, totalAmount, cartItems)

        if (message !== null) {
            return handleStatus(res, 401, message)
        }

        if (paymentMethod === 'COD' && finalAmount > 50000) {
            return handleStatus(res, 401, 'COD is not available for the amount 50000 & above!!')
        } else if (paymentMethod === 'Razorpay' && finalAmount > 500000) {
            return handleStatus(res, 401, 'Razorpay is not available for the amount 500000 & above')
        }

        const order = new Order({
            userId,
            orderId,
            orderedItems: cartItems.map(item => ({
                product: item.productId._id,
                quantity: item.quantity,
                price: item.totalPrice,
                productPrice: item.price
            })),
            totalPrice: priceWithoutGST + totalOfferedPrice,
            finalAmount: finalAmount,
            couponDiscount,
            discount: totalOfferedPrice || 0,
            address: orderAddress,
            status: 'Pending',
            paymentMethod,
            invoiceDate: new Date(),
            GST: totalGST,
            razorpayStatus: paymentMethod === 'Razorpay' ? 'Pending' : null,
            couponCode: coupon?.couponCode || null,
            couponApplied: coupon ? true : false,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            shipping: shippingCharge
        });

        if (paymentMethod === 'Razorpay') {
            await order.save();
            req.session.orderId = orderId;
            await Cart.findOneAndUpdate(
                { userId },
                { $set: { items: [], discount: 0, totalAmount: 0, GST: 0 } }
            );
            const razorpayOrder = await generateRazorpayCheckout(finalAmount)
            order.razorpayOrderId = razorpayOrder.id;

            return handleStatus(res, 200, null, {
                razorpayOrder,
                amount: finalAmount,
                orderId: orderId,
                message: 'Razorpay Order Created!'
            });
        }

        if (paymentMethod === 'Wallet') {

            const reason = `Products purchased ${order.orderId}!!`

            const { success, message } = await fromWallet(userId, finalAmount, reason)
            if (success === false) {
                return handleStatus(res, 400, message);
            }

            order.paymentStatus = 'Paid'
            const saveResult = await order.save()

            if (!saveResult) {
                return handleStatus(res, 403, 'Order not saved!!');
            }

            if (coupon && order.couponApplied) {
                await couponUpdate(coupon)
            }

            await updateInventory(userId)

            req.session.orderId = orderId;

            if (order.paymentStatus === 'Paid' && order.status === 'Pending') {
                order.status = 'Confirmed'
                order.orderedItems.forEach(item => item.itemStatus = 'Confirmed')
                await order.save()
            }
            return handleStatus(res, 200, message)
        }

        order.paymentStatus = 'Paid'

        const saveResult = await order.save();
        if (!saveResult) {
            return handleStatus(res, 401, 'Order not saved!!');
        }

        req.session.orderSuccess = true

        if (saveResult && paymentMethod !== 'Razorpay') {
            if (coupon && order.couponApplied) {
                await couponUpdate(coupon)
            }

            await updateInventory(userId)
            req.session.orderId = orderId;

            if (order.paymentStatus === 'Paid' && order.status === 'Pending') {
                order.status = 'Confirmed'
                order.orderedItems.forEach(item => item.itemStatus = 'Confirmed')
                await order.save()
            }
            return handleStatus(res, 200, 'Order Placed!!');
        }
        order.paymentStatus = 'Failed'
        return handleStatus(res, 401, 'Your order failed to complete!!');
    } catch (error) {
        console.log('Failed to confirm the order: ', error);
        return handleStatus(res, 500);
    }
};

const verifyPayment = async (req, res) => {
    try {
        const userId = req.session.user;
        const { razorpayPaymentId, razorpayOrderId, razorpaySignature, orderId } = req.body;

        const dbOrder = await Order.findOne({ orderId });
        if (!dbOrder) {
            return handleStatus(res, 404, 'Order not found!!');
        }

        if (dbOrder.razorpayStatus === 'Paid' || dbOrder.paymentStatus === 'Paid') {
            return handleStatus(res, 409, 'Payment already verified!!');
        }

        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);
        hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const generatedSignature = hmac.digest('hex');


        if (generatedSignature !== razorpaySignature) {
            dbOrder.status = 'Payment Failed'
            dbOrder.razorpayStatus = 'Failed'
            dbOrder.paymentStatus = 'Failed'
            dbOrder.paymentMethod = 'Payment Failed'
            await dbOrder.save()
            return handleStatus(res, 400, 'Paymengt vaerification failed!')
        }

        dbOrder.razorpayOrderId = razorpayOrderId;
        dbOrder.razorpayPaymentId = razorpayPaymentId;
        dbOrder.razorpaySignature = razorpaySignature;
        dbOrder.razorpayInvoiceDate = new Date();
        dbOrder.razorpayStatus = 'Paid';
        dbOrder.status = 'Pending';
        dbOrder.paymentStatus = 'Paid';
        dbOrder.paymentMethod = 'Razorpay';

        if (dbOrder.razorpayStatus === 'Paid' && dbOrder.paymentStatus === 'Paid') {
            await confirmOrder(userId, orderId, dbOrder)
        }

        if (dbOrder.coupon && dbOrder.couponApplied) {
            const couponDoc = await Coupon.findOne({ couponCode: dbOrder.couponCode });
            if (couponDoc) {
                await couponUpdate(couponDoc);
            }
        }

        await dbOrder.save();

        req.session.orderId = dbOrder.orderId
        req.session.orderSuccess = true

        return handleStatus(res, 200, 'Payment verified and order is placed successfully!!');

    } catch (error) {
        console.error("Payment verification error: ", error);
        return handleStatus(res, 500)
    }
};

const retryPayment = async (req, res) => {
    try {
        const userId = req.session.user;
        const { orderId, method } = req.body;

        const [user, order] = await Promise.all([
            User.findById(userId),
            Order.findOne({ orderId }).populate('orderedItems.product')
        ])

        if (!order) {
            return handleStatus(res, 404, 'Order not found!!');
        }

        const now = new Date();

        if (order.expiresAt && !isNaN(new Date(order.expiresAt).getTime()) && new Date(order.expiresAt) < now) {
            order.status = 'Cancelled';
            order.reason = 'Order Expired';
            order.orderedItems.forEach(item => {
                item.itemStatus = 'Cancelled';
                item.reason = 'Order Expired';
            });
            await order.save();
            return handleStatus(res, 401, 'Order has expired and was cancelled!!');
        }

        const productIds = order.orderedItems.map(item => item.product._id)
        const products = await Products.find({ _id: { $in: productIds } })

        for (let item of order.orderedItems) {
            const product = products.find(product => product._id.toString() === item.product._id.toString())
            if (!product) return handleStatus(res, 401, `Product not found for item ${item.product._id}`);
            if (product.stock < item.quantity) return handleStatus(res, 401, `${product.productName} is not available!!`);
        }

        const finalAmount = order.finalAmount;

        if (method === 'Razorpay') {

            if (order.paymentMethod === 'Razorpay' && finalAmount > 500000) {
                return handleStatus(res, 401, 'Razorpay is not availble for the amount 5,00,000 & above!!')
            }
            const razorpayOrder = await generateRazorpayCheckout(finalAmount);
            order.razorpayOrderId = razorpayOrder.id;

            return handleStatus(res, 200, null, {
                razorpayOrder,
                amount: finalAmount,
                orderId: orderId,
                user,
            });

        } else if (method === 'Wallet') {
            const reason = `Products purchased ${order.orderId}!!`;
            const { message, success } = await fromWallet(userId, finalAmount, reason);

            if (success === true) {

                if (order.paymentMethod === 'Razorpay') {
                    order.razorpayStatus = null;
                }

                order.paymentMethod = method;
                order.paymentStatus = 'Paid'
                order.status = 'Pending'
                const saveResult = await order.save();

                if (!saveResult) {
                    return handleStatus(res, 500, 'Order not saved!!');
                }

                if (order.paymentStatus === 'Paid' && order.status === 'Pending') {
                    await confirmOrder(userId, orderId, order)
                }

                return handleStatus(res, 200, message || 'Payment is completed with your Wallet!!');

            } else {
                order.paymentStatus = 'Failed'
                order.status = 'Payment Failed'
                order.paymentMethod = 'Payment Failed'
                await order.save()
                return handleStatus(res, 401, message || 'Payment with wallet is Failed!!');
            }

        } else if (method === 'COD') {
            if (finalAmount > 50000) {
                return handleStatus(res, 401, 'COD is not available for the amount 50000 & above!!');
            }
            if (order.paymentMethod === 'Razorpay') {
                order.razorpayStatus = null;
            }

            order.paymentMethod = method;
            order.paymentStatus = 'Paid'
            const saveResult = await order.save();

            if (!saveResult) {
                return handleStatus(res, 500, 'Order not saved!!');
            }

            if (order.paymentStatus === 'Paid' && order.status === 'Pending') {
                await confirmOrder(userId, orderId, order)
            }
            return handleStatus(res, 200, 'Payment completed cia Cash On delivery!!', { method });

        } else {
            order.status = 'Payment failed'
            order.paymentStatus = 'Failed'
            order.paymentMethod = 'Payment Failed'
            await order.save()
            return handleStatus(res, 400, 'Invalid payment method!!');
        }

    } catch (error) {
        console.log('Something went wrong with Repayment:', error);
        return handleStatus(res, 500);
    }
};


module.exports = {
    loadCheckout,
    checkout,
    verifyPayment,
    retryPayment
}