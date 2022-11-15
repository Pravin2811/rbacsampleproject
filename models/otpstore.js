const mongoose = require('mongoose')

const otpVerificationSchema = new mongoose.Schema({
    id:String,
    otp:String,
    createdAt: Date,
    expiresAt: Date
})

const userOtpVerification = mongoose.model('userOtpVerification', otpVerificationSchema)
module.exports = userOtpVerification