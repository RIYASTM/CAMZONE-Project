

function returnItem(items, reason, status) {
    let refundAmount = 0
    let refundReason = 'Refund for Returned Item(s)'
    let returnedItems = items.map(item => {
        item.itemStatus = status;
        item.reason = reason;
        refundAmount += item.productPrice * item.quantity
        return item
    });

    return {
        refundAmount,
        refundReason,
        returnedItems
    }
}

function orderReturn(order, reason, status) {
    let refundAmount = 0
    let refundReason = `Refund for Returned Order - ${order.orderId}`

    let returnedOrder = order.status = status
    order.reason = reason

    order.orderedItems.forEach(item => {
        item.itemStatus = status,
            item.reason = reason
        refundAmount += item.productPrice * item.quantity
        return item
    })

    return {
        refundAmount,
        refundReason,
        returnedOrder
    }
}

module.exports = {
    returnItem,
    orderReturn
}