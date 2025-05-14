const mongoose = require('mongoose')
const {Schema} = mongoose

const wislistSchema = new Schema ({
    userId : {
        type : Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    products : [{
        product : {
            type : Schema.Types.ObjectId,
            ref : "Product",
            required :  true
        },
        addedOn : {
            type : Date,
            default : Date.now
        }
    }]
})


const Wishlist = mongoose.model("Wishlist",wislistSchema)

module.exports = Wishlist