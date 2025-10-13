const { render, name } = require('ejs');
const Category = require('../../model/categoryModel');
const Products = require('../../model/productModel');
const fs = require('fs').promises;
const path = require('path');
const sanitizeHtml = require('sanitize-html');

const { validateCategoryForm } = require('../../helpers/validations');
const { handleStatus } = require('../../helpers/status');


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
        return handleStatus(res, 500, null, { redirectUrl: '/admin/page404' });
    }
};

const addCategory = async (req, res) => {
    try {
        const { categoryName, categoryDescription, listCategory, offerPrice } = req.body;

        const normalizedName = sanitizeHtml(categoryName.trim().toLowerCase());

        const categories = await Category.find();
        const findCategory = categories.find(cat => cat.name.toLowerCase() === normalizedName)

        if (findCategory) {
            return handleStatus(res, 402, 'Category already exist!!', { errors: { categoryName: 'Category alredy exists!!' } })
        }

        const categoryData = {
            categoryName: sanitizeHtml(categoryName),
            categoryDescription: sanitizeHtml(categoryDescription),
            offerPrice: offerPrice || 0,
        };

        const errors = validateCategoryForm(categoryData);
        if (errors) {
            return handleStatus(res, 400, 'Validation Failed', { errors })
        }

        const newCategory = new Category({
            name: sanitizeHtml(categoryName.trim()),
            description: sanitizeHtml(categoryDescription.trim()),
            isListed: listCategory === 'on' || listCategory === 'true',
            categoryOffer: parseFloat(offerPrice) || 0,
            categoryImage: req.file?.path,
        });

        await newCategory.save();

        return handleStatus(res, 200, 'Category added successfully!!', { redirectUrl: '/admin/category' });
    } catch (error) {
        console.error('Category adding error:', error);
        return handleStatus(res, 500, null, { redirectUrl: '/admin/page404' });
    }
};

const editCategory = async (req, res) => {
    try {
        const { id, categoryName, categoryDescription, offerPrice, listCategory } = req.body;

        const category = await Category.findById(id);
        if (!category) {
            return handleStatus(res, 404, 'Category not found!!');
        }

        if (offerPrice && parseFloat(offerPrice) >= 100) {
            return handleStatus(res, 401, 'Category offer should be under 100!!');
        }

        const normalizedName = sanitizeHtml(categoryName.trim().toLowerCase());
        const categories = await Category.find();
        const findCategory = categories.find(cat => cat.name.toLowerCase() === normalizedName)

        if (findCategory && findCategory._id.toString() !== id) {
            return handleStatus(res, 400, 'Category alredy exists with this name!!');
        }

        const categoryData = {
            categoryName: sanitizeHtml(categoryName),
            categoryDescription: sanitizeHtml(categoryDescription),
            offerPrice: offerPrice || 0,
        };

        const errors = validateCategoryForm(categoryData);
        if (errors) {
            return handleStatus(res, 400, 'Validation error', { errors });
        }

        let imageFilename = category.categoryImage;
        if (req.file) {
            if (category.categoryImage) {
                const publicId = category.categoryImage.split('/').pop().split('.')[0];
                try {
                    await cloudinary.uploader.destroy(`Camzone_IMG/category/${publicId}`);
                } catch (err) {
                    console.error('Failed to delete old image from Cloudinary:', err);
                    return handleStatus(res, 401, 'Failed ot delet image!')
                }
            }
            imageFilename = req.file?.path;
        }

        const updatedCategory = await Category.findByIdAndUpdate(
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

        if (!updatedCategory) {
            return handleStatus(res, 404, 'Category not found!!');
        }

        return handleStatus(res, 200, 'Category updated successfully!!', { category: updatedCategory });
    } catch (error) {
        console.error('Category editing failed:', error);
        return handleStatus(res, 500, null, { redirectUrl: '/admin/page404' });
    }
};

const addCategoryOffer = async (req, res) => {
    try {
        const percentage = parseInt(req.body.percentage);

        const { categoryId } = req.body;
        const category = await Category.findById(categoryId);
        if (!category) {
            return handleStatus(res, 404, 'Category not found!!');
        }

        if (isNaN(percentage) || percentage < 0 || percentage >= 100) {
            return handleStatus(res, 401, 'Offer must be beween 0 and 99');
        }

        const products = await Products.find({ category: category._id });
        const hasProductOffer = products.some((product) => product.productOffer > percentage);
        if (hasProductOffer) {
            return handleStatus(res, 401, 'Products within this category already have a higher offer!');
        }

        const updatedCategory = await Category.updateOne({ _id: categoryId }, { $set: { categoryOffer: percentage } });

        return handleStatus(res, 200, 'Caetegory offer added successfully!!', { category: updatedCategory });
    } catch (error) {
        console.error('Failed to add category offer:', error);
        return handleStatus(res, 500, null, { redirectUrl: '/admin/page404' });
    }
};

const removeCategoryOffer = async (req, res) => {
    try {
        const { categoryId } = req.body;
        const category = await Category.findById(categoryId);
        if (!category) {
            return handleStatus(res, 404, 'Category not found!!');
        }

        category.categoryOffer = 0;
        await category.save();

        return handleStatus(res, 200, 'Category offer removed successfully', { category });
    } catch (error) {
        console.error('Failed to remove category offer:', error);
        return handleStatus(res, 500, null, { redirectUrl: '/admin/page404' });
    }
};

module.exports = {
    loadCategory,
    addCategory,
    editCategory,
    addCategoryOffer,
    removeCategoryOffer,
};