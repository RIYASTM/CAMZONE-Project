const mongoose = require('mongoose')
const { Schema } = mongoose

const otpSchema = new Schema(
  {
    otp: Number,
    email: String
  },
  { timestamps: true }
)

otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 })

const OTP = mongoose.model('Otp', otpSchema)

module.exports = OTP