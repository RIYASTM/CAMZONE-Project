const Order = require('../../model/orderModel');
const PDFDocument = require('pdfkit');

const invoice = async (req, res) => {
  try {
    const id = req.params.id;

    const order = await Order.findById(id).populate('orderedItems.product');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    console.log('hi')

    const doc = new PDFDocument({ margin: 20 });
    const fileName = `invoice-${order.id}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // ======= HEADER =======
    doc.font('Helvetica-Bold').fontSize(20).fillColor('#000').text('ORDER INVOICE', { align: 'center' });
    doc.fillColor('#000').rect(0, 0, doc.page.width, 50).fill();
    doc.fillColor('#fff').fontSize(20).text('ORDER INVOICE', 0, 15, { align: 'center' });
    doc.moveDown(1);

    // ======= ORDER INFORMATION =======
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(14).text('Order Information', 50);
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(12);
    
    const orderInfoStartY = doc.y;
    // Labels on the left, values right-aligned
    doc.text('Order ID:', 50, orderInfoStartY);
    doc.text(`${order.orderId}`, 100, orderInfoStartY, { align: 'right', width: 200 });
    
    doc.text('Order Date:', 50, orderInfoStartY + 20);
    doc.text(`${order.invoiceDate.toLocaleDateString('en-IN')}`, 100, orderInfoStartY + 20, { align: 'right', width: 200 });
    
    doc.text('Payment Method:', 50, orderInfoStartY + 40);
    doc.text(`${order.paymentMethod || '-'}`, 100, orderInfoStartY + 40, { align: 'right', width: 200 });
    
    doc.moveDown(1.3);

    // ======= DELIVERY ADDRESS =======
    doc.font('Helvetica-Bold').fontSize(14).text('Delivery Address', 50);
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(12);
    
    const addressStartY = doc.y;
    // Labels on the left, values right-aligned like payment section
    doc.text('Name:', 50, addressStartY);
    doc.text(`${order.address.name || '-'}`, 100, addressStartY, { align: 'right', width: 200 });
    
    doc.text('Address:', 50, addressStartY + 20);
    doc.text(`${order.address.streetAddress || '-'}`, 100, addressStartY + 20, { align: 'right', width: 200 });
    
    doc.text('City:', 50, addressStartY + 40);
    doc.text(`${order.address.city || '-'}`, 100, addressStartY + 40, { align: 'right', width: 200 });
    
    doc.text('State:', 50, addressStartY + 60);
    doc.text(`${order.address.state || '-'}`, 100, addressStartY + 60, { align: 'right', width: 200 });
    
    doc.text('Pincode:', 50, addressStartY + 80);
    doc.text(`${order.address.pincode || '-'}`, 100, addressStartY + 80, { align: 'right', width: 200 });
    
    doc.moveDown(1);

    // ======= ORDER ITEMS =======
    doc.font('Helvetica-Bold').fontSize(14).text('Order Items', 50);
    doc.moveDown(0.5);
    
    // Table Header
    const currentY = doc.y;
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('Product Name', 50, currentY);
    doc.text('Price (Rs)', 250, currentY);
    doc.text('Quantity', 350, currentY);
    doc.text('Amount (Rs)', 475, currentY);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Table Rows
    doc.font('Helvetica').fontSize(12);
    order.orderedItems.forEach(item => {
      const rowY = doc.y; // Store current Y position
      doc.text(item.product.productName, 50, rowY);
      doc.text(item.productPrice.toFixed(2).toLocaleString('en-IN'), 250, rowY);
      doc.text(item.quantity.toString(), 350, rowY);
      doc.text(item.price.toFixed(2).toLocaleString('en-IN'), 490, rowY);
      doc.moveDown(0.5);
    });
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // ======= PAYMENT SUMMARY =======
    doc.font('Helvetica-Bold').fontSize(14).text('Payment Summary', 50);
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(12);
    
    const summaryStartY = doc.y;
    // Labels on the left, values right-aligned
    doc.text('Subtotal:', 350, summaryStartY);
    doc.text(`${order.totalPrice?.toFixed(2).toLocaleString('en-IN') || '0'}`, 400, summaryStartY, { align: 'right', width: 150 });
    
    doc.text('Shipping:', 350, summaryStartY + 20);
    doc.text(`${order.shippingCost?.toFixed(2).toLocaleString('en-IN') || 'No Cost'}`, 400, summaryStartY + 20, { align: 'right', width: 150 });
    
    doc.text('GST %:', 350, summaryStartY + 40);
    doc.text(`${order.GST?.toFixed(2).toLocaleString('en-IN') || '0'}`, 400, summaryStartY + 40, { align: 'right', width: 150 });
    
    doc.text('Discount:', 350, summaryStartY + 60);
    doc.text(`${order.discount?.toFixed(2).toLocaleString('en-IN') || '0'}`, 400, summaryStartY + 60, { align: 'right', width: 150 });
    
    doc.font('Helvetica-Bold');
    doc.text('Total:', 350, summaryStartY + 80);
    doc.text(`${order.finalAmount.toFixed(2).toLocaleString('en-IN')}`, 400, summaryStartY + 80, { align: 'right', width: 150 });
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    doc.end();
  } catch (error) {
    console.error('Invoice error:', error);
    res.status(500).json({ message: 'Error generating invoice' });
  }
};

module.exports = {
  invoice
};
