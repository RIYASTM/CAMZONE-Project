const Orders = require('../../model/orderModel')
const Users = require('../../model/userModel')


const loadReports = async (req,res) => {
    try {

        const orders = await Orders.find()
                    .populate('orderedItems.product', 'productName salePrice')
                    .populate('userId', 'name')
                    .lean();
        const users = await Users.find({ status : true }).lean();
        
        return res.render('reports',{
            pageTitle : 'Reports',
            currentPage:'reports',
            currentPages : 1,
            totalPages : 10,
            iconClass : 'fa-chart-bar',
            orders,
            users
        })
    } catch (error) {
        
        console.log('======================================');
        console.log('failed to load reports',error);
        console.log('======================================');
        res.status(500).send("Server Error")
    }
}

module.exports = {
    loadReports
}