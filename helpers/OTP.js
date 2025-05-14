const nodemailer = require('nodemailer')
const env = require('dotenv').config()



function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendOTP(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            require: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })
        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: 'Verify your account',
            text: `Your OTP is : ${otp}`,
            html: ` <b> Your OTP : ${otp} </b>`
        })

        return info.accepted.length > 0

    } catch (error) {

        console.log('=================================');
        console.log('Error on sending email', error)
        console.log('=================================');

    }
}


async function sendOTPForgott(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            require: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })
        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: 'OTP for Reset Password',
            text: `Your OTP is : ${otp}`,
            html: ` <b> Your OTP : ${otp} </b>`
        })

        return info.accepted.length > 0

    } catch (error) {

        console.log('=================================');
        console.log('Error on sending email', error)
        console.log('=================================');

    }
}


module.exports = {
    sendOTPForgott,
    generateOtp,
    sendOTP
}
