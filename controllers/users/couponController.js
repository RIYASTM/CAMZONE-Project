const User = require('../../model/userModel')
const Cart = require('../../model/cartModel')

const loadCoupon = async (req,res) => {
    try {
        
        const search = req.query.search || ''

        const userId = req.session.user

        const cart = await Cart.findOne({userId})



        return res.render('coupon',{
            currentPage : 'coupon',
            search,
            cart
        })

    } catch (error) {
        console.log('Failed to load the coupon page : ',error)
    }
}


module.exports = {
    loadCoupon
}