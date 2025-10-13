const mongoose = require('mongoose')
const { Schema } = mongoose
const { v4: uuidv4 } = require('uuid')

const orderSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    orderedItems: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        productPrice: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            default: 0
        },
        itemStatus: {
            type: String,
            required: true,
            default: 'Pending',
            enum: ['Confirmed', 'Pending', 'Processing', 'Shipped', 'Out of Delivery', 'Delivered', 'Cancelled', 'Return Request', 'Returned', 'Return Request Rejected']
        },
        reason: {
            type: String,
            required: false
        },
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    address: {
        addressType: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        streetAddress: {
            type: String,
            required: true
        },
        landMark: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        district: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        pincode: {
            type: Number,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        altPhone: {
            type: String,
            required: true
        }
    },
    invoiceDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: true,
        enum: ['Paid', 'Pending', 'Processing', 'Shipped', 'Out of Delivery', 'Delivered', 'Cancelled', 'Return Request', 'Returned', 'Return Request Rejected', 'Confirmed', 'Payment Failed', 'Failed']
    },
    paymentStatus: {
        type: String,
        default: 'Pending',
        enum: ['Paid', 'Pending', 'Failed']
    },
    createdOn: {
        type: Date,
        default: Date.now,
        required: true
    },
    couponApplied: {
        type: Boolean,
        default: false
    },
    couponCode: {
        type: String,
        required: false,
    },
    couponDiscount: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String
    },
    reason: {
        type: String,
        required: false
    },
    GST: {
        type: Number,
        required: false
    },
    razorpayOrderId: {
        type: String,
        required: false,
    },
    razorpayPaymentId: {
        type: String,
        required: false,
    },
    razorpaySignature: {
        type: String,
        required: false,
    },
    razorpayStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending'
    },
    razorpayInvoiceDate: {
        type: Date,
        default: Date.now
    },
    isCancelled: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
    },
    shipping: {
        type: Number,
        default: 0
    },
    deliveredDate: {
        type: Date,
        default: null
    }
})

const Order = mongoose.model("Order", orderSchema)

module.exports = Order