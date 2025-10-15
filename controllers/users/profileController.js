const User = require('../../model/userModel');
const Address = require('../../model/addressModel');
const Cart = require('../../model/cartModel');

const { validateProfile } = require('../../helpers/validations');
const { generateOtp, sendOTP } = require('../../helpers/OTP');
const { handleStatus } = require('../../helpers/status');


const loadProfile = async (req, res) => {
    try {

        const search = req.query.search || ''

        const userId = req.session.user

        if (!userId) {
            return handleStatus(res, 404, 'User not authenticated!');
        }

        const user = await User.findById(userId)

        if (!user) {
            return handleStatus(res, 404, 'User not found!');
        }

        const cart = userId ? await Cart.findOne({ userId }) : 0

        const address = await Address.findById(userId)

        return res.render('profile', {
            currentPage: 'profile',
            user,
            address,
            search,
            cart
        })

    } catch (error) {
        console.log('Failed to load the Profile Page : ', error)
        return handleStatus(res, 500);
    }
};

const editProfile = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return handleStatus(res, 401, 'User not authenticated!');
        }

        const { name, email, phone } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return handleStatus(res, 404, 'User not found!!')
        }

        const emailChanged = email && email !== user.email;

        const existUser = await User.findOne({
            $or: [
                { name: new RegExp(`^${name}$`, "i") },
                { email: new RegExp(`^${email}$`, "i") },
                { phone }
            ],
            _id: { $ne: userId }
        });


        if (existUser) {
            let errors = {};
            if (existUser.name.toLowerCase() === name.toLowerCase()) errors.name = 'Username already exists.';
            if (existUser.email.toLowerCase() === email.toLowerCase()) errors.email = 'Email already exists.';
            if (existUser.phone === phone) errors.phone = 'Phone number already exists.';
            return handleStatus(res, 409, 'Duplicate entry found', { errors })
        }

        const data = { name, email, phone };
        const errors = validateProfile(data);
        if (errors) {
            return handleStatus(res, 400, 'Validations Error', { errors })
        }

        if (emailChanged) {
            const sessionOtp = req.session.otp;
            if (!sessionOtp || sessionOtp.verified !== true) {
                return handleStatus(res, 401, 'Email change requires OTP verifications');
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
            return handleStatus(res, 400, 'Failed to updated user')
        }

        if (req.session.otp) delete req.session.otp;

        return handleStatus(res, 200, 'User updated successfully', { redirectUrl: '/profile' });
    } catch (error) {
        console.error("User updating error: ", error);
        return handleStatus(res, 500);
    }
};

const otpSend = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);
        if (!user) {
            return handleStatus(res, 401, 'User not found!');
        }

        const userMail = user.email;
        const otpCode = generateOtp();

        if (!otpCode) {
            return handleStatus(res, 500, 'OTP not generated!!');
        }

        req.session.otp = {
            code: otpCode,
            createdAt: Date.now(),
            verified: false,
            forEmail: userMail
        };

        const sendOtp = await sendOTP(userMail, otpCode);
        if (!sendOtp) {
            return handleStatus(res, 400, 'OTP not send!');
        }

        return handleStatus(res, 200, 'OTP send')

    } catch (error) {
        console.log('Error while sending OTP: ', error);
        return handleStatus(res, 500);
    }
};

const verifyOTP = (req, res) => {
    const { otp } = req.body;
    const sessionOtp = req.session.otp;

    if (!sessionOtp || !otp) {
        return handleStatus(res, 400, 'OTP not found or expired!!');
    }

    const isExpired = Date.now() - sessionOtp.createdAt > 5 * 60 * 1000;
    if (isExpired) {
        delete req.session.otp;
        return handleStatus(res, 400, 'OTP has expired!!');
    }

    if (otp != sessionOtp.code) {
        return handleStatus(res, 401, 'Invalid OTP');
    }

    req.session.otp.verified = true;
    return handleStatus(res, 200, 'OTP verified!!');
};


module.exports = {
    loadProfile,
    editProfile,
    otpSend,
    verifyOTP
};