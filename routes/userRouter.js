const express = require('express');
const router = express.Router();
const passport = require('passport');

//Helper Functions

const {uploadProfile} = require('../helpers/multer')

//MiddleWares Functions

const userAuth = require('../middleware/userAuth')
// const { checkBlockedStatus } = require('../middleware/userAuth');


//Controller Functions

const userController = require('../controllers/users/userController');
const cartController = require('../controllers/users/cartController')
const couponController = require('../controllers/users/couponController')
const checkoutController = require('../controllers/users/checkoutController')
const accountController = require('../controllers/users/accountController')
const passwordController = require('../controllers/users/passwordController')
const addressController = require('../controllers/users/addressController')
const profileController = require('../controllers/users/profileController')
const orderControlller = require('../controllers/users/orderController')


//Routers


router.get('/',userController.loadHomePage);

router.get('/shop',userController.loadShop)

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


//Account Controllings

router.get('/myAccount', userAuth, accountController.loadMyAccount)


//Password Resetting

router.get('/forgottPassword', userController.loadforgotPass)

router.post('/forgottPassword',userController.forgotpass)

router.get('/verifyEmailforgot',userController.loadverifyEmailforgot)

router.post('/verifyEmailforgot',userController.verifyEmailforgot)

router.get('/resetPassword',userController.loadResetPassword)

router.post('/resetPassword',userController.resetPassword)


//Password changing

router.get('/passwordManage', userAuth, passwordController.loadPassword)

router.post('/checkPassword', userAuth , passwordController.checkPassword)

router.post('/confirmOTP',userAuth, passwordController.confirmOTP)

router.patch('/changepassword', userAuth, passwordController.changePassword)


//Address Managing

router.get('/address', userAuth,addressController.loadAddress)

router.post('/addAddress', userAuth, addressController.addAddress)

router.patch('/editAddress', userAuth, addressController.editAddress)

router.patch('/deleteAddress/:id', userAuth, addressController.deleteAddress)


//Profile Management
router.get('/profile', userAuth,profileController.loadProfile)

router.post('/editProfile', uploadProfile, userAuth, profileController.editProfile)


//Cart

router.get('/cart', userAuth, cartController.loadCart)

router.post('/addtocart', userAuth , cartController.addToCart)

router.patch('/updateCart',userAuth , cartController.cartUpdate)

router.patch('/cartRemove', userAuth , cartController.removeItem)


//Coupon

router.get('/coupon',userAuth, couponController.loadCoupon)



//Checkout

router.get('/checkout',userAuth, checkoutController.loadCheckout )

router.post('/checkout', userAuth, checkoutController.checkout)

//Order
router.get('/orderSuccess',  orderControlller.loadOrderSuccess)


//My Orders

router.get('/myOrders' , userAuth , orderControlller.loadMyOrders)

//Order Details

router.get('/productDetails', userAuth , orderControlller.loadOrderDetails)


//Google Auth

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get("/auth/google/callback", 
    passport.authenticate("google", {
        failureRedirect: "/signin",
        failureFlash: true
    }),
    (req, res) => {
        req.session.usermail = req.user.email
        console.log("the usermail is : ",req.session.usermail)
       req.session.user = req.user._id;
        res.redirect("/");
    }
);



module.exports = router;