const Orders = require('../../model/orderModel')
const Users = require('../../model/userModel')
const Categories = require('../../model/categoryModel');
const Brand = require('../../model/brandModel');

const { handleStatus } = require('../../helpers/status');

const loadReports = async (req, res) => {
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
            Categories.find(),
            Brand.find()
        ])

        return res.render('reports', {
            pageTitle: 'Reports',
            currentPage: 'reports',
            currentPages: 1,
            totalPages: 10,
            iconClass: 'fa-chart-bar',
            categories,
            brands,
            orders,
            users
        })
    } catch (error) {

        console.log('======================================');
        console.log('failed to load reports', error);
        console.log('======================================');
        return handleStatus(res, 500, null, { redirectUrl: '/admin/page404' })
    }
}

module.exports = {
    loadReports
}