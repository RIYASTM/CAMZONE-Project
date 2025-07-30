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

    // ======= HEADER WITH LOGO =======
    try {
      doc.image('public/images/icons/CAMZONE.png', 50, 20, { width: 175, height: 50 });
    } catch (error) {
      console.log('Logo not found, skipping...');
    }
    
    doc.rect(0, 0, doc.page.width, 80);
    doc.font('Helvetica-Bold').fontSize(20).text('ORDER INVOICE', 200, 25, { align: 'center' });
    
    doc.font('Helvetica').fontSize(10);
    doc.text('www.camzoneofficial.com | contact@camzone.com', 200, 65, { align: 'center' });
    
    doc.y = 100;
    doc.moveDown(1);

    // ======= ORDER INFORMATION & DELIVERY ADDRESS (SIDE BY SIDE) =======
    const infoSectionY = doc.y;
    
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(14).text('Order Information', 50, infoSectionY);
    doc.font('Helvetica').fontSize(12);
    
    const orderInfoStartY = infoSectionY + 25;
    doc.text('Order ID:', 50, orderInfoStartY);
    doc.text(`${order.orderId}`, 100, orderInfoStartY, { align: 'right', width: 150 });
    
    doc.text('Order Date:', 50, orderInfoStartY + 20);
    doc.text(`${order.invoiceDate ? new Date(order.invoiceDate).toLocaleDateString('en-IN') : '-'}`, 100, orderInfoStartY + 20, { align: 'right', width: 150 });
    
    doc.text('Payment Method:', 50, orderInfoStartY + 40);
    doc.text(`${order.paymentMethod || '-'}`, 100, orderInfoStartY + 40, { align: 'right', width: 150 });
    
    doc.text('Phone No :', 50, orderInfoStartY + 60);
    doc.text(`${order.address.phone || '-'}`, 100, orderInfoStartY + 60, { align: 'right', width: 150 });

    doc.font('Helvetica-Bold').fontSize(14).text('Delivery Address', 350, infoSectionY);
    doc.font('Helvetica').fontSize(12);
    
    const addressStartY = infoSectionY + 25;
    doc.text('Name:', 350, addressStartY);
    doc.text(`${order.address.name || '-'}`, 400, addressStartY, { align: 'right', width: 150 });
    
    doc.text('Address:', 350, addressStartY + 20);
    doc.text(`${order.address.streetAddress || '-'}`, 400, addressStartY + 20, { align: 'right', width: 150 });
    
    doc.text('City:', 350, addressStartY + 40);
    doc.text(`${order.address.city || '-'}`, 400, addressStartY + 40, { align: 'right', width: 150 });
    
    doc.text('State:', 350, addressStartY + 60);
    doc.text(`${order.address.state || '-'}`, 400, addressStartY + 60, { align: 'right', width: 150 });
    
    doc.text('Pincode:', 350, addressStartY + 80);
    doc.text(`${order.address.pincode || '-'}`, 400, addressStartY + 80, { align: 'right', width: 150 });
    
    doc.y = Math.max(orderInfoStartY + 80, addressStartY + 100) + 20;

    // ======= ORDER ITEMS =======
    doc.font('Helvetica-Bold').fontSize(14).text('Order Items', 50);
    doc.moveDown(0.5);
    
    const currentY = doc.y;
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('Product Name', 50, currentY);
    doc.text('Price (Rs)', 250, currentY);
    doc.text('Quantity', 350, currentY);
    doc.text('Amount (Rs)', 475, currentY);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(12);
    order.orderedItems.forEach(item => {
      if(item.itemStatus !== 'Cancelled' && item.itemStatus !== 'Returned'){
        const rowY = doc.y;
        doc.text(item.product.productName, 50, rowY);
        doc.text(Number(item.productPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 250, rowY);
        doc.text(item.quantity ? item.quantity.toString() : 0, 350, rowY);
        doc.text(Number(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 490, rowY);
        doc.moveDown(0.5);
      }
    });
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // ======= PAYMENT SUMMARY =======
    doc.font('Helvetica-Bold').fontSize(14).text('Payment Summary', 50);
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(12);
    
    const summaryStartY = doc.y;
    doc.text('Subtotal:', 350, summaryStartY);
    doc.text(Number(order.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 400, summaryStartY, { align: 'right', width: 150 });
    
    doc.text('Shipping:', 350, summaryStartY + 20);
    doc.text(Number(order.shippingCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 400, summaryStartY + 20, { align: 'right', width: 150 });
    
    doc.text('GST %:', 350, summaryStartY + 40);
    doc.text(Number(order.GST).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 400, summaryStartY + 40, { align: 'right', width: 150 });
    
    doc.text('Discount:', 350, summaryStartY + 60);
    doc.text(Number(order.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 400, summaryStartY + 60, { align: 'right', width: 150 });

    
    doc.font('Helvetica-Bold');
    doc.text('Total:', 350, summaryStartY + 80);
    doc.text(Number(order.finalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 400, summaryStartY + 80, { align: 'right', width: 150 });
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
