const { name } = require('ejs');
const User = require('../../model/userModel')

const loadCustomers = async (req, res) => {
    try {

        const { search = '', sort = 'all', filter = 'all', page = 1 } = req.query;

        const limit = 5;

        let query = { isAdmin : false};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (filter === 'active') {
            query.isBlocked = false;
        } else if (filter === 'blocked') {
            query.isBlocked = true
        }

        let sortOption;

        switch (sort) {
            case 'all':
                sortOption = { createdOn: -1 };
                break;
            case 'name':
                sortOption = { name: 1 };
                break;
            case 'email':
                sortOption = { email: -1 };
                break;
            default:
                sortOption = { createdOn: -1 };
        }


        const userData = await User.find(query)
            .sort(sortOption)
            .collation({ locale: 'en', strength: 2 })
            .limit(limit)
            .skip((page - 1) * limit)
            .exec()


        const count = await User.find(query).countDocuments()

        const totalPages = Math.ceil(count / limit);

        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(200).json({
                success : true,
                datas: userData,
                currentPages: page,
                totalPages,
                search,
                sort,
                filter
            });
        }

        return res.render('customers', {
            datas: userData,
            currentPage: 'customers',
            iconClass: 'fa-users',
            pageTitle: 'Customers',
            currentPages: page,
            totalPages,
            search,
            sort,
            filter
        });
    } catch (error) {
        console.log('======================================');
        console.log('failed to load customers', error);
        console.log('======================================');
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(500).json({
                success: false,
                message: 'Server error while loading customers'
            });
        }
        res.status(500).render('error', {
            pageTitle: 'Error',
            message: 'Failed to load coupons',
            iconClass: 'fa-exclamation-triangle'
        });
    }
};

const customerBlocked = async (req, res) => {

    try {

        const { id, currentPages } = req.body

        const user = await User.findById(id)

        let activity = ''

        if (user.isBlocked) {
            activity = await User.updateOne({ _id: id }, { $set: { isBlocked: false } })
            return res.status(200).json({ success: true, message: 'Customer is Unblocked!!', redirectURL: `/admin/customers?page=${currentPages}`, done: 'Unblocked' })
        }

        activity = await User.updateOne({ _id: id }, { $set: { isBlocked: true } })

        if (!activity) {
            return res.status(400).json({ success: false, message: 'Failed to block customer!!', redirectURL: `/admin/customers?page=${currentPages}` })
        }

        return res.status(200).json({ success: true, message: 'Customer is blocked!!', redirectURL: `/admin/customers?page=${currentPages}`, done: 'Blocked', currentPages })

    } catch (error) {

        return console.log('Something went wrong while editing customer : ', error.message)

    }
}

const unblockCustomer = async (req, res) => {
    try {

        const { id, currentPages } = req.body

        await User.updateOne({ _id: id }, { $set: { isBlocked: false } })

        res.redirect('/admin/customers')

    } catch (error) {

        return console.log('Something went wrong while editing customer : ', error.message)

    }
}

module.exports = {
    loadCustomers,
    customerBlocked,
    unblockCustomer
};