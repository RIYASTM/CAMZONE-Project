const nodemailer = require('nodemailer')
const env = require('dotenv').config()

async function sendMessage(data) {
    try {

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            // port : 587,
            // secure : false,
            // require : true
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            replyTo: data.email,
            to: process.env.NODEMAILER_EMAIL,
            subject: `I need your support - ${data.name} , ${data.phone}`,
            html: `
                <p><strong>Name:</strong> ${data.name}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Phone:</strong> ${data.phone}</p>
                <p><strong>Message:</strong></p>
                <p>${data.message}</p>
            `
        })

        return info.accepted.length > 0


    } catch (error) {
        console.log('Some thing went wrong : ', error)
    }
}

module.exports = sendMessage