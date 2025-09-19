const User = require('../../model/userModel')

const loadCustomers = async (req, res) => {
    try {

        let search = req.query.search || '';

        let page = req.query.page ? parseInt(req.query.page) : 1

        const limit = 5;

        const userData = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: "i" } },
                { email: { $regex: '.*' + search + '.*', $options: "i" } }
            ]
        })
            .sort({ createdOn: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec()


        const count = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: '.*' + search + '.*' } },
                { email: { $regex: '.*' + search + '.*' } }
            ]
        }).countDocuments()

        const totalPages = Math.ceil((count >= 2 ? count : 1) / limit)

        return res.render('customers', {
            data: userData,
            currentPage: 'Customers',
            iconClass: 'fa-users',
            pageTitle: 'Customers',
            currentPages: page,
            totalPages,
            search
        });
    } catch (error) {
        console.log('======================================');
        console.log('failed to load customers', error);
        console.log('======================================');
        res.status(500).send('Server Error');
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

        return res.status(200).json({ success: true, message: 'Customer is blocked!!', redirectURL: `/admin/customers?page=${currentPages}`, done: 'Blocked' })

    } catch (error) {

        return console.log('Something went wrong while editing customer : ', error.message)

    }
}

const unblockCustomer = async (req, res) => {
    try {

        let id = req.query.id

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