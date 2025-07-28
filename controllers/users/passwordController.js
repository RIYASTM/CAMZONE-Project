
const User = require("../../model/userModel")
const Cart = require('../../model/cartModel')
const bcrypt = require('bcrypt')
const {validatePassword} = require('../../helpers/validations')
const {generateOtp,sendOTP} = require('../../helpers/OTP')
const securePassword = require('../../helpers/hashPass')



// const loadPassword = async (req,res) => {
//     try {
//         const search = req.query.search || ''
//         const user = await User.findById(req.session.user)
        
//         const userId = req.session.user

//         const cart = userId ? await Cart.findOne({userId}) : 0

//         return res.render('password',{
//             currentPage : 'password',
//             search,
//             user,
//             cart
//         })

//     } catch (error) {
//         console.log('Failed to load the password Page : ', error)
//     }
// }

const checkPassword = async (req,res) => {
    try {
        
        const userId = req.session.user

        // console.log('userId :: ', userId)

        const user = await User.findById(userId)

        // console.log('User :: ', user)

        const currentPassword = req.body.currentPassword

        console.log('Current pasword : ', currentPassword)

        // const password = user.password

        // console.log('Password : ', password)

        const isMatch = await bcrypt.compare( currentPassword , user.password)

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Password didn`t Match",
                errors: { currentPassword: "Password didn`t Match" }
            });
        }

        const email = user.email

        console.log('email : ', email)

        const otp = generateOtp();
        console.log('==================================================')
        console.log(`OTP Generated to "${email}" : "${otp}"`);
        console.log('==================================================')
        
        const emailSent = await sendOTP(email, otp);

        req.session.userOtp = otp;

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: "Failed to send OTP. Try again."
            });
        }

        // let seconds = 10

        // let countdown = setInterval(() => {
        //     seconds --
            
        //     if(seconds <= 0){
        //         clearInterval(countdown)
        //         req.session.userOtp = null
        //         console.log('OTP Expired!!')
        //     }
        // },1000)

        return res.status(200).json({success : true , message : 'Password matched!!'})

    } catch (error) {
        console.log('Error occurred while password checking : ', error)
        return res.status(500).json({success : false , message : 'Error occured while password checking!!'})
    }
}

const confirmOTP = async (req,res) => {
    try {
        
        const {otp} = req.body

        if(otp === req.session.userOtp){
            res.status(200).json({success : true , message : 'OTP veirfied!!'})
            return
        }

        res.status(401).json({success : false , message : 'Invalid OTP'})


    } catch (error) {
        console.log('Failed verify otp : ', error)
    }
}

const changePassword = async (req,res) => {
    try {
        
        const userId = req.session.user
        if(!userId){
            return res.status(401).json({success : false , message : 'User not authenticated!'})
        }

        const user = await User.findById(userId)
        if(!user){
            return res.status(404).json({success : false , message : 'User not found!'})
        }

        const data = req.body

        let validationError = validatePassword(data)

        if(validationError){
            return res.status(401).json({success : false , message : 'Validation error' })
        }

        const otp = req.session.userOtp

        if(!otp){
            return res.status(404).json({success : false , message : 'User not confirmed!!'})
        }

        const hashedPassword = await securePassword(data.newPassword)

        const updatePassword = await User.findByIdAndUpdate(userId,{
            $set:{
                password : hashedPassword
            }
        })

        if(!updatePassword){
            return res.status(401).json({success : false , message : 'Password updation failed!'})
        }



        req.session.userOtp = null

        return res.status(200).json({success : true , message : 'Password updated successfully!!'})
        

    } catch (error) {
        console.log('Failed to update password : ', error)
        return res.status(500).json({success :false , message : 'An error occurred while updating password!!'})   
    }
}


module.exports = {
    // loadPassword,
    checkPassword,
    confirmOTP,
    changePassword
}