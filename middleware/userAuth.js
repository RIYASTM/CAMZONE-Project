const User = require('../model/userModel')

const userAuth = (req,res,next)=> {
    if(req.session.user){
        User.findById(req.session.user)
        .then(data => {
            if(data && !data.isBlocked){
                next()
            }else{
                req.session.destroy(() => {
                    res.redirect('/')
                })
            }
        })
        .catch(error => {
            console.log('Error in userAuth Middleware ',error)
            res.status(500).send('Internal server error')
        })
    }else{
        res.redirect('/')
    }
}

module.exports = userAuth