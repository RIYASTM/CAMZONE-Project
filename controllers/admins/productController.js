const Products = require('../../model/productModel')
const Brands = require('../../model/brandModel')
const Category = require('../../model/categoryModel')

const { validateProductForm } = require('../../helpers/validations')
const { handleStatus } = require('../../helpers/status');


const loadProducts = async (req, res) => {
    try {

        const search = req.query.search || ''
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit

        const query = { isDeleted: false };

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

        const [totalProducts, category, brand] = await Promise.all([
            Products.countDocuments(query),
            Category.find({ isListed: true }),
            Brands.find({ isBlocked: false })
        ])

        const totalPages = Math.ceil((totalProducts >= 2 ? totalProducts : 1) / limit)

        if (!brand || !category) {
            return handleStatus(res, 400, `Category or Brand is not exist!!`)
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
        return handleStatus(res, 500, null, { redirectUrl: '/admin/page404' });
    }
}

const addProduct = async (req, res) => {
    try {
        const data = req.body;

        const existProduct = await Products.findOne({ productName:  { $regex: new RegExp(`^${data.productName}$`, 'i') } })

        if (existProduct) {
            return handleStatus(res, 401, 'Product already exists wth this name!');
        }

        const errors = validateProductForm(data);
        if (errors) {
            return handleStatus(res, 400, 'Validation error!', { errors });
        }

        const productImages = req.files ? req.files.map(file => file.path) : [];
        if (productImages.length === 0) {
            return handleStatus(res, 400, 'There is no images added!!')
        }

        if (productImages.length < 3) {
            return handleStatus(res, 401, 'Atlease 3 images are required!!')
        }

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

        return handleStatus(res, 200, 'Product added successfully', {
            redirectUrl: '/admin/products'
        });
    } catch (error) {
        console.error('Product adding error: ', error);
        return handleStatus(res, 500, null, { redirectUrl: '/admin/page404' });
    }
};

const editProduct = async (req, res) => {
    try {
        const data = req.body;
        const productId = data.id;
        const page = data.currentPages;

        const product = await Products.findById(productId).populate('brand').populate('category')

        const isDeleted = product.isDeleted

        if ( isDeleted) {
            return handleStatus(res, 401, `This product is Deleted!!`);
        }

        const existProduct = await Products.findOne({ productName:  { $regex: new RegExp(`^${data.productName}$`, 'i') } }).populate('category').populate('brand');
        if (existProduct) {
            return handleStatus(res, 401, 'Product already exista with this name!!');
        }

        const errors = validateProductForm(data);
        if (errors) {
            return handleStatus(res, 400, 'Validation Error!!', { errors });
        }

        const currentProduct = await Products.findById(productId);
        if (!currentProduct) {
            return handleStatus(res, 400, 'Product not found!!');
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
            return handleStatus(res, 401, 'Atlease 3 images are required!!');
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
            return handleStatus(res, 400, 'Product not found')
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

        return handleStatus(res, 200, 'Product updated successfully', {
            redirectUrl: `/admin/products?page=${page}`
        });

    } catch (error) {
        console.error('Product editing error: ', error);
        return handleStatus(res, 500, null, { redirectUrl: '/admin/page404' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const productId = req.body.productId

        const product = await Products.findById(productId)
        const isDeleted = product.isDeleted
        if ( isDeleted) {
            return handleStatus(res, 401, `This product already Deleted`);
        }

        const deletedProduct = await Products.findByIdAndUpdate(
            productId,
            { $set: { isDeleted: true } },
            { new: true }
        )

        if (!deletedProduct) {
            return handleStatus(res, 500, 'Failed to remove product!!', { redirectUrl: '/admin/page404' });
        }

        return handleStatus(res, 200, 'Product removed successfully');

    } catch (error) {

        console.error('Product editing error: ', error);
        return handleStatus(res, 500, null, { redirectUrl: '/admin/page404' });
    }
}


module.exports = {
    loadProducts,
    addProduct,
    editProduct,
    deleteProduct
}