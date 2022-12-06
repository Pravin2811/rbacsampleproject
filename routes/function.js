const User = require('../models/user')
const {SECRET} = require('../config/index')
const jwt = require('jsonwebtoken')
  
module.exports = {
    verifyAccessToken:(req, res, next)=>{
        if(!req.headers['authorization']) return res.json({message:'No Access'}); console.log('Please enter token')
        const authHeader = req.headers['authorization']
        const bearerToken = authHeader.split(' ')
        const token = bearerToken[1]
        jwt.verify(token, SECRET, (err, payload)=>{
            if(err){
                console.log(err)
                res.json({message:'Pls enter crct token'})
            }
            req.payload = payload
            next()
        })

    }
}
