const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('./cloudinary');

// Create separate storage configurations for each upload type
const storageBrand = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'Camzone_IMG/brands',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const storageProduct = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'Camzone_IMG/products',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const storageProfile = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'Camzone_IMG/profile',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const storageCategory = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'Camzone_IMG/category',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Images only (JPEG, JPG, PNG, WEBP)!'));
    }
};

const uploadBrand = multer({
    storage: storageBrand,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
}).single('brandImage');

const uploadProduct = multer({
    storage: storageProduct,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
}).array('productImage', 4);

const uploadProfile = multer({
    storage: storageProfile,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
}).single('profileImage');

const uploadCategory = multer({
    storage: storageCategory,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
}).single('categoryImage');

const handleMulterError = (upload) => {
    return (req, res, next) => {
        upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ success: false, message: err.message });
            } else if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
            next();
        });
    };
};

module.exports = {
    uploadBrand,
    uploadProduct,
    uploadProfile,
    uploadCategory,
    handleMulterError,
};