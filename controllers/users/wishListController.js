const Wishlist = require('../../model/wishlistModel')
const Product = require('../../model/productModel')
const User = require('../../model/userModel')
const Cart = require('../../model/cartModel')
const Category = require('../../model/categoryModel')
const Brand = require('../../model/brandModel')

const { handleStatus } = require('../../helpers/status')


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
        return handleStatus(res, 500)
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
            return handleStatus(res, 401, 'User not found!!');
        }

        if (!product) {
            return handleStatus(res, 404, 'Product not found!!');
        }

        const existInCart = cart?.items.find(
            (item) => item.productId._id.toString() === productId
        );

        if (existInCart) {
            return handleStatus(res, 402, 'Item already in your cart!!');
        }

        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = new Wishlist({
                userId,
                items: [{ product: product._id }],
            });

            await wishlist.save();

            return handleStatus(res, 200, 'Product added to wish list!', {
                done: 'Added',
                wishlist
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

            return handleStatus(res, 200, 'Product removed from the wish list!!', {
                done: 'Removed'
            });
        }

        wishlist.items.push({ product: product._id });

        await wishlist.save();

        return handleStatus(res, 200, 'Product added to Wish List!!', {
            done: 'Added',
            wishlist
        });
    } catch (error) {
        console.error('Error while adding to wishList:', error);
        return handleStatus(res, 500);
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
            return handleStatus(res, 401, 'User not found!!');
        }
        if (!wishlist) {
            return handleStatus(res, 404, 'Wishlist not found!');
        }

        const result = await Wishlist.updateOne(
            { userId },
            { $pull: { items: { product: productId } } }
        );

        if (result.modifiedCount === 0) {
            return handleStatus(res, 400, 'Product not found in Wishlist!!');
        }

        return handleStatus(res, 200, 'Product removed from the Wish List');

    } catch (error) {
        console.log('Error while removing from wishlist:', error);
        return handleStatus(res, 500);
    }
};


module.exports = {
    loadWishList,
    addtoWishlist,
    removeFromWishList
}