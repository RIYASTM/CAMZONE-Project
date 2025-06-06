const mongoose = require ('mongoose')
const {Schema} = mongoose

const brandSchema = new Schema ({
    brandName : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    brandImage : { 
        type : String,
        required : false
    },
    isBlocked : {
        type : Boolean,
        default : false
    },  
    createdAt : {
        type : Date,
        default : Date.now
    },
    isDeleted : {
        type : Boolean,
        default : false
    }
})

const Brand = mongoose.model("Brand",brandSchema)

module.exports = Brand