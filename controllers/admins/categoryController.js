const { render } = require('ejs');
const Category = require('../../model/categoryModel');
const Products = require('../../model/productModel');
const { validateCategoryForm } = require('../../helpers/validations');
const fs = require('fs').promises;
const path = require('path');
const sanitizeHtml = require('sanitize-html');

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
        const findCategory = await Category.findOne({ name: normalizedName });

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
            categoryImage: req.file?.filename,
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
        const existCategory = await Category.findOne({ name: normalizedName });

        if (existCategory && existCategory._id.toString() !== id) {
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
                const oldImagePath = path.join(__dirname, '../../public/uploads/category', category.categoryImage);
                try {
                    await fs.unlink(oldImagePath);
                } catch (err) {
                    console.error('Failed to delete old image:', err);
                }
            }
            imageFilename = req.file.filename;
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

const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.body;
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ status: false, message: 'Category not found!' });
        }

        if (category.categoryImage) {
            const imagePath = path.join(__dirname, '../../public/uploads/category', category.categoryImage);
            try {
                await fs.unlink(imagePath);
            } catch (err) {
                console.error('Failed to delete category image:', err);
            }
        }

        await Category.findByIdAndDelete(categoryId);
        return res.status(200).json({ status: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Category deletion failed:', error);
        return res.status(500).json({ status: false, message: 'An error occurred while deleting category!' });
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

        await Category.updateOne({ _id: categoryId }, { $set: { categoryOffer: percentage } });

        for (const product of products) {
            product.productOffer = 0;
            product.salePrice = product.regularPrice;
            await product.save();
        }

        return res.status(200).json({ status: true, message: 'Category offer added successfully' });
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

        const percentage = category.categoryOffer;
        const products = await Products.find({ category: category._id });

        if (products.length > 0) {
            for (const product of products) {
                product.salePrice += Math.floor((product.regularPrice * percentage) / 100);
                product.productOffer = 0;
                await product.save();
            }
        }

        category.categoryOffer = 0;
        await category.save();

        return res.status(200).json({ status: true, message: 'Category offer removed successfully' });
    } catch (error) {
        console.error('Failed to remove category offer:', error);
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

module.exports = {
    loadCategory,
    addCategory,
    editCategory,
    deleteCategory,
    addCategoryOffer,
    removeCategoryOffer,
};