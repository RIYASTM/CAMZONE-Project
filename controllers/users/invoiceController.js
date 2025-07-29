const Order = require('../../model/orderModel');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const invoice =  async (req, res) => {
  try {
    const orderId = req.params.orderId

    const order = await Order.findOne(req.params.orderId).populate('orderedItems.product');
    console.log('ORDERID : ', order)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const doc = new PDFDocument();
    const fileName = `invoice-${order.orderId}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text(`Invoice for Order #${order.orderId}`, { align: 'center' });
    doc.fontSize(12).text(`Date: ${order.createdOn.toLocaleDateString('en-IN')}`);
    doc.moveDown();
    order.orderedItems.forEach((item) => {
      doc.text(`${item.product.productName} - Quantity: ${item.quantity} - Price: ₹${item.product.salePrice}`);
    });
    doc.moveDown();
    doc.text(`Total: ₹${order.finalAmount.toFixed(2)}`, { align: 'right' });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Error generating invoice' });
  }
}

module.exports = {
    invoice
}