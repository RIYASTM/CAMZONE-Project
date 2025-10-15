const Order = require('../../model/orderModel');

const { generateInvoice } = require('../../helpers/generateInvoice');
const { handleStatus } = require('../../helpers/status');


const invoice = async (req, res) => {
  try {
    const id = req.params.id;

    const order = await Order.findById(id).populate('orderedItems.product');
    if (!order) {
      return handleStatus(res, 404, 'Order not found!!');
    }

    await generateInvoice(order, res);

    // return handleStatus(res, 200);

  } catch (error) {
    console.error('Invoice error:', error);
    return handleStatus(res, 500);
  }
};

module.exports = {
  invoice
};
