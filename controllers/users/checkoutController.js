const Address = require('../../model/addressModel')
const User = require('../../model/userModel')
const Products = require('../../model/productModel')
const Cart = require('../../model/cartModel')
const Order = require('../../model/orderModel')
const Coupon = require('../../model/couponModel')
const Wallet = require('../../model/walletModal')
const {generateRazorpayCheckout} = require('../../helpers/razorpay')

const crypto = require('crypto');


const {validateAddress} = require('../../helpers/validations')
const {createOrderId} = require('../../helpers/orderId')
const {fromWallet} = require('../../helpers/wallet')
const {updateInventory} = require('../../helpers/updateInventory')
const { default: mongoose } = require('mongoose')

async function calculateAmounts(couponCode,totalAmount, cartItems){

            const coupon = await Coupon.findOne({couponCode}) || ''
        
            let couponDiscount = 0

            if(coupon){
                if(coupon.discountType === 'percentage'){
                    couponDiscount = Math.floor((totalAmount * coupon.discount) / 100)
                }else{
                    couponDiscount = coupon.discount
                }
            }

            const totalGST = (totalAmount * 18) / 118

            const finalAmount = Math.floor(totalAmount - couponDiscount);
            const priceWithoutGST = Math.floor(finalAmount - totalGST);

            const subtotal = cartItems.reduce((total, item) => total + item.totalPrice, 0);
            const totalOfferPrice = cartItems.reduce((total, item) => total + (item.itemPrice * item.quantity), 0);
            const totalOfferedPrice = totalOfferPrice - subtotal + couponDiscount || 0

            return {
                priceWithoutGST,
                totalOfferedPrice,
                finalAmount,
                totalGST,
                coupon
            }
};

const loadCheckout = async (req, res) => {
    try {
        const search = req.query.search || '';
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated!' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found!' });
        }

        const addressDoc = await Address.findOne({ userId });
        const addresses = addressDoc ? addressDoc.address.filter(add => !add.isDeleted) : [];

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || !cart.items.length) {
            return res.redirect('/pageNotFound')
        }

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
            finalTotal
        });

    } catch (error) {
        console.log('Failed to load the checkout page:', error);
        // res.status(500).send('Something went wrong while loading checkout page.');
        return res.redirect('/pageNotFound')
    }
};

const checkout = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated!' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found!' });
        }

        const data = req.body;
        const paymentMethod = data.payment.method;
        const addressId = data.addressId?.addressId || '';

        const userAddress = await Address.findOne({ userId });
        const orderAddress = userAddress.address.find(add => add._id.toString() === addressId);
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


        const cartDoc = await Cart.findOne({ userId }).populate('items.productId');
        if (!cartDoc || !cartDoc.items.length) {
            return res.status(400).json({ success: false, message: 'Cart is empty!' });
        }

        const cartItems = cartDoc.items;

        for (let item of cartItems) {
            const product = await Products.findById(item.productId._id);
            if (item.quantity > product.quantity) {
                return res.status(400).json({ success: false, message: 'Not available in this quantity!' });
            }
        }

        //Order ID
        const orderId = await createOrderId()

        let totalAmount = 0;

        for (let item of cartItems) {
            const product = item.productId;
            item.itemGST = (product.gst || 0) * item.quantity;
            totalAmount += item.totalPrice;
        }

        const couponCode = data.couponCode
        
        const {finalAmount, totalOfferPrice, totalOfferedPrice, totalGST, priceWithoutGST, coupon } = await calculateAmounts(couponCode, totalAmount, cartItems)

        if( paymentMethod === 'COD' &&finalAmount > 50000){
            return res.status(401).json({ success :false, message : 'COD is not available for the amount 50000 & above!!'})
        }else if(paymentMethod === 'Razorpay' && finalAmount > 500000){
            return res.status(400).json({ success : false, message : 'Razorpay is not available for the amount 500000 & above'})
        }
   
        const order = new Order({
            userId,
            orderId, 
            orderedItems: cartItems.map(item => ({
                product: item.productId._id,
                quantity: item.quantity,
                price: item.totalPrice,
                productPrice : item.price
            })),
            totalPrice: priceWithoutGST + totalOfferedPrice,
            finalAmount: finalAmount,
            discount: totalOfferedPrice || 0,
            address: orderAddress,
            status: 'Pending',
            paymentMethod,
            invoiceDate: new Date(),
            GST: totalGST,
            razorpayStatus : paymentMethod === 'Razorpay' ? 'Pending' : null,
            couponCode: coupon?.couponCode || null,
            couponApplied : coupon ? true : false
        });

        if(paymentMethod === 'Razorpay'){
            await order.save();
            req.session.orderId = orderId;
            await updateInventory(userId)
            const razorpayOrder = await generateRazorpayCheckout(finalAmount)
            order.razorpayOrderId = razorpayOrder.id;
            return res.status(200).json({
                success : true,
                razorpayOrder,
                amount : finalAmount,
                orderId : orderId,
                message : 'Razorpay Order Created!',

            })
        }
        if(paymentMethod === 'Wallet'){
            const reason = `Products purchased ${order.orderId}!!`
            const {success, message} = await fromWallet(userId, finalAmount, reason)
            if(success === false){
                order.status = 'Failed'
                order.save()
                return res.status(401).json({success : false, message : message})
            }
            if(coupon && order.couponApplied){
                coupon.couponLimit--
                await coupon.save()
            }
            order.paymentStatus = 'Paid'
            const saveResult = await order.save()
            if(!saveResult){
                return res.status(401).json({ success : false, message : 'Order not saved.'})
            }
            await updateInventory(userId)
            req.session.orderId = orderId;
            
            res.status(200).json({success : true, message : message})
            if(order.paymentStatus === 'Paid'){
                setTimeout(()=> {
                    order.status = 'Confirmed'
                    order.save()
                },10000)
            }
            return
        }
        order.paymentStatus = 'Paid'
        const saveResult = await order.save();
        if(!saveResult){
            return res.status(401).json({ success : false, message : 'Order not saved.'})
        }
        req.session.orderSuccess = true
        if (saveResult && paymentMethod !== 'Razorpay') {   
            if(coupon && order.couponApplied){
                coupon.couponLimit--
                await coupon.save()
            }
            await updateInventory(userId)
            req.session.orderId = orderId;
            res.status(200).json({ success: true, message: 'Order Placed!' });

            if(order.paymentStatus === 'Paid' && order.status === 'Pending'){
                setTimeout(()=> {
                    order.status = 'Confirmed'
                    order.save()
                },10000)
            }
            return 
        }
        order.paymentStatus = 'Failed'
        return res.status(500).json({ success: false, message: 'Your order failed to complete!' });
    } catch (error) {
        console.log('Failed to confirm the order: ', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while confirming the order!'
        });
        return res.redirect('/pageNotFound')
    }
}; 

const verifyPayment = async (req, res) => {
    try {
        const userId = req.session.user;
        const { razorpayPaymentId, razorpayOrderId, razorpaySignature, orderId } = req.body;

        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);
        hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const generatedSignature = hmac.digest('hex');
        
        const dbOrder = await Order.findOne({ orderId });

        if (generatedSignature !== razorpaySignature) {
            dbOrder.status = 'Payment Failed'
            dbOrder.razorpayStatus = 'Failed'
            dbOrder.paymentStatus = 'Failed'
            return res.status(400).json({ success: false, message: 'Payment verification failed.' });
        }

        if (!dbOrder) {
            return res.status(401).json({ success: false, message: 'Order not found.' });
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
        dbOrder.paymentStatus = 'Paid'

        await updateInventory(userId)

        if (dbOrder.coupon && dbOrder.couponApplied) {
            const couponDoc = await Coupon.findOne({ couponCode: dbOrder.couponCode });
            if (couponDoc) {
                couponDoc.couponLimit--;
                await couponDoc.save();
            }
        }

        await dbOrder.save();

        req.session.orderId = dbOrder.orderId

        res.status(200).json({ success: true, message: 'Payment verified and order placed successfully!' });
        if(dbOrder.paymentStatus === 'Paid' && dbOrder.razorpayStatus === 'Paid'){
            setTimeout(()=> {
                dbOrder.status = 'Confirmed'
                dbOrder.save()
            },10000)
        }
        return 

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

        console.log('orderId : ', orderId)

        const order = await Order.findOne({orderId});
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const finalAmount = order.finalAmount;

        if (method === 'Razorpay') {
            if(order.paymentMethod === 'Razorpay' && finalAmount > 500000){
                return res.status(400).json({ success : false, message : 'Razorpay is not available for the amount 500000 & above'})
            }
            console.log('Payment method:', method);
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
            const{ message, success } = await fromWallet(userId, finalAmount, reason);

            if(success=== true){

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
    
                res.status(200).json({
                    success: true,
                    message: message || 'Payment is completed with your Wallet!!',
                    method
                });
                if(order.paymentStatus === 'Paid' && order.status === 'Pending'){
                    setTimeout(()=> {
                        order.status = 'Confirmed'
                        order.save()
                    },10000)
                }
                return  
            }else{
                order.paymentStatus = 'Failed'
                order.status = 'Payment Failed'
                order.save()
                return res.status(401).json({
                    success : false,
                    message : message || 'Payment with wallet is Failed!!'
                })
            }

        } else if (method === 'COD') {
            if(finalAmount > 10000){
                return res.status(401).json({ success :false, message : 'COD is not available for the amount 10000 & above!!'})
            }
            if (order.paymentMethod === 'Razorpay') {
                order.razorpayStatus = null;
            }

            order.paymentMethod = method;
            const saveResult = await order.save();

            if (!saveResult) {
                return res.status(500).json({ success: false, message: 'Order not saved!!' });
            }

            res.status(200).json({
                success: true,
                message: 'Payment completed via Cash on Delivery.',
                method
            });
            if(order.paymentStatus === 'Paid' && order.status === 'Pending'){
                setTimeout(()=> {
                    order.status = 'Confirmed'
                    order.save()
                },10000)
            }
            return  
        } else {
            order.status = 'Payment failed'
            order.paymentStatus = 'Failed'
            order.save()
            return res.status(400).json({ success: false, message: 'Invalid payment method.' });
        }

    } catch (error) {
        console.log('Something went wrong with Repayment:', error);
        res.status(500).json({ success: false, message: 'Something went wrong...' });
        return res.redirect('/pageNotFound')
    }
};



module.exports = {
    loadCheckout,
    checkout,
    verifyPayment,
    retryPayment
}