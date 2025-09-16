const express = require('express')
const app = express()
const doteenv = require('dotenv').config()
const path = require('path')
const ejs = require('ejs')
const nocache = require('nocache')
const session = require('express-session')
const port = process.env.PORT || 3000
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db')
const Razorpay = require('razorpay')


//Morgan
const morgan = require('morgan')



const userRouter = require('./routes/userRouter')
const adminRouter = require('./routes/adminRouter')

const passport = require('./config/passport')


app.set('view engine','ejs')
app.set('views', [
    path.join(__dirname, 'views/user'),
    path.join(__dirname, 'views/admin')
])


// app.use(morgan('dev'))
connectDB().then(() => {

    
    app.use(nocache())
    app.use(session({
        secret : process.env.SESSION_SECRET,
        resave : false,
        saveUninitialized : false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI, 
            collectionName: 'sessions',
            ttl: 72 * 60 * 60 
        }),
        cookie : {
            secure : process.env.NODE_ENV === 'production',
            httpOnly :true,
            maxAge : 72*60*60*1000
        }
    }))
    app.use(express.static(path.join(__dirname,'public')))
    app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
    
    
    app.use(express.json())
    app.use(express.urlencoded({extended : true}))
    
    
    app.use('/admin',adminRouter)
    app.use('/',userRouter)
    
    app.use(passport.initialize())
    app.use(passport.session())
    
    
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    app.listen(port,()=>{
        
        console.log("=======================================================")
        console.log(`\x1b[36m Server is running on ${port} - http://localhost:${port} \x1b[0m`)
        console.log("=======================================================")
        
    })
})