//Models
const User = require('../../model/userModel')
const Cart = require('../../model/cartModel')
const bcrypt = require('bcrypt')

//Helper Functions
const { validateForm, validateUser } = require('../../helpers/validations')
const { handleStatus } = require('../../helpers/status')



//Sign In
const loadSignin = async (req, res) => {
    try {

        if (req.session.user) return res.redirect('/')

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
        return handleStatus(res, 500)
    }
}

const signin = async (req, res) => {

    try {

        const { email, password } = req.body

        const isUser = await User.findOne({ email })

        if (!isUser) {
            return handleStatus(res, 404, 'User not Exist', { errors: { email: 'User not found!!' } })
        }

        const isUserBlocked = await User.findOne({ email, isBlocked: true })

        if (isUserBlocked) {
            return handleStatus(res, 403, 'You are blocked', { errors: { email: 'Blocked User' } })
        }

        const errors = validateForm(email, password)
        if (errors) {
            return res.status(400).json({ success: false, errors })
        }

        const isMatch = await bcrypt.compare(password, isUser.password)

        if (!isMatch) {
            return handleStatus(res, 400, 'Password didn`t Match', { errors: { password: "Password didn`t Match" } })
        }

        console.log("=========================================");
        console.log(email, password)
        console.log("=========================================");

        req.session.usermail = isUser.email;
        req.session.user = isUser._id;

        return handleStatus(res, 200, null, { redirectUrl: '/' })

    } catch (error) {
        console.error("Signin error:", error);
        return handleStatus(res, 500)
    }
}

//Sign Out
const signout = async (req, res) => {
    try {
        req.logout((err) => {
            if (err) return next(err);
            req.session.destroy((err) => {
                if (err) return res.redirect('/');
                res.clearCookie('user.sid');
                res.redirect('/');
            });
        });
        console.log('Signed out');
    } catch (error) {
        console.log('================================================');
        console.log('Failed to signout!!', error);
        console.log('================================================');
        return handleStatus(res, 500);
    }
};

module.exports = {
    loadSignin,
    signin,
    signout
}