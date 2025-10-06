const Coupons = require('../../model/couponModel');
const { v4: uuidv4 } = require('uuid');
const { validateCoupon } = require('../../helpers/validations')
const mongoose = require('mongoose')

const loadCoupons = async (req, res) => {
    try {
        const { search = '', sort = 'all', filter = 'all', page = 1 } = req.query;

        const limit = 10;
        let query = { isDeleted: false };

        if (search) {
            query.$or = [
                { couponName: { $regex: search, $options: 'i' } },
                { couponCode: { $regex: search, $options: 'i' } },
                { discountType: { $regex: search, $options: 'i' } }
            ];
        }

        if (filter === 'active') {
            query.isList = true;
            query.validUpto = { $gte: new Date() };
        } else if (filter === 'expired') {
            query.validUpto = { $lt: new Date() };
        }

        let sortOption;

        switch (sort) {
            case 'all':
                sortOption = { createdOn: -1 };
                break;
            case 'name':
                sortOption = { couponName: 1 };
                break;
            case 'name_desc':
                sortOption = { couponName: -1 };
                break;
            case 'discount':
                sortOption = { discount: -1 };
                break;
            default:
                sortOption = { createdOn: -1 };
        }


        const coupons = await Coupons.find(query)
            .sort(sortOption)
            .collation({ locale: 'en', strength: 2 })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalCoupons = await Coupons.countDocuments(query);
        const totalPages = Math.ceil(totalCoupons / limit);

        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(200).json({
                success: true,
                coupons,
                totalPages,
                currentPage: parseInt(page)
            });
        }

        return res.render('coupons', {
            pageTitle: 'Coupons',
            currentPage: 'coupons',
            currentPages: parseInt(page),
            totalPages,
            search,
            coupons,
            iconClass: 'fa-ticket-alt'
        });

    } catch (error) {
        console.error('Failed to load coupons:', error);
        res.status(500).render('error', {
            pageTitle: 'Error',
            message: 'Failed to load coupons',
            iconClass: 'fa-exclamation-triangle'
        });
    }
};

const getCoupon = async (req, res) => {
    try {

        const coupon = await Coupons.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        return res.status(200).json({
            success: true,
            coupon: {
                id: coupon._id,
                couponCode: coupon.couponCode,
                couponName: coupon.couponName,
                description: coupon.description,
                discountType: coupon.discountType,
                discount: coupon.discount,
                minOrder: coupon.minOrder,
                maxOrder: coupon.maxOrder,
                validFrom: coupon.validFrom,
                validUpto: coupon.validUpto,
                couponLimit: coupon.couponLimit,
                isList: coupon.isList
            }
        });

    } catch (error) {

        console.error('Error fetching coupons:', error);
        return res.status(500).json({ success: false, message: `Error fetching coupon: ${error.message}` });

    }
};

const addCoupon = async (req, res) => {
    try {
        const data = req.body;
        console.log(data)
        const errors = validateCoupon(data);
        if (errors) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }

        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const shortUUID = uuidv4().slice(0, 8);
        const couponCode = `CPN${dateStr}${shortUUID}`;

        const existingCode = await Coupons.findOne({ couponCode });
        if (existingCode) {
            return res.status(400).json({ success: false, message: 'Generated coupon code already exists' });
        }

        const existingCoupon = await Coupons.findOne({ couponName: data.couponName.trim() });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: 'Coupon name already exists' });
        }

        const coupon = new Coupons({
            couponCode,
            couponName: data.couponName.trim(),
            description: data.description.trim(),
            discountType: data.discountType,
            discount: parseFloat(data.discount),
            minOrder: parseFloat(data.minOrder),
            maxOrder: parseFloat(data.maxOrder),
            validFrom: new Date(data.validFrom),
            validUpto: new Date(data.validUpto),
            couponLimit: data.couponLimit ? parseInt(data.couponLimit) : undefined,
            isList: data.isDeactivated === 'on' ? false : true
        });

        const savedCoupon = await coupon.save();

        return res.status(201).json({
            success: true,
            message: 'Coupon created successfully!',
            coupon: {
                id: savedCoupon._id,
                couponCode: savedCoupon.couponCode,
                couponName: savedCoupon.couponName,
                description: savedCoupon.description,
                discountType: savedCoupon.discountType,
                discount: savedCoupon.discount,
                minOrder: savedCoupon.minOrder,
                maxOrder: savedCoupon.maxOrder,
                validFrom: savedCoupon.validFrom,
                validUpto: savedCoupon.validUpto,
                couponLimit: savedCoupon.couponLimit,
                isList: savedCoupon.isList
            }
        });
    } catch (error) {
        console.error('Error creating coupon:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists' });
        }
        return res.status(500).json({ success: false, message: `Error creating coupon: ${error.message}` });
    }
};

const updateCoupon = async (req, res) => {
    try {
        const data = req.body;
        const errors = validateCoupon(data);
        if (errors) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }

        const coupon = await Coupons.findById(data.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        const existingCoupon = await Coupons.findOne({ couponName: data.couponName.trim(), _id: { $ne: data.id } });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: 'Coupon name already exists' });
        }

        coupon.couponName = data.couponName.trim();
        coupon.description = data.description.trim();
        coupon.discountType = data.discountType;
        coupon.discount = parseFloat(data.discount);
        coupon.minOrder = parseFloat(data.minOrder);
        coupon.maxOrder = parseFloat(data.maxOrder)
        coupon.validFrom = new Date(data.validFrom);
        coupon.validUpto = new Date(data.validUpto);
        coupon.couponLimit = data.couponLimit ? parseInt(data.couponLimit) : undefined;
        coupon.isList = data.isDeactivated === 'on' ? false : true;

        const updatedCoupon = await coupon.save();

        return res.status(200).json({
            success: true,
            message: 'Coupon updated successfully!',
            coupon: {
                id: updatedCoupon._id,
                couponCode: updatedCoupon.couponCode,
                couponName: updatedCoupon.couponName,
                description: updatedCoupon.description,
                discountType: updatedCoupon.discountType,
                discount: updatedCoupon.discount,
                minOrder: updatedCoupon.minOrder,
                maxOrder: updatedCoupon.maxOrder,
                validFrom: updatedCoupon.validFrom,
                validUpto: updatedCoupon.validUpto,
                couponLimit: updatedCoupon.couponLimit,
                isList: updatedCoupon.isList
            }
        });
    } catch (error) {
        console.error('Error updating coupon:', error);
        return res.status(500).json({ success: false, message: `Error updating coupon: ${error.message}` });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.params.id || new mongoose.Types.ObjectId(req.params.id);
        const coupon = await Coupons.findByIdAndUpdate(couponId,
            { isDeleted: true, isList: false },
            { new: true, runValidators: true }
        );
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        return res.status(200).json({ success: true, message: 'Coupon deleted successfully!' });

    } catch (error) {
        console.error('Error deleting coupon:', error);
        return res.status(500).json({ success: false, message: `Error deleting coupon: ${error.message}` });
    }
};

module.exports = {
    loadCoupons,
    getCoupon,
    addCoupon,
    updateCoupon,
    deleteCoupon
};