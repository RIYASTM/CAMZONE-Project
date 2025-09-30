const crypto = require('crypto');

const Cart = require('../../model/cartModel')
const User = require('../../model/userModel')
const Order = require('../../model/orderModel')
const Coupon = require('../../model/couponModel')
const Wallet = require('../../model/walletModal')
const Address = require('../../model/addressModel')
const Products = require('../../model/productModel')

const { fromWallet } = require('../../helpers/wallet')
const { createOrderId } = require('../../helpers/orderId')
const { validateAddress } = require('../../helpers/validations')
const { calculateAmounts } = require('../../helpers/productOffer')
const { generateRazorpayCheckout } = require('../../helpers/razorpay')
const { updateInventory, updateInventoryOrder } = require('../../helpers/updateInventory');
const Product = require('../../model/productModel');


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
        ])

        const addresses = addressDoc ? addressDoc.address.filter(add => !add.isDeleted) : [];

        let cartItems = cart.items.filter(item => !item.isDeleted && item.productId !== null);

        const subtotal = cartItems.reduce((total, item) => total + item.totalPrice, 0);
        const totalOfferPrice = cartItems.reduce((total, item) => total + (item.itemPrice * item.quantity), 0);
        const totalOfferedPrice = totalOfferPrice - subtotal || 0;
        const gst = cart.GST || 0;
        const finalTotal = subtotal;

        return res.render('checkout', {
            user,
            currentPage: 'checkout',
            address: addresses,
            cart,
            search,
            totalOfferedPrice,
            subtotal,
            gst,
            finalTotal,
            coupons
        });

    } catch (error) {
        console.error('Checkout Load Error:', error.message, error.stack);
        return res.redirect('/pageNotFound')
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
            return res.status(401).json({ success: false, message: 'User not found!' });
        }

        const data = req.body;
        const paymentMethod = data.payment.method;
        const addressId = data.addressId?.addressId || '';

        const orderAddress = userAddress?.address.find(add => add._id.toString() === addressId);
        if (!orderAddress) {
            return res.status(400).json({ success: false, message: 'Invalid address!' });
        }

        let errors = validateAddress(orderAddress);

        if (errors) {
            console.log('Address Validation:', errors);
            return res.status(401).json({
                success: false,
                message: 'Address validation failed',
                errors
            });
        }

        if (!cartDoc || !cartDoc.items.length) {
            return res.status(400).json({ success: false, message: 'Cart is empty!' });
        }

        const cartItems = cartDoc.items;

        const productIds = cartItems.map(item => item.productId._id);
        const products = await Products.find({ _id: { $in: productIds } });

        for (let item of cartItems) {
            const product = products.find(product => product._id.toString() === item.productId._id.toString());
            if (!product || product.status !== 'Available') {
                return res.status(401).json({ success: false, message: 'One of the items is not available' });
            }
            if (item.quantity > product.quantity) {
                return res.status(400).json({ success: false, message: 'Not available in this quantity!' });
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

        const { finalAmount, totalOfferedPrice, totalGST, priceWithoutGST, coupon, couponDiscount } = await calculateAmounts(couponCode, totalAmount, cartItems)

        if (paymentMethod === 'COD' && finalAmount > 50000) {
            return res.status(401).json({ success: false, message: 'COD is not available for the amount 50000 & above!!' })
        } else if (paymentMethod === 'Razorpay' && finalAmount > 500000) {
            return res.status(400).json({ success: false, message: 'Razorpay is not available for the amount 500000 & above' })
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
            return res.status(200).json({
                success: true,
                razorpayOrder,
                amount: finalAmount,
                orderId: orderId,
                message: 'Razorpay Order Created!'
            })
        }

        if (paymentMethod === 'Wallet') {
            const reason = `Products purchased ${order.orderId}!!`
            const { success, message } = await fromWallet(userId, finalAmount, reason)
            if (success === false) {
                order.status = 'Failed'
                order.save()
                return res.status(401).json({ success: false, message: message })
            }
            if (coupon && order.couponApplied) {
                coupon.couponLimit--
                await coupon.save()
            }
            order.paymentStatus = 'Paid'
            const saveResult = await order.save()
            if (!saveResult) {
                return res.status(401).json({ success: false, message: 'Order not saved.' })
            }
            await updateInventory(userId)
            req.session.orderId = orderId;

            res.status(200).json({ success: true, message: message })

            if (order.paymentStatus === 'Paid' && order.status === 'Pending') {
                order.status = 'Confirmed'
                order.orderedItems.forEach(item => item.itemStatus = 'Confirmed')
                await order.save()
            }
            return
        }
        order.paymentStatus = 'Paid'
        const saveResult = await order.save();
        if (!saveResult) {
            return res.status(401).json({ success: false, message: 'Order not saved.' })
        }
        req.session.orderSuccess = true
        if (saveResult && paymentMethod !== 'Razorpay') {
            if (coupon && order.couponApplied) {
                coupon.couponLimit--
                await coupon.save()
            }
            await updateInventory(userId)
            req.session.orderId = orderId;
            res.status(200).json({ success: true, message: 'Order Placed!' });

            if (order.paymentStatus === 'Paid' && order.status === 'Pending') {
                order.status = 'Confirmed'
                order.orderedItems.forEach(item => item.itemStatus = 'Confirmed')
                await order.save()
            }
            return
        }
        order.paymentStatus = 'Failed'
        return res.status(500).json({ success: false, message: 'Your order failed to complete!' });
    } catch (error) {
        console.log('Failed to confirm the order: ', error);
        return res.redirect('/pageNotFound')
    }
};

const verifyPayment = async (req, res) => {
    try {
        const userId = req.session.user;
        const { razorpayPaymentId, razorpayOrderId, razorpaySignature, orderId } = req.body;

        const dbOrder = await Order.findOne({ orderId });
        if (!dbOrder) {
            return res.status(401).json({ success: false, message: 'Order not found.' });
        }

        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);
        hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const generatedSignature = hmac.digest('hex');


        if (generatedSignature !== razorpaySignature) {
            dbOrder.status = 'Payment Failed'
            dbOrder.razorpayStatus = 'Failed'
            dbOrder.paymentStatus = 'Failed'
            return res.status(400).json({ success: false, message: 'Payment verification failed.' });
        }

        if (dbOrder.razorpayStatus === 'Paid' || dbOrder.paymentStatus === 'Paid') {
            return res.status(409).json({ success: false, message: 'Payment already verified!' });
        }

        dbOrder.razorpayOrderId = razorpayOrderId;
        dbOrder.razorpayPaymentId = razorpayPaymentId;
        dbOrder.razorpaySignature = razorpaySignature;
        dbOrder.razorpayInvoiceDate = new Date();
        dbOrder.razorpayStatus = 'Paid';
        dbOrder.status = 'Pending';
        dbOrder.paymentStatus = 'Paid';

        if (dbOrder.razorpayStatus === 'Paid' && dbOrder.paymentStatus === 'Paid') {
            await updateInventoryOrder(userId, orderId)
            if (dbOrder.status === 'Pending') {
                dbOrder.status = 'Confirmed'
                dbOrder.expiresAt = null
                dbOrder.orderedItems.forEach(item => item.itemStatus = 'Confirmed')
            }
        }

        if (dbOrder.coupon && dbOrder.couponApplied) {
            const couponDoc = await Coupon.findOne({ couponCode: dbOrder.couponCode });
            if (couponDoc) {
                couponDoc.couponLimit--;
                await couponDoc.save();
            }
        }

        await dbOrder.save();

        req.session.orderId = dbOrder.orderId

        return res.status(200).json({ success: true, message: 'Payment verified and order placed successfully!' });

    } catch (error) {
        console.error("Payment verification error: ", error);
        res.status(500).json({ success: false, message: 'Server error!' });
        return res.redirect('/pageNotFound')
    }
};

const retryPayment = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId)
        const { orderId, method } = req.body;

        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
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
            return res.status(400).json({ success: false, message: 'Order has expired and was cancelled.' });
        }

        const productIds = order.orderedItems.map(item => item.product._id)
        const products = await Product.find({ _id : {$in : productIds}})

        for (let item of order.orderedItems){
            const product = products.find(product => product._id.toString() === item.product._id.toString())
            if(!product || product.stock < item.quantity){
                return res.status(401).json({ success :false, message : 'Ordered item is not available!!'})
            }
        }
        
        const finalAmount = order.finalAmount;
        
        if (method === 'Razorpay') {

            if (order.paymentMethod === 'Razorpay' && finalAmount > 500000) {
                return res.status(400).json({ success: false, message: 'Razorpay is not available for the amount 500000 & above' })
            }
            const razorpayOrder = await generateRazorpayCheckout(finalAmount);
            order.razorpayOrderId = razorpayOrder.id;

            return res.status(200).json({
                success: true,
                razorpayOrder,
                amount: finalAmount,
                orderId: orderId,
                user,
                message: 'Razorpay Order Created!',
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
                    return res.status(500).json({ success: false, message: 'Order not saved!!' });
                }

                if (order.paymentStatus === 'Paid' && order.status === 'Pending') {
                    await updateInventoryOrder(userId, orderId)
                    order.status = 'Confirmed'
                    order.expiresAt = null
                    order.orderedItems.forEach(item => item.itemStatus = 'Confirmed')
                    order.save()
                }

                return res.status(200).json({
                    success: true,
                    message: message || 'Payment is completed with your Wallet!!',
                    method
                });

            } else {
                order.paymentStatus = 'Failed'
                order.status = 'Payment Failed'
                order.save()
                return res.status(401).json({
                    success: false,
                    message: message || 'Payment with wallet is Failed!!'
                })
            }

        } else if (method === 'COD') {
            if (finalAmount > 10000) {
                return res.status(401).json({ success: false, message: 'COD is not available for the amount 10000 & above!!' })
            }
            if (order.paymentMethod === 'Razorpay') {
                order.razorpayStatus = null;
            }

            order.paymentMethod = method;
            order.paymentStatus = 'Paid'
            const saveResult = await order.save();

            if (!saveResult) {
                return res.status(500).json({ success: false, message: 'Order not saved!!' });
            }

            if (order.paymentStatus === 'Paid' && order.status === 'Pending') {
                await updateInventoryOrder(userId, orderId)
                order.status = 'Confirmed'
                order.expiresAt = null
                order.orderedItems.forEach(item => item.itemStatus = 'Confirmed')
                order.save()
            }
            return res.status(200).json({
                success: true,
                message: 'Payment completed via Cash on Delivery.',
                method
            });

        } else {
            order.status = 'Payment failed'
            order.paymentStatus = 'Failed'
            order.save()
            return res.status(400).json({ success: false, message: 'Invalid payment method.' });
        }

    } catch (error) {
        console.log('Something went wrong with Repayment:', error);
        return res.redirect('/pageNotFound')
    }
};



module.exports = {
    loadCheckout,
    checkout,
    verifyPayment,
    retryPayment
}