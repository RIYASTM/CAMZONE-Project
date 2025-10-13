const User = require('../../model/userModel');
const Cart = require('../../model/cartModel');
const Coupon = require('../../model/couponModel');

const { handleStatus } = require('../../helpers/status');

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
        return handleStatus(res, 500)
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
            return handleStatus(res, 401, 'User not found!!');
        } else if (!coupon) {
            return handleStatus(res, 401, 'Coupon not found!!');
        } else if (!cart) {
            return handleStatus(res, 401, 'Cart not found!!');
        }

        if (req.session.appliedCoupon) {
            return handleStatus(res, 402, 'You have already applied coupon. Remove it first!!')
        }

        const timeNow = new Date()

        if (timeNow > coupon.validUpto) {
            return handleStatus(res, 401, 'Coupon has been expired!!');
        }

        if (coupon.discountType === 'fixed') {
            if (cart.totalAmount <= coupon.discount) {
                return handleStatus(res, 401, `Your order needs to be more than - ${coupon.discount}...`);
            }
        }

        if (cart.totalAmount < coupon.minOrder) {
            return handleStatus(res, 401, `Your order needs to be more than RS- ${coupon.minOrder} order...`);
        } else if (cart.totalAmount > coupon.maxOrder) {
            return handleStatus(res, 401, `This order should under RS- ${coupon.maxOrder}..`);
        }

        if (coupon.couponLimit <= 0) {
            return handleStatus(res, 401, 'Coupon limit is over...');
        }

        const couponDiscount = coupon.discount
        const totalAmount = cart.totalAmount + Number(shippingCharge)
        const discount = Math.floor(coupon.discountType === 'percentage' ? (totalAmount * couponDiscount) / 100 : couponDiscount)

        const finalAmount = Math.floor(totalAmount - discount)

        req.session.appliedCoupon = {
            code: couponCode,
            discount,
            finalAmount,
        };

        return handleStatus(res, 200, 'Coupon applied successfully!!', {
            discount,
            finalAmount,
        })

    } catch (error) {
        console.log('Something went wrong while applying coupon : ', error)
        return handleStatus(res, 500);
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
            return handleStatus(res, 402, 'User not found!!');
        }
        if (!cart) {
            return handleStatus(res, 402, 'Cart is not found!!');
        }

        req.session.appliedCoupon = null;

        const finalAmount = cart.totalAmount + Number(shippingCharge)

        return handleStatus(res, 200, 'Coupon removed!!', { finalAmount });

    } catch (error) {
        console.log('Something went wrong while removing coupon : ', error)
        return handleStatus(res, 500);
    }
}

module.exports = {
    loadCoupon,
    applyCoupon,
    removeCoupon
}