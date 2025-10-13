const User = require('../model/userModel')


const adminAuth = (req, res, next) => {
    if (req.session && req.session.admin) {
        next()
    } else {
        res.redirect('/admin/')
    }
}


module.exports = adminAuth