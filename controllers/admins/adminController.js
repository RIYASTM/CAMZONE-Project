const User = require('../../model/userModel')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const loadpage404 = async (req, res) => {
    try {
        return res.render('page404')
    } catch (error) {
        res.status(500).send("server error")
    }
}

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
        res.status(500).send("Server Error")
    }
}

const signin = async (req, res) => {
    try {

        const { email, password } = req.body

        const admin = await User.findOne({ email, isAdmin: true });

        if (!admin) {
            return res.status(401).json({ success: false, message: 'Admin not found' });
        }

        const passwordMatch = await bcrypt.compare(password, admin.password);

        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password' });
        }

        req.session.admin = true
        req.session.adminId = admin._id;

        return res.status(200).json({ success: true, message: 'Signed in Successfully', redirectUrl: '/admin/dashboard' })

    } catch (error) {

        console.log('===========================================')
        console.log('failed to load the page', error)
        console.log('===========================================')
        res.status(500).json({ success: false, message: 'An error occurred while signin for admin ' })

    }
}

const logout = async (req, res) => {
    try {

        req.session.destroy((err) => {
            if (err) {
                return res.redirect('/admin/dashboard')
            }
            res.clearCookie('connect.sid');
            res.redirect('/admin/');
        })

    } catch (error) {
        console.log("Failed to logout", error)
        console.log('===================================');
        res.status(500).redirect('/page404')
        console.log('===================================');
    }
}


module.exports = {
    loadSignin,
    loadpage404,
    signin,
    logout
}