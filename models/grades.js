const mongoose = require('mongoose')
const User = require('./user')


const GradeSchema = new mongoose.Schema({
    name:String,
    id:String,
    Tamil:Number,
    English:Number,
    Maths:Number,
    Science:Number,
    SocialScience:Number
})

// GradeSchema.pre("save", function(next){
//     var docs = this
//     mongoose.model('Grade', GradeSchema).countDocuments(function(error, counter){
//         if(error) return next(error)
//         docs.id = counter+1
//         next()
//     })  
// })

// GradeSchema.pre('save',function(next){
//     var docs = this
//     User.countDocuments(function(error, counter){
//          if(error) return next(error)
//          docs.id = counter+1
//          next()
//     })
// })


module.exports = mongoose.model('grades',GradeSchema)