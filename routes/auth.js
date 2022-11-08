const router = require('express').Router()
const User = require('../models/user')
const Grade = require('../models/grades')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {SECRET} = require('../config/index')
const {verifyAccessToken} = require('./function')
const {v1:uuidv1} = require('uuid')


//SignUp
router.post('/signup',async (req,res)=>{
    const {name, email, password} = req.body
    //const roles = ["Admin", "Teacher", "Student"]
    //const role = roles[Math.floor(Math.random() * roles.length)]
    const hashedpassword = await bcrypt.hash(password, 12)
    const uid = uuidv1()

    const user = new User({
        name,
        email,
        password:hashedpassword,
        role:'Student',
        id:uid
    })
    
    const grade = new Grade({
        id:uid,
        name:name,
        Tamil:Math.floor(Math.random() * 100),
        English:Math.floor(Math.random() * 100),
        Maths:Math.floor(Math.random() * 100),
        Science:Math.floor(Math.random() * 100),
        SocialScience:Math.floor(Math.random() * 100)
    }) 
     
     user.save()
     .then(data=>{
        if(user.role === 'Student'){
        grade.save()
        .then(done=>{
            res.json({message:'Grades updated'})
        }).catch((err)=>{
            console.log(err)
        })
        }
        res.json({message:'User profile created'})
    }).catch((err)=>{
        console.log(err)
    })
    

})

//Login post
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

//Creating Profile by Admin
router.post('/createprofile', verifyAccessToken, async (req, res)=>{
    const userDet = req.payload
    const password = req.body.password
    const hashedpassword = await bcrypt.hash(password, 12)
    const uid = uuidv1()
    if(userDet.role === 'Admin'){
        const user = new User({
            name:req.body.name,
            email:req.body.email,
            password:hashedpassword,
            role:req.body.role,
            id:uid,
            bio:req.body.bio,
            mobile:req.body.mobile
        })
        
        const grade = new Grade({
            id:uid,
            name:req.body.name
        }) 
         
         user.save()
         .then(data=>{
            if(user.role === 'Student'){
            grade.save()
            .then(done=>{
                res.json({message:'Grades updated'})
            }).catch((err)=>{
                console.log(err)
            })
            }
            res.json({message:'User profile created'})
        }).catch((err)=>{
            console.log(err)
        })
    }else{
        res.status(401).json('Access denied')
    }
})


//Role update Post
router.post('/updaterole', verifyAccessToken, async (req,res)=>{
    const {id, role} = req.body
    const userDet = req.payload
    if(userDet.role === 'Admin'){
        const result = await User.findOneAndUpdate({"id":id},{$set:{"role":role}})
        res.json({message:"Successfully updated"})
    }else{
        res.json({message:"You can't modify the records"})
    }
})

//GetUser details
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

//GetUser detail with ID
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

//Getgrades of students
router.get('/getgrades',verifyAccessToken, async (req,res)=>{
    const userDet = req.payload
    if(userDet.role === 'Admin' || userDet.role === 'Teacher'){
        const result = await Grade.find()
        res.json(result)
    }else{
        res.json(`Can't Access`)
    }
})

//Getgrades with student ID
router.get('/getgrades/:id',verifyAccessToken, async (req,res)=>{
    const userDet = req.payload
    if(userDet.role === 'Admin' || userDet.role === 'Teacher'){
        const result = await Grade.findOne({id:req.params.id})
        .then(data=>{
            if(!data){
                res.status(404).json('No data')
            }else{
            res.json(data)
            }
        }).catch(err=>{
            console.log(err)
        })
        
    }else if(userDet.role === 'Student'){
        if(userDet.id === req.params.id){
            const result = await Grade.findOne({id:req.params.id})
            res.json(result)
        }else{
            res.json('Access denied')
        }
    }else{
        res.json('No access')
    }
})

//Viewing Profiles by Admin
router.get('/profiles',verifyAccessToken,async (req, res)=>{
    // const result =await User.find().populate('grades')
    // res.json(result)
    const userDet = req.payload
    if(userDet.role === 'Admin'){
        const result = await User.aggregate([
        {$lookup:{
            from:"grades",
            localField:"name",
            foreignField:"name",
            as:"grades"
            }
        }
        ])
        res.json(result)
   }else{
    res.json(`Don't have access`)
   }
})


//ViewProfiles depending on their roles
router.get('/viewprofiles', verifyAccessToken, async (req,res)=>{
    const userDet = req.payload
    if(userDet.role === 'Admin'){
        const result = await User.find()
        res.status(200).json(result)
    }else if(userDet.role === 'Teacher'){
        const result = await User.find({"role":"Student"})
        res.status(200).json(result)
    }else{
        res.status(401).json('Access denied')
    }
})

//Updating profile based on id
router.put('/updateprofile/:id', verifyAccessToken,async (req, res)=>{
    const userDet = req.payload
    //const {name, email, role} = req.body
    if(userDet.role === 'Admin'){
        const result = await User.findOneAndUpdate({id:req.params.id},{$set:{name:req.body.name, email:req.body.email, role:req.body.role, bio:req.body.bio, mobile:req.body.mobile}})
        const result1 = await Grade.findOneAndUpdate({id:req.params.id},{$set:{name:req.body.name}})
        res.json('Successfully updated')
    }else{
        res.status(401).json('Access denied')
    }
})


//Updating grades based on ID
router.put('/updategrades/:id', verifyAccessToken, async (req, res)=>{
    const userDet = req.payload
    if(userDet.role === 'Teacher'){
        const result = await Grade.findOneAndUpdate({id:req.params.id},{$set:{Tamil:req.body.Tamil, English:req.body.English,Maths:req.body.Maths,Science:req.body.Science,SocialScience:req.body.SocialScience}})
        res.json('Successfully updated') 
    }else{
        res.status(401).json('Access denied')
    }
})


//Deleting profile 
router.delete('/deleteprofile/:id',verifyAccessToken,async (req, res)=>{
    const userDet = req.payload
    if(userDet.role === 'Admin'){
    const result = await User.deleteOne({id:req.params.id})
    const result1 = await Grade.deleteOne({id:req.params.id})
    res.json('Successfully Deleted')
    }else{
        res.status(401).json('Access denied')
    }
    
})

module.exports = router