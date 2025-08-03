const Order = require('../model/orderModel')

async function createOrderId(){
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const count = await Order.countDocuments({ createdOn: { $gte: today, $lt: tomorrow } });
    const seq = (count % 100).toString().padStart(2, '0');
    const orderId = `ORD${year}${month}${day}${seq}`;

    return orderId
}

module.exports = {
    createOrderId
}