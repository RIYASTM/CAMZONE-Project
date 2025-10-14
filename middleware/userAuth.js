const { handleStatus } = require('../helpers/status');
const User = require('../model/userModel')



const userAuth = (req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user)
            .then(data => {
                if (data && !data.isBlocked) {
                    return next();
                } else {
                    
                    // req.session.destroy(() => {
                    //     if (req.xhr || req.headers.accept.includes('application/json')) {
                    //         return res.status(403).json({
                    //             success: false,
                    //             message: 'Your account is blocked. Please contact support.'
                    //         });
                    //     }
                    //     return res.redirect('/');
                    // });

                    req.session.user = null
                    if(req.xhr || req.headers.accept.includes('application/json')){
                        return handleStatus(res, 403, 'Your account is blocked. Please contact support.', {redirect : '/'})
                    }
                    return res.redirect('/')
                }
            })
            .catch(error => {
                console.log('Error in userAuth Middleware ', error);
                if (req.xhr || req.headers.accept.includes('application/json')) {
                    return res.status(500).json({ success: false, message: 'Internal server error' });
                }
                return res.status(500).send('Internal server error');
            });
    } else {
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'You must signin in first.' });
        }
        return res.redirect('/signin');
    }
};

module.exports = userAuth;
