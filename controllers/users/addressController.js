const User = require('../../model/userModel');
const Address = require('../../model/addressModel');
const Cart = require('../../model/cartModel')

const {validateAddress} = require('../../helpers/validations')

const loadAddress = async (req, res) => {
    try {
        const search = req.query.search || ''

        const userId = req.session.user;
        
        if (!userId) {
            return res.status(401).render('error', { message: 'User not authenticated.' });
        }

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).render('error', { message: 'User not found.' });
        }

        const addressDoc = await Address.findOne({ userId });

        const addresses = addressDoc ? addressDoc.address.filter(addr => !addr.isDeleted) : [];

        const cart = await Cart.findOne({userId})
        

        return res.render('address', {
            currentPage: 'address',
            user,
            cart,
            address: addresses,
            search
        });
    } catch (error) {
        console.error('Failed to load the Address Page:', error);
        return res.status(500).render('error', { message: 'Failed to load address page.' });
    }
};

const addAddress = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const data = req.body;

        console.log('address Data :', data)

        let errors = validateAddress(data)
        
        if (errors) {
            return res.status(400).json({ success: false, message: 'Validation error', errors });
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
            // id: Date.now() 
        };

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
                return res.status(409).json({ success: false, message: 'Duplicate address found.' });
            }
            addressDoc.address.push(newAddress);
        }

        const savedAddress = await addressDoc.save();
        if (!savedAddress) {
            return res.status(400).json({ success: false, message: 'Failed to save address.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Address saved successfully'
        });

    } catch (error) {
        console.error('Error adding address:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while adding address: ' + error.message
        });
    }
};

const editAddress = async (req, res) => {
    try {
        
        const data = req.body

        const userId = req.session.user

        if(!userId){
            return res.status(400).json({success : false, message : 'User not authenticated!'})
        }

        const user = await User.findById(userId)

        if(!user){
            return res.status(401).json({ success : false , message : 'User not found!'})
        }

        console.log('Address update requested by : ', user.name)

        let errors = validateAddress(data)

        if(errors){
            return res.status(401).json({ success : false , message : 'Validation error', errors })
        }

        const addressDoc = await Address.findOne({ userId });
        
        if (!addressDoc) {
            return res.status(401).json({ success : false , message : 'Address not found!!'});
        }

        console.log('Address id type : ', typeof(data.addressId))

        const existAddress = addressDoc.address.findIndex(add => !add.isDeleted && add._id.toString() === data.addressId)

        if (existAddress === -1) {
            return res.status(401).json({ success : false , message : 'Address id not found!!'});
        }
        
        console.log('Exist address : ', existAddress)

        const existFields = addressDoc.address.some((add , index) => {
            !add.isDeleted && 
            index !== existAddress &&
            add.streetAddress === data.streetAddress &&
            add.pincode === data.pincode &&
            add.city === data.city
        })

        if(existFields){
            return res.status(400).json({success : false , message : 'Duplicate fields found'})
        }
        
        // console.log('Address address ID : ', data.addressId)

        const addressUpdate = await Address.updateOne(
            { userId, "address._id": data.addressId },
            {
                $set: {
                    "address.$.name": data.name,
                    "address.$.streetAddress": data.streetAddress,
                    "address.$.landMark": data.apartment || '',
                    "address.$.city": data.city,
                    "address.$.state": data.state,
                    "address.$.district": data.district,
                    "address.$.country": data.country,
                    "address.$.pincode": data.pincode,
                    "address.$.phone": data.phone1,
                    "address.$.altPhone": data.phone,
                    "address.$.addressType": data.addressType || 'home'
                }
            }
        );

        if(!addressUpdate){
            return res.status(400).json({success : false , message : 'Failed to update address!!'})
        }

        return res.status(200).json({success : true , message : 'Address updated successfully!'})
        



    } catch (error) {

        console.log('Error occurred while updating address : ', error)
        return res.status(500).json({success : false , message : 'Error occurred while updating address', error})
        
    }
}

const deleteAddress = async (req,res) => {
    try {

        const addressId = req.params.id

        console.log('Delete address id : ', addressId)

        const userId = req.session.user

        if(!userId){
            return res.status(400).json({success : false, message : 'User not authenticated!'})
        }

        const user = await User.findById(userId)

        if(!user){
            return res.status(401).json({ success : false , message : 'User not found!'})
        }

        const findAddress = await Address.findOne({userId , 'address._id' : addressId})

        if(!findAddress){
            return res.status(404).json({ success : false, message : 'Address not found!'})
        }

        const deleteAddress = await Address.findOneAndUpdate(
            { userId , 'address._id' : addressId},
            { $set: {
                'address.$.isDeleted' : true 
                } 
            },
            { new: true }
        );

        if(!deleteAddress){
            return res.status(400).json({
                success : false ,
                message : 'Failed to delete address!',
                error
            })
        }

        return res.status(200).json({
            success : true ,
            message : 'Address deleted successfully!'
        })

    } catch (error) {
        
        console.log('Error occurred while deleting address : ', error)
        return res.status(500).json({
            success : false ,
            message : 'Failed to delete address because error occurred!',
            error
        })
    }
}

module.exports = {
    loadAddress,
    addAddress,
    editAddress,
    deleteAddress
};