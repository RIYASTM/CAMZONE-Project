const Wishlist = require('../../model/wishlistModel')
const Product = require('../../model/productModel')
const User = require('../../model/userModel')
const Cart = require('../../model/cartModel')
const Category = require('../../model/categoryModel')
const Brand = require('../../model/brandModel')



const loadWishList = async (req, res) => {
    try {
        const userId = req.session.user;

        const [user, cart, wishList] = await Promise.all([
            User.findById(userId),
            Cart.findOne({ userId }).populate('items.productId') || { items: [] },
            Wishlist.findOne({ userId }).populate({
                path: 'items.product',
                populate: [
                    { path: 'brand' },
                    { path: 'category' }
                ]
            })
        ])
        if (!user) return res.redirect('/signin');

        if (!wishList) {
            return res.render('wishList', {
                currentPage: 'WishList',
                user,
                cart,
                search: req.query.search || '',
                wishlistItems: []
            });
        }

        const productsWithOffers = wishList.items.map(item => {
            const product = item.product;

            const productOffer = product.productOffer || 0;
            const brandOffer = product.brand?.brandOffer || 0;
            const categoryOffer = product.category?.categoryOffer || 0;

            const totalOffer = Math.max(productOffer, brandOffer, categoryOffer);

            const salePrice = Math.round(
                product.regularPrice - (product.regularPrice / 100 * totalOffer)
            );

            return {
                ...item._doc,
                product: {
                    ...product._doc,
                    salePrice,
                    totalOffer,
                    productOffer,
                    brandOffer,
                    categoryOffer
                }
            };
        });

        return res.render('wishList', {
            currentPage: 'WishList',
            user,
            cart,
            search: req.query.search || '',
            wishlistItems: productsWithOffers
        });

    } catch (error) {
        console.error('Error while launching wish List:', error);
        return res.status(500).redirect('/pageNotFound');
    }
};


const addtoWishlist = async (req, res) => {
    try {

        const userId = req.session.user;
        const { productId } = req.body;
        const [user, product, cart] = await Promise.all([
            User.findById(userId),
            Product.findById(productId),
            Cart.findOne({ userId }).populate('items.productId')            
        ])

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        const existInCart = cart?.items.find(
            (item) => item.productId._id.toString() === productId
        );

        if (existInCart) {
            return res
                .status(402)
                .json({ success: false, message: 'Item already in your cart!!!' });
        }

        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = new Wishlist({
                userId,
                items: [{ product: product._id }],
            });

            await wishlist.save();

            return res.status(200).json({
                success: true,
                message: 'Product successfully added to Wish List.',
                done: 'Added',
                wishlist,
            });
        }

        const alreadyExists = wishlist.items.some(
            (item) => item.product.toString() === product._id.toString()
        );

        if (alreadyExists) {
            await Wishlist.updateOne(
                { userId },
                { $pull: { items: { product: product._id } } }
            );

            return res.status(200).json({
                success: true,
                message: 'Product successfully removed from the Wish List.',
                done: 'Removed',
            });
        }

        wishlist.items.push({ product: product._id });

        await wishlist.save();

        return res.status(200).json({
            success: true,
            message: 'Product successfully added to Wish List.',
            done: 'Added',
            wishlist,
        });
    } catch (error) {
        console.error('Error while adding to wishList:', error);
        return res
            .status(500)
            .json({ success: false, message: 'Internal server error.' });
    }
};

const removeFromWishList = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user;

        const [user, wishlist] = await Promise.all([
            User.findById(userId),
            Wishlist.findOne({ userId })
        ])

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }
        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist not found.' });
        }

        const result = await Wishlist.updateOne(
            { userId },
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