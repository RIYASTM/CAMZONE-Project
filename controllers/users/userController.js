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

//helper Functions
const securePassword = require('../../helpers/hashPass')
const { sendOTPForgott, generateOtp, sendOTP } = require('../../helpers/OTP')
const { validateForm, validateUser } = require('../../helpers/validations')



//Home Page
const loadHomePage = async (req, res) => {
    try {

        const search = req.query.search || ''
        const usermail = req.session.usermail;
        const userId = req.session.user

        const user = await User.findById(userId)

        const cart = userId ? await Cart.findOne({ userId }) : 0;

        const brands = await Brands.find({ isDeleted: false, isBlocked: false });
        const categories = await Category.find({ isListed: true });

        const query = { isBlocked: false, isDeleted: false };

        if (search) {

            const brandIds = await Brands.find({
                brandName: { $regex: search.trim(), $options: 'i' },
                isBlocked: false
            }).distinct('_id');

            const categoryIds = await Category.find({
                name: { $regex: search.trim(), $options: 'i' },
                isListed: true
            }).distinct('_id');

            query.$or = [
                { productName: { $regex: search.trim(), $options: 'i' } },
                { brand: { $in: brandIds } },
                { category: { $in: categoryIds } }
            ];
        }

        const products = await Products.find({
            ...query,
            category: { $in: categories.map(category => category._id) },
            productImage: { $exists: true, $ne: [] }
        })
            .populate('brand')
            .populate('category')
            .exec();

        const productsWithOffers = products.map(product => {
            const productOffer = product.productOffer || 0;
            let brandOffer = product.brand?.brandOffer || 0;
            let categoryOffer = product.category?.categoryOffer || 0;

            const totalOffer = Math.max(productOffer, brandOffer, categoryOffer);

            product.salePrice = Math.round(product.regularPrice - product.regularPrice / 100 * totalOffer)

            return {
                ...product._doc,
                productOffer,
                brandOffer,
                categoryOffer,
                totalOffer
            };
        });

        const wishList = await Wishlist.findOne({userId }).populate('items.product')

        let wishlistItems = wishList ? wishList.items.map(item => item.product._id.toString()) : []

        const newProducts = productsWithOffers
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 8);

        return res.render('home', {
            user: user || '',
            search,
            cart,
            currentPage: 'home',
            brands,
            category: categories,
            newProducts,
            products: productsWithOffers,
            wishlistItems
        });

    } catch (error) {
        console.log('================================================');
        console.log('Failed to load home!!', error);
        console.log('================================================');
        return res.status(500).redirect('/pageNotFound');
    }
}

//Products Displaying with Filters
const loadShop = async (req, res) => {
    try {
        const search = req.query.search || '';
        const usermail = req.session.usermail;
        const brand = req.query.brand;
        const category = req.query.category;
        const price = req.query.price;
        const sortName = req.query.sortName;
        const stock = req.query.sortQuantity;

        const query = { isDeleted: false, isBlocked: false };

        const userId = req.session.user

        const user = await User.findById(userId);

        const cart = userId ? await Cart.findOne({ userId }) : 0

        let queryParts = [];

        // Price Filter
        let sortOption = {};

        if (price) {
            switch (price) {
                // 🔃 Sorting cases
                case 'LOW-HIGH':
                    sortOption.salePrice = 1;
                    queryParts.push(`price=${encodeURIComponent(price)}`);
                    break;
                case 'HIGH-LOW':
                    sortOption.salePrice = -1;
                    queryParts.push(`price=${encodeURIComponent(price)}`);
                    break;

                // 💰 Filtering cases
                case 'below-10000':
                    query.salePrice = { $lt: 10000 };
                    queryParts.push(`price=${encodeURIComponent(price)}`);
                    break;
                case '10000-50000':
                    query.salePrice = { $gte: 10000, $lt: 50000 };
                    queryParts.push(`price=${encodeURIComponent(price)}`);
                    break;
                case '50000-100000':
                    query.salePrice = { $gte: 50000, $lt: 100000 };
                    queryParts.push(`price=${encodeURIComponent(price)}`);
                    break;
                case '100000-500000':
                    query.salePrice = { $gte: 100000, $lt: 500000 };
                    queryParts.push(`price=${encodeURIComponent(price)}`);
                    break;
                case 'above-500000':
                    query.salePrice = { $gte: 500000 };
                    queryParts.push(`price=${encodeURIComponent(price)}`);
                    break;

                default:
                    console.log('Invalid Entry');
                    break;
            }
        }

        // Category Filter
        if (category) {
            const categoryFilter = category ? (Array.isArray(category) ? category : [category]) : [];
            if (categoryFilter.length > 0) {
                query.category = { $in: categoryFilter };

                // If it's array, handle each category separately
                if (Array.isArray(category)) {
                    category.forEach(cat => {
                        queryParts.push(`category=${encodeURIComponent(cat)}`);
                    });
                } else {
                    queryParts.push(`category=${encodeURIComponent(category)}`);
                }
            }
        }

        // Brand Filter
        if (brand) {
            const brandFilter = brand ? (Array.isArray(brand) ? brand : [brand]) : [];
            if (brandFilter.length > 0) {
                query.brand = { $in: brandFilter };

                if (Array.isArray(brand)) {
                    brand.forEach(b => {
                        queryParts.push(`brand=${encodeURIComponent(b)}`);
                    });
                } else {
                    queryParts.push(`brand=${encodeURIComponent(brand)}`);
                }
            }
        }

        // Name Filter
        if (sortName) {
            if (sortName === 'A-Z') {
                sortOption.productName = 1;
                queryParts.push(`sortName=${encodeURIComponent(sortName)}`);
            } else if (sortName === 'Z-A') {
                sortOption.productName = -1;
                queryParts.push(`sortName=${encodeURIComponent(sortName)}`);
            }
        }

        // Build final query string from all parts
        let finalQuery = queryParts.join('&');

        // Search logic for database query
        if (search) {
            queryParts.push(`search=${encodeURIComponent(search)}`);

            const brandIds = await Brands.find({
                brandName: { $regex: search.trim(), $options: 'i' },
                isBlocked: false
            }).distinct('_id');

            const categoryIds = await Category.find({
                name: { $regex: search.trim(), $options: 'i' },
                isListed: true
            }).distinct('_id');

            query.$or = [
                { productName: { $regex: search.trim(), $options: 'i' } },
                { brand: { $in: brandIds } },
                { category: { $in: categoryIds } },
            ];
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;



        const products = await Products.find(query)
            .sort(sortOption)
            .populate('brand')
            .populate('category')
            .skip(skip)
            .limit(limit)
            .exec();

        const brands = await Brands.find({ isDeleted: false, isBlocked: false });
        const categories = await Category.find({ isListed: true });

        const totalProducts = await Products.countDocuments({
            isDeleted: false,
            isBlocked: false,
            ...query
        });

        const wishList = await Wishlist.findOne({userId }).populate('items.product')

        let wishlistItems = wishList ? wishList.items.map(item => item.product._id.toString()) : []

        const totalPages = Math.ceil((totalProducts >= 2 ? totalProducts : 1) / limit);

        return res.render('shop', {
            user: user || '',
            search,
            cart,
            brands,
            category: categories,
            products: products || [],
            currentPage: 'shop',
            currentPages: page,
            totalPages,
            finalQuery,
            wishlistItems
        });

    } catch (error) {
        console.log('================================================');
        console.log('Failed to load shop!!', error);
        console.log('================================================');
        return res.status(500).redirect('/pageNotFound');
    }
}

//Product Page
const loadProduct = async (req, res) => {
    try {

        const search = req.query.search || ''

        const usermail = req.session.usermail

        const userId = req.session.user

        const user = await User.findById(userId)

        const cart = userId ? await Cart.findOne({ userId }) : 0


        const productId = req.query.id

        const product = await Products.findById(productId, { isBlocked: false }).populate(['category', 'brand'])

        if (!product) {
            return res.status(400).json({ success: false, message: 'This products is blocked or unavailable' })
        }

        const wishList = await Wishlist.findOne({userId }).populate('items.product')

        let wishlistItems = []

        if (wishList) {
            wishlistItems = wishList.items.map(item => item.product._id.toString())
        }

        const findCategory = product.category

        const findBrand = product.brand

        const categoryOffer = findCategory?.categoryOffer || 0

        console.log('Category offer : ', categoryOffer)

        const brandOffer = findBrand?.brandOffer || 0

        console.log('Brand offer : ', brandOffer)

        const productOffer = product.productOffer || 0

        console.log('Product offer : ', productOffer)

        const totalOffer = Math.max(productOffer, brandOffer, categoryOffer);

        //Offer Console
        const offers = {
            Brand: brandOffer,
            Category: categoryOffer,
            Product: productOffer
        }

        const maxKey = Object.keys(offers).reduce((a, b) => {
            return offers[a] > offers[b] ? a : b
        })

        console.log(`Offer : ${maxKey} Offer - ${offers[maxKey]}`)

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
        return res.status(500).redirect('/pageNotFound');
    }
}

//Sign In
const loadSignin = async (req, res) => {
    try {

        if(req.session.user) return res.redirect('/')

        const userId = req.session.user

        const cart = userId ? await Cart.findOne({ userId }) : 0

        const search = req.query.search || ''
        return res.render('signin', {
            currentPage: 'signin',
            cart,
            search
        })
    } catch (error) {
        console.log('================================================')
        console.log('Failed to load page!!', error);
        console.log('================================================')
        return res.status(500).redirect('/pageNotFound')
    }
}

const signin = async (req, res) => {

    try {

        const { email, password } = req.body

        const isUser = await User.findOne({ email })

        if (!isUser) {
            return res.status(400).json({
                success: false,
                message: 'User not Exist',
                errors: { email: 'User not found!!' }
            })
        }

        const userBlocked = await User.findOne({ email, isBlocked: true })

        if (userBlocked) {
            return res.status(400).json({
                success: false,
                message: 'You`re Blocked',
                errors: { email: 'Blocked User' }
            })
        }

        const errors = validateForm(email, password)
        if (errors) {
            return res.status(400).json({ success: false, errors })
        }

        const isMatch = await bcrypt.compare(password, isUser.password)

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Password didn`t Match",
                errors: { password: "Password didn`t Match" }
            });
        }

        console.log("=========================================");
        console.log(email, password)
        console.log("=========================================");

        req.session.usermail = isUser.email;
        req.session.user = isUser._id;

        return res.status(200).json({
            success: true,
            message: "Signin Success",
            redirectUrl: '/'
        })

    } catch (error) {
        console.error("Signin error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong: " + error.message
        });
    }
}

//Account Creating
const loadSignup = async (req, res) => {
    try {

        if(req.session.user) return res.redirect('/')

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
        return res.status(500).redirect('/pageNotFound')
    }
}

const signup = async (req, res) => {
    try {

        const { name, email, phone, password, confirmPassword } = req.body;

        const findUser = await User.findOne({ email });
        if (findUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists",
                errors: { email: "User with this email already exists" }
            });
        }

        const userData = { name, email, phone, password, confirmPassword };

        const errors = validateUser(userData);
        if (errors) {
            return res.status(400).json({ success: false, errors });
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
            return res.status(500).json({
                success: false,
                message: "Failed to send OTP. Try again."
            });
        }

        req.session.userData = { name, email, phone, password };

        return res.status(200).json({
            success: true,
            message: "OTP Generated",
            redirectUrl: "/emailVerify"
        });

    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong: " + error.message
        });
    }
}

//sign Out
const signout = async (req, res) => {
    try {

        req.session.destroy((err) => {
            if (err) {
                return res.redirect('/');
            }
            res.clearCookie('connect.sid');
            res.redirect('/');
        });

        console.log('Signed out')
    } catch (error) {
        console.log('================================================')
        console.log('Failed to signout!!', error)
        console.log('================================================')
        return res.status(500).render('page-404')
    }
}

//Email Verifying
const loadVerifyEmail = async (req, res) => {
    try {

        if(req.session.user) return res.redirect('/')

        console.log('page loaded')

        const search = req.query.search || ''

        const email = req.session.usermail

        const userOtp = await OTP.findOne({ email })

        if (userOtp) {
            console.log('userOtp : ', userOtp)
        }


        const otpGenerated = userOtp?.createdAt || 0
        console.log('otp generated : ', otpGenerated)

        const expiryTime = 90 * 1000

        const now = Date.now()

        console.log('now : ', now)


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
        return res.status(500).redirect('/pageNotFound')
    }
}

const verifyEmail = async (req, res) => {
    try {
        const { otp } = req.body;
        const email = req.session.usermail;

        const userOtp = await OTP.findOne({ email, otp });

        if (!userOtp) {
            return res.status(401).json({
                success: false,
                message: 'Invalid OTP or OTP has been expired. Try Again...'
            });
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

        // 4. Setup session
        req.session.user = saveUserData._id;
        req.session.userData = saveUserData;

        // 5. Cleanup OTP from DB
        await OTP.deleteOne({ _id: userOtp._id });

        return res.status(200).json({
            success: true,
            message: "OTP Verification Success",
            redirectUrl: "/"
        });

    } catch (error) {
        console.log("================================");
        console.log("Failed to load page!!", error);
        console.log("================================");
        res.status(500).json({ success: false, message: "An error occured" });
    }
};

//Resent OTP
const resendOtp = async (req, res) => {
    try {

        const { email } = req.session.userData;
        console.log('email from session data : ', email)

        if (!email) {
            res.status(500).json({
                success: false,
                message: "Email not found , pls try again!"
            });
        }

        let otp = generateOtp();
        await OTP.deleteMany({email})
        const userOtp = new OTP({ otp, email })
        await userOtp.save()
        req.session.userOtp = otp;
        req.session.otpGenerated = Date.now()

        const remainingTime = 90 * 1000;

        const emailSent = await sendOTP(email, otp)
        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: "Failed to send email, please try again later"
            });
        }

        console.log("Resend otp:", otp);
        return res.status(200).json({
            success: true,
            message: "OTP resent successfully",
            remainingTime
        });
    } catch (error) {
        console.log("Error resending OTP:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error. Please try again..."
        });
    }
}

//Forgot Password Resetting
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
                return res.status(200).json({
                    success: true,
                    message: "OTP Generated",
                    redirectUrl: "/verifyEmailforgot"
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: "Failed to send OTP. Try again."
                });
            }
        } else {
            return res.status(500).json({
                success: false,
                message: "User not found."
            });
        }
    } catch (error) {
        console.log('Failed to reset password : ', error)
        return res.status(500).json({
            success: false,
            message: "Something went wrong: " + error.message
        });
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
        return res.redirect('/pageNotFound')
    }
}

const verifyEmailforgot = async (req, res) => {
    try {
        const { otp } = req.body

        console.log('from body : ', otp)
        console.log('from session : ', req.session.userOtp)
        if (otp === req.session.userOtp) {
            const user = req.session.userData
            return res.status(200).json({
                success: true,
                message: "OTP Verification Success",
                redirectUrl: "/resetPassword"
            });
        }
        return res.status(400).json({
            success: false,
            message: "Invelid OTP. Please try again!!"
        })

    } catch (error) {
        console.log('================================')
        console.log("Failed to load page!!", error);
        console.log('================================')
        res.status(500).json({ success: false, message: "An error occured" })

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
        return res.redirect('/pageNotFound')
    }
}

const resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body

        const user = await User.findOne({ email: req.session.email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }


        console.log('from back : ', password, ' ', confirmPassword)
        if (password !== confirmPassword) {
            return res.status(401).json({ success: false, message: 'Passwords do not match' })
        }

        const passwordHash = await securePassword(password)
        if (!passwordHash) {

            return res.status(401).json({ success: false, message: 'Password hashing failed' })
        }

        console.log('user : ', user)

        user.password = passwordHash

        await user.save()

        return res.status(200).json({ success: true, message: 'Password changed successfully', redirectUrl: '/signin' })

    } catch (error) {

    }
}

//cart
const loadCart = async (req, res) => {
    try {

        search = req.query.search || ''

        const product = await Products.find({ isBlocked: false })

        const userId = req.session.user

        const cart = userId ? await Cart.findOne({ userId }) : 0

        return res.render('cart', {
            currentPage: 'cart',
            product,
            search,
            cart
        })

    } catch (error) {
        console.log('Failed to load the cart page : ', error)
    }
}

//Error Page
const pageNotFound = async (req, res) => {
    try {
        res.render('page-404')
    } catch (error) {
        console.log('================================================')
        console.log('Failed to load Page!!', error)
        console.log('================================================')
        return res.status(500).send('Something went wrong with this page....')
    }
}



module.exports = {
    pageNotFound,
    loadHomePage,
    loadforgotPass,
    loadverifyEmailforgot,
    forgotpass,
    verifyEmailforgot,
    loadResetPassword,
    resetPassword,
    loadShop,
    loadVerifyEmail,
    verifyEmail,
    resendOtp,
    loadSignin,
    loadSignup,
    signup,
    signin,
    signout,
    loadProduct,
    loadCart

}