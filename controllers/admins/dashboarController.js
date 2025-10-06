const Orders = require('../../model/orderModel');
const Users = require('../../model/userModel');
const Category = require('../../model/categoryModel');
const Brand = require('../../model/brandModel');

const loadDashboard = async (req, res) => {
    try {

        const [orders, users, categories, brands] = await Promise.all([
            Orders.find()
                .populate('orderedItems.product', 'productName salePrice')
                .populate('userId', 'name')
                .populate({
                    path: 'orderedItems.product',
                    populate: {
                        path: 'category',
                        model: 'Category'
                    }
                })
                .lean(),

            Users.find({ status: true }).lean(),
            Category.find().lean(),
            Brand.find().lean()
        ])

        return res.render('dashboard', {
            currentPage: 'dashboard',
            pageTitle: 'Dashboard',
            iconClass: 'fa-chart-line',
            categories,
            orders,
            brands,
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