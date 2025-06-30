const User = require("../../model/userModel")
const Order = require('../../model/orderModel')
const Products = require('../../model/productModel')
const Cart = require('../../model/cartModel')
const { search } = require("../../routes/userRouter")


const loadOrderSuccess = async (req,res) => { 
    try {

        const search = req.query.search || ''

        const userId = req.session.user

        if(!userId){
            return res.status(401).json({ success :false , message : 'User not authenticated!'})
        }

        const user = await User.findById(userId)

        if(!user){
            return res.status(401).json({ success : false , message : 'User not found!'})
        }

        const orderId = req.session.orderId

        const userOrder = await Order.findOne({orderId})
             .populate("orderedItems.product")


        console.log('Order : ', userOrder)

        if(!userOrder){
            return res.status(401).json({ success : false , message : 'Order not found!'})
        }
        
        console.log("Order ID from session:", orderId);

        return res.render('orderSuccess',{
            order : userOrder,
            search,
            currentPage : 'orderSuccess'
        })

    } catch (error) {
        console.log('Failed to render success : ',error )
    }
}

const loadMyOrders = async (req,res) => {
    try {

        const serch = req.query.search || ''
        
        const userId = req.session.user

        const userOrders = await Order.find({userId}).populate("orderedItems.product")

        // console.log('User Orders : ', userOrders)

        return res.render('myOrders',{
            orders : userOrders,
            search,
            currentPage : 'myOrders'
        })

    } catch (error) {
        console.log('Error while load my Order page : ', error)
    }
}

const loadOrderDetails = async (req,res) => {
    try {

        const search = req.query.search || ''
        
        const productId = req.query.id

        console.log('Product Id : ', productId)

        const userId = req.session.user

        if(!userId){
            return res.status(401).json({ success : false , message : 'User not authenticated!'})
        }

        const userOrders = await Order.find({userId}).populate("orderedItems.product")

        if(!userOrders){
            return res.status(401).json({ success : false , message : 'User Orders not found!!'})
        }

        let currentOrder = null
        let currentItem = null

        for (const order of userOrders) {
            for (const item of order.orderedItems) {
                if (item.product && item.product._id.toString() === productId) {
                    currentOrder = order;
                    currentItem = item;
                    break;
                }
            }
            if (currentItem) break;
        }
        

        console.log('Current order : ', currentOrder)
        console.log('Current item : ', currentItem)
        

        return res.render('orderDetails',{
            order : currentOrder,
            productItem : currentItem,
            search,
            currentPage : 'orderDetails'
        })



    } catch (error) {
        console.log('failed to load the order details : ', error)
        return res.status(500).json({ success : false , message : 'An error occurred while loading the order details!!'})        
    }
}


module.exports = {
    loadOrderSuccess,
    loadMyOrders,
    loadOrderDetails
}