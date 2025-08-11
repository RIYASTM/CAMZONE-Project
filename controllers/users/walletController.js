const crypto = require('crypto');

const Wallet = require('../../model/walletModal')
const User = require('../../model/userModel')
const Cart = require('../../model/cartModel')


const {generateRazorpay} = require('../../helpers/razorpay')
const {addToWallet} = require('../../helpers/wallet')


const loadWallet = async (req,res) => {
    try {

        const search = req.query.search || '';
        const userId = req.session.user
        const user = await User.findById(userId)
        const cart = await Cart.findById(userId)

        const userWallet = await Wallet.findOne({userId})

        // console.log('Transaction : ', transactions)
        // console.log('User Wallet : ', userWallet)
        
        if(!userWallet){
            return res.render('wallet',{
                user,
                wallet : {balance : 0},
                transactions : [],
                currentPage : 'Wallet',
                cart,
                search,
                curretnPages : 1,
                totalPage : 2
            })
        }

        const transactions = userWallet.transactions || []
        
        return res.render('wallet',{
            currentPage : 'Wallet',
            user,
            search,
            cart,
            wallet : userWallet,
            transactions
        })

    } catch (error) {
        console.log('error on launching wallet page : ', error)
        // res.status(500).render('error', { message: 'Failed to load wallet.' });
        return res.redirect('/pageNotFound')
    }
} 

const addTowallet = async (req,res) => {
    try {

        const userId = req.session.user

        if(!userId){
            return res.status(401).json({ success : false, message : 'User not authenticated!!'})
        }

        const user = await User.findById(userId)

        if(!user){
            return res.status(401).json({ success : false, message : 'User not found!!'})
        }

        const amount = parseInt(req.body.amount)

        if(amount > 90000 ){
            return res.status(401).json({ success : false, message : 'Not allowed for the amount above 90000'})
        }

        const razorpayOrder = await generateRazorpay(amount)

        razorpayOrder.razorpayOrderId = razorpayOrder.id;
        return res.status(200).json({
            success : true,
            amount : amount,
            razorpayOrder,
            user,
            message : 'Razorpay Order Created!',
        })

    } catch (error) {
        console.log("Something went wrong while generating razorpay : ", error)
        return res.status(500).json({ success : false, message : 'Something went wrong while generating razorpay'})
    }
}

const verifyAmount = async (req,res) => {
    try {

        const {razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body

        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);
        hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const generatedSignature = hmac.digest('hex');

        if(razorpaySignature !== generatedSignature){
            console.log('Invalid signature:', { razorpayOrderId, razorpayPaymentId, generatedSignature, razorpaySignature });
            return res.status(401).json({success : false, message : 'Failed with razorpay!!'})
        }

        const amount = parseInt(req.body.amount)
        const userId = req.session.user
        const reason = 'Added money to wallet!!'

        const {success, message} = await addToWallet(userId,amount, reason)

        if(success === false){
            return res.status(401).json({ success, message : message ||  'Money adding to wallet failed!!'})
        }

        return res.status(200).json({ success , message : message || 'Successfully added to your wallet!!'})
        
    } catch (error) {
        console.log('Something went wrong with this  : ', error)
        return res.status(500).json({ success : false, message : 'Something went wrong!!!!'})
    }
}

module.exports = {
    loadWallet,
    addTowallet,
    verifyAmount
}