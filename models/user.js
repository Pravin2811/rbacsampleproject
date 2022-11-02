const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    id: Number,
    name: String,
    email: String,
    password: String,
    role: String
})

UserSchema.pre("save", function(next){
    var docs = this
    mongoose.model('User', UserSchema).countDocuments(function(error, counter){
        if(error) return next(error)
        docs.id = counter+1
        next()
    })   
})


module.exports = mongoose.model('users',UserSchema)
