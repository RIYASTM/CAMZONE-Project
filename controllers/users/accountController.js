const User = require('../../model/userModel')
const Cart = require('../../model/cartModel')

const loadMyAccount = async (req,res) => { 
    try {

        const userId = req.session.user

        const cart = await Cart.findOne({userId})
        
        return res.render('myAccount',{
            cart
        })


    } catch (error) {
        console.log('Failed to load the My Account Page : ',error)
    }
}



module.exports = {
    loadMyAccount
}