const mongoose = require('mongoose')
const {Schema} = mongoose
const {v4:uuidv4} = require('uuid')

const orderSchema = new Schema ({
    userId : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    orderId : {
        type : String,
        required : true,
        unique : true
    },
    orderedItems : [{
        product : {
            type : Schema.Types.ObjectId,
            ref : 'Product',
            required : true
        },
        quantity : {
            type : Number,
            required : true
        },
        price : {
            type : Number,
            default : 0
        }
    }],
    totalPrice : {
        type : Number,
        required : true
    },
    discount : {
        type : Number,
        default : 0
    },
    finalAmount : {
        type : Number,
        required : true
    },
    address : {
        addressType : {
            type : String,
            required : true
        },
        name : {
            type : String,
            required : true
        },
        streetAddress : {
            type : String,
            required : true
        },
        landMark : {
            type : String,
            required : true
        },
        city : {
            type : String,
            required : true
        },
        state : {
            type : String,
            required : true
        },
        district : {
            type : String,
            required : true
        },
        country : {
            type : String,
            required : true
        },
        pincode : {
            type : Number,
            required : true
        },
        phone : {
            type : String,
            required : true
        },
        altPhone : {
            type : String,
            required :  true
        }
    },
    invoiceDate : {
        type : Date,
        default : Date.now
    },
    status : {
        type : String,
        required : true,
        enum : ['Pending', 'Processing', ' Shipped', 'Out of Delivery', 'Delivered', 'Cancelled', 'Return Request', 'Returned']
    },
    createdOn : {
        type : Date,
        default : Date.now,
        required : true
    },
    couponApplied : {
        type : Boolean,
        default : false
    },
    paymentMethod : {
        type : String
    }
})

const Order = mongoose.model("Order",orderSchema)

module.exports = Order