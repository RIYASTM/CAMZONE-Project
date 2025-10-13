

function cancelItem(items, reason) {
    let refundAmount = 0
    let refundReason = 'Refund for Cancelled Item(s)'

    let cancelledItems = items.map(item => {
        item.itemStatus = 'Cancelled';
        item.reason = reason;
        refundAmount += item.productPrice * item.quantity;
        return item
    });

    return {
        refundAmount,
        refundReason,
        cancelledItems
    }

}

function orderCancel(order, reason) {

    let refundAmount = 0
    let refundReason = `Refund for Cancelled Order - ${order.orderId}`

    let cancelledOrder = order.status = 'Cancelled'
    order.reason = reason
    order.orderedItems.forEach(item => {
        item.itemStatus = 'Cancelled',
            item.reason = reason,
            refundAmount += item.productPrice * item.quantity
    });

    return {
        refundAmount,
        refundReason,
        cancelledOrder
    }
}


module.exports = {
    cancelItem,
    orderCancel
}