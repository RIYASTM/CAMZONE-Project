
const bcrypt = require('bcrypt')

const User = require("../../model/userModel")
const Cart = require('../../model/cartModel')

const { validatePassword } = require('../../helpers/validations')
const { generateOtp, sendOTP } = require('../../helpers/OTP')
const { securePassword } = require('../../helpers/hashPass')
const { handleStatus } = require("../../helpers/status")


const checkPassword = async (req, res) => {
    try {

        const userId = req.session.user

        const user = await User.findById(userId)

        const currentPassword = req.body.currentPassword

        const isMatch = bcrypt.compare(currentPassword, user.password)

        if (!isMatch) {
            return handleStatus(res, 400, 'Password didn`t match!!', {
                errors: { currentPassword: "Password didn`t Match" }
            });
        }

        const email = user.email

        const otp = generateOtp();
        console.log('==================================================')
        console.log(`OTP Generated to "${email}" : "${otp}"`);
        console.log('==================================================')

        const emailSent = await sendOTP(email, otp);

        req.session.userOtp = otp;

        if (!emailSent) {
            return handleStatus(res, 500, 'Failed to send OTP, Try after some time!!');
        }

        return handleStatus(res, 200, 'Password matched!!');

    } catch (error) {
        console.log('Error occurred while password checking : ', error)
        return handleStatus(res, 500);
    }
}

const confirmOTP = async (req, res) => {
    try {

        const { otp } = req.body

        if (otp === req.session.userOtp) {
            return handleStatus(res, 200, 'OTP verified!!');
        }

        return handleStatus(res, 400, 'Invalid OTP');


    } catch (error) {
        console.log('Failed verify otp : ', error);
        return handleStatus(res, 500);
    }
}

const changePassword = async (req, res) => {
    try {

        const userId = req.session.user
        if (!userId) {
            return handleStatus(res, 401, 'User not Authenticated');
        }

        const user = await User.findById(userId)
        if (!user) {
            return handleStatus(res, 400, 'User not found!!');
        }

        const data = req.body

        const currentPassword = data.currentPassword

        const isMatch = await bcrypt.compare(currentPassword, user.password)

        if (!isMatch) {
            return handleStatus(res, 400, 'Passwords didn`t match!!', {
                errors: { currentPassword: "Password didn`t match with old Password" }
            });
        }

        let validationError = validatePassword(data)

        if (validationError) {
            return handleStatus(res, 401, 'Validation error!', { validationError })
        }

        const hashedPassword = await securePassword(data.newPassword)

        const updatePassword = await User.findByIdAndUpdate(userId, {
            $set: {
                password: hashedPassword
            }
        })

        if (!updatePassword) {
            return handleStatus(res, 401, 'Password updation failed!!');
        }

        req.session.userOtp = null

        return handleStatus(res, 200, 'Password updated successfully!!');

    } catch (error) {
        console.log('Failed to update password : ', error)
        return handleStatus(res, 500)
    }
}


module.exports = {
    checkPassword,
    confirmOTP,
    changePassword
}