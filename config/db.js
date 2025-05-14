const mongoose = require('mongoose')
const env = require('dotenv').config()

const connectDB = async () =>{
    try {
        const dbConnect = await mongoose.connect(process.env.MONGODB_URI)
        console.log(`\x1b[36m Mongo DB connected with ${dbConnect.connection.host} \x1b[0m`)
        console.log("=======================================================")
    } catch (error) {
        console.log("=======================================================")
        console.log("=======================================================")
        console.log(`\x1b[31m Mongo DB connection failed. ${error} \x1b[0m`)
        console.log("=======================================================")
        console.log("=======================================================")
        process.exit(1)

    }
}

module.exports = connectDB