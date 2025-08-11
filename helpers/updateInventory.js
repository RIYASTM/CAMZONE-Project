const Cart = require('../model/cartModel');
const Product = require('../model/productModel');

async function updateInventory(userId) {
    const cart = await Cart.findOne({ userId });

    if (!cart || !cart.items || !cart.items.length) {
        console.warn(`No cart or items found for user: ${userId}`);
        return;
    }

    await Cart.findOneAndUpdate(
                { userId },
                { $set: { items: [], discount: 0, totalAmount: 0, GST: 0 } }
            );

    for (let item of cart.items) {
        const productId = item.productId._id || item.productId;
        const product = await Product.findById(productId);
        if (product) {
            product.quantity -= item.quantity;
            if (product.quantity < 0) product.quantity = 0;
            await product.save();
        }
    }
}

module.exports = {
    updateInventory
}
