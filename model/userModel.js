const mongoose = require('mongoose')
const {Schema} = mongoose;

const userSchema = new Schema({
    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    phone : {
        type : Number,
        required : false,
        unique : false,
        sparse : true,
        default : null
    },
    googleId : {
        type : String,
        unique : true
    },
    password : {
        type : String,
        required : false,
    },
    isBlocked : {
        type : Boolean,
        default : false
    },
    isAdmin : {
        type : Boolean,
        default : false
    },
    profileImage : {
        type : String,
        required : false
    },
    cart : {
        type : Schema.Types.ObjectId,
        ref : "Cart"
    },
    wallet : {
        type : Number,
        default : 0
    },
    wishlist : {
        type : Schema.Types.ObjectId,
        ref : "Wishlist"
    },
    orderHistory : {
        type : Schema.Types.ObjectId,
        ref : "Order"
    },
    status :{
        type : Boolean,
        default : true || 'Active'
    },
    createdOn : {
        type : Date,
        default : Date.now
    },
    referalCode : {
        type : String,
        // require : true
    },
    redeemed : {
        type : Boolean,
        // default : false
    },
    redeemedUsers : {
        type : Schema.Types.ObjectId,
        ref : "User",
        // required : true
    },
    searchHistory : [{
        category : {
            type : Schema.Types.ObjectId,
            ref : "Category"
        },
        brand : {
            type : String
        },
        searchOn : {
            type : Date,
            default : Date.now
        }
    }]
})


const User = mongoose.model("User",userSchema)

module.exports = User