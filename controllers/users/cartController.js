const User = require('../../model/userModel')
const Products = require('../../model/productModel')
const Brands = require('../../model/brandModel')
const Category = require('../../model/categoryModel')
const Cart = require('../../model/cartModel')
const WishList = require('../../model/wishlistModel')



const loadCart = async (req, res) => {
    try {
        const search = req.query.search || '';
        const userId = req.session.user;
        const user = await User.findById(userId);
        const cart = await Cart.findOne({ userId });

        let cartItems = [];
        let subTotal = 0;

        let totalOfferPrice = 0
        let totalOfferedPrice = 0

        if (cart && cart.items.length > 0) {
            cartItems = cart.items.filter(item => !item.isDeleted);

            for (let item of cartItems) {
                const product = await Products.findOne({ _id: item.productId, isBlocked: false }).populate('category').populate('brand');

                if (product && !product.isBlocked) {
                    item.productId = product;

                    const productOffer = product.productOffer || 0;
                    const categoryOffer = product.category?.categoryOffer || 0;
                    console.log('category Offer : ', categoryOffer)
                    const brandOffer = product.brand?.brandOffer || 0;
                    console.log('brand Offer : ',brandOffer)

                    const totalOffer = productOffer + categoryOffer + brandOffer;
                    console.log('totalOffer : ', totalOffer)

                    const discountedPrice = Math.round(product.regularPrice * (1 - totalOffer / 100));
                    console.log('discounted Price : ', discountedPrice)

                    item.itemPrice = product.regularPrice;
                    item.discount = totalOffer;
                    item.price = discountedPrice
                    item.totalPrice = discountedPrice * item.quantity;
                    subTotal += item.totalPrice;
                } else {
                    item.productId = null;
                }
            }


            cartItems = cartItems.filter(item => item.productId !== null);
            cart.totalAmount = cartItems.reduce((total, item) => total + item.totalPrice, 0);
            console.log('cart Items : ', cartItems)
            
            await cart.save();
            
            totalOfferPrice = cartItems.reduce((total, item) => total + (item.itemPrice * item.quantity), 0);
            totalOfferedPrice = totalOfferPrice - cart.totalAmount  || 0;
            
        }

        const total = subTotal;

        return res.render('cart', {
            user,
            currentPage: 'cart',
            cartItems,
            search,
            subtotal: subTotal,
            total,
            cart,
            totalOfferedPrice
        });
    } catch (error) {
        console.log('Failed to load the cart page:', error);
        return res.redirect('/pageNotFound');
    }
};


const addToCart = async (req, res) => {
    try {
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not Authenticated!!' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found!!' });
        }

        const { productId, quantity } = req.body;
        
        const wishList = await WishList.findOne({user : userId}).populate('items.product')
        
        const wishlistItem = wishList.items.find(item => item.product._id.toString() === productId.toString())

        if(wishlistItem){
            await WishList.updateOne({user : userId} , {$pull : {items : {product : productId}}})
        }

        const product = await Products.findOne({ _id: productId, isDeleted: false, isBlocked: false }).populate('category').populate('brand');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found!!' });
        }

        
        // Offer Section
        const productOffer = product.productOffer || 0
        const categoryOffer = product.category.categoryOffer || 0
        const brandOffer = product.brand.brandOffer || 0

        
        
        const offer = categoryOffer + brandOffer
        const totalOffer = productOffer + offer
        console.log('total Offer : ', totalOffer)


        const stock = product.quantity;
        console.log('product stock : ', product.quantity)
        const parsedQuantity = parseInt(quantity);

        const discountedPrice = Math.round(product.regularPrice * (1 - totalOffer / 100));

        console.log('discounted Price : ', discountedPrice)

        const newCartItem = {
            productId: product._id,
            quantity: parsedQuantity,
            discount: totalOffer,
            itemPrice: product.regularPrice,
            price: discountedPrice,
            totalPrice: discountedPrice * parsedQuantity,
            status: product.status
        };


        
        let cartDoc = await Cart.findOne({ userId });
        
        if (!cartDoc) {
            cartDoc = new Cart({ userId, items: [newCartItem] });
        }

        const existingItem = cartDoc.items.find(item => item.productId.toString() === productId);

        const totalQuantity = existingItem ? existingItem.quantity + parsedQuantity : parsedQuantity;

        if (totalQuantity > stock) {
            return res.status(401).json({ success: false, message: 'Quantity exceeded available stock' });
        }
        
        if (existingItem) {

            existingItem.quantity += parsedQuantity;
            existingItem.discount = totalOffer;
            existingItem.itemPrice = product.regularPrice;
            existingItem.price = discountedPrice;
            existingItem.totalPrice = discountedPrice * parsedQuantity;


        } else {
            cartDoc.items.push(newCartItem);
        }

        
        
        cartDoc.totalAmount = cartDoc.items.reduce((sum, item) => sum + item.totalPrice, 0);
        
        const savedCart = await cartDoc.save();
        
        if (!savedCart) {
            return res.status(401).json({ success: false, message: 'Product adding failed' });
        }
        console.log('cart doc : ', cartDoc)

        return res.status(200).json({
            success: true,
            message: "Product added successfully",
            redirectUrl: '/cart'
        });

    } catch (error) {
        console.error('Failed to add to the cart:', error);
        return res.status(500).json({ success: false, message: 'Error occurred while adding to the cart!!' });
    }
};


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
    removeItem,
}