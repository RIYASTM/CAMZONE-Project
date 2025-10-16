require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const ejs = require('ejs');
const nocache = require('nocache');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const passport = require('./config/passport');

const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');

// Trust NGINX proxy for HTTPS detection
app.set('trust proxy', 1);

// View engine
app.set('view engine', 'ejs');
app.set('views', [
    path.join(__dirname, 'views/user'),
    path.join(__dirname, 'views/admin')
]);

// Connect to MongoDB
connectDB().then(() => {

    // JSON & URL encoding
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Session middleware (must be BEFORE passport and routers)
    app.use(
        session({
            secret: process.env.SESSION_SECRET || 'supersecretkey1234567890',
            resave: false,
            saveUninitialized: false,
            store: MongoStore.create({
                mongoUrl: process.env.MONGODB_URI,
                collectionName: 'sessions',
                touchAfter: 24 * 3600,
                autoRemove: 'interval',
                autoRemoveInterval: 10,
                crypto: {
                    secret: process.env.SESSION_SECRET || 'supersecretkey1234567890'
                }
            }),
            cookie: {
                // secure: true,      // HTTPS only
                secure : process.env.NODE_ENV === 'production',
                httpOnly: true,    // prevent JS access
                maxAge: 1000 * 60 * 60 * 24
            }
        })
    );

    // Passport initialization
    app.use(passport.initialize());
    app.use(passport.session());

    // Nocache for sensitive routes
    app.use('/admin', nocache());
    app.use('/user', nocache());

    // Static files
    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

    // Routers
    app.use('/admin', adminRouter);
    app.use('/', userRouter);

    app.use((req,res, next) => {
        res.status(404).redirect('/pageNotFound')
    })

    // Start server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running on https://your-domain.com`);
    });

}).catch(err => {
    console.error("Failed to connect to MongoDB:", err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log("Shutting down gracefully...");
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log("Process terminated. Closing DB...");
    await mongoose.connection.close();
    process.exit(0);
});
