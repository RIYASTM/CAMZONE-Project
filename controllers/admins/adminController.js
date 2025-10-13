const User = require('../../model/userModel')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const { handleStatus } = require('../../helpers/status')

const loadpage404 = async (req, res) => {
    try {
        return res.render('page404')
    } catch (error) {
        return handleStatus(res, 500)
    }
};

const loadSignin = async (req, res) => {
    try {

        if (req.session.admin) {
            return res.redirect('/admin/dashboard')
        }

        return res.render('adminsignin')
    } catch (error) {
        console.log('======================================');
        console.log('failed to load signin', error);
        console.log('======================================');
        return handleStatus(res, 500, null, { redirectUrl: '/admin/page404' });
    }
};

const signin = async (req, res) => {
    try {

        const { email, password } = req.body

        const admin = await User.findOne({ email, isAdmin: true });

        if (!admin) {
            return handleStatus(res, 401, 'Admin not found')
        }

        const passwordMatch = await bcrypt.compare(password, admin.password);

        if (!passwordMatch) {
            return handleStatus(res, 401, 'Password didn`t match')
        }

        req.session.admin = true
        req.session.adminId = admin._id;

        return handleStatus(res, 200, 'Signed in Successfully', { redirectUrl: '/admin/dashboard' })

    } catch (error) {
        console.log('===========================================')
        console.log('failed to load the page', error)
        console.log('===========================================')
        return handleStatus(res, 500, null, { redirectUrl: '/admin/page404' });
    }
};

const logout = async (req, res) => {
    try {

        req.session.destroy((err) => {
            if (err) {
                return res.redirect('/admin/dashboard')
            }
            res.clearCookie('admin.sid');
            res.redirect('/admin/');
        })

    } catch (error) {
        console.log('===================================');
        console.log("Failed to logout", error)
        console.log('===================================');
        return handleStatus(res, 500, null, { redirectUrl: '/admin/page404' });
    }
};


module.exports = {
    loadSignin,
    loadpage404,
    signin,
    logout
}