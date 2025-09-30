const bcrypt = require('bcrypt')


async function securePassword (password) {
    try {
        const saltRound = 10
        const passwordHash = await bcrypt.hash(password, saltRound)
        return passwordHash
    } catch (error) {
        console.log('Failed to password hashing : ', error)
    }
}



module.exports = {securePassword}
