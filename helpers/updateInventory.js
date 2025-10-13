const Cart = require('../model/cartModel');
const Products = require('../model/productModel');
const Orders = require('../model/orderModel');

async function updateInventory(userId) {
    const cart = await Cart.findOne({ userId });
    if (!cart?.items?.length) return;

    await Cart.findOneAndUpdate(
        { userId },
        { $set: { items: [], discount: 0, totalAmount: 0, GST: 0 } }
    );

    const bulkOps = cart.items.map(item => ({
        updateOne: {
            filter: { _id: item.productId },
            update: { $inc: { quantity: -item.quantity } }
        }
    }));

    if (bulkOps.length > 0) {
        await Products.bulkWrite(bulkOps);
    }
}

async function updateInventoryOrder(userId, orderId) {
    const cart = await Cart.findOne({ userId });
    if (cart) {
        await Cart.findOneAndUpdate(
            { userId },
            { $set: { items: [], discount: 0, totalAmount: 0, GST: 0 } }
        );
    }

    const order = await Orders.findOne({ orderId, userId }).populate('orderedItems.product');
    if (!order?.orderedItems?.length) return;

    const bulkOps = order.orderedItems.map(item => ({
        updateOne: {
            filter: { _id: item.product._id },
            update: { $inc: { quantity: -item.quantity } }
        }
    }));

    if (bulkOps.length > 0) {
        await Products.bulkWrite(bulkOps);
    }
}

module.exports = {
    updateInventory,
    updateInventoryOrder
};
