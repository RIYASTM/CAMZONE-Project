const User = require('../../model/userModel')
const Address = require('../../model/addressModel')
const Cart = require('../../model/cartModel')

const {validateProfile} = require('../../helpers/validations')

const session = require('express-session')


const loadProfile = async (req,res) => {
    try {

        const search = req.query.search || ''

        const userId= req.session.user
        
        if(!userId){
            return res.status(404).json({success : false , message : 'User not authenticated!'})
        }


        const user = await User.findById(userId)

        if(!user ){
            return res.status(404).json({success : false , message : 'User not found!'})
        }

        const cart = userId ? await Cart.findOne({userId}) : 0

        const address = await Address.findById(userId)
        
        
        return res.render('profile',{
            currentPage : 'profile',
            user,
            address,
            search,
            cart
        })

    } catch (error) {
        console.log('Failed to load the Profile Page : ',error)
    }
}

const editProfile = async (req,res) => {
    try {
        
        const userId = req.session.user;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated.' });
        }

        const { name, email, phone } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        console.log('User : ',user)

        const existUser = await User.findOne({
            $or: [{ name }, { email }, { phone }],
            _id: { $ne: userId }
        });

        if (existUser) {
            let errors = {};
            if (existUser.name === name) errors.name = 'Username already exists.';
            if (existUser.email === email) errors.email = 'Email already exists.';
            if (existUser.phone === phone) errors.phone = 'Phone number already exists.';
            return res.status(409).json({ success: false, message: 'Duplicate entry found.', errors });
        }

        const data = {name , email, phone}

        console.log('data : ', data)

        const errors = validateProfile(data)

        if(errors){
            return res.status(400).json({success : false , message : 'Validation Error'})
        }

        const updateData = {
            name : data.name ? data.name : user.name,
            email : data.email ? data.email : user.email,
            phone : data.phone ? data.phone : user.phone,
            profileImage : req.file ? req.file.filename : user.profileImage
        }

        const updateUser = await User.findByIdAndUpdate(userId, updateData,{new : true, runValidators : true})

        console.log('Updated User : ', updateUser)

        if(!updateUser){
            return res.status(500).json({
                success : false,
                message : 'Failed to update user'
            })
        }

        return res.status(200).json({
            success : true,
            message : 'User updated successfully',
            redirectUrl : '/profile'
        })


    } catch (error) {
        console.log('=================================')
        console.error("User updating error : ", error);
        console.log('=================================')
        return res.status(500).json({ 
            success: false,
            message: "Something went wrong while updating User: " + error.message 
        });
    }
}






module.exports = {
    loadProfile,
    editProfile
}