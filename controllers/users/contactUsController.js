const Cart = require('../../model/cartModel');
const User = require('../../model/userModel');
const Message = require('../../model/messageModal');

const sendMessage = require('../../helpers/contactUs');
const { handleStatus } = require('../../helpers/status');

const loadContactUs = async (req, res) => {
    try {

        const userId = req.session.user

        const user = userId ? await User.findById(userId) : ''

        const cart = userId ? await Cart.findOne({ userId }) : 0

        const search = req.query.search || ''


        return res.render('contactUs', {
            currentPage: 'contactUs',
            search,
            cart,
            user
        })

    } catch (error) {
        console.log('Something with contactUs : ', error)
        return handleStatus(res, 500);
    }
}

const contactUs = async (req, res) => {
    try {

        const userId = req.session.user

        const data = req.body

        const message = new Message({
            userId: userId ? userId : null,
            name: data.name,
            email: data.email,
            phone: data.phone,
            message: data.message
        })

        const isSaved = await message.save()

        if (!isSaved) {
            return handleStatus(res, 400, 'Your message is not saved. Please try again later!!');
        }

        const messageSend = await sendMessage(data)

        if (!messageSend) {
            return handleStatus(res, 500, 'Your message is not send!');
        }

        return handleStatus(res, 200, 'Your message is send!');

    } catch (error) {
        console.log('Something went wrong : ', error)
        return handleStatus(res, 500);
    }
}

module.exports = {
    loadContactUs,
    contactUs
}