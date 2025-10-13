const express = require('express')
const router = express.Router()
const multer = require('multer')
const adminAuth = require('../middleware/adminAuth')
const { uploadBrand, uploadProduct, uploadCategory, handleMulterError } = require('../helpers/multer');


const adminController = require("../controllers/admins/adminController")
const dashboardController = require("../controllers/admins/dashboarController")
const customerController = require("../controllers/admins/customerController")
const productController = require("../controllers/admins/productController")
const reportsController = require('../controllers/admins/reportsController')
const ordersController = require('../controllers/admins/ordersController')
const categoryController = require('../controllers/admins/categoryController')
const couponsController = require('../controllers/admins/couponController')
const brandController = require('../controllers/admins/brandController')


//Admin Signin

router.get('/', adminController.loadSignin)

router.post('/signin', adminController.signin)


//Logout

router.get('/logout', adminController.logout)


//Error Page

router.get('/page404', adminController.loadpage404)


//Customer Management

router.get('/customers', adminAuth, customerController.loadCustomers)

router.post('/blockCustomer', adminAuth, customerController.customerBlocked)

router.get('/unblockCustomer', adminAuth, customerController.unblockCustomer)


//Category Mangement

router.get('/category', adminAuth, categoryController.loadCategory);

router.post('/addCategory', adminAuth, handleMulterError(uploadCategory), categoryController.addCategory);

router.post('/editCategory', adminAuth, handleMulterError(uploadCategory), categoryController.editCategory);

router.post('/addCategoryOffer', adminAuth, categoryController.addCategoryOffer);

router.post('/removeCategoryOffer', adminAuth, categoryController.removeCategoryOffer);

router.post('/add-category', (req, res) => res.redirect('/admin/addCategory'));


//Brand Management

router.get('/brands', adminAuth, brandController.loadBrands)

router.post('/addBrand', adminAuth, uploadBrand, brandController.addBrand)

router.post('/editBrand', adminAuth, uploadBrand, brandController.editBrand)

router.post('/deleteBrand', adminAuth, brandController.deleteBrand)


//Product Management

router.get('/products', adminAuth, productController.loadProducts)

router.post('/addProduct', adminAuth, uploadProduct, productController.addProduct)

router.post('/editProduct', adminAuth, uploadProduct, productController.editProduct)

router.post('/deleteProduct', adminAuth, productController.deleteProduct)


// Dashboard ManageMent

router.get('/dashboard', adminAuth, dashboardController.loadDashboard)


//Reports Management

router.get('/reports', adminAuth, reportsController.loadReports)


//Orders Management

router.get('/orders', adminAuth, ordersController.loadOrders)

router.post('/updateStatus', adminAuth, ordersController.updateStatus)

router.post('/handleStatus', adminAuth, ordersController.returnOrder)

router.post('/order', adminAuth, ordersController.currentOrder)


//Coupon Mangement

router.get('/coupons', adminAuth, couponsController.loadCoupons)

router.get('/coupon/:id', couponsController.getCoupon);

router.post('/addCoupon', adminAuth, couponsController.addCoupon)

router.post('/editCoupon', adminAuth, couponsController.updateCoupon)

router.post('/deleteCoupon/:id', adminAuth, couponsController.deleteCoupon)




module.exports = router;