const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const PORT = process.env.PORT || 3000
require('dotenv').config()
const User = require('./models/user')

app.use(express.json())
// app.use((req, res, next)=>{
//    res.header("Access-Control-Allow-Origin", "*")
//    res.header("Access-Control-Allow-Headers","Origin, X-Requested-Width, Content-Type, Accept, Authorization")
//    if(req.method === 'OPTIONS'){
//       res.header('Access-Control-Allow-Methods','PUT, POST, PATCH, DELETE, GET')
//       return res.status(200).json({})
//    }
// })
app.use(require('./routes/auth'))


mongoose
    .connect(process.env.MONGO_URI, {
       dbName: process.env.DB_NAME
    }).then(
       console.log('Connected to DB'),
       app.listen(process.env.PORT,()=>{
       console.log(`Listening to port ${PORT}`)
    })
).catch((err)=>console.log(err.message))
