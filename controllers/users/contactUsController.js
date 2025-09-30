const Cart = require('../../model/cartModel')
const User = require('../../model/userModel')
const Message = require('../../model/messageModal')

const sendMessage = require('../../helpers/contactUs')

const loadContactUs = async (req,res) => {
    try {

        const userId = req.session.user
        
        const user = userId ? await User.findById(userId) : ''

        const cart = userId ? await Cart.findOne({userId}) : 0

        const search = req.query.search || ''
        
        
        return res.render('contactUs',{
            currentPage: 'contactUs',
            search,
            cart,
            user
        })

    } catch (error) {
        console.log('Something with contactUs : ', error)
        return res.redirect('/pageNotFound');
    }
}

const contactUs = async (req, res) => {
    try {
        
        const userId = req.session.user

        const data = req.body

        const message = new Message({
            userId : userId ? userId : null,
            name : data.name,
            email : data.email,
            phone : data.phone,
            message : data.message
        })

        const isSaved = await message.save()
        
        if(!isSaved) {
            return res.status(402).json({ success : false, message : 'Your message is not saved!!'})
        }

        const messageSend = await sendMessage(data)

        if(!messageSend){
            return res.status(500).json({ success : false, message : 'Your message is not send!!'})
        }

        return res.status(200).json({success : true , message : 'Your message is sent'})

    } catch (error) {
        console.log('Something went wrong : ', error)
    }
}

module.exports = {
    loadContactUs,
    contactUs
}