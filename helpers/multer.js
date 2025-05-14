const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDirectory = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
};

const storageBrand = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads/brands');
        ensureDirectory(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const storageProduct = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads/products');
        ensureDirectory(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const storageProfile = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads/profile');
        ensureDirectory(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
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
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('brandImage');

const uploadProduct = multer({
    storage: storageProduct,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
}).array('productImage', 4);

const uploadProfile = multer({
    storage : storageProfile,
    fileFilter,
    limits : {fileSize : 5 * 1024 * 1024}
}).single('profileImage')

module.exports = {
    uploadBrand,
    uploadProduct,
    uploadProfile
};