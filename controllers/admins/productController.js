const Products = require('../../model/productModel')
const Brands = require('../../model/brandModel')
const Category = require('../../model/categoryModel')
const User = require('../../model/userModel')
const fs = require('fs')
const Path = require('path')
const sharp = require('sharp')

//Helper Function 
const {validateProductForm} = require('../../helpers/validations')




const loadProducts = async (req,res) => {
    try {


        const search = req.query.search || ''
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit

        const query = {isDeleted: false};

        if (search) {
            const brandIds = await Brands.find({
                brandName: { $regex: search.trim(), $options: 'i' },
                isBlocked: false
            }).distinct('_id');

            const categoryIds = await Category.find({
                name: { $regex: search.trim(), $options: 'i' },
                isListed: true
            }).distinct('_id');

            // Construct OR condition for search
            query.$or = [
                { productName: { $regex: search.trim(), $options: 'i' } },
                { brand: { $in: brandIds } },
                { category: { $in: categoryIds } }
            ];
        }

        const totalProducts = await Products.countDocuments(query)

        const totalPages = Math.ceil((totalProducts >=2 ? totalProducts : 1 ) / limit )


        const category = await Category.find({isListed:true})
        // console.log('Categories : ',category)
        
        const brand = await Brands.find({isBlocked : false})
        // console.log('Brands : ', brand)

        if(!brand || !category){
            return res.redirect('/admin/page404')
        }

        const products = await Products.find(query).populate(['brand','category']).sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec();

        return res.render('products',{
            search,
            category,
            brands : brand,
            pageTitle: 'Products',
            currentPage: 'products',
            products, 
            currentPages : page,
            totalPages,
            iconClass : 'fa-box'
        })
    } catch (error) {

        console.log('======================================');
        console.log('failed to load products',error);
        console.log('======================================');
        res.status(500).redirect('/admin/page404')
    }
}
        
const addProduct = async (req, res) => {
    try {
        const data = req.body;

        // console.log('Received form data:', data);
        // console.log('Received files:', req.files);

        console.log('brand : ', data.brand)

        const existProduct = await Products.findOne({ productName: data.productName }).populate(['category','brand']);

        if (existProduct) {
            return res.status(401).json({ success: false, message: 'Product already exists with this name!' });
        }

        const errors = validateProductForm(data);

        if (errors) {
            console.log('Validation error from backend: ', errors);
            return res.status(400).json({ success: false, message : errors });
        }

        const productImages = req.files ? req.files.map(file => file.filename) : [];

        // console.log('Product images to save:', productImages);

        if (productImages.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one product image is required!' });
        }

        const findCategory = data.category
        const findBrand = data.brand

        const categoryOffer = findCategory ?.categoryOffer || 0

        console.log('Category offer : ',categoryOffer)

        const brandOffer = findBrand ?.brandOffer || 0

        console.log('Brand offer : ',brandOffer)

        const productOffer = data.productOffer ? data.productOffer : 0

        console.log('Product offer : ',productOffer)

        const totalOffer = categoryOffer + productOffer + brandOffer


        const regularPrice = parseFloat(data.regularPrice)
        let salePrice = parseFloat(data.salePrice)

        // console.log(data.productOffer)

        // if(productOffer){
        //     salePrice = regularPrice - (regularPrice * totalOffer / 100)
        // }


        const newProduct = new Products({
            productName: data.productName,
            description: data.description,
            brand: data.brand,
            category: data.category,
            regularPrice,
            salePrice,
            productOffer : totalOffer,
            quantity: parseInt(data.stock),
            productImage: productImages,
            isBlocked: data.isBlocked === 'on'
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
        const data = req.body;
        const productId = data.id;

        console.log('data : ',data)


        const existProduct = await Products.findOne({ productName: data.productName, _id: { $ne: productId } });

        if (existProduct) {
            return res.status(401).json({ success: false, message: 'Product already exists with this name!' });
        }

        const errors = validateProductForm(data);

        if (errors) {
            console.log('Validation error from backend: ', errors);
            return res.status(400).json({ success: false, message : errors });
        }

        // Handle multiple image uploads
        const productImages = req.files ? req.files.map(file => file.filename) : [];


        const findCategory = data.category
        const findBrand = data.brand

        const categoryOffer = findCategory ?.categoryOffer || 0

        console.log('Category offer : ',categoryOffer)

        const brandOffer = findBrand ?.brandOffer || 0

        console.log('Brand offer : ',brandOffer)

        const productOffer = data.productOffer ? data.productOffer : 0

        console.log('Product offer : ',productOffer)

        const totalOffer = categoryOffer + productOffer + brandOffer

        const regularPrice = parseFloat(data.regularPrice)
        let salePrice = parseFloat(data.salePrice)
        console.log('saleprice: ',salePrice)

        console.log(data.productOffer)

        // if(productOffer){
        //     salePrice = regularPrice - (regularPrice * productOffer / 100)
        // }


        const updateData = {
            productName: data.productName,
            description: data.description,
            brand: data.brand,
            category: data.category,
            regularPrice,
            salePrice,
            productOffer : totalOffer,
            quantity: parseInt(data.stock),
            isBlocked: data.isBlocked === 'on'
        };

        if (productImages.length > 0) {
            updateData.productImage = productImages;
        }

        const updatedProduct = await Products.findByIdAndUpdate(productId, updateData, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found!' });
        }

        return res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            redirectUrl: '/admin/products'
        });
    } catch (error) {
        console.error('Product editing error: ', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while editing product: ' + error.message
        });
    }
};

const deleteProduct = async (req,res) => {
    try {
        
        const productId = req.body.productId

        console.log('id : ',productId)

        const deletedProduct = await Products.findByIdAndUpdate(
            productId,
            {$set : { isDeleted : true } },
            { new : true}
        )

        if(!deletedProduct){
            return res.status(401).json({success : false , message : 'Failed to delete product!!'})
        }

        return res.status(200).json({success : true , message : 'Product deleted successfully'})



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