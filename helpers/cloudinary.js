require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const cloud_name = process.env.CLOUDINARY_NAME?.trim();
const api_key = process.env.CLOUDINARY_KEY?.trim();
const api_secret = process.env.CLOUDINARY_SECRET?.trim();

if (!cloud_name || !api_key || !api_secret) {
  throw new Error("Cloudinary environment variables are missing!");
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
