const Products = require('../../model/productModel')
const Brands = require('../../model/brandModel')
const Category = require('../../model/categoryModel')

const { validateProductForm } = require('../../helpers/validations')


const loadProducts = async (req, res) => {
    try {

        const search = req.query.search || ''
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit

        const query = { isDeleted: false };

        if (search) {
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
                { category: { $in: categoryIds } }
            ];
        }

        const totalProducts = await Products.countDocuments(query)

        const totalPages = Math.ceil((totalProducts >= 2 ? totalProducts : 1) / limit)

        const category = await Category.find({ isListed: true })

        const brand = await Brands.find({ isBlocked: false })

        if (!brand || !category) {
            return res.redirect('/admin/page404')
        }

        const products = await Products.find(query).populate(['brand', 'category']).sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .exec();

        if (products.length > 0) {
            const bulkOps = products.map(product => {
                let newStatus = 'Available'

                if (product.isBlocked === true || product.isBlocked === 'true') {
                    newStatus = 'Discontinued';
                } else if (product.quantity <= 0) {
                    newStatus = 'Out of Stock';
                }

                return {
                    updateOne: ({
                        filter: { _id: product._id },
                        update: { $set: { status: newStatus } }
                    })
                }
            })

            await Products.bulkWrite(bulkOps)
        }

        return res.render('products', {
            search,
            category,
            brands: brand,
            pageTitle: 'Products',
            currentPage: 'products',
            products,
            currentPages: page,
            totalPages,
            iconClass: 'fa-box',
        })
    } catch (error) {

        console.log('======================================');
        console.log('failed to load products', error);
        console.log('======================================');
        res.status(500).redirect('/admin/page404')
    }
}

const addProduct = async (req, res) => {
    try {
        const data = req.body;

        const existProduct = await Products.findOne({ productName: data.productName }).populate(['category', 'brand']);

        if (existProduct) {
            return res.status(401).json({ success: false, message: 'Product already exists with this name!' });
        }

        const errors = validateProductForm(data);
        if (errors) {
            return res.status(400).json({ success: false, message: errors });
        }

        const productImages = req.files ? req.files.map(file => file.path) : [];
        if (productImages.length === 0) {
            return res.status(400).json({ success: false, message: 'There is no images added!!!' });
        }

        if (productImages.length < 3) {
            return res.status(401).json({ success: false, message: 'At least three images needed!!!' })
        }
        console.log('image : ', productImages)

        const regularPrice = parseFloat(data.regularPrice)
        const gst = (regularPrice * 18) / 118
        let salePrice = parseFloat(data.salePrice) || 0

        const productOffer = parseFloat(data.productOffer) || 0;

        if (productOffer) {
            salePrice = Math.round(regularPrice - (regularPrice * productOffer / 100))
        } else {
            salePrice = regularPrice
        }

        const brand = await Brands.findById(data.brand) || ''
        const category = await Category.findById(data.category) || ''

        const brandOffer = brand?.brandOffer || 0
        const categoryOffer = category?.categoryOffer || 0

        const totalOffer = Math.max(productOffer, brandOffer, categoryOffer)

        const newProduct = new Products({
            productName: data.productName,
            description: data.description,
            brand: data.brand,
            category: data.category,
            regularPrice,
            salePrice,
            productOffer,
            quantity: parseInt(data.stock),
            productImage: productImages,
            gst,
            isBlocked: data.isBlocked === 'on',
            totalOffer
        });

        await newProduct.save();

        return res.status(200).json({
            success: true,
            message: 'Product added successfully',
            redirectUrl: '/admin/products'
        });
    } catch (error) {
        console.error('Product adding error: ', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while adding product: ' + error.message
        });
    }
};

const editProduct = async (req, res) => {
    try {
        console.log('req.body:', req.body);
        console.log('req.files:', req.files);
        const data = req.body;
        const productId = data.id;
        const page = data.currentPages;

        const product = await Products.findById(productId).populate('brand').populate('category')

        const isBlocked = product.isBlocked
        const isDeleted = product.isDeleted

        if (isBlocked || isDeleted) {
            return res.status(401).json({ success: false, message: `This product is ${isBlocked ? 'Blocked' : 'Deleted'}` })
        }

        const existProduct = await Products.findOne({ productName: data.productName, _id: { $ne: productId } }).populate('category').populate('brand');
        if (existProduct) {
            return res.status(401).json({ success: false, message: 'Product already exists with this name!' });
        }

        const errors = validateProductForm(data);
        if (errors) {
            return res.status(400).json({ success: false, message: errors });
        }

        const currentProduct = await Products.findById(productId);
        if (!currentProduct) {
            return res.status(404).json({ success: false, message: 'Product not found!' });
        }

        let finalImages = [];

        const existingImages = req.body.existingImages || [];
        if (Array.isArray(existingImages)) {
            finalImages = [...existingImages.filter(img => img && img !== 'null')];
        } else if (existingImages && existingImages !== 'null') {
            finalImages.push(existingImages);
        }

        const newImages = req.files ? req.files.map(file => file.path) : [];
        finalImages = [...finalImages, ...newImages];

        finalImages = [...new Set(finalImages.filter(img => img && img !== 'null'))];

        if (finalImages.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'At least 3 images are required!'
            });
        }

        if (finalImages.length > 4) {
            finalImages = finalImages.slice(0, 4);
        }

        const productOffer = parseFloat(data.productOffer) || 0;
        const regularPrice = parseFloat(data.regularPrice);
        const gst = Math.ceil((regularPrice * 18) / 118);
        let salePrice = parseFloat(data.salePrice);

        if (productOffer > 0) {
            salePrice = Math.round(regularPrice - (regularPrice * productOffer / 100));
        } else {
            salePrice = regularPrice;
        }

        const categoryOffer = parseFloat(product?.category?.categoryOffer) || 0
        const brandOffer = parseFloat(product?.brand?.brandOffer) || 0

        const totalOffer = Math.max(productOffer, categoryOffer, brandOffer)

        const updateData = {
            productName: data.productName,
            description: data.description,
            brand: data.brand,
            category: data.category,
            regularPrice,
            salePrice,
            productOffer,
            gst,
            quantity: parseInt(data.stock),
            isBlocked: data.isBlocked === 'on',
            productImage: finalImages,
            totalOffer
        };

        const updatedProduct = await Products.findByIdAndUpdate(productId, updateData, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found!' });
        }

        const products = await Products.find();
        products.forEach(product => {
            if (product.isBlocked) {
                product.status = 'Discontinued';
            } else if (product.quantity <= 0) {
                product.status = 'Out of Stock';
            } else {
                product.status = 'Available';
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            redirectUrl: `/admin/products?page=${page}`
        });
    } catch (error) {
        console.error('Product editing error: ', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while editing product: ' + error.message
        });
    }
};

const deleteProduct = async (req, res) => {
    try {

        console.log('req.body:', req.body);
        console.log('req.files:', req.files);

        const productId = req.body.productId

        const product = await Products.findById(productId)
        const isBlocked = product.isBlocked
        const isDeleted = product.isDeleted
        if (isBlocked || isDeleted) {
            return res.status(401).json({ success: false, message: `This product already ${isBlocked ? 'Blocked' : 'Deleted'}` })
        }

        const deletedProduct = await Products.findByIdAndUpdate(
            productId,
            { $set: { isDeleted: true } },
            { new: true }
        )

        if (!deletedProduct) {
            return res.status(401).json({ success: false, message: 'Failed to delete product!!' })
        }

        return res.status(200).json({ success: true, message: 'Product deleted successfully' })

    } catch (error) {

        console.error('Product editing error: ', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while editing product: ' + error.message
        });
    }
}


module.exports = {
    loadProducts,
    addProduct,
    editProduct,
    deleteProduct
}