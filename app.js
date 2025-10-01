require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const ejs = require('ejs')
const nocache = require('nocache')
const session = require('express-session')
const port = process.env.PORT || 3000
const MongoStore = require('connect-mongo')
const connectDB = require('./config/db')
const Razorpay = require('razorpay')
const morgan = require('morgan')
const passport = require('./config/passport')
const mongoose = require('mongoose')


// Routers
const userRouter = require('./routes/userRouter')
const adminRouter = require('./routes/adminRouter')
// ====== GLOBAL ERROR HANDLERS ======
process.on("uncaughtException", (err) => {
    if (err.message.includes("Unable to find the session to touch") ||
        err.message.includes("session")) {
        console.warn("Session issue encountered:", err.message);
        return;
    }
    console.error("Uncaught Exception:", err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (reason && reason.message && reason.message.includes("session")) {
        console.warn("Session-related promise rejection, continuing...");
        return;
    }
    process.exit(1);
});

// ====== VIEW ENGINE ======
app.set('view engine', 'ejs')
app.set('views', [
    path.join(__dirname, 'views/user'),
    path.join(__dirname, 'views/admin')
])
app.set("trust proxy", 1); 


// ====== DATABASE CONNECT ======
connectDB().then(() => {
    // ====== MIDDLEWARES ======
    // app.use(morgan('dev')) // enable only in dev

    // No-cache only for sensitive routes, not static assets
    app.use('/admin', nocache())
    app.use('/user', nocache())

    app.use(session({
        secret: process.env.SESSION_SECRET || 'supersecretkey1234567890',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            touchAfter: 24 * 3600,
            crypto: {
                secret: process.env.SESSION_SECRET || 'supersecretkey1234567890'
            },
            autoRemove: 'native',
            collectionName: 'sessions'
        }),
        cookie: {
            cookie: {
                secure: process.env.NODE_ENV === 'production',  
                httpOnly: true,
                sameSite: 'lax', 
                maxAge: 1000 * 60 * 60 * 24 
            } 
        }
    }))

    app.use(passport.initialize())
    app.use(passport.session())

    // Static files with caching
    app.use(express.static(path.join(__dirname, 'public'), {
        maxAge: '1d', // cache static assets for 1 day
        etag: true
    }))
    app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))

    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    // ====== ROUTES ======
    app.use('/admin', adminRouter)
    app.use('/', userRouter)

    // ====== START SERVER ======
    app.listen(port, () => {
        console.log("=======================================================")
        console.log(`\x1b[36m Server is running on ${port} - http://localhost:${port} \x1b[0m`)
        console.log("=======================================================")
    })
})

// ====== GRACEFUL SHUTDOWN ======
process.on('SIGINT', async () => {
    console.log("Shutting down gracefully...")
    await mongoose.connection.close()
    process.exit(0)
})

process.on('SIGTERM', async () => {
    console.log("Process terminated. Closing DB...")
    await mongoose.connection.close()
    process.exit(0)
})
