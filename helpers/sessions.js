require('dotenv').config();
const session = require('express-session');
const MongoStore = require('connect-mongo');



const userSession = session({
        name: 'user.sid',
        secret: process.env.SESSION_SECRET || 'supersecretkey1234567890',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            collectionName: 'sessions'
        }),
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24
        }
    });

    const adminSession = session({
        name: 'admin.sid',
        secret: process.env.SESSION_SECRET || 'supersecretkey1234567890',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            collectionName: 'adminSessions'
        }),
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24
        }
    });



    module.exports = {
        userSession,
        adminSession
    }