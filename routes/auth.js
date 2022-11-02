const router = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {SECRET} = require('../config/index')
const passport = require('passport')
const {verifyAccessToken} = require('./function')



router.post('/signup',async (req,res)=>{
    const {name, email, password} = req.body
    const roles = ["Admin", "Teacher", "Student"]
    const role = roles[Math.floor(Math.random() * roles.length)]
    const hashedpassword = await bcrypt.hash(password, 12)
    const user = new User({
        name,
        email,
        password:hashedpassword,
        role
    })
    
     user.save()
    .then(data=>{
        res.send({message:'saved'})
    }).catch((err)=>{
        console.log(err)
    })
})

router.post('/login',async (req, res)=>{
    const {email, password} = req.body
    const user = await User.findOne({email})
    if(!user){
        return res.status(404).json({message:'Invalid login credentials'})
    }

    const isMatch =await bcrypt.compare(password, user.password)
    if(isMatch){
        const token = jwt.sign({
            id: user.id,
            name:user.name,
            email:user.email,
            role:user.role
        },
        SECRET
        )

        const result = {
            id:user.id,
            name:user.name,
            email:user.email,
            role:user.role,
            token:`Bearer ${token}`
        }

        return res.status(200).json({
            ...result,
            message:'You are logged in'
        })
    }else{
        res.status(403).json({
            message:'Incorrect password'
        })
    }

     
})



router.get('/getuser',verifyAccessToken,async (req,res)=>{
    const userDet = req.payload
    if(userDet.role === 'Admin'){
        const result =await User.find({role:{$in:['Teacher','Student']}})
        res.json(result)
    }else if(userDet.role === 'Teacher'){
        const result = await User.find({role:{$in:['Student']}})
        res.json(result)
    }else if(userDet.role === 'Student'){
        const email1 = userDet.email
        const result = await User.findOne({email:email1})
        res.json(result)
    }
})

router.get('/getuser/:id',verifyAccessToken, async (req, res)=>{
    const userDet = req.payload
    if(userDet.role === 'Admin'){ 
    const result = await User.findOne({id:req.params.id})
    res.json(result)
    }else if(userDet.role === 'Teacher'){
        const result = await User.findOne({$and:[{id:req.params.id},{role:{$in:['Teacher','Student']}}]})
        if(!result){
            res.json({message:'No Access'})
        }
        res.json(result)
    }else{
        res.json({message:'Access Denied'})
    }
})

module.exports = router