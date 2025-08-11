const Orders = require('../../model/orderModel');
const Users = require('../../model/userModel');

const loadDashboard = async (req, res) => {
    try {
        const admin = req.session.admin;

        const orders = await Orders.find()
            .populate('orderedItems.product', 'productName salePrice')
            .populate('userId', 'name')
            .lean();
        const users = await Users.find({ status : true }).lean();

        return res.render('dashboard', {
            currentPage: 'dashboard',
            pageTitle: 'Dashboard',
            iconClass: 'fa-chart-line',
            orders,
            users
        });
    } catch (error) {
        console.log('===========================================');
        console.log('failed to load dashboard page', error);
        console.log('===========================================');
        res.status(500).send("server error");
    }
};

module.exports = {
    loadDashboard
};