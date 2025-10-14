//Models
const User = require('../../model/userModel')
const Brands = require('../../model/brandModel')
const Products = require('../../model/productModel')
const Category = require('../../model/categoryModel')
const Cart = require('../../model/cartModel')
const Wishlist = require('../../model/wishlistModel')

//Helper Functions
const { handleStatus } = require('../../helpers/status')


const loadHomePage = async (req, res) => {
    try {

        const search = req.query.search || ''
        const userId = req.session.user;
        console.log("jj : ",req.session )

        const [user, brands, categories] = await Promise.all([
            User.findById(userId),
            Brands.find({ isDeleted: false, isBlocked: false }),
            Category.find({ isListed: true })
        ])

        const cart = userId ? await Cart.findOne({ userId }) : 0;

        const query = { isBlocked: false, isDeleted: false };

        if (search) {

            const [brandIds, categoryIds] = await Promise.all([
                Brands.find({
                    brandName: { $regex: search.trim(), $options: 'i' },
                    isBlocked: false
                }).distinct('_id'),
                Category.find({
                    name: { $regex: search.trim(), $options: 'i' },
                    isListed: true
                }).distinct('_id')
            ])

            query.$or = [
                { productName: { $regex: search.trim(), $options: 'i' } },
                { brand: { $in: brandIds } },
                { category: { $in: categoryIds } }
            ];
        }

        const products = await Products.find({
            ...query,
            category: { $in: categories.map(category => category._id) },
            productImage: { $exists: true, $ne: [] }
        })
            .populate('brand')
            .populate('category')
            .exec();

        const productsWithOffers = products.map(product => {
            const productOffer = product.productOffer || 0;
            const brandOffer = product.brand?.brandOffer || 0;
            const categoryOffer = product.category?.categoryOffer || 0;

            const totalOffer = Math.max(productOffer, brandOffer, categoryOffer);

            product.salePrice = Math.round(product.regularPrice - product.regularPrice / 100 * totalOffer)

            return {
                ...product._doc,
                productOffer,
                brandOffer,
                categoryOffer,
                totalOffer
            };
        });

        const wishList = await Wishlist.findOne({ userId }).populate('items.product')

        let wishlistItems = wishList ? wishList.items.map(item => item.product._id.toString()) : []

        const newProducts = productsWithOffers
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 8);

        return res.render('home', {
            user: user || '',
            search,
            cart,
            currentPage: 'home',
            brands,
            category: categories,
            newProducts,
            products: productsWithOffers,
            wishlistItems
        });

    } catch (error) {
        console.log('================================================');
        console.log('Failed to load home!!', error);
        console.log('================================================');
        return handleStatus(res, 500)
    }
}

module.exports = {
    loadHomePage
}