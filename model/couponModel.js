const mongoose = require ('mongoose')
const {Schema} = mongoose

const couponSchema = new Schema ({
    couponCode : {
        type : String,
        required : true,
        unique : true
    },
    couponName : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    createdOn : {
        type : Date,
        default : Date.now,
        required : true
    },
    validFrom : {
        type : Date,
        required : true
    },
    validUpto : {
        type : Date,
        required : true
    },
    discountType : {
        type : String,
        enum: ['percentage', 'fixed'],
        required : true
    },
    discount : {
        type : Number,
        required : true
    },
    minOrder : {
        type : Number,
        required : true
    },
    isList : {
        type : Boolean,
        default : true
    },
    couponLimit : {
        type : Number,
        default : 1
    },
    isDeleted : {
        type : Boolean,
        default : false
    }
})


const Coupon = mongoose.model('Coupon', couponSchema)

module.exports = Coupon