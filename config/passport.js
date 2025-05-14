const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy

const User = require('../model/userModel')

const env = require('dotenv').config()
if(env.error)throw new Error("Failed to load .env file: ",env.error.message)
    console.log('=======================================================================')
    console.log("Environment variables loaded: ",process.env.GOOGLE_CLIENT_ID)


passport.use(new GoogleStrategy({
    clientID : process.env.GOOGLE_CLIENT_ID,
    clientSecret : process.env.GOOGLE_CLIENT_SECRET,
    callbackURL : '/auth/google/callback'
    
},
async (accessToken,refreshToken,profile,done) => {
    try {
        
        let user = await User.findOne({googleId:profile.id})

        if(user){
        
            return done(null,user)
        }else{
            user = new User({
                name : profile.displayName,
                email : profile.emails[0].value,
                googleId : profile.id
            })
            await user.save()

            return done(null,user)
        }
        

    } catch (error) {
        
        return done(error,null)
    }
}

))

passport.serializeUser((user,done)=>{
    
    done(null,user.id)

})

passport.deserializeUser((id,done) => {
    User.findById(id)
    .then(user=>{
        console.log("Deserialized user: ", user ? user.email : "Not found");
        done(null,user)
    })
    .catch(err=>{
        console.error("Deserialize error: ", err);
        done(err,null)
    })
})

module.exports = passport