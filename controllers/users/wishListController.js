const Wishlist = require('../../model/wishlistModel')
const Product = require('../../model/productModel')
const User = require('../../model/userModel')
const Cart = require('../../model/cartModel')



const loadWishList = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);
        if (!user) return res.redirect('/login');

        const cart = await Cart.findById(userId);
        const wishList = await Wishlist.findOne({ userId }).populate('items.product');

        return res.render('wishList', {
            currentPage: 'WishList',
            user,
            cart,
            search: req.query.search || '',
            wishlistItems: wishList ? wishList.items : []
        });

    } catch (error) {
        console.error('Error while launching wish List:', error);
        return res.status(500).render('error', { message: 'Failed to load wishlist.' });
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

        let wishlist = await Wishlist.findOne({ userId }).populate('items.product');

        if (!wishlist) {
            wishlist = new Wishlist({
                userId,
                items: [{ product : product._id }]
            });
        } else {
            const alreadyExists = wishlist.items.some(item => item.product._id.toString() === product._id.toString);
            if (alreadyExists) {
                return res.status(400).json({ success: false, message: 'Product already in wishlist.' });
            }

            wishlist.items.push({product : product._id });
        }

        await wishlist.save();

        return res.status(200).json({ success: true, message: 'Product successfully added to Wish List.' });

    } catch (error) {
        console.error('Error while adding to wishList:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
      

const removeFromWishList = async (req, res) => {
    try {
        const userId = req.session.user;
        const { productId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }

        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist not found.' });
        }

        const initialLength = wishlist.items.length;

        wishlist.items = wishlist.items.filter(
            item => item.product._Id.toString() !== productId
        );

        if (wishlist.items.length === initialLength) {
            return res.status(400).json({ success: false, message: 'Product not found in wishlist.' });
        }

        await wishlist.save();

        return res.status(200).json({ success: true, message: 'Product removed from wishlist.' });

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