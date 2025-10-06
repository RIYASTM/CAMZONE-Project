const { render, name } = require('ejs');
const Category = require('../../model/categoryModel');
const Products = require('../../model/productModel');
const fs = require('fs').promises;
const path = require('path');
const sanitizeHtml = require('sanitize-html');

const { validateCategoryForm } = require('../../helpers/validations');


const loadCategory = async (req, res) => {
    try {
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;

        const categories = await Category.find({
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
                { description: { $regex: '.*' + search + '.*', $options: 'i' } },
            ],
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.find({
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
                { description: { $regex: '.*' + search + '.*', $options: 'i' } },
            ],
        }).countDocuments();

        const totalPages = Math.ceil(totalCategories / limit);
        console.log(categories)
        return res.render('category', {
            pageTitle: 'Category',
            category: categories,
            search,
            currentPage: 'category',
            currentPages: page,
            totalPages,
            iconClass: 'fa-list',
        });
    } catch (error) {
        console.error('Failed to load category:', error);
        return res.redirect('/page404');
    }
};

const addCategory = async (req, res) => {
    try {
        const { categoryName, categoryDescription, listCategory, offerPrice } = req.body;

        const normalizedName = sanitizeHtml(categoryName.trim().toLowerCase());

        const categories = await Category.find();
        const findCategory = categories.find(cat => cat.name.toLowerCase() === normalizedName)

        if (findCategory) {
            return res.status(409).json({
                success: false,
                message: 'Category already exists!',
                errors: { categoryName: 'Category already exists!' },
            });
        }

        const categoryData = {
            categoryName: sanitizeHtml(categoryName),
            categoryDescription: sanitizeHtml(categoryDescription),
            offerPrice: offerPrice || 0,
        };

        const errors = validateCategoryForm(categoryData);
        if (errors) {
            return res.status(400).json({ success: false, errors });
        }

        const newCategory = new Category({
            name: sanitizeHtml(categoryName.trim()),
            description: sanitizeHtml(categoryDescription.trim()),
            isListed: listCategory === 'on' || listCategory === 'true',
            categoryOffer: parseFloat(offerPrice) || 0,
            categoryImage: req.file?.path,
        });

        await newCategory.save();

        return res.status(200).json({
            success: true,
            message: 'Category Added Successfully',
            redirectUrl: '/admin/category',
        });
    } catch (error) {
        console.error('Category adding error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while adding category: ' + error.message,
        });
    }
};

const editCategory = async (req, res) => {
    try {
        const { id, categoryName, categoryDescription, offerPrice, listCategory } = req.body;

        if (offerPrice && parseFloat(offerPrice) >= 100) {
            return res.json({
                success: false,
                message: 'Category offer should be under 100!',
            });
        }

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found!',
            });
        }

        const normalizedName = sanitizeHtml(categoryName.trim().toLowerCase());
        const categories = await Category.find();
        const findCategory = categories.find(cat => cat.name.toLowerCase() === normalizedName)

        if (findCategory && findCategory._id.toString() !== id) {
            return res.status(400).json({
                success: false,
                message: 'Category already exists with this name!',
            });
        }

        const categoryData = {
            categoryName: sanitizeHtml(categoryName),
            categoryDescription: sanitizeHtml(categoryDescription),
            offerPrice: offerPrice || 0,
        };

        const errors = validateCategoryForm(categoryData);
        if (errors) {
            return res.status(400).json({ success: false, errors });
        }

        let imageFilename = category.categoryImage;
        if (req.file) {
            if (category.categoryImage) {
                const publicId = category.categoryImage.split('/').pop().split('.')[0];
                try {
                    await cloudinary.uploader.destroy(`Camzone_IMG/category/${publicId}`);
                } catch (err) {
                    console.error('Failed to delete old image from Cloudinary:', err);
                }
            }
            imageFilename = req.file?.path;
        }

        const updateCategory = await Category.findByIdAndUpdate(
            id,
            {
                name: sanitizeHtml(categoryName.trim()),
                description: sanitizeHtml(categoryDescription.trim()),
                categoryOffer: parseFloat(offerPrice) || 0,
                isListed: listCategory === 'on' || listCategory === 'true',
                categoryImage: imageFilename,
            },
            { new: true }
        );

        if (!updateCategory) {
            return res.status(404).json({
                success: false,
                message: 'Category not found!',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Category Successfully Updated',
            category: updateCategory
        });
    } catch (error) {
        console.error('Category editing failed:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while editing category!',
            error: error.message,
        });
    }
};

const addCategoryOffer = async (req, res) => {
    try {
        const percentage = parseInt(req.body.percentage);
        if (isNaN(percentage) || percentage < 0 || percentage >= 100) {
            return res.json({ status: false, message: 'Invalid percentage value! Must be between 0 and 99.' });
        }

        const { categoryId } = req.body;
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ status: false, message: 'Category not found!' });
        }

        const products = await Products.find({ category: category._id });
        const hasProductOffer = products.some((product) => product.productOffer > percentage);
        if (hasProductOffer) {
            return res.json({ status: false, message: 'Products within this category already have a higher offer!' });
        }

        const updatedCategory = await Category.updateOne({ _id: categoryId }, { $set: { categoryOffer: percentage } });


        return res.status(200).json({ status: true, message: 'Category offer added successfully', category: updatedCategory });
    } catch (error) {
        console.error('Failed to add category offer:', error);
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

const removeCategoryOffer = async (req, res) => {
    try {
        const { categoryId } = req.body;
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ status: false, message: 'Category not found!' });
        }

        category.categoryOffer = 0;
        await category.save();

        return res.status(200).json({ status: true, message: 'Category offer removed successfully', category });
    } catch (error) {
        console.error('Failed to remove category offer:', error);
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

module.exports = {
    loadCategory,
    addCategory,
    editCategory,
    addCategoryOffer,
    removeCategoryOffer,
};