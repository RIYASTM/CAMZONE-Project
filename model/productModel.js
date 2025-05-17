const mongoose = require('mongoose')
const {Schema} = mongoose

const productSchema = new Schema ({
    productName : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    brand : {
        type :  Schema.Types.ObjectId,
        ref : 'Brand',
        required : true
    },
    category : {
        type : Schema.Types.ObjectId,
        ref : "Category",
        required : true
    },
    regularPrice : {
        type : Number,
        required : true
    },
    salePrice : {
        type : Number,  
        required : true
    },
    productOffer : {
        type : Number,
        required : true,
        default : 0
    },
    quantity : {
        type : Number,
        required : true,
        default : 1
    },
    productImage : {
        type : [String], 
        required : true
    },
    isBlocked : {
        type : Boolean,
        default : false
    },
    status : {
        type : String,
        enum : ["Available", "Out of Stock", "Discontinued"],
        required : true,
        default : "Available"
    },
    createdAt : {
        type : Date,
        default : Date.now
    },
    isDeleted : {
        type : Boolean,
        default : false
    }
},{Timestamp : true})

const Product = mongoose.model("Product",productSchema)

module.exports = Product