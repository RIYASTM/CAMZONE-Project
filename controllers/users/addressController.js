const User = require('../../model/userModel');
const Address = require('../../model/addressModel');
const Cart = require('../../model/cartModel')

const { validateAddress } = require('../../helpers/validations')
const { handleStatus } = require('../../helpers/status');

const loadAddress = async (req, res) => {
    try {
        const search = req.query.search || ''

        const userId = req.session.user;

        const [user, addressDoc, cart] = await Promise.all([
            User.findById(userId),
            Address.findOne({ userId }),
            Cart.findOne({ userId })
        ])

        if (!user) {
            return handleStatus(res, 402, 'User not found')
        }

        const addresses = addressDoc ? addressDoc.address.filter(addr => !addr.isDeleted) : [];

        return res.render('address', {
            currentPage: 'address',
            user,
            cart,
            address: addresses,
            search
        });
    } catch (error) {
        console.error('Failed to load the Address Page:', error);
        return handleStatus(res, 500)
    }
};

const addAddress = async (req, res) => {
    try {

        const userId = req.session.user;

        const user = await User.findById(userId);
        if (!user) {
            return handleStatus(res, 404, 'User not found!');
        }

        const data = req.body;

        let errors = validateAddress(data)
        if (errors) {
            return handleStatus(res, 401, 'Validation Error!', { errors })
        }

        const newAddress = {
            name: data.name,
            streetAddress: data.streetAddress,
            landMark: data.landMark || '',
            city: data.city,
            state: data.state,
            district: data.district,
            country: data.country,
            pincode: data.pincode,
            phone: data.phone,
            altPhone: data.altPhone,
            addressType: data.addressType || 'home',
        };

        let existAddress = await Address.findOne({
            userId,
            'addresses.addressType': newAddress.addressType
        });

        if (existAddress) {
            return handleStatus(res, 409, `${newAddress.addressType} address already exists!`);
        }

        let addressDoc = await Address.findOne({ userId });

        if (!addressDoc) {
            addressDoc = new Address({ userId, address: [newAddress] });
        } else {
            const exists = addressDoc.address.some(addr =>
                !addr.isDeleted &&
                addr.streetAddress === newAddress.streetAddress &&
                addr.city === newAddress.city &&
                addr.pincode === newAddress.pincode
            );
            if (exists) {
                return handleStatus(res, 409, 'Duplicate address found!!');
            }
            addressDoc.address.push(newAddress);
        }

        const savedAddress = await addressDoc.save();
        if (!savedAddress) {
            return handleStatus(res, 500, 'Failed to save address!!');
        }

        return handleStatus(res, 200, 'Addresss added successfully!', { address: newAddress });

    } catch (error) {
        console.error('Error adding address:', error);
        return handleStatus(res, 500)
    }
};

const editAddress = async (req, res) => {
    try {

        const data = req.body

        const userId = req.session.user
        const user = await User.findById(userId)
        if (!user) {
            return handleStatus(res, 402, 'User not found!!')
        }

        let errors = validateAddress(data)
        if (errors) {
            return handleStatus(res, 401, 'Validation Error!!', { errors });
        }

        const addressDoc = await Address.findOne({ userId });
        if (!addressDoc) {
            return handleStatus(res, 401, 'Address not found!!');
        }

        const existAddress = addressDoc.address.findIndex(add => !add.isDeleted && add._id.toString() === data.addressId)
        if (existAddress === -1) {
            return handleStatus(res, 401, 'Address id not found!!');
        }

        const existFields = addressDoc.address.some((add, index) => {
            !add.isDeleted &&
                index !== existAddress &&
                add.streetAddress === data.streetAddress &&
                add.pincode === data.pincode &&
                add.city === data.city
        })
        if (existFields) {
            return handleStatus(res, 400, 'Duplicate fields found!')
        }

        const updatingAddress = {
            name: data.name,
            streetAddress: data.streetAddress,
            landMark: data.landMark || '',
            city: data.city,
            state: data.state,
            district: data.district,
            country: data.country,
            pincode: data.pincode,
            phone: data.phone,
            altPhone: data.altPhone,
            addressType: data.addressType || 'home',
        }

        let exist = await Address.findOne({
            userId,
            'addresses.addressType': updatingAddress.addressType
        });
        if (exist) {
            return handleStatus(res, 402, `${updatingAddress.addressType} address already exists!`)
        }

        const addressUpdate = await Address.updateOne(
            { userId, "address._id": data.addressId },
            {
                $set: {
                    "address.$": updatingAddress,
                }
            }
        );

        if (addressUpdate.modifiedCount === 0 || !addressUpdate) {
            return handleStatus(res, 500, 'Failed to update address!');
        }

        return handleStatus(res, 200, 'Address updated successfully!', {
            address: updatingAddress
        });

    } catch (error) {
        console.log('Error occurred while updating address : ', error)
        return handleStatus(res, 500)
    }
};

const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id

        const userId = req.session.user
        const user = await User.findById(userId)
        if (!user) {
            return handleStatus(res, 402, 'User not found!')
        }

        const findAddress = await Address.findOne({ userId, 'address._id': addressId })
        if (!findAddress) {
            return handleStatus(res, 402, 'Address not found!');
        }

        const deleteAddress = await Address.findOneAndUpdate(
            { userId, 'address._id': addressId },
            {
                $set: {
                    'address.$.isDeleted': true
                }
            },
            { new: true }
        );

        if (!deleteAddress) {
            return handleStatus(res, 500, 'Failed to delete address!', { error })
        }

        return handleStatus(res, 200, 'Address removed successfully!');

    } catch (error) {

        console.log('Error occurred while deleting address : ', error)
        return handleStatus(res, 500);
    }
};

module.exports = {
    loadAddress,
    addAddress,
    editAddress,
    deleteAddress
};