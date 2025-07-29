const Address = require('../../model/addressModel')
const User = require('../../model/userModel')
const Products = require('../../model/productModel')
const Cart = require('../../model/cartModel')
const Order = require('../../model/orderModel')


const {validateAddress} = require('../../helpers/validations')
const { default: mongoose } = require('mongoose')




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
        console.log('cart Discount : ', cart.discount)
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
        return res.status(500).send('Something went wrong while loading checkout page.');
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
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const count = await Order.countDocuments({ createdOn: { $gte: today, $lt: tomorrow } });
        const seq = (count % 100).toString().padStart(2, '0');
        const orderId = `ORD${year}${month}${day}${seq}`;

        let totalAmount = 0;
        let totalGST = 0;

        for (let item of cartItems){
            console.log('total Price : ', item.totalPrice)
        }

        for (let item of cartItems) {
            const product = item.productId;
            item.itemGST = (product.gst || 0) * item.quantity;
            totalAmount += item.totalPrice;
            totalGST += item.itemGST;
        }

        const finalAmount = Math.floor(totalAmount);
        const priceWithoutGST = Math.floor(finalAmount - totalGST);
        console.log('cart : ', cartDoc)

        const subtotal = cartItems.reduce((total, item) => total + item.totalPrice, 0);
        console.log('sub total : ', subtotal)
        const totalOfferPrice = cartItems.reduce((total, item) => total + (item.itemPrice * item.quantity), 0);
        console.log('total offer price : ', totalOfferPrice)
        const totalOfferedPrice = totalOfferPrice - subtotal || 0
        console.log('total offered price : ', totalOfferedPrice)

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
            GST: totalGST
        });

        const saveResult = await order.save();
        if (!saveResult) {
            return res.status(500).json({ success: false, message: 'Your order failed to complete!' });
        }

        // Reduce product stock
        for (let item of cartItems) {
            const product = await Products.findById(item.productId._id);
            if (product) {
                product.quantity -= item.quantity;
                if (product.quantity < 0) product.quantity = 0;
                await product.save();
            }
        }

        // Clear cart
        req.session.orderId = orderId;
        await Cart.findOneAndUpdate({ userId }, { $set: { items: [], discount: 0, totalAmount: 0, GST: 0 } });

        return res.status(200).json({ success: true, message: 'Order confirmed!' });

    } catch (error) {
        console.log('Failed to confirm the order: ', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while confirming the order!'
        });
    }
};




module.exports = {
    loadCheckout,
    checkout
}