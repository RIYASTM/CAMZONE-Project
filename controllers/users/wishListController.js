const Wishlist = require('../../model/wishlistModel')
const Product = require('../../model/productModel')
const User = require('../../model/userModel')
const Cart = require('../../model/cartModel')



const loadWishList = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);
        if (!user) return res.redirect('/login');

        const cart = await Cart.findOne({userId}).populate('items.productId')

        const wishList = await Wishlist.findOne({ user : userId }).populate('items.product');
        return res.render('wishList', {
            currentPage: 'WishList',
            user,
            cart,
            search: req.query.search || '',
            wishlistItems : wishList.items || []
        });

    } catch (error) {
        console.error('Error while launching wish List:', error);
        return res.status(500).redirect('/pageNotFound');
    }
}


const addtoWishlist = async (req, res) => {
    try {
        const userId = req.session.user;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }

        const { productId } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        let wishlist = await Wishlist.findOne({ user : userId }).populate('items.product');

        if (!wishlist) {
            wishlist = new Wishlist({
                userId,
                items: [{ product : product._id }]
            });

            await wishlist.save();

            return res.status(200).json({ success: true, message: 'Product successfully added to Wish List.', done : 'Added', wishlist });

        }

        const alreadyExists = wishlist.items.some(item => item.product._id.toString() === product._id.toString())

        console.log('Exist product : ',alreadyExists)

        if (alreadyExists) {
            const removeItem = await Wishlist.updateOne({user : userId} , {$pull : {items : {product : product._id}}})

            if(!removeItem){
                
                return res.status(400).json({ success : false , message : 'Failed to remove from the Wish List.'})
            
            }

            res.status(200).json({ success : true , message : 'Product successfully removed from the Wish List.', done : 'Removed' , wishlist})
            
            return await wishlist.save();
        }

        wishlist.items.push({product : product._id });
        

        await wishlist.save();

        return res.status(200).json({ success: true, message: 'Product successfully added to Wish List.', done : 'Added' , wishlist});

    } catch (error) {
        console.error('Error while adding to wishList:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
      

const removeFromWishList = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }

        const wishlist = await Wishlist.findOne({ user: userId }); 

        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist not found.' });
        }

        const initialLength = wishlist.items.length;

        const result = await Wishlist.updateOne(
            { user: userId },
            { $pull: { items: { product: productId } } } 
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({ success: false, message: 'Product not found in wishlist.' });
        }

        res.status(200).json({
            success: true,
            message: 'Product successfully removed from the Wish List.',
        });

    } catch (error) {
        console.log('Error while removing from wishlist:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};


module.exports = {
    loadWishList,
    addtoWishlist,
    removeFromWishList
}