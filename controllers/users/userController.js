//Modules
const nodemailer = require('nodemailer')
const env = require('dotenv').config()
const bcrypt = require('bcrypt')
const userAuth = require('../../middleware/userAuth')
const session = require('express-session')

//Models
const User = require('../../model/userModel')
const Brands = require('../../model/brandModel')
const Products = require('../../model/productModel')
const Category = require('../../model/categoryModel')
const Cart = require('../../model/cartModel')
const Wishlist = require('../../model/wishlistModel')
const OTP = require('../../model/otpModal')

//Helper Functions
const { securePassword } = require('../../helpers/hashPass')
const { sendOTPForgott, generateOtp, sendOTP } = require('../../helpers/OTP')
const { validateForm, validateUser } = require('../../helpers/validations')
const { handleStatus } = require('../../helpers/status')



//Product Page
const loadProduct = async (req, res) => {
    try {

        const search = req.query.search || ''

        const userId = req.session.user

        const user = await User.findById(userId)

        const cart = userId ? await Cart.findOne({ userId }) : 0

        const productId = req.query.id

        const [product, wishList] = await Promise.all([
            Products.findById(productId, { isBlocked: false }).populate(['category', 'brand']),
            Wishlist.findOne({ userId }).populate('items.product')
        ])

        if (!product) {
            return handleStatus(res, 403, 'This products is blocked or unavailable')
        }

        let wishlistItems = []

        if (wishList) {
            wishlistItems = wishList.items.map(item => item.product._id.toString())
        }

        const findCategory = product.category

        const findBrand = product.brand

        const categoryOffer = findCategory?.categoryOffer || 0

        const brandOffer = findBrand?.brandOffer || 0

        const productOffer = product.productOffer || 0

        const totalOffer = Math.max(productOffer, brandOffer, categoryOffer);

        product.salePrice = Math.round(product.regularPrice - product.regularPrice / 100 * totalOffer)

        const relatedProducts = await Products.find({ category: findCategory })

        return res.render('product', {
            user: user || '',
            search,
            cart,
            brands: findBrand,
            category: findCategory,
            product,
            totalOffer,
            relatedProducts,
            currentPage: 'product',
            wishlistItems
        })

    } catch (error) {
        console.error('Error while loading product : ', error)
        return handleStatus(res, 500);
    }
}

//Account Creating
const loadSignup = async (req, res) => {
    try {

        if (req.session.user) return res.redirect('/')

        const search = req.query.search || ''

        const userId = req.session.user

        const cart = userId ? await Cart.findOne({ userId }) : 0

        return res.render('signup', {
            currentPage: 'signup',
            search,
            cart
        })
    } catch (error) {
        console.log('================================================')
        console.log('Failed to load page!!', error);
        console.log('================================================')
        return handleStatus(res, 500)
    }
}

const signup = async (req, res) => {
    try {

        const { name, email, phone, password, confirmPassword } = req.body;

        const findUser = await User.findOne({ email });
        if (findUser) {
            return handleStatus(res, 400, 'User with this email already exists', {
                errors:
                    { email: "User with this email already exists" }
            })
        }

        const userData = { name, email, phone, password, confirmPassword };

        const errors = validateUser(userData);
        if (errors) {
            return handleStatus(res, 400, 'Validation error', { errors })
        }

        const otp = generateOtp();
        console.log('==================================================')
        console.log(`OTP Generated to "${email}" : "${otp}"`);
        console.log('==================================================')

        await OTP.deleteMany({ email });

        const signupOtp = new OTP({ otp, email })

        await signupOtp.save()

        req.session.usermail = email

        req.session.userOtp = otp;

        req.session.otpGenerated = Date.now()

        const emailSent = await sendOTP(email, otp);
        if (!emailSent) {
            return handleStatus(res, 500, 'Failed to send OTP. Try again');
        }

        req.session.userData = { name, email, phone, password };

        return handleStatus(res, 200, 'OTP Generated', {
            redirectUrl: '/emailVerify'
        });

    } catch (error) {
        console.error("Signup error:", error);
        return handleStatus(res, 500);
    }
}

//Sign Out
const signout = async (req, res) => {
    try {

        if(req.session.user){
            req.session.user = null;
            console.log('signed Out');
            return res.redirect('/');
        }

        return redirect('/')

        // req.logout((err) => {
        //     if (err) return next(err);
        //     req.session.destroy((err) => {
        //         if (err) return res.redirect('/');
        //         res.clearCookie('user.sid');
        //         res.redirect('/');
        //     });
        // });
        console.log('Signed out');
    } catch (error) {
        console.log('================================================');
        console.log('Failed to signout!!', error);
        console.log('================================================');
        return handleStatus(res, 500);
    }
};

const loadVerifyEmail = async (req, res) => {
    try {

        if (req.session.user) return res.redirect('/')

        const search = req.query.search || ''

        const email = req.session.usermail

        const userOtp = await OTP.findOne({ email })

        const otpGenerated = userOtp?.createdAt || 0

        const expiryTime = 90 * 1000

        const now = Date.now()

        let remainingTime = 0

        if (otpGenerated) {
            remainingTime = Math.max(0, expiryTime - (now - otpGenerated));
        }

        return res.render('emailVerify', {
            currentPage: 'emailVerify',
            search,
            cart: 0,
            remainingTime
        }
        )
    } catch (error) {
        console.log('================================================')
        console.log('Failed to load page!!', error);
        console.log('================================================')
        return handleStatus(res, 500)
    }
}

const verifyEmail = async (req, res) => {
    try {
        const { otp } = req.body;
        const email = req.session.usermail;

        const userOtp = await OTP.findOne({ email, otp });

        if (!userOtp) {
            return handleStatus(res, 401, 'Invalid OTP or OTP has been expired. Try again...');
        }

        const user = req.session.userData;
        const passwordHash = await securePassword(user.password);

        const saveUserData = new User({
            name: user.name,
            email: user.email,
            phone: user.phone,
            password: passwordHash
        });

        await saveUserData.save();

        req.session.user = saveUserData._id;
        req.session.userData = saveUserData;

        await OTP.deleteOne({ _id: userOtp._id });

        return handleStatus(res, 200, 'OTP Verified', {
            redirectUrl: '/'
        })

    } catch (error) {
        console.log("================================");
        console.log("Failed to load page!!", error);
        console.log("================================");
        return handleStatus(res, 500)
    }
};

//Resent OTP
const resendOtp = async (req, res) => {
    try {

        const { email } = req.session.userData;

        if (!email) {
            return handleStatus(res, 401, 'Email not found')
        }

        let otp = generateOtp();
        await OTP.deleteMany({ email })
        const userOtp = new OTP({ otp, email })
        await userOtp.save()
        req.session.userOtp = otp;
        req.session.otpGenerated = Date.now()

        const remainingTime = 90 * 1000;

        const emailSent = await sendOTP(email, otp)
        if (!emailSent) {
            return handleStatus(res, 500, 'Failed to send OTP. Please try again later');
        }

        return handleStatus(res, 200, 'OTP send successfully');

    } catch (error) {
        console.log("Error resending OTP:", error);
        return handleStatus(res, 500)
    }
}

const loadforgotPass = async (req, res) => {
    try {
        const search = req.query.search || ''
        const userId = req.session.user

        const cart = userId ? await Cart.findOne({ userId }) : 0

        res.render('forgottPass', {
            currentPage: 'forgottPass',
            cart,
            search
        })

    } catch (error) {
        console.log('Error while loading forgottPass', error)
        return handleStatus(res, 500)
    }

}

const forgotpass = async (req, res) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email: email })

        if (user) {
            const otp = generateOtp()
            const emailSent = await sendOTPForgott(email, otp)
            if (emailSent) {
                req.session.userOtp = otp
                req.session.email = email
                req.session.userData = user
                console.log('OTP for reset pass : ', otp)
                return handleStatus(res, 200, 'OTP Generated', {
                    redirectUrl: '/verifyEmailforgot'
                });
            } else {
                return handleStatus(res, 500, 'Filed to send OTP. Try again later')
            }
        } else {
            return handleStatus(res, 401, 'User Not Found')
        }
    } catch (error) {
        console.log('Failed to reset password : ', error)
        return handleStatus(res, 500)
    }
}

const loadverifyEmailforgot = async (req, res) => {
    try {

        const search = req.query.search || ''

        const userId = req.session.user

        const cart = userId ? await Cart.findOne({ userId }) : 0

        res.render('verifyEmailforgot', {
            currentPage: 'verifyEmailforgot',
            search,
            cart
        })

    } catch (error) {
        console.log('Error while loading forgottPass', error)
        return handleStatus(res, 500)
    }
}

const verifyEmailforgot = async (req, res) => {
    try {
        const { otp } = req.body

        console.log('from body : ', otp)
        console.log('from session : ', req.session.userOtp)
        if (otp === req.session.userOtp) {
            const user = req.session.userData
            return handleStatus(res, 200, 'OTP Verified', {
                redirectUrl: '/resetPassword'
            })
        }
        return handleStatus(res, 400, 'Invalid OTP. Try again!!')
    } catch (error) {
        console.log('================================');
        console.log("Failed to load page!!", error);
        console.log('================================');
        return handleStatus(res, 500);
    }
}

const loadResetPassword = async (req, res) => {
    try {
        const search = req.query.search || ''

        const userId = req.session.user

        const cart = userId ? await Cart.findOne({ userId }) : 0

        return res.render('resetPass', {
            currentPage: 'resetPass',
            search,
            cart
        })
    } catch (error) {
        console.errpr('Error occurred while loading reset Password Page : ', error)
        return handleStatus(res, 500)
    }
}

const resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body

        const user = await User.findOne({ email: req.session.email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        if (password !== confirmPassword) {
            return res.status(401).json({ success: false, message: 'Passwords do not match' })
        }

        const passwordHash = await securePassword(password)
        if (!passwordHash) {

            return res.status(401).json({ success: false, message: 'Password hashing failed' })
        }

        user.password = passwordHash

        await user.save()

        return res.status(200).json({ success: true, message: 'Password changed successfully', redirectUrl: '/signin' })

    } catch (error) {
        console.log('Somthing went wrong while resetting password : ', error)
        return handleStatus(res, 500)
    }
}

const pageNotFound = async (req, res) => {
    try {
        res.render('page-404')
    } catch (error) {
        console.log('================================================')
        console.log('Failed to load Page!!', error)
        console.log('================================================')
        return handleStatus(res, 500)
    }
}



module.exports = {
    pageNotFound,
    loadforgotPass,
    loadverifyEmailforgot,
    forgotpass,
    verifyEmailforgot,
    loadResetPassword,
    resetPassword,
    loadVerifyEmail,
    verifyEmail,
    resendOtp,
    loadSignup,
    signup,
    signout,
    loadProduct,

}