const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const ensureDirectory = async (dir) => {
    try {
        if (!(await fs.access(dir).then(() => true).catch(() => false))) {
            await fs.mkdir(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    } catch (err) {
        console.error(`Error creating directory ${dir}:`, err);
    }
};

const storageBrand = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads/brands');
        await ensureDirectory(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const storageProduct = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads/products');
        await ensureDirectory(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const storageProfile = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads/profile');
        await ensureDirectory(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const storageCategory = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads/category');
        await ensureDirectory(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Images only (JPEG, JPG, PNG)!'));
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