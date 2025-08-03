const Address = require('../../model/addressModel')
const User = require('../../model/userModel')
const Products = require('../../model/productModel')
const Cart = require('../../model/cartModel')
const Order = require('../../model/orderModel')
const Coupon = require('../../model/couponModel')
const {razorpayInst} = require('../../helpers/razorpay')

const crypto = require('crypto');


const {validateAddress} = require('../../helpers/validations')
const {createOrderId} = require('../../helpers/orderId')
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
}


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
        // console.log('cart Discount : ', cart.discount)
        if (!cart || !cart.items.length) {
            return res.render('checkout', {
                user,
                currentPage: 'checkout',
                address: addresses,
                cart: null,
                search,
                totalOfferedPrice: 0,
                message: 'Your cart is empty!'
            });
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

        // const date = new Date();
        // const year = date.getFullYear().toString().slice(-2);
        // const month = (date.getMonth() + 1).toString().padStart(2, '0');
        // const day = date.getDate().toString().padStart(2, '0');
        // const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        // const tomorrow = new Date(today);
        // tomorrow.setDate(tomorrow.getDate() + 1);
        // const count = await Order.countDocuments({ createdOn: { $gte: today, $lt: tomorrow } });
        // const seq = (count % 100).toString().padStart(2, '0');
        // const orderId = `ORD${year}${month}${day}${seq}`;


        let totalAmount = 0;

        for (let item of cartItems) {
            const product = item.productId;
            item.itemGST = (product.gst || 0) * item.quantity;
            totalAmount += item.totalPrice;
        }

        const couponCode = data.couponCode
        
        const {finalAmount, totalOfferPrice, totalOfferedPrice, totalGST, priceWithoutGST, coupon } = await calculateAmounts(couponCode, totalAmount, cartItems)

        // const coupon = await Coupon.findOne({couponCode}) || ''
        
        // let couponDiscount = 0

        // if(coupon){
        //     if(coupon.discountType === 'percentage'){
        //         couponDiscount = Math.floor((totalAmount * coupon.discount) / 100)
        //     }else{
        //         couponDiscount = coupon.discount
        //     }
        // }


        // totalGST = (totalAmount * 18) / 118

        // const finalAmount = Math.floor(totalAmount - couponDiscount);
        // const priceWithoutGST = Math.floor(finalAmount - totalGST);

        // const subtotal = cartItems.reduce((total, item) => total + item.totalPrice, 0);
        // const totalOfferPrice = cartItems.reduce((total, item) => total + (item.itemPrice * item.quantity), 0);
        // const totalOfferedPrice = totalOfferPrice - subtotal + couponDiscount || 0

        
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
        
        const saveResult = await order.save();

        if(paymentMethod === 'Razorpay'){
            console.log('payment method : ', paymentMethod)
            const razorpayOrder = await generateRazorpay(finalAmount)
            order.razorpayOrderId = razorpayOrder.id; 
            await order.save();
            return res.status(200).json({
                success : true,
                razorpayOrder,
                amount : finalAmount,
                orderId : orderId,
                message : 'Razorpay Order Created!',

            })
       }

        if (saveResult && paymentMethod !== 'Razorpay') {
            
            if(coupon && order.couponApplied){
                coupon.couponLimit--
                console.log('coupon limit : ', coupon.couponLimit)
                await coupon.save()
            }

            for (let item of cartItems) {
                const product = await Products.findById(item.productId._id);
                if (product) {
                    product.quantity -= item.quantity;
                    if (product.quantity < 0) product.quantity = 0;
                    await product.save();
                }
            }
            req.session.orderId = orderId;
            await Cart.findOneAndUpdate({ userId }, { $set: { items: [], discount: 0, totalAmount: 0, GST: 0 } });
    
            return res.status(200).json({ success: true, message: 'Order confirmed!' });
        } 

        return res.status(500).json({ success: false, message: 'Your order failed to complete!' });


    } catch (error) {
        console.log('Failed to confirm the order: ', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while confirming the order!'
        });
    }
}; 

const verifyPayment = async (req, res) => {
    try {
        const userId = req.session.user;
        const { razorpayPaymentId, razorpayOrderId, razorpaySignature, orderId } = req.body;

        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);
        hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature !== razorpaySignature) {
            return res.status(400).json({ success: false, message: 'Payment verification failed.' });
        }

        const dbOrder = await Order.findOne({ orderId });
        if (!dbOrder) {
            return res.status(401).json({ success: false, message: 'Order not found.' });
        }

        if (dbOrder.razorpayStatus === 'Paid') {
            return res.status(409).json({ success: false, message: 'Payment already verified!' });
        }

        dbOrder.razorpayOrderId = razorpayOrderId;
        dbOrder.razorpayPaymentId = razorpayPaymentId;
        dbOrder.razorpaySignature = razorpaySignature;
        dbOrder.razorpayInvoiceDate = new Date();
        dbOrder.razorpayStatus = 'Paid';
        dbOrder.status = 'Confirmed';

        for (let item of dbOrder.orderedItems) {
            const product = await Products.findById(item.product);
            if (product) {
                product.quantity -= item.quantity;
                if (product.quantity < 0) product.quantity = 0;
                await product.save();
            }
        }

        await Cart.findOneAndUpdate(
            { userId },
            { $set: { items: [], discount: 0, totalAmount: 0, GST: 0 } }
        );

        if (dbOrder.coupon && dbOrder.couponApplied) {
            const couponDoc = await Coupon.findOne({ couponCode: dbOrder.couponCode });
            if (couponDoc) {
                couponDoc.couponLimit--;
                await couponDoc.save();
            }
        }

        await dbOrder.save();

        return res.status(200).json({ success: true, message: 'Payment verified and order placed successfully!' });

    } catch (error) {
        console.error("Payment verification error: ", error);
        res.status(500).json({ success: false, message: 'Server error!' });
        return res.redirect('/pageNotFound')
    }
};


async function generateRazorpay( amount){
    try {
        const options = {
            amount : amount * 100,
            currency : 'INR',
            receipt: `Order_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        }
        

        const order = await razorpayInst.orders.create(options)
        return order
    } catch (error) {
        console.log('Something went wrong with razorpay : ', error)   
    }

}





module.exports = {
    loadCheckout,
    checkout,
    verifyPayment
}