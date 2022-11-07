const { request } = require('express')
const mongoose = require('mongoose')
const grades = require('./grades')
const Grade = require('./grades')

const UserSchema = new mongoose.Schema({
    id:String,
    name: String,
    email: String,
    password: String,
    role: String,
    mobile:{
        type:String,
        default:""
    },
    bio:{
        type:String,
        default:""
    }
})

// UserSchema.pre("save", function(next){
    
//     console.log('first')
//     var docs = this
//     mongoose.model('User', UserSchema).countDocuments(function(error, counter){
//         if(error) return next(error)
//         docs.id = counter+1
//         global.userid = docs.id
//         next()
//     }) 
//     console.log(global.userid) 
// })


module.exports = mongoose.model('users',UserSchema)