const User = require('../../model/userModel')
const Address = require('../../model/addressModel')
const Cart = require('../../model/cartModel')

const {validateProfile} = require('../../helpers/validations')
const {generateOtp,sendOTP} = require('../../helpers/OTP')

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

const editProfile = async (req, res) => {
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

        const emailChanged = email && email !== user.email;

        // Check for duplicate entries
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

        const data = { name, email, phone };
        const errors = validateProfile(data);
        if (errors) {
            return res.status(400).json({ success: false, message: 'Validation Error', errors });
        }

        // 🛑 OTP Verification if email changed
        if (emailChanged) {
            const sessionOtp = req.session.otp;
            if (!sessionOtp || sessionOtp.verified !== true) {
                return res.status(401).json({ success: false, message: 'Email change requires OTP verification.' });
            }
        }

        const updateData = {
            name,
            email,
            phone,
            profileImage: req.file ? req.file.filename : user.profileImage
        };

        const updateUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });

        if (!updateUser) {
            return res.status(500).json({ success: false, message: 'Failed to update user' });
        }

        if (req.session.otp) delete req.session.otp;

        return res.status(200).json({
            success: true,
            message: 'User updated successfully',
            redirectUrl: '/profile'
        });

    } catch (error) {
        console.error("User updating error: ", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating User: " + error.message
        });
    }
};


const otpSend = async (req,res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found!!' });
        }

        const userMail = user.email;
        const otpCode = generateOtp();

        if (!otpCode) {
            return res.status(500).json({ success: false, message: 'OTP not generated!!' });
        }

        req.session.otp = {
            code: otpCode,
            createdAt: Date.now(),
            verified: false,
            forEmail: userMail
        };

        const sendOtp = await sendOTP(userMail, otpCode);
        if (!sendOtp) {
            return res.status(400).json({ success: false , message: 'OTP not sent!!' });
        }

        return res.status(200).json({ success: true , message: 'OTP sent!' });

    } catch (error) {
        console.log('Error while sending OTP: ', error);
        return res.status(500).json({ success: false, message: 'Failed to send OTP.' });
    }
}


const verifyOTP = (req, res) => {
    const { otp } = req.body;
    const sessionOtp = req.session.otp;

    if (!sessionOtp || !otp) {
        return res.status(400).json({ success: false, message: 'OTP not found or expired.' });
    }

    const isExpired = Date.now() - sessionOtp.createdAt > 5 * 60 * 1000; // 5 minutes
    if (isExpired) {
        delete req.session.otp;
        return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    if (otp != sessionOtp.code) {
        return res.status(401).json({ success: false, message: 'Invalid OTP.' });
    }

    req.session.otp.verified = true;
    return res.status(200).json({ success: true, message: 'OTP verified.' });
}








module.exports = {
    loadProfile,
    editProfile,
    otpSend,
    verifyOTP
}