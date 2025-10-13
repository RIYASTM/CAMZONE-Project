const { updateInventoryOrder } = require('./updateInventory')

async function confirmOrder(userId, orderId, order) {
    await updateInventoryOrder(userId, orderId)
    order.status = 'Confirmed'
    order.expiresAt = null
    order.orderedItems.forEach(item => item.itemStatus = 'Confirmed')
    await order.save()
}


module.exports = {
    confirmOrder
}