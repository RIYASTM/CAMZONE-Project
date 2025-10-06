
const Brand = require('../../model/brandModel')
const Product = require('../../model/productModel')

const { ValidateBrand } = require('../../helpers/validations')


const loadBrands = async (req, res) => {
    try {

        const search = req.query.search || ''
        const page = parseInt(req.query.page) || 1;
        const limit = 5;

        const query = { isDeleted: false };

        if (search) {
            query.brandName = { $regex: search.trim(), $options: 'i' };
        }

        const brands = await Brand.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const totalbrands = await Brand.countDocuments(query);
        const totalPages = Math.ceil((totalbrands >= 2 ? totalbrands : 1) / limit)

        return res.render('brands', {
            pageTitle: 'Brands',
            brands: brands,
            search,
            currentPage: 'brands',
            iconClass: 'fa-brands',
            currentPages: page,
            totalPages: totalPages
        })

    } catch (error) {

        console.log('======================================');
        console.log('Failed to load brands', error);
        console.log('======================================');
        return res.status(500).redirect('/page404');

    }
}

const addBrand = async (req, res) => {
    try {

        const { brandName, description, brandOffer } = req.body

        const existBrand = await Brand.findOne({ brandName: { $regex: new RegExp(`^${brandName}$`, 'i') } })
        if (existBrand) {
            return res.status(500).json({ success: false, message: 'Brand is already exist with this name!!' })
        }

        const brandData = { brandName, description, brandOffer }
        const errors = ValidateBrand(brandData)

        if (errors) {
            return res.status(400).json({ success: false, errors })
        }

        const newBrand = new Brand({
            brandName: brandName,
            description: description,
            brandImage: req.file?.path

        })

        await newBrand.save()

        return res.status(200).json({ success: true, message: 'Brand added successfully', redirectUrl: '/admin/brands' })

    } catch (error) {
        console.log('=================================')
        console.error("Brand adding error : ", error);
        console.log('=================================')
        return res.status(500).json({
            success: false,
            message: "Something went wrong while adding brand: " + error.message
        });
    }
}

const editBrand = async (req, res) => {
    try {

        const { id, brandName, description, isBlocked, brandOffer } = req.body

        const brandData = { brandName, description, brandOffer }
        const errors = ValidateBrand(brandData)

        if (errors) {
            console.log('err : ', errors)
            return res.status(400).json({ success: false, message: errors })
        }

        const brand = await Brand.findById(id)

        if (!brand) {
            return res.status(401).json({
                success: false,
                message: 'Brand not found!!'
            })
        }

        const existBrand = await Brand.findOne({ brandName: brandName })

        if (existBrand && existBrand._id.toString() !== id) {
            return res.status(401).json({
                success: false,
                message: 'Brand already exist with this name'
            })
        }

        let imageUrl = brand.brandImage;
        if (req.file) {
            if (brand.brandImage) {
                const publicId = brand.brandImage.split('/').pop().split('.')[0];
                try {
                    await cloudinary.uploader.destroy(`Camzone_IMG/brands/${publicId}`);
                } catch (err) {
                    console.error('Failed to delete old image from Cloudinary:', err);
                }
            }
            imageUrl = req.file?.path;
        }


        const updateData = {
            brandName: brandName ? brandName.trim() : brand.brandName,
            description: description ? description.trim() : brand.description,
            isBlocked: isBlocked === 'on' || isBlocked === true,
            brandOffer,
            brandImage: imageUrl
        }

        const updatedBrand = await Brand.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })

        if (!updatedBrand) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update brand'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Brand updated successfully',
            redirectUrl: '/admin/brands'
        })

    } catch (error) {
        console.log('=================================')
        console.error("Brand updating error : ", error);
        console.log('=================================')
        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating brand: " + error.message
        });
    }
}

const deleteBrand = async (req, res) => {
    try {

        const id = req.body.brandId
        const deleteBrand = await Brand.findByIdAndUpdate(
            id,
            { $set: { isDeleted: true } },
            { new: true }
        );

        if (!deleteBrand) {
            return res.status(400).json({ success: false, message: 'Brand not found' })
        }

        await Brand.findByIdAndDelete(id)
        return res.status(200).json({ success: true, message: "Category offer removed" })

    } catch (error) {

        console.log('Failed to delete : ', error)

    }
}


module.exports = {
    loadBrands,
    addBrand,
    editBrand,
    deleteBrand

}

