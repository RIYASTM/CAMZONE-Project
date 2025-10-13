const mongoose = require('mongoose')
const { Schema } = mongoose


const messageSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: false
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    }
}, { timestamps: true })

const message = mongoose.model('message', messageSchema)

module.exports = message