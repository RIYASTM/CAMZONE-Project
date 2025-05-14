

const loadMyAccount = async (req,res) => { 
    try {
        
        return res.render('myAccount')


    } catch (error) {
        console.log('Failed to load the My Account Page : ',error)
    }
}



module.exports = {
    loadMyAccount
}