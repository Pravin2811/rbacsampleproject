const router = require('express').Router()
const User = require('../models/user')
const Grade = require('../models/grades')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {SECRET, JWT_SECRET,CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, REFRESH_TOKEN} = require('../config/index')
const {verifyAccessToken} = require('./function')
const {v1:uuidv1} = require('uuid')
const nodemailer = require('nodemailer')
const {google} = require('googleapis')
const userOtpVerification = require('../models/otpstore')
const { $where } = require('../models/user')


const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
oAuth2Client.setCredentials({refresh_token:REFRESH_TOKEN})

// async function sendMail(){
//     try{
//         const accesstoken = await oAuth2Client.getAccessToken()

//         const transport = nodemailer.createTransport({
//             service:'gmail',
//             auth:{
//                 type:'OAuth2',
//                 user:'experimentmail2023@gmail.com',
//                 clientId: CLIENT_ID,
//                 clientSecret: CLIENT_SECRET,
//                 refreshToken: REFRESH_TOKEN,
//                 accessToken: accesstoken
//             }
//         })

//         const mailOptions = {
//             from:'Test <experimentmail2023@gmail.com>',
//             to:'cpravinkumar007@gmail.com',
//             subject:"Hello User",
//             text:"Hi welcome",
//             html:'<h1>Hi Welcome</h1>'
//         }

//         const result = await transport.sendMail(mailOptions)
//         return result

//     }catch(err){
//         return err
//     }
// }

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

//forgot password
router.post('/forgot-password',async (req, res, next)=>{
    const {email} = req.body
    const user = await User.findOne({email:email})
    if(!user){
        res.send('User not found')
    }

    const secret = JWT_SECRET+ user.password
    const payload = {
        id:user.id,
        email: user.email,
        name: user.name
    }
    const token = jwt.sign(payload, secret, {expiresIn:'10m'})
    const link = `http://localhost:3000/reset-password/${user.id}/${token}`
    console.log(link)
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`
    const hashedOtp = await bcrypt.hash(otp, 10)
    const newUserOtpVerification = await new userOtpVerification({
        id:user.id,
        otp:hashedOtp,
        createdAt: Date.now(),
        expiresAt: Date.now() + 900000
    })
    await newUserOtpVerification.save()
    
    try{
        const accesstoken = await oAuth2Client.getAccessToken()

        const transport = nodemailer.createTransport({
            service:'gmail',
            auth:{
                type:'OAuth2',
                user:'experimentmail2023@gmail.com',
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accesstoken
            }
        })

        const mailOptions = {
            from:'Test <experimentmail2023@gmail.com>',
            to:user.email,
            subject:"Password reset request",
            text:`Hello ${user.name}, 
                  please click below to reset your password
                  ${link}
                  The above link is valid for 10mins.`,
            html:`<p>Hello ${user.name}, 
            <br><br>please click below to reset your password or enter this ${otp} to verify.
            <br><br><a href=${link}>${link}</a>
            <br><br>The above link is valid for 10mins.</p>`
        }
        res.send('Password reset link has been sent to mail...')
        const result = await transport.sendMail(mailOptions)
        return result
        

    }catch(err){
        return err
    }
    
    
})

//Reset password
router.post('/reset-password/:id/:token', async (req, res)=>{
    const {id, token} = req.params
    const {password, confirmPassword} = req.body
    const user = await User.findOne({id:id})
    if(!user){
        res.json('User not found')
    }

    const secret = JWT_SECRET+ user.password
    try{
    const payload = jwt.verify(token, secret)
    console.log(payload)
    if(password === confirmPassword){
        //user.password = password
        const hashedpassword = await bcrypt.hash(password, 12)
        //console.log(hashedpassword)
        //user.password = hashedpassword
        await User.findOneAndUpdate({id:id},{$set:{password:hashedpassword}})
        res.status(201).json('Password updated')
    }else{
        res.send('Password do not match')
    }
    }catch(error){
        console.log(error.message)
    }
    
})

//Reset password using otp
router.post('/verifyotp', async (req, res)=>{
    const {id, otp, newpassword, confirmpassword} = req.body
    if(!id || !otp || !newpassword || !confirmpassword){
        res.json('Please enter all details')
    }else{
        const userOtpRecord = await userOtpVerification.find({id:id})
        if(userOtpRecord.length <= 0){
            res.json(`Record doesn't exist`)
        }else{
            const {expiresAt} = userOtpRecord[0]
            const hashedOtp = userOtpRecord[0].otp

            if(expiresAt < Date.now()){
                await userOtpVerification.deleteMany({id:id})
                res.json('OTP Code expired. Please try again')
            }else{
                const validOtp = await bcrypt.compare(otp, hashedOtp)
                if(!validOtp){
                    res.json('Invalid OTP')
                }else{
                    if(newpassword === confirmpassword){
                        const hashedpassword = await bcrypt.hash(newpassword, 12)
                        await User.findOneAndUpdate({id:id},{$set:{password:hashedpassword}})
                        res.json('OTP verified. Password updated')
                        await userOtpVerification.deleteMany({id:id})
                    }else{
                        res.json('Passwords do not match')
                    }
                }
            }
        }
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
router.post('/updateuser', verifyAccessToken, async (req,res)=>{
    const {id, role} = req.body
    const userDet = req.payload
    if(userDet.role === 'Admin'){
        const result = await User.findOneAndUpdate({id:id},{$set:{email:req.body.email,role:role}})
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

//Pagination api
router.post('/users',verifyAccessToken, paginatedResults(User), (req, res) => {
    const userDet = req.payload
    if(userDet.role === 'Admin'){
    res.json(res.paginatedResults)
    }else{
        res.status(403).json('Access denied')
    }
})

// router.post('/sorted', (req, res)=>{
//     const sort = await User.sort()
// })

function paginatedResults(model) {
    return async (req, res, next) => {
      const page = parseInt(req.body.page)
      const limit = parseInt(req.body.limit) || 10
  
      const startIndex = (page - 1) * limit
      const endIndex = page * limit
  
      const results = {}
  
      if (endIndex < await model.countDocuments().exec()) {
        results.next = {
          page: page + 1,
          limit: limit
        }
      }
      
      if (startIndex > 0) {
        results.previous = {
          page: page - 1,
          limit: limit
        }
      }
      try {
        results.results = await model.find({},{$sort:{name:-1}}).limit(limit).skip(startIndex).exec()
        res.paginatedResults = results
        next()
      } catch (e) {
        res.status(500).json({ message: e.message })
      }
    }
}



module.exports = router