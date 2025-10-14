//Models
const User = require('../../model/userModel')
const Cart = require('../../model/cartModel')
const OTP = require('../../model/otpModal')
const bcrypt = require('bcrypt')

//Helper Functions
const { handleStatus } = require('../../helpers/status')


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

module.exports = {
    loadSignup,
    signup
}