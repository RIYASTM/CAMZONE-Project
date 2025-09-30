const Order = require('../../model/orderModel');

const {generateInvoice} = require('../../helpers/generateInvoice')


const invoice = async (req, res) => {
  try {
    const id = req.params.id;

    const order = await Order.findById(id).populate('orderedItems.product');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    generateInvoice(order, res)

    return res.status(200)
    
  } catch (error) {
    console.error('Invoice error:', error);
    res.status(500).json({ message: 'Error generating invoice' });
  }
};

module.exports = {
  invoice
};
