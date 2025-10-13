const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose')

const Coupons = require('../../model/couponModel');

const { validateCoupon } = require('../../helpers/validations')
const { handleStatus } = require('../../helpers/status');


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
            return handleStatus(res, 200, null, {
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
        return handleStatus(res, 500, 'Failed to load coupons', { redirectUrl: '/admin/page404', iconClass: 'fa-exclamation-triangle' });
    }
};

const getCoupon = async (req, res) => {
    try {

        const coupon = await Coupons.findById(req.params.id);
        if (!coupon) {
            return handleStatus(res, 404, 'Coupon not found')
        }

        return handleStatus(res, 200, null, {
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
        return handleStatus(res, 500, null, { redirectUrl: '/admin/page404' });
    }
};

const addCoupon = async (req, res) => {
    try {
        const data = req.body;
        console.log(data)
        const errors = validateCoupon(data);
        if (errors) {
            return handleStatus(res, 400, 'Validation failed!!', { errors });
        }

        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const shortUUID = uuidv4().slice(0, 8);
        const couponCode = `CPN${dateStr}${shortUUID}`;

        const existingCode = await Coupons.findOne({ couponCode });
        if (existingCode) {
            return handleStatus(res, 400, 'Coupon code already exists!!')
        }

        const existingCoupon = await Coupons.findOne({ couponName: data.couponName.trim() });
        if (existingCoupon) {
            return handleStatus(res, 400, 'Coupon name already exists!!')
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

        return handleStatus(res, 200, 'Coupon created successfully', {
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
            return handleStatus(res, 400, 'Coupon code already exists!!');
        }
        return handleStatus(res, 500, null, { redirectUrl: '/admin/page404' });
    }

};

const updateCoupon = async (req, res) => {
    try {
        const data = req.body;
        const errors = validateCoupon(data);
        if (errors) {
            return handleStatus(res, 400, 'Validations Failed!!', { errors });
        }

        const coupon = await Coupons.findById(data.id);
        if (!coupon) {
            return handleStatus(res, 404, 'Coupon not found!!');
        }

        const existingName = await Coupons.findOne({ couponName: data.couponName.trim(), _id: { $ne: data.id } });
        if (existingName) {
            return handleStatus(res, 400, 'Coupon name already exists!!');
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

        return handleStatus(res, 200, 'Coupon updated successfully', {
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
        return handleStatus(res, 500, null, { redirectUrl: '/admin/page404' });
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
            return handleStatus(res, 404, 'Coupon not found');
        }

        return handleStatus(res, 200, 'Coupon deleted successfully');

    } catch (error) {
        console.error('Error deleting coupon:', error);
        return handleStatus(res, 500, null, { redirectUrl: '/admin/page404' });
    }
};

module.exports = {
    loadCoupons,
    getCoupon,
    addCoupon,
    updateCoupon,
    deleteCoupon
};