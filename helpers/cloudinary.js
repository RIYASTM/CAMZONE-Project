const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Check if environment variables are loaded
if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_KEY || !process.env.CLOUDINARY_SECRET) {
  console.error('❌ Cloudinary credentials missing!');
  console.error('CLOUDINARY_NAME:', process.env.CLOUDINARY_NAME ? '✓' : '✗');
  console.error('CLOUDINARY_KEY:', process.env.CLOUDINARY_KEY ? '✓' : '✗');
  console.error('CLOUDINARY_SECRET:', process.env.CLOUDINARY_SECRET ? '✓' : '✗');
  throw new Error('Cloudinary environment variables are not configured');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME.trim(),
  api_key: process.env.CLOUDINARY_KEY.trim(),
  api_secret: process.env.CLOUDINARY_SECRET.trim(),
});


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Camzone_IMG', 
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

module.exports = { cloudinary, storage };
