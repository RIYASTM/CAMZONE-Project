const express = require('express');
const router = express.Router();
const passport = require('passport');

//Helper Functions

const { uploadProfile } = require('../helpers/multer')

//MiddleWares Functions

const userAuth = require('../middleware/userAuth')
// const { checkBlockedStatus } = require('../middleware/userAuth');


//Controller Functions

const userController = require('../controllers/users/userController');
const cartController = require('../controllers/users/cartController')
const couponController = require('../controllers/users/couponController')
const checkoutController = require('../controllers/users/checkoutController')
const passwordController = require('../controllers/users/passwordController')
const addressController = require('../controllers/users/addressController')
const profileController = require('../controllers/users/profileController')
const orderControlller = require('../controllers/users/orderController')
const walletController = require('../controllers/users/walletController')
const wishListController = require('../controllers/users/wishListController')
const invoiceController = require('../controllers/users/invoiceController')


//Routers


router.get('/', userController.loadHomePage);

router.get('/shop', userController.loadShop)

router.get('/product', userController.loadProduct);

router.get('/signin', userController.loadSignin);

router.post('/signin', userController.signin);

router.get('/signup', userController.loadSignup);

router.post('/signup', userController.signup);

router.get('/emailVerify', userController.loadVerifyEmail);

router.post('/verify-email', userController.verifyEmail);

router.post('/resend-otp', userController.resendOtp);

router.get('/pageNotFound', userController.pageNotFound);

router.get('/signout', userController.signout);


//Password Resetting

router.get('/forgottPassword', userController.loadforgotPass)

router.post('/forgottPassword', userController.forgotpass)

router.get('/verifyEmailforgot', userController.loadverifyEmailforgot)

router.post('/verifyEmailforgot', userController.verifyEmailforgot)

router.get('/resetPassword', userController.loadResetPassword)

router.post('/resetPassword', userController.resetPassword)


//Password changing

router.post('/changePassword', userAuth, passwordController.changePassword)


//Address Managing

router.get('/address', userAuth, addressController.loadAddress)

router.post('/addAddress', userAuth, addressController.addAddress)

router.patch('/editAddress', userAuth, addressController.editAddress)

router.patch('/deleteAddress/:id', userAuth, addressController.deleteAddress)


//Profile Management
router.get('/profile', userAuth, profileController.loadProfile)

router.post('/editProfile', uploadProfile, userAuth, profileController.editProfile)

router.post('/sendOtp', userAuth, profileController.otpSend)

router.post('/verifyOTP', userAuth, profileController.verifyOTP)


//Cart

router.get('/cart', userAuth, cartController.loadCart)

router.post('/addtocart', userAuth, cartController.addToCart)

router.patch('/updateCart', userAuth, cartController.cartUpdate)

router.patch('/cartRemove', userAuth, cartController.removeItem)

router.patch('/cartTowishlist', userAuth , cartController.cartToWishlist)

router.post('/toCheckout', userAuth, cartController.toCheckout)


//Coupon

router.get('/coupon', userAuth, couponController.loadCoupon)

router.post('/applyCoupon', userAuth, couponController.applyCoupon)

router.post('/removeCoupon', userAuth, couponController.removeCoupon)


//Checkout

router.get('/checkout', userAuth, checkoutController.loadCheckout)

router.post('/checkout', userAuth, checkoutController.checkout)

router.post('/verify-payment', userAuth, checkoutController.verifyPayment)

router.post('/retryPayment', userAuth, checkoutController.retryPayment)


//Order Success
router.get('/orderSuccess', orderControlller.loadOrderSuccess)


//My Orders

router.get('/myOrders', userAuth, orderControlller.loadMyOrders)

router.post('/orderCancel', userAuth, orderControlller.cancelOrder)

router.post('/orderReturn', userAuth, orderControlller.returnRequest)


//Order Details

router.get('/orderDetails', userAuth, orderControlller.loadOrderDetails)


//wallet Details

router.get('/wallet', userAuth, walletController.loadWallet)

router.post('/addtoWallet', userAuth, walletController.addTowallet)

router.post('/verify-Amount', userAuth, walletController.verifyAmount)


//Wish List

router.get('/wishList', userAuth, wishListController.loadWishList)

router.post('/addtowishlist', userAuth, wishListController.addtoWishlist)

router.post('/removeFromWishList', userAuth, wishListController.removeFromWishList)


//Invoice 

router.get('/downloadInvoice/:id', userAuth, invoiceController.invoice)

//Google Auth

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', (req, res, next) => {
     passport.authenticate('google', (err, user, info) => {
          console.log()
          if (err || !user) {
               const message = info?.message || 'Authentication failed';
               return res.redirect(`/signup?message=${encodeURIComponent(message)}`);
          }
          req.logIn(user, (loginErr) => {
               if (loginErr) {
                    return res.redirect(`/signup?message=${encodeURIComponent('Login failed')}`);
               }
               req.session.user = user._id;
               return res.redirect('/');
          });
     })(req, res, next);
});



module.exports = router;