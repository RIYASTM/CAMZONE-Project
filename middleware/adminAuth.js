const User = require('../model/userModel')

// const adminAuth = (req,res,next)=>{
//     User.findOne({isAdmin:true} )
//     .then(data=>{
//         if(data){
//             next()
//         }else{

//             res.redirect('/admin/')
//         }
//     })
//     .catch(error=>{
//         console.error('Error in adminAuth middleware!!')
//         res.status(500).send("Internal server error")
//     })
// }

const adminAuth = (req,res,next) => {
    if(req.session.admin){
        next()
    }else{
        res.redirect('/admin/')
    }
}


module.exports = adminAuth