const User = require('../../model/userModel')
const Cart = require('../../model/cartModel')
const Coupon = require('../../model/couponModel')

const loadCoupon = async (req,res) => {
    try {
        
        const search = req.query.search || ''

        const userId = req.session.user

        const cart = await Cart.findOne({userId})
        
        const page = parseInt(req.query.page) || 1;
        const limit = 5;

        let query = {isList : true}
        
        if (search) {
            query.couponName  = { $regex: search.trim(), $options: 'i' };
        }
        
        const coupons = await Coupon.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();
        const totalCoupons = await Coupon.countDocuments(query)
        const totalPages = Math.ceil((totalCoupons >= 2 ? totalCoupons : 1) / limit)
        
        // console.log('Coupons : ',coupons)


        return res.render('coupon',{
            currentPage : 'coupon',
            search,
            coupons,
            cart,
            currentPages : page,
            totalPages,
        })

    } catch (error) {
        console.log('Failed to load the coupon page : ',error)
    }
}

const applyCoupon = async (req,res) => {
    try {

        const userId = req.session.user
        if(!userId){
            return res.status(401).json({ success :false, message : 'User not Authenticated...'})
        }
        
        const user = await User.findById(userId)
        if(!user){
            return res.status(401).json({ success :false, message : 'User not found...'})
        }
        
        const couponCode = req.body.couponCode

        const coupon = await Coupon.findOne({couponCode})

        if(!coupon){
            return res.status(401).json({ success : false, message : 'Coupon not found...'})
        }

        const cart = await Cart.findOne({userId})

        if(!cart){
            return res.status(401).json({ success : false, message : 'Cart not found...'})
        }

        if(cart.totalAmount < coupon.minOrder){
            return res.status(401).json({ success : false, message : `This coupon needs minimum RS- ${coupon.minOrder} order...` })
        }

        const today = new Date()

        if(coupon.validUpto < today){
            return res.status(401).json({ success : false, message : 'This coupon has been expired...'})
        }

        if( coupon.couponLimit <= 0){
            return res.status(401).json({ success : false, message : 'Coupon limit is over...'})
        }
        
        const couponDiscount = coupon.discount
        const totalAmount = cart.totalAmount
        const discount = Math.floor(coupon.discountType === 'percentage' ?  (totalAmount * couponDiscount) / 100 : couponDiscount)

        const finalAmount = Math.floor(totalAmount - discount)

        const totalGst = (Math.floor(finalAmount * 18 ) / 118)

        req.session.appliedCoupon = {
            code: couponCode,
            discount,
            finalAmount,
        };

        return res.status(200).json({success : true, message : 'Coupon applied successfully...', discount, finalAmount, totalGst})
        
    } catch (error) {
        console.log('Something went wrong while applying coupon : ', error)
        return res.status(500).json({ success :false, message : `Something went wrong while applying coupon : ${error.message}`, error})
    }
}

const removeCoupon = async (req,res) => {
    try {
        
        const userId = req.session.user
        if(!userId){
            return res.status(401).json({ success : false, message : 'User not authenticated..'})
        }

        const user = await User.findById(userId)
        if(!user){
            return res.status(401).json({ success : false, message : 'User not found..'})
        }

        const cart = await Cart.findOne({userId})
        if(!cart){
            return res.status(401).json({ success : false, message : 'Cart not found...'})
        }

        req.session.appliedCoupon = null;

        const finalAmount = cart.totalAmount

        const totalGst = cart.GST

        return res.status(200).json({ success : true , message : 'Coupon successfully removed..', finalAmount, totalGst})


    } catch (error) {
        console.log('Something went wrong while removing coupon : ', error)
        return res.status(500).json({ success :false, message : `Something went wrong while removing coupon : ${error.message}`, error})
    }
}

module.exports = {
    loadCoupon,
    applyCoupon,
    removeCoupon
}