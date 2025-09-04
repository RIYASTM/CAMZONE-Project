const Orders = require('../../model/orderModel');
const Users = require('../../model/userModel');
const Category = require('../../model/categoryModel');
const Brand = require('../../model/brandModel');

const loadDashboard = async (req, res) => {
    try {
        const admin = req.session.admin;

        const orders = await Orders.find()
                    .populate('orderedItems.product', 'productName salePrice')
                    .populate('userId', 'name')
                    .populate({
                        path: 'orderedItems.product',
                        populate: {
                        path: 'category',
                        model: 'Category'
                        }
                    })
                    .lean();
        const users = await Users.find({ status : true }).lean();

        const categories = await Category.find()
        const brands = await Brand.find()

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