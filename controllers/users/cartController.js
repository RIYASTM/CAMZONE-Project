const User = require('../../model/userModel')
const Products = require('../../model/productModel')
const Brands = require('../../model/brandModel')
const Category = require('../../model/categoryModel')
const Cart = require('../../model/cartModel')



const loadCart = async (req,res) => {
    try {

        search = req.query.search || ''

        const userId = req.session.user

        const user = await User.findById(userId)

        const cart = await Cart.findOne({ userId });


        let cartItems = []
        let subTotal = 0

        if(cart && cart.items.length > 0 ){ 
            cartItems = cart.items.filter(item => !item.isDeleted)

            
            for( let item of cartItems){

                let product = await Products.findOne({_id : item.productId , isBlocked : false})

                if(product){

                    item.product = product

                    console.log('Cart item quantity : ', item.quantity)

                    item.price = product.salePrice
                    item.totalPrice = product.salePrice * item.quantity
                    subTotal += product.salePrice * item.quantity



                }else {
                    item.product = null
                }
            }

            cartItems = cartItems.filter(item => item.product !== null)
        }

        cart.totalAmount = cart.items.reduce((total, item) => total += item.totalPrice,0)

        console.log('Total Price : ', cart.totalAmount)



        // cart.totalAmount = 

        // console.log('Cart total : ',cart.totalPrice)
        
        const total = subTotal;

        // console.log('Cart length : ', cart.items.length)

        // console.log('Total price : ', total)

        return res.render('cart', {
            user,
            currentPage: 'cart',
            cartItems: cartItems, 
            search,
            subtotal: subTotal,
            total: total,
            cart
        });

    } catch (error) {
        console.log('Failed to load the cart page : ', error)
        return res.redirect('/pageNotFound')
    }
}

const addToCart = async (req,res) => {
    try {
        
        const userId = req.session.user

        if(!userId){
            return res.status(401).json({success : false , message : 'User not Authenticated!!'})
        }

        const user = await User.findById(userId)

        if(!user){
            return res.status(404).json({ success :false , message : 'User not found!!'})
        }

        const {productId, quantity} = req.body

        const product = await Products.findById(productId , {isDeleted : false, isBlocked :false})

        if(!product){
            return res.status(404).json({ success : false , message : 'Product not found!!'})
        }

        const stock = product.quantity
        const parsedQuantity = quantity

        if(parsedQuantity > stock){
            console.log('hi')
            return res.status(401).json({success : false , message : 'Quantity exeeded over the stock'})
        }

        const newCart = {
            productId: product._id,
            quantity: parseInt(quantity), 
            price: product.regularPrice,
            totalPrice: product.salePrice * parseInt(quantity), 
            status: product.status
        };

        let cartDoc = await Cart.findOne({ userId });
        if (!cartDoc) {
            cartDoc = new Cart({ userId, itmes: [newCart] });
        } else {
            const existItem = cartDoc.items.find(item => item.productId.toString() === productId);
            if (existItem) {
                existItem.quantity += parseInt(quantity)
                existItem.totalPrice = existItem.quantity * product.salePrice
            }else{
                cartDoc.items.push(newCart);
            }
        }

        cartDoc.totalAmount = cartDoc.items.reduce((total, item) => total += item.totalPrice , 0)

        const saveCart = await cartDoc.save()

        if(!saveCart){
            return res.status(401).json({ success :false , message : 'Product adding failed'})
        }

        return res.status(200).json({ success : true , message : "Product added successfully" , redirectUrl : '/cart'})

    } catch (error) {

        console.log('Failed to add to the cart : ',error)
        return res.status(500).json({ success : false , message : 'Error occurred while adding to the cart!!'})
    }
}

const cartUpdate = async (req,res) => {
    try {
        
        const userId = req.session.user

        if(!userId){
            return res.status(401).json({success : false , message : 'User not Authenticated!!'})
        }

        const user = await User.findById(userId)

        if(!user){
            return res.status(404).json({ success :false , message : 'User not found!!'})
        }

        const {productId, quantity} = req.body

        console.log('quantity : ', quantity)

        const product = await Products.findById(productId , {isDeleted : false, isBlocked :false})

        if(!product){
            return res.status(404).json({ success : false , message : 'Product not found!!'})
        }

        const stock = product.quantity
        console.log('Product stock : ', stock)
        const parsedQuantity = parseInt(quantity)


        if(parsedQuantity > stock){
            return res.status(401).json({success : false , message : `Quantity exeeded over the stock of ${product.productName}`})
        }

        let cartDoc = await Cart.findOne({ userId });

        const existItem = cartDoc.items.find(item => item.productId.toString() === productId);
        if (existItem) {
            existItem.quantity = parsedQuantity
            existItem.totalPrice = existItem.quantity * product.salePrice
        }else {
            return res.status(404).json({success : false, message : 'Item not found'})
        }
        
        cartDoc.totalAmount = cartDoc.items.reduce((total,item) => total + item.totalPrice, 0)

        const saveCart = await cartDoc.save()

        if(!saveCart){
            return res.status(401).json({ success :false , message : 'Product updating failed'})
        }

        return res.status(200).json({ success : true , message : "Product updated successfully"})


    } catch (error) {
        console.log('Failed to update to the cart : ',error)
        return res.status(500).json({ success : false , message : 'Error occurred while updating to the cart!!'})
    }
}

const removeItem = async (req,res) => {
    try {
        
        const userId = req.session.user

        if(!userId){
            return res.status(401).json({success : false , message : 'User not Authenticated!!'})
        }

        const user = await User.findById(userId)

        if(!user){
            return res.status(404).json({ success :false , message : 'User not found!!'})
        }

        const {productId} = req.body

        const product = await Products.findById(productId , {isDeleted : false, isBlocked :false})

        if(!product){
            return res.status(404).json({ success : false , message : 'Product not found!!'})
        }

        const cartDoc = await Cart.findOne({userId})

        if(!cartDoc){
            return res.status(401).json({success : false , message : 'Cart is not found!!'})
        }

        // const cartItem = cartDoc.items.find(item => item.productId.toString() === productId);

        const removeItem = cartDoc.items.findIndex(item => item.productId.toString() === productId)

        if(removeItem === -1){
            return res.status(401).json({ success :false , message : 'Item not found in cart'})
        }

        cartDoc.items.pull({productId})

        cartDoc.totalAmount = cartDoc.items.reduce((sum,item) => sum + item.totalPrice, 0)

        const saveUpdate = await cartDoc.save()
        if(!saveUpdate){
            return res.stauts(401).json({success  : false , message : 'Item deleting failed!!'})
        }

        return res.status(200).json({ success : true , message : "Product deleted successfully"})

    } catch (error) {
        console.log('Failed to delete to the cart : ',error)
        return res.status(500).json({ success : false , message : 'Error occurred while deleting to the cart!!'})
    }
}


module.exports = {
    loadCart,
    addToCart,
    cartUpdate,
    removeItem
}