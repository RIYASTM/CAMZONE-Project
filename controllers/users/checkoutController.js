const Address = require('../../model/addressModel')
const User = require('../../model/userModel')
const Products = require('../../model/productModel')
const Cart = require('../../model/cartModel')
const Order = require('../../model/orderModel')


const {validateAddress} = require('../../helpers/validations')
const { default: mongoose } = require('mongoose')




const loadCheckout = async (req,res) => {
    try {

        const search = req.query.search || ''

        const userId = req.session.user

        if(!userId){
            return res.status(401).json({ success : false , message : 'User not authenticated!!'})
        }

        const user = await User.findById(userId)

        if(!user){
            return res.status(401).json({ success :false , message : 'user not found!!'})
        }

        const addressDoc = await Address.findOne({userId})

        if(!addressDoc){
            return res.status(401).json({ success : false , message : 'Address of this user is not found!!'})
        }

        const addressess = addressDoc ? addressDoc.address.filter(add => !add.isDeleted) : []

        // console.log('User address: ', address)



        const cart = await Cart.findOne({userId})



        console.log('Cart total : ', cart.totalAmount)
     
        return res.render('checkout',{
            user,
            currentPage : 'checkout',
            address : addressess,
            cart,
            search
        })

    } catch (error) {
        console.log(('Failed to load the checkout page : ', error))
    }
    
}

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
        const addressId = data.addressId ? data.addressId.addressId : '';

        const userAddress = await Address.findOne({ userId });
        const orderAddress = userAddress.address.filter(add => add._id.toString() === addressId);

        const cartDoc = await Cart.findOne({ userId }).populate('items.productId');
        if (!cartDoc || !cartDoc.items.length) {
            return res.status(400).json({ success: false, message: 'Cart is empty!' });
        }

        const cartItems = cartDoc.items;

        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const count = await Order.countDocuments({
            createdOn: { $gte: today, $lt: tomorrow }
        });

        const seq = (count % 100).toString().padStart(2, '0');
        const orderId = `ORD${year}${month}${day}${seq}`;

        

        const totalPrice = cartItems.reduce((total, item) => total + item.totalPrice, 0);
        const finalAmount = totalPrice;

        const order = new Order({
            userId,
            orderId,
            orderedItems: cartItems.map(item => ({
                product: item.productId._id,
                quantity: item.quantity,
                price: item.price,
            })),
            totalPrice,
            finalAmount,
            discount: cartDoc.discount || 0,
            address: orderAddress[0],
            status: 'Pending',
            paymentMethod,
            invoiceDate: new Date(),
        });

        const saveResult = await order.save();



        if (!saveResult) {
            return res.status(500).json({ success: false, message: 'Your order failed to complete!' });
        }

        for (let item of cartItems){
            const product = await Products.findById(item.productId._id)

            if(product){
                product.quantity -= item.quantity

                if(product.quantity <= 0) product.quantity = 0
                await product.save()
            }
        }

        req.session.orderId = orderId

        await Cart.findOneAndUpdate({ userId }, { $set: { items: [], discount: 0 } });

        return res.status(200).json({success : true , message : 'Order confirmed!'})

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