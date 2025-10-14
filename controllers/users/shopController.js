//Models
const User = require('../../model/userModel')
const Brands = require('../../model/brandModel')
const Products = require('../../model/productModel')
const Category = require('../../model/categoryModel')
const Cart = require('../../model/cartModel')
const Wishlist = require('../../model/wishlistModel')

//Helper Functions
const { handleStatus } = require('../../helpers/status')



//Products Displaying with Filters
const loadShop = async (req, res) => {
    try {
        const search = req.query.search || '';
        const usermail = req.session.usermail;
        const brand = req.query.brand;
        const category = req.query.category;
        const price = req.query.price;
        const sortName = req.query.sortName;
        const stock = req.query.sortQuantity;

        const query = { isDeleted: false, isBlocked: false };

        const userId = req.session.user

        const user = await User.findById(userId);

        const cart = userId ? await Cart.findOne({ userId }) : 0

        let queryParts = [];
        let sortOption = {};

        if (price) {
            switch (price) {
                case 'LOW-HIGH':
                    sortOption.salePrice = 1;
                    queryParts.push(`price=${encodeURIComponent(price)}`);
                    break;
                case 'HIGH-LOW':
                    sortOption.salePrice = -1;
                    queryParts.push(`price=${encodeURIComponent(price)}`);
                    break;

                case 'below-10000':
                    query.salePrice = { $lt: 10000 };
                    queryParts.push(`price=${encodeURIComponent(price)}`);
                    break;
                case '10000-50000':
                    query.salePrice = { $gte: 10000, $lt: 50000 };
                    queryParts.push(`price=${encodeURIComponent(price)}`);
                    break;
                case '50000-100000':
                    query.salePrice = { $gte: 50000, $lt: 100000 };
                    queryParts.push(`price=${encodeURIComponent(price)}`);
                    break;
                case '100000-500000':
                    query.salePrice = { $gte: 100000, $lt: 500000 };
                    queryParts.push(`price=${encodeURIComponent(price)}`);
                    break;
                case 'above-500000':
                    query.salePrice = { $gte: 500000 };
                    queryParts.push(`price=${encodeURIComponent(price)}`);
                    break;

                default:
                    console.log('Invalid Entry');
                    break;
            }
        }

        if (category) {
            const categoryFilter = category ? (Array.isArray(category) ? category : [category]) : [];
            if (categoryFilter.length > 0) {
                query.category = { $in: categoryFilter };

                if (Array.isArray(category)) {
                    category.forEach(cat => {
                        queryParts.push(`category=${encodeURIComponent(cat)}`);
                    });
                } else {
                    queryParts.push(`category=${encodeURIComponent(category)}`);
                }
            }
        }

        if (brand) {
            const brandFilter = brand ? (Array.isArray(brand) ? brand : [brand]) : [];
            if (brandFilter.length > 0) {
                query.brand = { $in: brandFilter };

                if (Array.isArray(brand)) {
                    brand.forEach(b => {
                        queryParts.push(`brand=${encodeURIComponent(b)}`);
                    });
                } else {
                    queryParts.push(`brand=${encodeURIComponent(brand)}`);
                }
            }
        }

        if (sortName) {
            if (sortName === 'A-Z') {
                sortOption.productName = 1;
                queryParts.push(`sortName=${encodeURIComponent(sortName)}`);
            } else if (sortName === 'Z-A') {
                sortOption.productName = -1;
                queryParts.push(`sortName=${encodeURIComponent(sortName)}`);
            }
        }

        let finalQuery = queryParts.join('&');

        if (search) {
            queryParts.push(`search=${encodeURIComponent(search)}`);

            const brandIds = await Brands.find({
                brandName: { $regex: search.trim(), $options: 'i' },
                isBlocked: false
            }).distinct('_id');

            const categoryIds = await Category.find({
                name: { $regex: search.trim(), $options: 'i' },
                isListed: true
            }).distinct('_id');

            query.$or = [
                { productName: { $regex: search.trim(), $options: 'i' } },
                { brand: { $in: brandIds } },
                { category: { $in: categoryIds } },
            ];
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const skip = (page - 1) * limit;

        const products = await Products.find(query)
            .sort(sortOption)
            .populate('brand')
            .populate('category')
            .skip(skip)
            .limit(limit)
            .exec();

        const productsWithOffers = products.map(product => {
            const productOffer = product.productOffer || 0;
            const brandOffer = product.brand?.brandOffer || 0;
            const categoryOffer = product.category?.categoryOffer || 0;

            const totalOffer = Math.max(productOffer, brandOffer, categoryOffer);
            product.totalOffer = totalOffer

            product.salePrice = Math.round(product.regularPrice - product.regularPrice / 100 * totalOffer)

            return {
                ...product._doc,
                productOffer,
                brandOffer,
                categoryOffer,
                totalOffer
            };
        });

        const [brands, categories, totalProducts, wishList] = await Promise.all([
            Brands.find({ isDeleted: false, isBlocked: false }),
            Category.find({ isListed: true }),
            Products.countDocuments({
                isDeleted: false,
                isBlocked: false,
                ...query
            }),
            Wishlist.findOne({ userId }).populate('items.product')
        ])

        let wishlistItems = wishList ? wishList.items.map(item => item.product._id.toString()) : []

        const totalPages = Math.ceil((totalProducts >= 2 ? totalProducts : 1) / limit);

        return res.render('shop', {
            user: user || '',
            search,
            cart,
            brands,
            category: categories,
            products: productsWithOffers || [],
            currentPage: 'shop',
            currentPages: page,
            totalPages,
            finalQuery,
            wishlistItems
        });

    } catch (error) {
        console.log('================================================');
        console.log('Failed to load shop!!', error);
        console.log('================================================');
        return handleStatus(res, 500)
    }
}

module.exports = {
    loadShop
}