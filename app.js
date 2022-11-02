const express = require('express')
const app = express()
const mongoose = require('mongoose')
const PORT = process.env.PORT || 3000
require('dotenv').config()
const User = require('./models/user')

app.use(express.json())
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
