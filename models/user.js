const { request } = require('express')
const mongoose = require('mongoose')
const grades = require('./grades')
const Grade = require('./grades')

const UserSchema = new mongoose.Schema({
    id:String,
    name: {
        type:String,
        required: true,
        minLength:2
    },
    email: {
        type:String,
        required: true,
        minLength:10
    },
    password:{
        type:String,
        required: true,
        minLength:6
    },
    role:{
        type: String,
        required: true,
        default:"Student"
    },
    mobile:{
        type:String,
        default:""
    },
    bio:{
        type:String,
        default:""
    }
    // grades:[{
    //     type: mongoose.Schema.Types.ObjectId, ref:'grades'
    // }]
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