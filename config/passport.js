const passport = require('passport')
const bcrypt = require('bcrypt')
const GoogleStrategy = require('passport-google-oauth20').Strategy

const User = require('../model/userModel')
const { securePassword } = require('../helpers/hashPass')

const env = require('dotenv').config()
if (env.error) throw new Error("Failed to load .env file: ", env.error.message)
console.log('=======================================================================')
console.log("Environment variables loaded... ")


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL : 'http://thecamzone.shop/auth/google/callback',
    // callbackURL: '/auth/google/callback'

},
    async (accessToken, refreshToken, profile, done) => {
        try {

            let user = await User.findOne({ googleId: profile.id })

            if (user) {
                if (!user.isBlocked) {
                    return done(null, user)
                } else {
                    return done(null, false, { message: 'User is blocked!!' })
                }
            } else {
                const hashedPassword = await securePassword(profile.id)

                user = new User({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    password: hashedPassword
                })
                console.log('Google User : ', user)
                await user.save()

                return done(null, user)
            }


        } catch (error) {
            console.log("google auth error : ", error)

            return done(error, null)
        }
    }

))

passport.serializeUser((user, done) => {

    done(null, user.id)

})

passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            console.log("Deserialized user: ", user ? user.email : "Not found");
            done(null, user)
        })
        .catch(err => {
            console.error("Deserialize error: ", err);
            done(err, null)
        })
})

module.exports = passport