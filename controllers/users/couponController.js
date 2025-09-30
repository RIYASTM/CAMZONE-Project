const User = require('../../model/userModel')
const Cart = require('../../model/cartModel')
const Coupon = require('../../model/couponModel')

const loadCoupon = async (req, res) => {
    try {

        const search = req.query.search || ''
        const userId = req.session.user

        const page = parseInt(req.query.page) || 1;
        const limit = 5;

        let query = { isList: true }

        if (search) {
            query.couponName = { $regex: search.trim(), $options: 'i' };
        }

        const [cart, coupons, totalCoupons] = await Promise.all([
            Cart.findOne({ userId }),
            Coupon.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit)
                .exec(),
            Coupon.countDocuments(query)
        ])

        const totalPages = Math.max(1, Math.ceil(totalCoupons / limit))

        return res.render('coupon', {
            currentPage: 'coupon',
            search,
            coupons,
            cart,
            currentPages: page,
            totalPages,
        })

    } catch (error) {
        console.log('Failed to load the coupon page : ', error)
    }
}

const applyCoupon = async (req, res) => {
    try {

        const userId = req.session.user
        const { couponCode, shippingCharge } = req.body

        const [user, coupon, cart] = await Promise.all([
            User.findById(userId),
            Coupon.findOne({ couponCode }),
            Cart.findOne({ userId })
        ])

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found...' })
        } else if (!coupon) {
            return res.status(401).json({ success: false, message: 'Coupon not found...' })
        } else if (!cart) {
            return res.status(401).json({ success: false, message: 'Cart not found...' })
        }

        const timeNow = new Date()

        if (timeNow > coupon.validUpto) {
            return res.status(401).json({ success: false, message: 'Coupon has been expired...' })
        }

        if (coupon.discountType === 'fixed') {
            if (cart.totalAmount <= coupon.discount) {
                return res.status(401).json({ success: false, message: `Your order needs to be more than - ${coupon.discount}...` })
            }
        }

        if (cart.totalAmount < coupon.minOrder) {
            return res.status(401).json({ success: false, message: `Your order needs to be more than RS- ${coupon.minOrder} order...` })
        } else if (cart.totalAmount > coupon.maxOrder) {
            return res.status(401).json({ success: false, message: `This order should under RS- ${coupon.maxOrder}..` })
        }

        if (coupon.couponLimit <= 0) {
            return res.status(401).json({ success: false, message: 'Coupon limit is over...' })
        }

        const couponDiscount = coupon.discount
        const totalAmount = cart.totalAmount + Number(shippingCharge)
        const discount = Math.floor(coupon.discountType === 'percentage' ? (totalAmount * couponDiscount) / 100 : couponDiscount)

        const finalAmount = Math.floor(totalAmount - discount)

        const totalGst = Math.floor((finalAmount * 18) / 118)

        req.session.appliedCoupon = {
            code: couponCode,
            discount,
            finalAmount,
        };

        return res.status(200).json({ success: true, message: 'Coupon applied successfully...', discount, finalAmount, totalGst })

    } catch (error) {
        console.log('Something went wrong while applying coupon : ', error)
        return res.status(500).json({ success: false, message: `Something went wrong while applying coupon : ${error.message || error.stack}`, error })
    }
}

const removeCoupon = async (req, res) => {
    try {

        const shippingCharge = req.body.shippingCharge

        const userId = req.session.user

        const [user, cart] = await Promise.all([
            User.findById(userId),
            Cart.findOne({ userId })
        ])

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found..' })
        }
        if (!cart) {
            return res.status(401).json({ success: false, message: 'Cart not found...' })
        }

        req.session.appliedCoupon = null;

        const finalAmount = cart.totalAmount + Number(shippingCharge)
        const totalGst = Math.floor(cart.GST)

        return res.status(200).json({ success: true, message: 'Coupon successfully removed..', finalAmount, totalGst })

    } catch (error) {
        console.log('Something went wrong while removing coupon : ', error)
        return res.status(500).json({ success: false, message: `Something went wrong while removing coupon : ${error.message}`, error })
    }
}

module.exports = {
    loadCoupon,
    applyCoupon,
    removeCoupon
}